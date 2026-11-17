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
    with op.batch_alter_table("appointment_requests") as batch_op:
        batch_op.add_column(sa.Column("integration_status", sa.String(length=40), nullable=True, server_default="NOT_SYNCED"))
        batch_op.add_column(sa.Column("external_system", sa.String(length=80), nullable=True))
        batch_op.add_column(sa.Column("external_reference", sa.String(length=160), nullable=True))
        batch_op.add_column(sa.Column("integration_idempotency_key", sa.String(length=160), nullable=True))
        batch_op.create_unique_constraint("uq_appointment_requests_integration_key", ["integration_idempotency_key"])
        batch_op.add_column(sa.Column("integrated_at", sa.DateTime(), nullable=True))


def downgrade():
    with op.batch_alter_table("appointment_requests") as batch_op:
        batch_op.drop_column("integrated_at")
        batch_op.drop_constraint("uq_appointment_requests_integration_key", type_="unique")
        batch_op.drop_column("integration_idempotency_key")
        batch_op.drop_column("external_reference")
        batch_op.drop_column("external_system")
        batch_op.drop_column("integration_status")
    op.drop_index("ix_visits_patient_identifier", table_name="visits")
    op.drop_column("visits", "patient_identifier")
