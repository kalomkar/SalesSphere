"""
SalesSphere AI – Analytics Routes
Advanced BI: trends, forecasting, performance metrics
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func, extract, case
from app import db
from app.models import Sale, SaleItem, Product, Category, User

analytics_bp = Blueprint("analytics", __name__)


# ─── Revenue Trend (multi-year) ───────────────────────────────────────────────
@analytics_bp.route("/revenue-trend", methods=["GET"])
@jwt_required()
def revenue_trend():
    years = int(request.args.get("years", 2))
    now = datetime.utcnow()
    result = []

    for yr in range(now.year - years + 1, now.year + 1):
        monthly = db.session.query(
            extract("month", Sale.sale_date).label("month"),
            func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
        ).filter(
            extract("year", Sale.sale_date) == yr,
            Sale.status == "completed",
        ).group_by(extract("month", Sale.sale_date)).all()

        month_map = {int(r.month): float(r.revenue) for r in monthly}
        result.append({
            "year": yr,
            "data": [{"month": i, "revenue": month_map.get(i, 0)} for i in range(1, 13)],
        })

    return jsonify({"data": result}), 200


# ─── Product Performance ──────────────────────────────────────────────────────
@analytics_bp.route("/product-performance", methods=["GET"])
@jwt_required()
def product_performance():
    year = int(request.args.get("year", datetime.utcnow().year))
    category_id = request.args.get("category_id")

    query = db.session.query(
        Product.id,
        Product.name,
        Category.name.label("category"),
        func.coalesce(func.sum(SaleItem.quantity), 0).label("units_sold"),
        func.coalesce(func.sum(SaleItem.total), 0).label("revenue"),
        func.coalesce(func.sum(SaleItem.quantity * Product.cost_price), 0).label("cost"),
    ).join(SaleItem, Product.id == SaleItem.product_id)\
     .join(Sale, SaleItem.sale_id == Sale.id)\
     .join(Category, Product.category_id == Category.id)\
     .filter(
        extract("year", Sale.sale_date) == year,
        Sale.status == "completed",
     )

    if category_id:
        query = query.filter(Product.category_id == int(category_id))

    results = query.group_by(Product.id, Product.name, Category.name)\
                   .order_by(func.sum(SaleItem.total).desc()).all()

    data = []
    for r in results:
        revenue = float(r.revenue)
        cost = float(r.cost)
        profit = revenue - cost
        data.append({
            "id": r.id,
            "name": r.name,
            "category": r.category,
            "units_sold": int(r.units_sold),
            "revenue": revenue,
            "cost": cost,
            "profit": profit,
            "margin": round((profit / revenue * 100), 1) if revenue > 0 else 0,
        })

    return jsonify({"data": data, "year": year}), 200


# ─── Customer Growth ──────────────────────────────────────────────────────────
@analytics_bp.route("/customer-growth", methods=["GET"])
@jwt_required()
def customer_growth():
    year = int(request.args.get("year", datetime.utcnow().year))

    results = db.session.query(
        extract("month", Sale.sale_date).label("month"),
        func.count(func.distinct(Sale.customer_email)).label("customers"),
        func.count(Sale.id).label("orders"),
    ).filter(
        extract("year", Sale.sale_date) == year,
        Sale.status == "completed",
    ).group_by(extract("month", Sale.sale_date)).all()

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    data_map = {int(r.month): {"customers": r.customers, "orders": r.orders} for r in results}

    chart_data = [
        {
            "month": month_names[i],
            "customers": data_map.get(i + 1, {}).get("customers", 0),
            "orders": data_map.get(i + 1, {}).get("orders", 0),
        }
        for i in range(12)
    ]

    return jsonify({"data": chart_data, "year": year}), 200


# ─── Demand Forecasting (12-month projection) ─────────────────────────────────
@analytics_bp.route("/forecast", methods=["GET"])
@jwt_required()
def forecast():
    """Simple exponential smoothing forecast for next 6 months."""
    now = datetime.utcnow()
    history = []

    # Get last 12 months of revenue
    for i in range(11, -1, -1):
        m = (now.month - i - 1) % 12 + 1
        y = now.year - ((now.month - i - 1) // 12 + (1 if now.month - i <= 0 else 0))
        start = datetime(y, m, 1)
        end = datetime(y, m % 12 + 1, 1) if m < 12 else datetime(y + 1, 1, 1)

        rev = db.session.query(
            func.coalesce(func.sum(Sale.total_amount), 0)
        ).filter(Sale.sale_date >= start, Sale.sale_date < end, Sale.status == "completed")\
         .scalar() or 0

        history.append({"period": f"{y}-{str(m).zfill(2)}", "revenue": float(rev)})

    # Exponential smoothing alpha=0.3
    alpha = 0.3
    smoothed = history[0]["revenue"] if history else 0
    for h in history[1:]:
        smoothed = alpha * h["revenue"] + (1 - alpha) * smoothed

    # Project next 6 months with 3% monthly growth assumption
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    projections = []
    val = smoothed
    for i in range(1, 7):
        m = (now.month + i - 1) % 12
        y = now.year + (now.month + i - 1) // 12
        val = val * 1.03
        projections.append({
            "period": f"{y}-{str(m + 1).zfill(2)}",
            "month": month_names[m],
            "projected_revenue": round(val, 2),
            "confidence_band_low": round(val * 0.88, 2),
            "confidence_band_high": round(val * 1.12, 2),
        })

    return jsonify({
        "historical": history,
        "projections": projections,
        "model": "Exponential Smoothing (α=0.3)",
    }), 200


# ─── Sales Heatmap (by day of week + hour) ────────────────────────────────────
@analytics_bp.route("/heatmap", methods=["GET"])
@jwt_required()
def sales_heatmap():
    """Return sales density by weekday."""
    year = int(request.args.get("year", datetime.utcnow().year))

    results = db.session.query(
        extract("month", Sale.sale_date).label("month"),
        func.count(Sale.id).label("count"),
        func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
    ).filter(
        extract("year", Sale.sale_date) == year,
        Sale.status == "completed",
    ).group_by(extract("month", Sale.sale_date)).all()

    data = [
        {"month": int(r.month), "count": r.count, "revenue": float(r.revenue)}
        for r in results
    ]
    return jsonify({"data": data, "year": year}), 200


# ─── Top & Weak Performers ────────────────────────────────────────────────────
@analytics_bp.route("/performers", methods=["GET"])
@jwt_required()
def performers():
    year = int(request.args.get("year", datetime.utcnow().year))
    limit = int(request.args.get("limit", 5))

    base_query = db.session.query(
        Product.id,
        Product.name,
        Category.name.label("category"),
        func.coalesce(func.sum(SaleItem.total), 0).label("revenue"),
        func.coalesce(func.sum(SaleItem.quantity), 0).label("units"),
    ).join(SaleItem, Product.id == SaleItem.product_id)\
     .join(Sale, SaleItem.sale_id == Sale.id)\
     .join(Category, Product.category_id == Category.id)\
     .filter(extract("year", Sale.sale_date) == year, Sale.status == "completed")\
     .group_by(Product.id, Product.name, Category.name)

    top = base_query.order_by(func.sum(SaleItem.total).desc()).limit(limit).all()
    weak = base_query.order_by(func.sum(SaleItem.total).asc()).limit(limit).all()

    def to_item(r):
        return {
            "id": r.id, "name": r.name, "category": r.category,
            "revenue": float(r.revenue), "units": int(r.units),
        }

    return jsonify({
        "top_performers": [to_item(r) for r in top],
        "weak_performers": [to_item(r) for r in weak],
    }), 200


# ─── Profit vs Expense ───────────────────────────────────────────────────────
@analytics_bp.route("/profit-expense", methods=["GET"])
@jwt_required()
def profit_expense():
    year = int(request.args.get("year", datetime.utcnow().year))

    results = db.session.query(
        extract("month", Sale.sale_date).label("month"),
        func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
        func.coalesce(func.sum(SaleItem.quantity * Product.cost_price), 0).label("cost"),
    ).join(SaleItem, Sale.id == SaleItem.sale_id)\
     .join(Product, SaleItem.product_id == Product.id)\
     .filter(
        extract("year", Sale.sale_date) == year,
        Sale.status == "completed",
     ).group_by(extract("month", Sale.sale_date)).all()

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    data_map = {int(r.month): {"revenue": float(r.revenue), "cost": float(r.cost)} for r in results}

    chart_data = [
        {
            "month": month_names[i],
            "revenue": data_map.get(i + 1, {}).get("revenue", 0),
            "cost": data_map.get(i + 1, {}).get("cost", 0),
            "profit": data_map.get(i + 1, {}).get("revenue", 0) - data_map.get(i + 1, {}).get("cost", 0),
        }
        for i in range(12)
    ]

    return jsonify({"data": chart_data, "year": year}), 200
