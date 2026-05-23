"""
SalesSphere AI – Dashboard Routes
KPI cards, summary statistics, recent activities
"""
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract
from app import db
from app.models import User, Product, Sale, SaleItem, Category, Notification

dashboard_bp = Blueprint("dashboard", __name__)


def get_month_range(year: int, month: int):
    """Return start and end datetime for a given month."""
    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)
    return start, end


# ─── Main KPI Summary ────────────────────────────────────────────────────────
@dashboard_bp.route("/summary", methods=["GET"])
@jwt_required()
def get_summary():
    now = datetime.utcnow()
    year = int(request.args.get("year", now.year))
    month = int(request.args.get("month", now.month))

    start, end = get_month_range(year, month)

    # Previous month for comparison
    if month == 1:
        prev_start, prev_end = get_month_range(year - 1, 12)
    else:
        prev_start, prev_end = get_month_range(year, month - 1)

    # Current month sales
    cur_sales = db.session.query(
        func.count(Sale.id).label("count"),
        func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
        func.coalesce(func.sum(Sale.discount), 0).label("discounts"),
    ).filter(Sale.sale_date >= start, Sale.sale_date < end, Sale.status == "completed").first()

    # Previous month
    prev_sales = db.session.query(
        func.count(Sale.id).label("count"),
        func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
    ).filter(Sale.sale_date >= prev_start, Sale.sale_date < prev_end, Sale.status == "completed").first()

    # Cost (sum of cost_price * quantity for sold items)
    cur_cost = db.session.query(
        func.coalesce(func.sum(SaleItem.quantity * Product.cost_price), 0)
    ).join(Product, SaleItem.product_id == Product.id)\
     .join(Sale, SaleItem.sale_id == Sale.id)\
     .filter(Sale.sale_date >= start, Sale.sale_date < end, Sale.status == "completed")\
     .scalar() or 0

    revenue = float(cur_sales.revenue or 0)
    cost = float(cur_cost)
    profit = revenue - cost

    prev_revenue = float(prev_sales.revenue or 0)
    revenue_growth = (
        round(((revenue - prev_revenue) / prev_revenue) * 100, 1)
        if prev_revenue > 0 else 0
    )

    prev_orders = prev_sales.count or 0
    cur_orders = cur_sales.count or 0
    orders_growth = (
        round(((cur_orders - prev_orders) / prev_orders) * 100, 1)
        if prev_orders > 0 else 0
    )

    # Active customers (unique customer emails in last 30 days)
    active_customers = db.session.query(
        func.count(func.distinct(Sale.customer_email))
    ).filter(
        Sale.sale_date >= now - timedelta(days=30),
        Sale.status == "completed",
    ).scalar() or 0

    # Stock info
    total_products = Product.query.filter_by(is_active=True).count()
    low_stock_count = Product.query.filter(
        Product.is_active == True,
        Product.stock_quantity <= Product.reorder_level,
    ).count()

    # Users count
    total_users = User.query.filter_by(is_active=True).count()

    return jsonify({
        "period": {"year": year, "month": month},
        "revenue": {
            "current": revenue,
            "previous": prev_revenue,
            "growth": revenue_growth,
            "currency": "USD",
        },
        "orders": {
            "current": cur_orders,
            "previous": prev_orders,
            "growth": orders_growth,
        },
        "profit": {
            "current": profit,
            "margin": round((profit / revenue * 100), 1) if revenue > 0 else 0,
        },
        "active_customers": active_customers,
        "total_products": total_products,
        "low_stock_count": low_stock_count,
        "total_users": total_users,
    }), 200


# ─── Monthly Revenue Chart Data ───────────────────────────────────────────────
@dashboard_bp.route("/monthly-revenue", methods=["GET"])
@jwt_required()
def monthly_revenue():
    year = int(request.args.get("year", datetime.utcnow().year))

    results = db.session.query(
        extract("month", Sale.sale_date).label("month"),
        func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
        func.count(Sale.id).label("orders"),
    ).filter(
        extract("year", Sale.sale_date) == year,
        Sale.status == "completed",
    ).group_by(extract("month", Sale.sale_date)).all()

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    # Build full 12-month array with zeros for missing months
    data_map = {int(r.month): {"revenue": float(r.revenue), "orders": r.orders}
                for r in results}

    chart_data = [
        {
            "month": month_names[i],
            "revenue": data_map.get(i + 1, {}).get("revenue", 0),
            "orders": data_map.get(i + 1, {}).get("orders", 0),
        }
        for i in range(12)
    ]

    return jsonify({"year": year, "data": chart_data}), 200


# ─── Category Distribution ───────────────────────────────────────────────────
@dashboard_bp.route("/category-sales", methods=["GET"])
@jwt_required()
def category_sales():
    year = int(request.args.get("year", datetime.utcnow().year))
    month = request.args.get("month")

    query = db.session.query(
        Category.name,
        Category.color,
        func.coalesce(func.sum(SaleItem.total), 0).label("revenue"),
        func.coalesce(func.sum(SaleItem.quantity), 0).label("units"),
    ).join(Product, Category.id == Product.category_id)\
     .join(SaleItem, Product.id == SaleItem.product_id)\
     .join(Sale, SaleItem.sale_id == Sale.id)\
     .filter(
        extract("year", Sale.sale_date) == year,
        Sale.status == "completed",
     )

    if month:
        query = query.filter(extract("month", Sale.sale_date) == int(month))

    results = query.group_by(Category.id, Category.name, Category.color).all()

    total = sum(float(r.revenue) for r in results)
    data = [
        {
            "name": r.name,
            "color": r.color,
            "revenue": float(r.revenue),
            "units": int(r.units),
            "percentage": round((float(r.revenue) / total * 100), 1) if total > 0 else 0,
        }
        for r in results
    ]
    return jsonify({"data": data}), 200


# ─── Region Sales ────────────────────────────────────────────────────────────
@dashboard_bp.route("/region-sales", methods=["GET"])
@jwt_required()
def region_sales():
    year = int(request.args.get("year", datetime.utcnow().year))

    results = db.session.query(
        Sale.region,
        func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
        func.count(Sale.id).label("orders"),
    ).filter(
        extract("year", Sale.sale_date) == year,
        Sale.status == "completed",
    ).group_by(Sale.region).all()

    data = [
        {"region": r.region, "revenue": float(r.revenue), "orders": r.orders}
        for r in results
    ]
    return jsonify({"data": data}), 200


# ─── Top Products ─────────────────────────────────────────────────────────────
@dashboard_bp.route("/top-products", methods=["GET"])
@jwt_required()
def top_products():
    limit = int(request.args.get("limit", 10))
    year = int(request.args.get("year", datetime.utcnow().year))

    results = db.session.query(
        Product.id,
        Product.name,
        Product.image_url,
        Category.name.label("category"),
        func.coalesce(func.sum(SaleItem.total), 0).label("revenue"),
        func.coalesce(func.sum(SaleItem.quantity), 0).label("units_sold"),
    ).join(SaleItem, Product.id == SaleItem.product_id)\
     .join(Sale, SaleItem.sale_id == Sale.id)\
     .join(Category, Product.category_id == Category.id)\
     .filter(
        extract("year", Sale.sale_date) == year,
        Sale.status == "completed",
     ).group_by(Product.id, Product.name, Product.image_url, Category.name)\
      .order_by(func.sum(SaleItem.total).desc())\
      .limit(limit).all()

    data = [
        {
            "id": r.id,
            "name": r.name,
            "image_url": r.image_url,
            "category": r.category,
            "revenue": float(r.revenue),
            "units_sold": int(r.units_sold),
        }
        for r in results
    ]
    return jsonify({"data": data}), 200


# ─── Recent Sales ─────────────────────────────────────────────────────────────
@dashboard_bp.route("/recent-sales", methods=["GET"])
@jwt_required()
def recent_sales():
    limit = int(request.args.get("limit", 8))
    sales = Sale.query.order_by(Sale.created_at.desc()).limit(limit).all()
    return jsonify({"data": [s.to_dict() for s in sales]}), 200


# ─── AI Prediction Card Data ──────────────────────────────────────────────────
@dashboard_bp.route("/ai-prediction", methods=["GET"])
@jwt_required()
def ai_prediction():
    """Simple linear projection based on last 3 months."""
    now = datetime.utcnow()
    months_data = []

    for i in range(3, 0, -1):
        m = now.month - i
        y = now.year
        if m <= 0:
            m += 12
            y -= 1
        start, end = get_month_range(y, m)
        rev = db.session.query(
            func.coalesce(func.sum(Sale.total_amount), 0)
        ).filter(
            Sale.sale_date >= start, Sale.sale_date < end, Sale.status == "completed"
        ).scalar() or 0
        months_data.append(float(rev))

    # Simple weighted average prediction
    if len(months_data) == 3:
        predicted = months_data[0] * 0.2 + months_data[1] * 0.3 + months_data[2] * 0.5
        predicted = round(predicted * 1.05, 2)  # 5% optimistic adjustment
    else:
        predicted = 0

    last = months_data[-1] if months_data else 0
    growth = round(((predicted - last) / last * 100), 1) if last > 0 else 0

    return jsonify({
        "predicted_revenue": predicted,
        "last_month_revenue": last,
        "growth_forecast": growth,
        "confidence": 78,
        "model": "Linear Weighted Projection",
    }), 200
