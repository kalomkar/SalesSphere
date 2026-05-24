"""
SalesSphere AI – Database Models
"""
import bcrypt
from datetime import datetime
from app import db


# ─────────────────────────────────────────────────────────────────────────────
# User Model
# ─────────────────────────────────────────────────────────────────────────────
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum("admin", "manager", "employee", "viewer"), default="employee")
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    avatar_url = db.Column(db.String(500), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    verify_token = db.Column(db.String(255), nullable=True)
    last_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sales = db.relationship("Sale", back_populates="user", lazy="dynamic")
    notifications = db.relationship("Notification", back_populates="user", lazy="dynamic")

    def set_password(self, password: str):
        self.password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(
            password.encode("utf-8"), self.password_hash.encode("utf-8")
        )

    def to_dict(self, include_sensitive=False):
        data = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "avatar_url": self.avatar_url,
            "phone": self.phone,
            "department": self.department,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat(),
        }
        return data


# ─────────────────────────────────────────────────────────────────────────────
# Product Category
# ─────────────────────────────────────────────────────────────────────────────
class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    color = db.Column(db.String(20), default="#6366f1")
    icon = db.Column(db.String(50), default="package")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    products = db.relationship("Product", back_populates="category", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "icon": self.icon,
            "product_count": self.products.count(),
            "created_at": self.created_at.isoformat(),
        }


# ─────────────────────────────────────────────────────────────────────────────
# Product Model
# ─────────────────────────────────────────────────────────────────────────────
class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    price = db.Column(db.Numeric(12, 2), nullable=False)
    cost_price = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    stock_quantity = db.Column(db.Integer, default=0)
    reorder_level = db.Column(db.Integer, default=10)
    image_url = db.Column(db.String(500), nullable=True)
    region = db.Column(db.String(100), default="All")
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = db.relationship("Category", back_populates="products")
    sale_items = db.relationship("SaleItem", back_populates="product", lazy="dynamic")

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.reorder_level

    @property
    def profit_margin(self):
        if self.price > 0:
            return round(((self.price - self.cost_price) / self.price) * 100, 2)
        return 0

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "sku": self.sku,
            "description": self.description,
            "category_id": self.category_id,
            "category": self.category.name if self.category else None,
            "price": float(self.price),
            "cost_price": float(self.cost_price),
            "profit_margin": self.profit_margin,
            "stock_quantity": self.stock_quantity,
            "reorder_level": self.reorder_level,
            "is_low_stock": self.is_low_stock,
            "image_url": self.image_url,
            "region": self.region,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }


# ─────────────────────────────────────────────────────────────────────────────
# Sale Model
# ─────────────────────────────────────────────────────────────────────────────
class Sale(db.Model):
    __tablename__ = "sales"

    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    customer_name = db.Column(db.String(200), nullable=False)
    customer_email = db.Column(db.String(150), nullable=True)
    customer_phone = db.Column(db.String(20), nullable=True)
    region = db.Column(db.String(100), default="North")
    status = db.Column(
        db.Enum("pending", "completed", "cancelled", "refunded"),
        default="completed",
    )
    payment_method = db.Column(
        db.Enum("cash", "card", "online", "bank_transfer"),
        default="card",
    )
    subtotal = db.Column(db.Numeric(12, 2), default=0)
    discount = db.Column(db.Numeric(12, 2), default=0)
    tax = db.Column(db.Numeric(12, 2), default=0)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    sale_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="sales")
    items = db.relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "invoice_number": self.invoice_number,
            "user_id": self.user_id,
            "salesperson": self.user.name if self.user else None,
            "customer_name": self.customer_name,
            "customer_email": self.customer_email,
            "customer_phone": self.customer_phone,
            "region": self.region,
            "status": self.status,
            "payment_method": self.payment_method,
            "subtotal": float(self.subtotal),
            "discount": float(self.discount),
            "tax": float(self.tax),
            "total_amount": float(self.total_amount),
            "notes": self.notes,
            "sale_date": self.sale_date.isoformat(),
            "created_at": self.created_at.isoformat(),
            "items": [item.to_dict() for item in self.items],
        }


# ─────────────────────────────────────────────────────────────────────────────
# Sale Item (line items within a sale)
# ─────────────────────────────────────────────────────────────────────────────
class SaleItem(db.Model):
    __tablename__ = "sale_items"

    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey("sales.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Numeric(12, 2), nullable=False)
    discount = db.Column(db.Numeric(12, 2), default=0)
    total = db.Column(db.Numeric(12, 2), nullable=False)

    sale = db.relationship("Sale", back_populates="items")
    product = db.relationship("Product", back_populates="sale_items")

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else None,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price),
            "discount": float(self.discount),
            "total": float(self.total),
        }


# ─────────────────────────────────────────────────────────────────────────────
# Notification Model
# ─────────────────────────────────────────────────────────────────────────────
class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(
        db.Enum("info", "warning", "success", "error", "ai_insight"),
        default="info",
    )
    is_read = db.Column(db.Boolean, default=False)
    action_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="notifications")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "is_read": self.is_read,
            "action_url": self.action_url,
            "created_at": self.created_at.isoformat(),
        }


class ImportedDataset(db.Model):
    __tablename__ = "imported_datasets"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    source = db.Column(db.String(100), default="upload")
    file_name = db.Column(db.String(255), nullable=True)
    file_path = db.Column(db.String(500), nullable=True)
    file_type = db.Column(db.String(20), nullable=True)
    row_count = db.Column(db.Integer, default=0)
    column_count = db.Column(db.Integer, default=0)
    columns_json = db.Column(db.Text, nullable=True)
    field_map_json = db.Column(db.Text, nullable=True)
    quality_report_json = db.Column(db.Text, nullable=True)
    analysis_json = db.Column(db.Text, nullable=True)
    status = db.Column(db.Enum("previewed", "imported", "failed"), default="imported")
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def _json(self, value):
        import json
        try:
            return json.loads(value) if value else None
        except Exception:
            return None

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "source": self.source,
            "file_name": self.file_name,
            "file_type": self.file_type,
            "row_count": self.row_count,
            "column_count": self.column_count,
            "columns": self._json(self.columns_json) or [],
            "field_map": self._json(self.field_map_json) or {},
            "quality_report": self._json(self.quality_report_json) or {},
            "analysis": self._json(self.analysis_json) or {},
            "status": self.status,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
        }
