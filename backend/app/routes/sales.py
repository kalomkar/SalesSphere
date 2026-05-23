"""
SalesSphere AI – Sales Routes
Sales CRUD, invoice management, revenue tracking
"""
import random
import string
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract
from app import db
from app.models import Sale, SaleItem, Product, User

sales_bp = Blueprint("sales", __name__)


def generate_invoice_number() -> str:
    """Generate unique invoice number like INV-2024-00001."""
    year = datetime.utcnow().year
    last = Sale.query.filter(
        extract("year", Sale.created_at) == year
    ).count()
    return f"INV-{year}-{str(last + 1).zfill(5)}"


# ─── Sales List ──────────────────────────────────────────────────────────────
@sales_bp.route("/", methods=["GET"])
@jwt_required()
def get_sales():
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    search = request.args.get("search", "")
    status = request.args.get("status")
    region = request.args.get("region")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    payment = request.args.get("payment_method")

    query = Sale.query

    if search:
        query = query.filter(
            Sale.invoice_number.ilike(f"%{search}%") |
            Sale.customer_name.ilike(f"%{search}%") |
            Sale.customer_email.ilike(f"%{search}%")
        )
    if status:
        query = query.filter_by(status=status)
    if region:
        query = query.filter_by(region=region)
    if payment:
        query = query.filter_by(payment_method=payment)
    if start_date:
        query = query.filter(Sale.sale_date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Sale.sale_date <= datetime.fromisoformat(end_date))

    paginated = query.order_by(Sale.sale_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "data": [s.to_dict() for s in paginated.items],
        "total": paginated.total,
        "page": page,
        "pages": paginated.pages,
    }), 200


# ─── Create Sale ─────────────────────────────────────────────────────────────
@sales_bp.route("/", methods=["POST"])
@jwt_required()
def create_sale():
    user_id = get_jwt_identity()
    data = request.get_json()

    required = ["customer_name", "items"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    items_data = data["items"]
    if not items_data:
        return jsonify({"error": "At least one item required"}), 400

    # Build items and calculate totals
    subtotal = 0.0
    sale_items = []

    for item_data in items_data:
        product = Product.query.get(item_data["product_id"])
        if not product:
            return jsonify({"error": f"Product {item_data['product_id']} not found"}), 404
        if product.stock_quantity < item_data.get("quantity", 1):
            return jsonify({"error": f"Insufficient stock for {product.name}"}), 400

        qty = item_data.get("quantity", 1)
        unit_price = float(item_data.get("unit_price", product.price))
        discount = float(item_data.get("discount", 0))
        total = (unit_price * qty) - discount

        sale_items.append({
            "product": product,
            "quantity": qty,
            "unit_price": unit_price,
            "discount": discount,
            "total": total,
        })
        subtotal += total

    discount_total = float(data.get("discount", 0))
    tax = round(subtotal * 0.08, 2)  # 8% tax
    total_amount = subtotal - discount_total + tax

    sale = Sale(
        invoice_number=generate_invoice_number(),
        user_id=user_id,
        customer_name=data["customer_name"],
        customer_email=data.get("customer_email"),
        customer_phone=data.get("customer_phone"),
        region=data.get("region", "North"),
        status=data.get("status", "completed"),
        payment_method=data.get("payment_method", "card"),
        subtotal=subtotal,
        discount=discount_total,
        tax=tax,
        total_amount=total_amount,
        notes=data.get("notes"),
        sale_date=datetime.fromisoformat(data["sale_date"]) if data.get("sale_date") else datetime.utcnow(),
    )
    db.session.add(sale)
    db.session.flush()  # Get sale.id

    for item_data in sale_items:
        item = SaleItem(
            sale_id=sale.id,
            product_id=item_data["product"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            discount=item_data["discount"],
            total=item_data["total"],
        )
        db.session.add(item)
        # Reduce stock
        item_data["product"].stock_quantity -= item_data["quantity"]

    db.session.commit()

    # Revenue alert notification if high value
    if total_amount > 5000:
        from app.models import Notification
        admin = User.query.filter_by(role="admin").first()
        if admin:
            notif = Notification(
                user_id=admin.id,
                title="High-Value Sale Alert",
                message=f"Sale {sale.invoice_number} totaling ${total_amount:,.2f} completed for {sale.customer_name}.",
                type="success",
                action_url=f"/sales/{sale.id}",
            )
            db.session.add(notif)
            db.session.commit()

    return jsonify({"message": "Sale created", "data": sale.to_dict()}), 201


# ─── Get Single Sale ─────────────────────────────────────────────────────────
@sales_bp.route("/<int:sale_id>", methods=["GET"])
@jwt_required()
def get_sale(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    return jsonify(sale.to_dict()), 200


# ─── Update Sale ─────────────────────────────────────────────────────────────
@sales_bp.route("/<int:sale_id>", methods=["PUT"])
@jwt_required()
def update_sale(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    data = request.get_json()

    updatable = ["customer_name", "customer_email", "customer_phone",
                 "status", "payment_method", "notes", "region"]
    for field in updatable:
        if field in data:
            setattr(sale, field, data[field])

    db.session.commit()
    return jsonify({"message": "Sale updated", "data": sale.to_dict()}), 200


# ─── Delete / Cancel Sale ────────────────────────────────────────────────────
@sales_bp.route("/<int:sale_id>", methods=["DELETE"])
@jwt_required()
def cancel_sale(sale_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ("admin", "manager"):
        return jsonify({"error": "Insufficient permissions"}), 403

    sale = Sale.query.get_or_404(sale_id)
    if sale.status == "completed":
        # Restore stock
        for item in sale.items:
            item.product.stock_quantity += item.quantity
    sale.status = "cancelled"
    db.session.commit()
    return jsonify({"message": "Sale cancelled"}), 200


# ─── Revenue Stats ────────────────────────────────────────────────────────────
@sales_bp.route("/stats", methods=["GET"])
@jwt_required()
def sales_stats():
    year = int(request.args.get("year", datetime.utcnow().year))

    total = db.session.query(
        func.count(Sale.id),
        func.coalesce(func.sum(Sale.total_amount), 0),
    ).filter(
        extract("year", Sale.sale_date) == year,
        Sale.status == "completed",
    ).first()

    by_status = db.session.query(
        Sale.status,
        func.count(Sale.id).label("count"),
    ).filter(extract("year", Sale.sale_date) == year)\
     .group_by(Sale.status).all()

    by_region = db.session.query(
        Sale.region,
        func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
    ).filter(
        extract("year", Sale.sale_date) == year,
        Sale.status == "completed",
    ).group_by(Sale.region).all()

    return jsonify({
        "year": year,
        "total_orders": total[0],
        "total_revenue": float(total[1]),
        "by_status": [{"status": r.status, "count": r.count} for r in by_status],
        "by_region": [{"region": r.region, "revenue": float(r.revenue)} for r in by_region],
    }), 200
