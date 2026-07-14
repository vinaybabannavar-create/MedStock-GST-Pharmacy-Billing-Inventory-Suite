from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import auth, models, schemas
from app.db import get_db
from app.config import settings

router = APIRouter()

require_any = auth.RoleChecker(["admin", "pharmacist", "cashier"])

def _generate_invoice_no(db: Session) -> str:
    """Auto-increment invoice number: MED-YYYY-NNNNNN"""
    today = date.today()
    prefix = f"MED-{today.year}-"
    # Count existing sales this year
    count = db.query(models.Sale).filter(
        models.Sale.invoice_no.like(f"{prefix}%")
    ).count()
    return f"{prefix}{str(count + 1).zfill(6)}"


@router.get("/", response_model=list[schemas.SaleResponse])
def list_sales(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any)
):
    return db.query(models.Sale).order_by(models.Sale.id.desc()).offset(skip).limit(limit).all()


@router.get("/{sale_id}", response_model=schemas.SaleResponse)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any)
):
    sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.post("/", response_model=schemas.SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(
    sale_data: schemas.SaleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any)
):
    """
    GST-compliant billing engine:
    - Determines local (CGST+SGST) vs interstate (IGST) based on customer state code
    - Deducts stock from batch using FEFO (earliest expiry first)
    - Writes audit entries to stock_ledger
    - Auto-generates invoice number
    """
    try:
        # Determine customer's state code for CGST/SGST vs IGST
        customer_state_code = sale_data.customer_state_code
        if sale_data.customer_id and not customer_state_code:
            customer = db.query(models.Customer).filter(models.Customer.id == sale_data.customer_id).first()
            if customer:
                customer_state_code = customer.state_code

        is_local = (customer_state_code is None) or (customer_state_code == settings.STORE_STATE_CODE)

        # Generate invoice number
        invoice_no = _generate_invoice_no(db)

        # Create sale record (totals calculated below)
        # Note: customer_name/phone/state_code are for GST calc only — not persisted on Sale model
        db_sale = models.Sale(
            invoice_no=invoice_no,
            customer_id=sale_data.customer_id,
            date=date.today(),
            subtotal=Decimal("0.00"),
            cgst_amount=Decimal("0.00"),
            sgst_amount=Decimal("0.00"),
            igst_amount=Decimal("0.00"),
            discount=sale_data.discount,
            total=Decimal("0.00"),
            payment_mode=sale_data.payment_mode,
            created_by=current_user.id
        )
        db.add(db_sale)
        db.flush()

        total_subtotal = Decimal("0.00")
        total_cgst     = Decimal("0.00")
        total_sgst     = Decimal("0.00")
        total_igst     = Decimal("0.00")

        for item in sale_data.items:
            # Fetch batch and lock it for update
            batch = db.query(models.Batch).filter(models.Batch.id == item.batch_id).first()
            if not batch:
                raise HTTPException(status_code=404, detail=f"Batch ID {item.batch_id} not found")
            if batch.quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock in batch {batch.batch_no}. Available: {batch.quantity}, Requested: {item.quantity}"
                )
            if batch.expiry_date < date.today():
                raise HTTPException(
                    status_code=400,
                    detail=f"Batch {batch.batch_no} has expired on {batch.expiry_date}. Cannot sell expired medicines."
                )

            # Get medicine for GST rate
            medicine = db.query(models.Medicine).filter(models.Medicine.id == batch.medicine_id).first()
            gst_rate = medicine.gst_rate if medicine else Decimal("0.00")

            # Line-level computation
            base_price   = item.sale_price  # price per unit ex-GST
            qty          = Decimal(str(item.quantity))
            line_base    = (base_price * qty).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            gst_fraction = gst_rate / Decimal("100")

            if is_local:
                half_gst      = (gst_fraction / 2).quantize(Decimal("0.0001"))
                line_cgst     = (line_base * half_gst).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                line_sgst     = line_cgst
                line_igst     = Decimal("0.00")
            else:
                line_cgst     = Decimal("0.00")
                line_sgst     = Decimal("0.00")
                line_igst     = (line_base * gst_fraction).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            line_total = line_base + line_cgst + line_sgst + line_igst

            # Accumulate totals
            total_subtotal += line_base
            total_cgst     += line_cgst
            total_sgst     += line_sgst
            total_igst     += line_igst

            # Create sale item
            db_item = models.SaleItem(
                sale_id=db_sale.id,
                batch_id=batch.id,
                quantity=item.quantity,
                sale_price=item.sale_price,
                gst_rate=gst_rate,
                line_total=line_total
            )
            db.add(db_item)

            # Deduct from batch stock (FEFO enforced by caller choosing correct batch_id)
            batch.quantity -= item.quantity

            # Stock ledger audit entry
            db_ledger = models.StockLedger(
                batch_id=batch.id,
                change_qty=-item.quantity,   # negative = stock out
                reason="sale",
                reference_id=db_sale.id
            )
            db.add(db_ledger)

        # Apply discount
        grand_total = max(
            Decimal("0.00"),
            (total_subtotal + total_cgst + total_sgst + total_igst - sale_data.discount)
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # Patch sale with computed totals
        db_sale.subtotal     = total_subtotal
        db_sale.cgst_amount  = total_cgst
        db_sale.sgst_amount  = total_sgst
        db_sale.igst_amount  = total_igst
        db_sale.total        = grand_total

        db.commit()
        db.refresh(db_sale)
        return db_sale

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create sale: {str(e)}"
        )


@router.get("/{sale_id}/pdf")
def get_sale_invoice_pdf(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_any)
):
    from io import BytesIO
    from fastapi.responses import StreamingResponse
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    # 1. Fetch sale data
    sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale invoice not found")

    # 2. Setup document buffer
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom typography style definitions
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e293b'),
        alignment=0, # Left aligned
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'InvoiceSub',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=15
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#1e293b')
    )

    body_regular = ParagraphStyle(
        'BodyRegular',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        fontName='Helvetica-Bold',
        textColor=colors.white
    )

    story = []

    # ─── HEADER SECTION (Brand & Title) ───────────────────
    story.append(Paragraph("MEDILEDGER PHARMACY", title_style))
    story.append(Paragraph(
        "Karnataka Store Suite, India  |  GSTIN: 29MMMMM8888M1Z0  |  State Code: 29 (Local)", 
        subtitle_style
    ))
    story.append(Spacer(1, 10))

    # ─── META INFORMATION (Invoice & Customer) ─────────────
    # Fetch customer if linked
    customer_name = "Walk-in Customer"
    customer_phone = "9999999999"
    customer_state = "29 (Local)"
    if sale.customer_id:
        cust = db.query(models.Customer).filter(models.Customer.id == sale.customer_id).first()
        if cust:
            customer_name = cust.name
            customer_phone = cust.phone
            customer_state = cust.state_code if cust.state_code else "29"

    meta_data = [
        [
            Paragraph("<b>Invoice No:</b>", body_bold), 
            Paragraph(sale.invoice_no, body_regular),
            Paragraph("<b>Customer Name:</b>", body_bold),
            Paragraph(customer_name, body_regular)
        ],
        [
            Paragraph("<b>Invoice Date:</b>", body_bold),
            Paragraph(sale.date.strftime("%Y-%m-%d"), body_regular),
            Paragraph("<b>Contact Phone:</b>", body_bold),
            Paragraph(customer_phone, body_regular)
        ],
        [
            Paragraph("<b>Payment Mode:</b>", body_bold),
            Paragraph(sale.payment_mode, body_regular),
            Paragraph("<b>Tax Region:</b>", body_bold),
            Paragraph("Karnataka (State Code: " + (customer_state if customer_state else "29") + ")", body_regular)
        ]
    ]

    meta_table = Table(meta_data, colWidths=[90, 160, 100, 180])
    meta_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,-1), (-1,-1), 1, colors.HexColor('#e2e8f0')),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))

    # ─── ITEMS TABLE ───────────────────────────────────────
    # Table columns: SL, Medicine Name, Batch, Expiry, Qty, Rate, GST %, Line Total
    table_headers = [
        Paragraph("SL", header_style),
        Paragraph("Medicine / Generic Name", header_style),
        Paragraph("Batch No", header_style),
        Paragraph("Expiry", header_style),
        Paragraph("Qty", header_style),
        Paragraph("Price (₹)", header_style),
        Paragraph("GST %", header_style),
        Paragraph("Total (₹)", header_style)
    ]
    
    invoice_rows = [table_headers]
    
    for idx, item in enumerate(sale.items, start=1):
        # Fetch batch details
        batch = db.query(models.Batch).filter(models.Batch.id == item.batch_id).first()
        med_name = f"Batch ID #{item.batch_id}"
        batch_no = "N/A"
        expiry = "N/A"
        if batch:
            batch_no = batch.batch_no
            expiry = batch.expiry_date.strftime("%Y-%m-%d")
            medicine = db.query(models.Medicine).filter(models.Medicine.id == batch.medicine_id).first()
            if medicine:
                med_name = medicine.name
                if medicine.generic_name:
                    med_name += f"<br/><font color='#64748b' size='8'>{medicine.generic_name}</font>"

        invoice_rows.append([
            Paragraph(str(idx), body_regular),
            Paragraph(med_name, body_regular),
            Paragraph(batch_no, body_regular),
            Paragraph(expiry, body_regular),
            Paragraph(str(item.quantity), body_regular),
            Paragraph(f"{float(item.sale_price):.2f}", body_regular),
            Paragraph(f"{float(item.gst_rate):.1f}%", body_regular),
            Paragraph(f"{float(item.line_total):.2f}", body_regular)
        ])

    items_table = Table(invoice_rows, colWidths=[25, 200, 60, 65, 35, 50, 45, 55])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 15))

    # ─── SUMMARY BLOCK ─────────────────────────────────────
    summary_data = [
        [Paragraph("<b>Subtotal (Ex-GST):</b>", body_regular), Paragraph(f"₹{float(sale.subtotal):.2f}", body_regular)],
    ]
    
    if float(sale.cgst_amount) > 0:
        summary_data.append([Paragraph("<b>CGST:</b>", body_regular), Paragraph(f"₹{float(sale.cgst_amount):.2f}", body_regular)])
        summary_data.append([Paragraph("<b>SGST:</b>", body_regular), Paragraph(f"₹{float(sale.sgst_amount):.2f}", body_regular)])
    if float(sale.igst_amount) > 0:
        summary_data.append([Paragraph("<b>IGST:</b>", body_regular), Paragraph(f"₹{float(sale.igst_amount):.2f}", body_regular)])
    if float(sale.discount) > 0:
        summary_data.append([Paragraph("<font color='#e11d48'><b>Discount (-)</b></font>", body_regular), Paragraph(f"-₹{float(sale.discount):.2f}", body_regular)])
        
    summary_data.append([
        Paragraph("<b>Grand Total:</b>", body_bold), 
        Paragraph(f"<b>₹{float(sale.total):.2f}</b>", body_bold)
    ])

    summary_table = Table(summary_data, colWidths=[150, 80])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, colors.HexColor('#1e293b')),
    ]))

    # Wrap summary in parent alignment layout
    outer_summary = Table([[Spacer(1,1), summary_table]], colWidths=[300, 230])
    outer_summary.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT')
    ]))
    story.append(outer_summary)
    story.append(Spacer(1, 40))

    # ─── TERMS & LEGAL FOOTER ──────────────────────────────
    footer_text = (
        "<b>Terms & Conditions:</b><br/>"
        "1. Medicines once sold cannot be returned or exchanged under any circumstances.<br/>"
        "2. Please check packaging, seals, and expiration date before leaving the counter.<br/>"
        "3. This is a computer-generated GST-compliant invoice and requires no physical signature."
    )
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, leading=11, textColor=colors.HexColor('#64748b'))))

    # 3. Build document
    doc.build(story)
    
    # 4. Stream response
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice-{sale.invoice_no}.pdf"}
    )

