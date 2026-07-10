"""add_unique_constraint_batches_medicine_batch_supplier

Revision ID: 527ef11c9a3e
Revises: c4ed273e458a
Create Date: 2026-07-10 16:22:55.048519

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '527ef11c9a3e'
down_revision: Union[str, Sequence[str], None] = 'c4ed273e458a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint(
        'uq_batches_medicine_batch_supplier',
        'batches',
        ['medicine_id', 'batch_no', 'supplier_id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_batches_medicine_batch_supplier', 'batches', type_='unique')
