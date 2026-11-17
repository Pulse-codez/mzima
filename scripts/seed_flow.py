import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

from backend.db.session import SessionLocal
from backend.services.flow.seeding import ensure_flow_reference_data

PDF_DIR = os.path.join(PROJECT_ROOT, "backend", "data")


def main():
    db = SessionLocal()
    try:
        result = ensure_flow_reference_data(db, PDF_DIR)
        print("Flow reference data seeded:", result)
    finally:
        db.close()


if __name__ == "__main__":
    main()
