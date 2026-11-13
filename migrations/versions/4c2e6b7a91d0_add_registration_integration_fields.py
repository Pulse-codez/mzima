"""add patient registration and facility integration fields"""
from alembic import op
import sqlalchemy as sa

revision = "4c2e6b7a91d0"
down_revision = "bf671f7bc692"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("visits", sa.Column("patient_identifier", sa.String(length=100), nullable=True))
    op.create_index("ix_visits_patient_identifier", "visits", ["patient_identifier"], unique=False)
    op.add_column("appointment_requests", sa.Column("integration_status", sa.String(length=40), nullable=True, server_default="NOT_SYNCED"))
    op.add_column("appointment_requests", sa.Column("external_system", sa.String(length=80), nullable=True))
    op.add_column("appointment_requests", sa.Column("external_reference", sa.String(length=160), nullable=True))
    op.add_column("appointment_requests", sa.Column("integration_idempotency_key", sa.String(length=160), nullable=True))
    op.create_unique_constraint("uq_appointment_requests_integration_key", "appointment_requests", ["integration_idempotency_key"])
    op.add_column("appointment_requests", sa.Column("integrated_at", sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column("appointment_requests", "integrated_at")
    op.drop_constraint("uq_appointment_requests_integration_key", "appointment_requests", type_="unique")
    op.drop_column("appointment_requests", "integration_idempotency_key")
    op.drop_column("appointment_requests", "external_reference")
    op.drop_column("appointment_requests", "external_system")
    op.drop_column("appointment_requests", "integration_status")
    op.drop_index("ix_visits_patient_identifier", table_name="visits")
    op.drop_column("visits", "patient_identifier")
