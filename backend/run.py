"""
SalesSphere AI – Application Entry Point
"""
import os
from app import create_app, db
from app.models import User, Category, Product, Sale, SaleItem, Notification, ImportedDataset

app = create_app(os.getenv("FLASK_ENV", "development"))


@app.shell_context_processor
def make_shell_context():
    return {
        "db": db,
        "User": User,
        "Category": Category,
        "Product": Product,
        "Sale": Sale,
        "SaleItem": SaleItem,
        "Notification": Notification,
        "ImportedDataset": ImportedDataset,
    }


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=app.config["DEBUG"],
    )
