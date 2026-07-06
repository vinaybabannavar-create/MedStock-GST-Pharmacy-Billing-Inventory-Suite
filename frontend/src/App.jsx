import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  UserSquare2, 
  LogOut, 
  Plus, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  FolderOpen,
  UserCheck,
  ShoppingCart,
  Receipt,
  Printer,
  X
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Login form states
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Data states
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sales, setSales] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [salesSummary, setSalesSummary] = useState(null);

  // Billing tab states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [walkInName, setWalkInName] = useState('Walk-in Customer');
  const [walkInPhone, setWalkInPhone] = useState('9999999999');
  const [walkInStateCode, setWalkInStateCode] = useState('29');
  
  const [medSearchQuery, setMedSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState('0.00');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [finalInvoice, setFinalInvoice] = useState(null); // Shows receipt modal

  // Create forms
  const [newMedicine, setNewMedicine] = useState({
    name: '', generic_name: '', manufacturer: '', hsn_code: '', gst_rate: '18.00', unit: 'Strip', category: 'Tablet'
  });
  const [newSupplier, setNewSupplier] = useState({
    name: '', gstin: '', phone: '', address: '', state_code: '29'
  });
  const [newCustomer, setNewCustomer] = useState({
    name: '', phone: '', address: '', state_code: '29'
  });
  const [newBatch, setNewBatch] = useState({
    medicine_id: '', batch_no: '', expiry_date: '', quantity: 100, purchase_price: '50.00', mrp: '99.00', supplier_id: ''
  });

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const triggerNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    if (token) {
      axios.get(`${API_BASE_URL}/auth/me`, getAuthHeaders())
        .then(res => {
          setUser(res.data);
          fetchData();
        })
        .catch(err => {
          handleLogout();
        });
    }
  }, [token]);

  const fetchData = () => {
    const headers = getAuthHeaders();
    axios.get(`${API_BASE_URL}/medicines/`, headers).then(res => setMedicines(res.data)).catch(console.error);
    axios.get(`${API_BASE_URL}/suppliers/`, headers).then(res => setSuppliers(res.data)).catch(console.error);
    axios.get(`${API_BASE_URL}/customers/`, headers).then(res => setCustomers(res.data)).catch(console.error);
    axios.get(`${API_BASE_URL}/batches/`, headers).then(res => setBatches(res.data)).catch(console.error);
    axios.get(`${API_BASE_URL}/sales/`, headers).then(res => setSales(res.data)).catch(console.error);
    axios.get(`${API_BASE_URL}/analytics/alerts`, headers).then(res => setAlerts(res.data)).catch(console.error);
    axios.get(`${API_BASE_URL}/analytics/sales-summary`, headers).then(res => setSalesSummary(res.data)).catch(console.error);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const res = await axios.post(`${API_BASE_URL}/auth/login`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('token', res.data.access_token);
      setToken(res.data.access_token);
      triggerNotification('Successfully logged in!');
    } catch (err) {
      setLoginError(err.response?.data?.detail || 'Failed to connect to backend server');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  // Add item to cart using FEFO selection
  const handleAddToCart = (medicine) => {
    // Get all unexpired batches with stock > 0 for this medicine, sorted by expiry date asc (FEFO)
    const todayStr = new Date().toISOString().split('T')[0];
    const availableBatches = batches
      .filter(b => b.medicine_id === medicine.id && b.quantity > 0 && b.expiry_date >= todayStr)
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

    if (availableBatches.length === 0) {
      triggerNotification(`No active stock batches found for ${medicine.name}`, 'error');
      return;
    }

    const fefoBatch = availableBatches[0];

    // Check if batch already exists in cart
    const existingIndex = cart.findIndex(item => item.batch_id === fefoBatch.id);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingIndex].quantity + 1 > fefoBatch.quantity) {
        triggerNotification(`Cannot exceed available batch stock (${fefoBatch.quantity})`, 'error');
        return;
      }
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        medicine_id: medicine.id,
        name: medicine.name,
        generic_name: medicine.generic_name,
        batch_id: fefoBatch.id,
        batch_no: fefoBatch.batch_no,
        expiry_date: fefoBatch.expiry_date,
        max_quantity: fefoBatch.quantity,
        sale_price: parseFloat(fefoBatch.mrp).toFixed(2), // default to MRP
        gst_rate: parseFloat(medicine.gst_rate),
        quantity: 1
      }]);
    }
    triggerNotification(`Added ${medicine.name} (Batch: ${fefoBatch.batch_no}) to cart`);
  };

  const updateCartQty = (index, qty) => {
    const updated = [...cart];
    const item = updated[index];
    const parsedQty = parseInt(qty) || 0;
    if (parsedQty > item.max_quantity) {
      triggerNotification(`Only ${item.max_quantity} units available in Batch ${item.batch_no}`, 'error');
      item.quantity = item.max_quantity;
    } else {
      item.quantity = parsedQty;
    }
    setCart(updated);
  };

  const updateCartPrice = (index, price) => {
    const updated = [...cart];
    updated[index].sale_price = price;
    setCart(updated);
  };

  const removeFromCart = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
    triggerNotification('Item removed from cart');
  };

  // GST State Calculation logic
  const getCustomerStateCode = () => {
    if (selectedCustomerId) {
      const cust = customers.find(c => c.id === parseInt(selectedCustomerId));
      return cust?.state_code || '29';
    }
    return walkInStateCode || '29';
  };

  const isLocalCustomer = () => {
    return getCustomerStateCode() === '29';
  };

  // Computations
  const getCartTotals = () => {
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    cart.forEach(item => {
      const price = parseFloat(item.sale_price) || 0;
      const qty = item.quantity || 0;
      const itemSubtotal = price * qty;
      const rate = item.gst_rate / 100;

      subtotal += itemSubtotal;
      if (isLocalCustomer()) {
        const itemCgst = itemSubtotal * (rate / 2);
        cgst += itemCgst;
        sgst += itemCgst;
      } else {
        igst += itemSubtotal * rate;
      }
    });

    const discVal = parseFloat(discount) || 0;
    const total = subtotal + cgst + sgst + igst - discVal;

    return {
      subtotal: subtotal.toFixed(2),
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      igst: igst.toFixed(2),
      total: Math.max(0, total).toFixed(2)
    };
  };

  const totals = getCartTotals();

  // Submit sale to backend
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      triggerNotification('Cart is empty', 'error');
      return;
    }

    const salePayload = {
      customer_id: selectedCustomerId ? parseInt(selectedCustomerId) : null,
      customer_name: selectedCustomerId ? null : walkInName,
      customer_phone: selectedCustomerId ? null : walkInPhone,
      customer_state_code: getCustomerStateCode(),
      payment_mode: paymentMode,
      discount: parseFloat(discount) || 0,
      items: cart.map(item => ({
        batch_id: item.batch_id,
        quantity: item.quantity,
        sale_price: parseFloat(item.sale_price)
      }))
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/sales/`, salePayload, getAuthHeaders());
      triggerNotification('Sale successfully finalized!');
      setFinalInvoice(res.data);
      setCart([]);
      setDiscount('0.00');
      fetchData();
    } catch (err) {
      triggerNotification(err.response?.data?.detail || 'Failed to complete checkout', 'error');
    }
  };

  // Download PDF invoice from backend
  const handleDownloadPdf = async (saleId, invoiceNo) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/sales/${saleId}/pdf`, {
        ...getAuthHeaders(),
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      triggerNotification('PDF downloaded successfully!');
    } catch (err) {
      triggerNotification('Failed to download PDF. Please try again.', 'error');
    }
  };

  // Add handlers
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/medicines/`, newMedicine, getAuthHeaders());
      triggerNotification('Medicine added successfully');
      setNewMedicine({ name: '', generic_name: '', manufacturer: '', hsn_code: '', gst_rate: '18.00', unit: 'Strip', category: 'Tablet' });
      fetchData();
    } catch (err) {
      triggerNotification(err.response?.data?.detail || 'Failed to add medicine', 'error');
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/suppliers/`, newSupplier, getAuthHeaders());
      triggerNotification('Supplier added successfully');
      setNewSupplier({ name: '', gstin: '', phone: '', address: '', state_code: '29' });
      fetchData();
    } catch (err) {
      triggerNotification(err.response?.data?.detail || 'Failed to add supplier', 'error');
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/customers/`, newCustomer, getAuthHeaders());
      triggerNotification('Customer added successfully');
      setNewCustomer({ name: '', phone: '', address: '', state_code: '29' });
      fetchData();
    } catch (err) {
      triggerNotification(err.response?.data?.detail || 'Failed to add customer', 'error');
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/batches/`, newBatch, getAuthHeaders());
      triggerNotification('Batch added successfully');
      setNewBatch({ medicine_id: '', batch_no: '', expiry_date: '', quantity: 100, purchase_price: '50.00', mrp: '99.00', supplier_id: '' });
      fetchData();
    } catch (err) {
      triggerNotification(err.response?.data?.detail || 'Failed to add batch', 'error');
    }
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(medSearchQuery.toLowerCase()) ||
    (m.generic_name && m.generic_name.toLowerCase().includes(medSearchQuery.toLowerCase()))
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute top-10 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 tracking-wider">
            MediLedger
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Pharmacy Billing & Inventory Management Suite</p>
        </div>

        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Staff Log In</h2>

          {loginError && (
            <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full bg-slate-950/40 border border-slate-700/50 rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g. admin"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950/40 border border-slate-700/50 rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loginLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loginLoading ? 'Logging in...' : 'Enter System'}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-700/30 pt-4 text-center">
            <span className="text-xs text-slate-400">Default Credentials for Demo:</span>
            <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-slate-300 font-mono">
              <div className="bg-slate-800/40 p-1.5 rounded">admin / admin123</div>
              <div className="bg-slate-800/40 p-1.5 rounded">pharmacist / pharma123</div>
              <div className="bg-slate-800/40 p-1.5 rounded">cashier / cashier123</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Toast Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 py-3 px-5 rounded-lg border shadow-xl text-white transition-all transform translate-y-0 ${
          notification.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-emerald-600 border-emerald-500'
        }`}>
          <CheckCircle size={18} />
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Invoice receipt slip modal */}
      {finalInvoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100 flex flex-col justify-between max-h-[90vh]">
            <button 
              onClick={() => setFinalInvoice(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto pr-1">
              {/* Receipt Thermal styling */}
              <div className="text-center pb-4 border-b border-dashed border-slate-200">
                <h3 className="text-xl font-black text-slate-900 tracking-wider">MEDILEDGER PHARMACY</h3>
                <p className="text-xs text-slate-500 mt-1">Karnataka, GSTIN: 29MMMMM8888M1Z0</p>
                <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">Ph: 9988776655</p>
              </div>

              <div className="py-4 text-xs space-y-1.5 border-b border-dashed border-slate-200 font-mono text-slate-600">
                <div className="flex justify-between"><span>Invoice:</span><span className="font-bold text-slate-950">{finalInvoice.invoice_no}</span></div>
                <div className="flex justify-between"><span>Date:</span><span>{finalInvoice.date}</span></div>
                <div className="flex justify-between"><span>Cashier ID:</span><span>User #{finalInvoice.created_by}</span></div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="text-slate-950 font-bold">
                    {finalInvoice.customer_id ? `Saved Cust #${finalInvoice.customer_id}` : 'Walk-in Customer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Customer State Code:</span>
                  <span>{getCustomerStateCode()} {isLocalCustomer() ? '(Local)' : '(Interstate)'}</span>
                </div>
              </div>

              <table className="w-full mt-4 text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-dashed border-slate-200 text-slate-400 text-[10px]">
                    <th className="pb-2">Item</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-100 text-slate-800">
                  {finalInvoice.items?.map(it => {
                    const matchedBatch = batches.find(b => b.id === it.batch_id);
                    const matchedMed = matchedBatch ? medicines.find(m => m.id === matchedBatch.medicine_id) : null;
                    return (
                      <tr key={it.id} className="align-top">
                        <td className="py-2.5">
                          <span className="font-bold block text-slate-900">{matchedMed?.name || `Batch #${it.batch_id}`}</span>
                          <span className="text-[10px] text-slate-400">Batch: {matchedBatch?.batch_no} | Exp: {matchedBatch?.expiry_date}</span>
                        </td>
                        <td className="py-2.5 text-right font-bold">{it.quantity}</td>
                        <td className="py-2.5 text-right">₹{parseFloat(it.sale_price).toFixed(2)}</td>
                        <td className="py-2.5 text-right font-bold">₹{parseFloat(it.line_total).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 pt-4 border-t border-dashed border-slate-200 space-y-1.5 font-mono text-xs text-slate-600">
                <div className="flex justify-between"><span>Subtotal:</span><span>₹{parseFloat(finalInvoice.subtotal).toFixed(2)}</span></div>
                {parseFloat(finalInvoice.cgst_amount) > 0 && (
                  <div className="flex justify-between"><span>CGST:</span><span>₹{parseFloat(finalInvoice.cgst_amount).toFixed(2)}</span></div>
                )}
                {parseFloat(finalInvoice.sgst_amount) > 0 && (
                  <div className="flex justify-between"><span>SGST:</span><span>₹{parseFloat(finalInvoice.sgst_amount).toFixed(2)}</span></div>
                )}
                {parseFloat(finalInvoice.igst_amount) > 0 && (
                  <div className="flex justify-between"><span>IGST:</span><span>₹{parseFloat(finalInvoice.igst_amount).toFixed(2)}</span></div>
                )}
                {parseFloat(finalInvoice.discount) > 0 && (
                  <div className="flex justify-between text-rose-600"><span>Discount:</span><span>-₹{parseFloat(finalInvoice.discount).toFixed(2)}</span></div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-dashed border-slate-200">
                  <span>Grand Total:</span>
                  <span>₹{parseFloat(finalInvoice.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center mt-6 text-[10px] text-slate-400 font-bold border-t border-dashed border-slate-200 pt-3">
                <p>THANK YOU FOR YOUR VISIT</p>
                <p className="mt-0.5 font-mono text-[8px]">Invoices are GST Compliant</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => handleDownloadPdf(finalInvoice.id, finalInvoice.invoice_no)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                <span>Download PDF Invoice</span>
              </button>
              <button 
                onClick={() => setFinalInvoice(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-lg text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0">
        <div>
          <div className="py-4 border-b border-slate-800 text-center mb-6">
            <h1 className="text-2xl font-black text-white tracking-wider">MediLedger</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Karnataka Store Suite</p>
          </div>

          <div className="space-y-1">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
              { id: 'billing', name: 'Billing Counter', icon: ShoppingCart },
              { id: 'inventory', name: 'Inventory & Medicines', icon: Package },
              { id: 'suppliers', name: 'Suppliers', icon: Truck },
              { id: 'customers', name: 'Customers', icon: Users },
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4">
          {user && (
            <div className="bg-slate-800/40 p-3 rounded-lg flex items-center gap-3 mb-3 border border-slate-800">
              <div className="bg-blue-500/20 text-blue-400 p-2 rounded">
                <UserCheck size={18} />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
                <p className="text-[10px] text-slate-400 capitalize font-mono">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-900/30 text-rose-300 font-bold text-xs uppercase tracking-wider transition-all"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900">System Dashboard</h2>
              <p className="text-sm text-slate-500 mt-1">Live overview and real-time operations alerts</p>
            </div>

            {/* Sales performance summaries */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Today's Revenue</span>
                <div className="flex justify-between items-center mt-2">
                  <h3 className="text-3xl font-black text-slate-800">
                    ₹{salesSummary?.today?.revenue?.toFixed(2) || '0.00'}
                  </h3>
                  <span className="bg-emerald-50 text-emerald-600 text-xs font-bold py-1 px-2.5 rounded-full">
                    {salesSummary?.today?.invoices || 0} Invoices
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">This Month's Revenue</span>
                <div className="flex justify-between items-center mt-2">
                  <h3 className="text-3xl font-black text-slate-800">
                    ₹{salesSummary?.this_month?.revenue?.toFixed(2) || '0.00'}
                  </h3>
                  <span className="bg-blue-50 text-blue-600 text-xs font-bold py-1 px-2.5 rounded-full">
                    {salesSummary?.this_month?.invoices || 0} Invoices
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">All-Time Revenue</span>
                <div className="flex justify-between items-center mt-2">
                  <h3 className="text-3xl font-black text-slate-800">
                    ₹{salesSummary?.all_time?.revenue?.toFixed(2) || '0.00'}
                  </h3>
                  <span className="bg-indigo-50 text-indigo-600 text-xs font-bold py-1 px-2.5 rounded-full">
                    {salesSummary?.all_time?.invoices || 0} Total
                  </span>
                </div>
              </div>
            </div>

            {/* Core directories count banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-100/60 border border-slate-200/60 p-4 rounded-lg flex items-center justify-between text-xs text-slate-600">
                <span>Medicines: <b>{medicines.length}</b></span>
                <Package size={14} className="text-slate-400" />
              </div>
              <div className="bg-slate-100/60 border border-slate-200/60 p-4 rounded-lg flex items-center justify-between text-xs text-slate-600">
                <span>Total Batches: <b>{batches.length}</b></span>
                <FolderOpen size={14} className="text-slate-400" />
              </div>
              <div className="bg-slate-100/60 border border-slate-200/60 p-4 rounded-lg flex items-center justify-between text-xs text-slate-600">
                <span>Suppliers: <b>{suppliers.length}</b></span>
                <Truck size={14} className="text-slate-400" />
              </div>
              <div className="bg-slate-100/60 border border-slate-200/60 p-4 rounded-lg flex items-center justify-between text-xs text-slate-600">
                <span>Customers: <b>{customers.length}</b></span>
                <Users size={14} className="text-slate-400" />
              </div>
            </div>

            {/* Expiry alerts and Low stock panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Expiration warnings */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span>Batch Expiry Warnings</span>
                </h3>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {/* Already Expired */}
                  {alerts?.expired_with_stock?.map(b => (
                    <div key={b.batch_id} className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-rose-700 block">{b.medicine_name}</span>
                        <span className="text-slate-500 font-mono">Batch: {b.batch_no} | Expired: {b.expiry_date}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-600 block">{b.quantity} in stock</span>
                        <span className="text-[10px] text-rose-500 uppercase font-black">{b.days_overdue} days overdue</span>
                      </div>
                    </div>
                  ))}

                  {/* 7d Expiry */}
                  {alerts?.expiring_critical_7d?.map(b => (
                    <div key={b.batch_id} className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-orange-700 block">{b.medicine_name}</span>
                        <span className="text-slate-500 font-mono">Batch: {b.batch_no} | Expires: {b.expiry_date}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-orange-600 block">{b.quantity} units</span>
                        <span className="text-[10px] text-orange-500 uppercase font-bold">{b.days_remaining}d remaining</span>
                      </div>
                    </div>
                  ))}

                  {/* 30d Expiry */}
                  {alerts?.expiring_soon_30d?.map(b => (
                    <div key={b.batch_id} className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-amber-700 block">{b.medicine_name}</span>
                        <span className="text-slate-500 font-mono">Batch: {b.batch_no} | Expiry: {b.expiry_date}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-amber-600 block">{b.quantity} units</span>
                        <span className="text-[10px] text-amber-500 font-medium">{b.days_remaining} days left</span>
                      </div>
                    </div>
                  ))}

                  {alerts?.summary?.expired_with_stock === 0 && 
                   alerts?.summary?.expiring_critical_7d === 0 && 
                   alerts?.summary?.expiring_soon_30d === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">No expiring or overdue batches found. ✅</p>
                  )}
                </div>
              </div>

              {/* Low stock alerts */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-500" />
                  <span>Low Stock Warnings (≤ 10)</span>
                </h3>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {alerts?.low_stock?.map(b => (
                    <div key={b.batch_id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{b.medicine_name}</span>
                        <span className="text-slate-500 font-mono">Batch: {b.batch_no} | Exp: {b.expiry_date}</span>
                      </div>
                      <span className={`font-bold py-1 px-2.5 rounded text-[11px] ${
                        b.quantity === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {b.quantity === 0 ? 'OUT OF STOCK' : `${b.quantity} Left`}
                      </span>
                    </div>
                  ))}

                  {alerts?.summary?.low_stock_batches === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">All batches are well-stocked. ✅</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Billing Counter</h2>
              <p className="text-sm text-slate-500 mt-0.5">Create GST-compliant invoices with FEFO batch selection</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Customer and Medicine Select */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Customer selection */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Customer Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Select Registered Customer</label>
                      <select
                        value={selectedCustomerId}
                        onChange={e => setSelectedCustomerId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Walk-in / Unsaved Customer --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                        ))}
                      </select>
                    </div>

                    {!selectedCustomerId && (
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Walk-in Info</span>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Name</label>
                          <input 
                            type="text" 
                            value={walkInName}
                            onChange={e => setWalkInName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Phone</label>
                            <input 
                              type="text" 
                              value={walkInPhone}
                              onChange={e => setWalkInPhone(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">GST State Code</label>
                            <input 
                              type="text" 
                              value={walkInStateCode}
                              onChange={e => setWalkInStateCode(e.target.value)}
                              placeholder="29"
                              className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medicine Search & Click to Add */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Add Medicine</h3>
                  
                  <div className="relative mb-4">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Search size={16} />
                    </span>
                    <input 
                      type="text"
                      placeholder="Search catalog..."
                      value={medSearchQuery}
                      onChange={e => setMedSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
                    {filteredMedicines.map(med => (
                      <div 
                        key={med.id} 
                        onClick={() => handleAddToCart(med)}
                        className="py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50/80 px-2 rounded-lg transition-all"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{med.name}</h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">HSN: {med.hsn_code} | GST: {med.gst_rate}%</span>
                        </div>
                        <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded-full transition-all">
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                    {filteredMedicines.length === 0 && (
                      <p className="text-xs text-center text-slate-400 py-8">No matching medicines found.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Billing Cart & Totals */}
              <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleCheckout} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Invoice Cart Items</h3>
                    <span className="text-xs bg-blue-50 text-blue-600 py-1 px-2.5 rounded-full font-bold">
                      {cart.length} unique items
                    </span>
                  </div>

                  {/* Cart Table */}
                  <div className="overflow-x-auto min-h-[220px]">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          <th className="py-3 px-5">Medicine & Batch</th>
                          <th className="py-3 px-5 text-right w-24">Qty</th>
                          <th className="py-3 px-5 text-right w-28">Sale Price (₹)</th>
                          <th className="py-3 px-5 text-right w-24">GST</th>
                          <th className="py-3 px-5 text-right">Line Total</th>
                          <th className="py-3 px-5 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {cart.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-16 text-center text-slate-400 font-medium">
                              Cart is empty. Search and add medicines on the left.
                            </td>
                          </tr>
                        ) : (
                          cart.map((item, idx) => {
                            const sub = (parseFloat(item.sale_price) || 0) * item.quantity;
                            return (
                              <tr key={item.batch_id} className="hover:bg-slate-50/50 transition-all">
                                <td className="py-3.5 px-5">
                                  <div className="font-bold text-slate-900">{item.name}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 flex gap-2">
                                    <span className="bg-slate-100 py-0.5 px-1 rounded font-mono font-bold text-slate-600">Batch: {item.batch_no}</span>
                                    <span>Exp: {item.expiry_date}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-5 text-right">
                                  <input 
                                    type="number"
                                    min="1"
                                    max={item.max_quantity}
                                    value={item.quantity}
                                    onChange={e => updateCartQty(idx, e.target.value)}
                                    className="w-16 bg-slate-50 border border-slate-200 rounded p-1 text-center font-bold text-sm"
                                  />
                                  <span className="block text-[8px] text-slate-400 mt-1 uppercase">Max: {item.max_quantity}</span>
                                </td>
                                <td className="py-3.5 px-5 text-right">
                                  <input 
                                    type="text"
                                    value={item.sale_price}
                                    onChange={e => updateCartPrice(idx, e.target.value)}
                                    className="w-24 bg-slate-50 border border-slate-200 rounded p-1 text-right font-mono"
                                  />
                                </td>
                                <td className="py-3.5 px-5 text-right font-semibold text-slate-500">
                                  {item.gst_rate}%
                                </td>
                                <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">
                                  ₹{sub.toFixed(2)}
                                </td>
                                <td className="py-3.5 px-5 text-center">
                                  <button 
                                    type="button"
                                    onClick={() => removeFromCart(idx)}
                                    className="text-rose-500 hover:text-rose-600 font-bold"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary & Checkout Footer */}
                  <div className="bg-slate-50 border-t border-slate-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Billing options */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Discount (₹)</label>
                          <input 
                            type="text" 
                            value={discount}
                            onChange={e => setDiscount(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Mode</label>
                          <select
                            value={paymentMode}
                            onChange={e => setPaymentMode(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="UPI">UPI / QR Code</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-2 bg-white border border-slate-200/60 p-3 rounded-lg leading-relaxed">
                        <span className="font-bold text-slate-700 block mb-1">GST Tax Allocation Rules:</span>
                        Customer State: <span className="font-bold">{getCustomerStateCode()}</span>. 
                        Tax Split: <span className="font-bold text-indigo-600">{isLocalCustomer() ? 'Local CGST (6%) + SGST (6%)' : 'Interstate IGST (12%)'}</span>
                      </div>
                    </div>

                    {/* Final checkout totals */}
                    <div className="space-y-3 bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between shadow-sm">
                      <div className="space-y-2 text-xs text-slate-600 font-mono">
                        <div className="flex justify-between"><span>Base Subtotal:</span><span>₹{totals.subtotal}</span></div>
                        
                        {isLocalCustomer() ? (
                          <>
                            <div className="flex justify-between"><span>CGST:</span><span>₹{totals.cgst}</span></div>
                            <div className="flex justify-between"><span>SGST:</span><span>₹{totals.sgst}</span></div>
                          </>
                        ) : (
                          <div className="flex justify-between"><span>IGST:</span><span>₹{totals.igst}</span></div>
                        )}

                        {parseFloat(discount) > 0 && (
                          <div className="flex justify-between text-rose-600"><span>Discount:</span><span>-₹{parseFloat(discount).toFixed(2)}</span></div>
                        )}
                        
                        <div className="flex justify-between text-lg font-black text-slate-900 border-t border-dashed border-slate-200 pt-2">
                          <span>Grand Total:</span>
                          <span>₹{totals.total}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={cart.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Receipt size={18} />
                        <span>Finalize Invoice & Checkout</span>
                      </button>
                    </div>

                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY & MEDICINES TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Inventory & Medicines</h2>
                <p className="text-sm text-slate-500 mt-0.5">Manage medicine items and stock batches</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Form */}
              <div className="space-y-6 lg:col-span-1">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-blue-500" />
                    <span>Create New Medicine</span>
                  </h3>
                  
                  <form onSubmit={handleAddMedicine} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Medicine Name</label>
                      <input 
                        type="text" 
                        value={newMedicine.name} 
                        onChange={e => setNewMedicine({...newMedicine, name: e.target.value})}
                        required
                        placeholder="e.g. Paracetamol 650mg"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Generic Name</label>
                      <input 
                        type="text" 
                        value={newMedicine.generic_name} 
                        onChange={e => setNewMedicine({...newMedicine, generic_name: e.target.value})}
                        placeholder="e.g. Paracetamol"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Manufacturer</label>
                        <input 
                          type="text" 
                          value={newMedicine.manufacturer} 
                          onChange={e => setNewMedicine({...newMedicine, manufacturer: e.target.value})}
                          required
                          placeholder="e.g. Cipla"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">HSN Code</label>
                        <input 
                          type="text" 
                          value={newMedicine.hsn_code} 
                          onChange={e => setNewMedicine({...newMedicine, hsn_code: e.target.value})}
                          required
                          placeholder="30049099"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">GST Rate (%)</label>
                        <select 
                          value={newMedicine.gst_rate}
                          onChange={e => setNewMedicine({...newMedicine, gst_rate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="0.00">0%</option>
                          <option value="5.00">5%</option>
                          <option value="12.00">12%</option>
                          <option value="18.00">18%</option>
                          <option value="28.00">28%</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Unit</label>
                        <input 
                          type="text" 
                          value={newMedicine.unit} 
                          onChange={e => setNewMedicine({...newMedicine, unit: e.target.value})}
                          required
                          placeholder="Strip"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                        <input 
                          type="text" 
                          value={newMedicine.category} 
                          onChange={e => setNewMedicine({...newMedicine, category: e.target.value})}
                          required
                          placeholder="Tablet"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all"
                    >
                      Save Medicine
                    </button>
                  </form>
                </div>

                {/* Batch Adding Form */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-indigo-500" />
                    <span>Record Medicine Batch</span>
                  </h3>
                  
                  <form onSubmit={handleAddBatch} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Select Medicine</label>
                      <select 
                        value={newBatch.medicine_id}
                        onChange={e => setNewBatch({...newBatch, medicine_id: e.target.value})}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Choose Medicine --</option>
                        {medicines.map(med => (
                          <option key={med.id} value={med.id}>{med.name} ({med.manufacturer})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Batch Number</label>
                        <input 
                          type="text" 
                          value={newBatch.batch_no} 
                          onChange={e => setNewBatch({...newBatch, batch_no: e.target.value})}
                          required
                          placeholder="BAT1002"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Expiry Date</label>
                        <input 
                          type="date" 
                          value={newBatch.expiry_date} 
                          onChange={e => setNewBatch({...newBatch, expiry_date: e.target.value})}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity</label>
                        <input 
                          type="number" 
                          value={newBatch.quantity} 
                          onChange={e => setNewBatch({...newBatch, quantity: parseInt(e.target.value) || 0})}
                          required
                          min="0"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Cost Price (₹)</label>
                        <input 
                          type="text" 
                          value={newBatch.purchase_price} 
                          onChange={e => setNewBatch({...newBatch, purchase_price: e.target.value})}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">MRP (₹)</label>
                        <input 
                          type="text" 
                          value={newBatch.mrp} 
                          onChange={e => setNewBatch({...newBatch, mrp: e.target.value})}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Select Supplier</label>
                      <select 
                        value={newBatch.supplier_id}
                        onChange={e => setNewBatch({...newBatch, supplier_id: e.target.value})}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Choose Supplier --</option>
                        {suppliers.map(sup => (
                          <option key={sup.id} value={sup.id}>{sup.name}</option>
                        ))}
                      </select>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all"
                    >
                      Save Batch
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Listing */}
              <div className="lg:col-span-2 space-y-6">
                {/* Medicines List */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Medicines Directory</h3>
                    <span className="text-xs bg-slate-100 text-slate-600 py-1 px-2.5 rounded-full font-bold">{medicines.length} items</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          <th className="py-3 px-5">ID</th>
                          <th className="py-3 px-5">Name / Generic</th>
                          <th className="py-3 px-5">Manufacturer</th>
                          <th className="py-3 px-5">HSN Code</th>
                          <th className="py-3 px-5 text-right">GST Rate</th>
                          <th className="py-3 px-5">Unit / Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {medicines.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">No medicines registered yet. Use the form to add one.</td>
                          </tr>
                        ) : (
                          medicines.map(med => (
                            <tr key={med.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="py-3.5 px-5 font-mono text-xs">{med.id}</td>
                              <td className="py-3.5 px-5">
                                <div className="font-bold text-slate-900">{med.name}</div>
                                {med.generic_name && <div className="text-xs text-slate-400 mt-0.5">{med.generic_name}</div>}
                              </td>
                              <td className="py-3.5 px-5">{med.manufacturer}</td>
                              <td className="py-3.5 px-5 font-mono text-xs">{med.hsn_code}</td>
                              <td className="py-3.5 px-5 text-right font-bold text-slate-800">{med.gst_rate}%</td>
                              <td className="py-3.5 px-5">
                                <span className="text-xs bg-blue-50 text-blue-600 py-0.5 px-2 rounded-full font-semibold">{med.category}</span>
                                <span className="text-xs text-slate-400 ml-1.5">/ {med.unit}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Batches List */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Recorded Batches (Stock Levels)</h3>
                    <span className="text-xs bg-indigo-50 text-indigo-600 py-1 px-2.5 rounded-full font-bold">{batches.length} batches</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          <th className="py-3 px-5">Batch No</th>
                          <th className="py-3 px-5">Medicine</th>
                          <th className="py-3 px-5 text-center">Expiry</th>
                          <th className="py-3 px-5 text-right">Quantity</th>
                          <th className="py-3 px-5 text-right">Cost (₹)</th>
                          <th className="py-3 px-5 text-right">MRP (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {batches.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">No stock batches recorded yet.</td>
                          </tr>
                        ) : (
                          batches.map(bat => {
                            const medicineName = medicines.find(m => m.id === bat.medicine_id)?.name || `Medicine ID: ${bat.medicine_id}`;
                            const isExpired = new Date(bat.expiry_date) < new Date();
                            return (
                              <tr key={bat.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="py-3.5 px-5 font-mono text-xs font-bold text-slate-900">{bat.batch_no}</td>
                                <td className="py-3.5 px-5 font-medium">{medicineName}</td>
                                <td className={`py-3.5 px-5 text-center font-bold text-xs ${isExpired ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {bat.expiry_date}
                                  {isExpired && <span className="block text-[8px] uppercase tracking-wider text-rose-500 font-black">Expired</span>}
                                </td>
                                <td className="py-3.5 px-5 text-right font-bold text-slate-800">{bat.quantity}</td>
                                <td className="py-3.5 px-5 text-right font-mono">₹{parseFloat(bat.purchase_price).toFixed(2)}</td>
                                <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">₹{parseFloat(bat.mrp).toFixed(2)}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUPPLIERS TAB */}
        {activeTab === 'suppliers' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Suppliers</h2>
              <p className="text-sm text-slate-500 mt-0.5">Manage medicine vendors and GST details</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                  <Plus size={18} className="text-blue-500" />
                  <span>Register Supplier</span>
                </h3>
                
                <form onSubmit={handleAddSupplier} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier Name</label>
                    <input 
                      type="text" 
                      value={newSupplier.name} 
                      onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                      required
                      placeholder="e.g. Karnataka Meds Distributor"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">GSTIN</label>
                      <input 
                        type="text" 
                        value={newSupplier.gstin} 
                        onChange={e => setNewSupplier({...newSupplier, gstin: e.target.value.toUpperCase()})}
                        required
                        maxLength="15"
                        placeholder="29AAAAA1111A1Z1"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">State Code</label>
                      <input 
                        type="text" 
                        value={newSupplier.state_code} 
                        onChange={e => setNewSupplier({...newSupplier, state_code: e.target.value})}
                        required
                        maxLength="2"
                        placeholder="29"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={newSupplier.phone} 
                      onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                      required
                      placeholder="9876543210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Full Address</label>
                    <textarea 
                      value={newSupplier.address} 
                      onChange={e => setNewSupplier({...newSupplier, address: e.target.value})}
                      required
                      placeholder="No. 12, MG Road, Bengaluru"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-20 resize-none"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all"
                  >
                    Save Supplier
                  </button>
                </form>
              </div>

              {/* Right Column: Listing */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Suppliers Directory</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 py-1 px-2.5 rounded-full font-bold">{suppliers.length} vendors</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="py-3 px-5">ID</th>
                        <th className="py-3 px-5">Name</th>
                        <th className="py-3 px-5">GSTIN / State</th>
                        <th className="py-3 px-5">Phone</th>
                        <th className="py-3 px-5">Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {suppliers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">No suppliers registered. Add one using the form.</td>
                        </tr>
                      ) : (
                        suppliers.map(sup => (
                          <tr key={sup.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="py-3.5 px-5 font-mono text-xs">{sup.id}</td>
                            <td className="py-3.5 px-5 font-bold text-slate-900">{sup.name}</td>
                            <td className="py-3.5 px-5">
                              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 py-0.5 px-1.5 rounded">{sup.gstin}</span>
                              <span className="text-xs text-slate-400 ml-1.5">Code: {sup.state_code}</span>
                            </td>
                            <td className="py-3.5 px-5">{sup.phone}</td>
                            <td className="py-3.5 px-5 max-w-xs truncate text-xs text-slate-500">{sup.address}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Customers</h2>
              <p className="text-sm text-slate-500 mt-0.5">Manage customer directory and local/interstate markers</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                  <Plus size={18} className="text-blue-500" />
                  <span>Register Customer</span>
                </h3>
                
                <form onSubmit={handleAddCustomer} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Customer Name</label>
                    <input 
                      type="text" 
                      value={newCustomer.name} 
                      onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                      required
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={newCustomer.phone} 
                        onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                        required
                        placeholder="9876543210"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">State Code (Optional)</label>
                      <input 
                        type="text" 
                        value={newCustomer.state_code} 
                        onChange={e => setNewCustomer({...newCustomer, state_code: e.target.value})}
                        maxLength="2"
                        placeholder="29"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Full Address (Optional)</label>
                    <textarea 
                      value={newCustomer.address} 
                      onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                      placeholder="No. 45, 2nd Main Road, Bengaluru"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-20 resize-none"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all"
                  >
                    Save Customer
                  </button>
                </form>
              </div>

              {/* Right Column: Listing */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Customers Directory</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 py-1 px-2.5 rounded-full font-bold">{customers.length} registered</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="py-3 px-5">ID</th>
                        <th className="py-3 px-5">Name</th>
                        <th className="py-3 px-5">Phone</th>
                        <th className="py-3 px-5 text-center">State Code</th>
                        <th className="py-3 px-5">Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">No customers registered. Add one using the form.</td>
                        </tr>
                      ) : (
                        customers.map(cust => (
                          <tr key={cust.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="py-3.5 px-5 font-mono text-xs">{cust.id}</td>
                            <td className="py-3.5 px-5 font-bold text-slate-900">{cust.name}</td>
                            <td className="py-3.5 px-5">{cust.phone}</td>
                            <td className="py-3.5 px-5 text-center">
                              {cust.state_code ? (
                                <span className="font-mono font-bold text-xs bg-blue-50 text-blue-600 py-0.5 px-2 rounded">
                                  {cust.state_code}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 italic">29 (Local Walk-in)</span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 max-w-xs truncate text-xs text-slate-500">{cust.address || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
