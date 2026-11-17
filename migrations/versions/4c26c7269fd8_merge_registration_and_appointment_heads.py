"""merge_registration_and_appointment_heads

Revision ID: 4c26c7269fd8
Revises: 4c2e6b7a91d0, f4a91d2c7e10
Create Date: 2026-11-17 00:26:38.042856

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4c26c7269fd8'
down_revision: Union[str, Sequence[str], None] = ('4c2e6b7a91d0', 'f4a91d2c7e10')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
