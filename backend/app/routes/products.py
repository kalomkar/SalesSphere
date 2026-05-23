"""
SalesSphere AI – Products Routes
Full CRUD, categories, inventory management, stock alerts
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Product, Category, User

products_bp = Blueprint("products", __name__)


def require_role(*roles):
    """Decorator to check user role."""
    from functools import wraps
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            from flask_jwt_extended import get_jwt_identity
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or user.role not in roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ─── Categories ─────────────────────────────────────────────────────────────
@products_bp.route("/categories", methods=["GET"])
@jwt_required()
def get_categories():
    cats = Category.query.all()
    return jsonify({"data": [c.to_dict() for c in cats]}), 200


@products_bp.route("/categories", methods=["POST"])
@jwt_required()
@require_role("admin")
def create_category():
    data = request.get_json()
    if not data.get("name"):
        return jsonify({"error": "Category name required"}), 400

    if Category.query.filter_by(name=data["name"]).first():
        return jsonify({"error": "Category already exists"}), 409

    cat = Category(
        name=data["name"],
        description=data.get("description", ""),
        color=data.get("color", "#6366f1"),
        icon=data.get("icon", "package"),
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify({"message": "Category created", "data": cat.to_dict()}), 201


# ─── Products List & Create ──────────────────────────────────────────────────
@products_bp.route("/", methods=["GET"])
@jwt_required()
def get_products():
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    search = request.args.get("search", "")
    category_id = request.args.get("category_id")
    region = request.args.get("region")
    low_stock = request.args.get("low_stock", "false").lower() == "true"
    is_active = request.args.get("is_active")

    query = Product.query

    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%")
        )
    if category_id:
        query = query.filter_by(category_id=int(category_id))
    if region:
        query = query.filter_by(region=region)
    if low_stock:
        query = query.filter(Product.stock_quantity <= Product.reorder_level)
    if is_active is not None:
        query = query.filter_by(is_active=is_active.lower() == "true")

    paginated = query.order_by(Product.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "data": [p.to_dict() for p in paginated.items],
        "total": paginated.total,
        "page": page,
        "per_page": per_page,
        "pages": paginated.pages,
    }), 200


@products_bp.route("/", methods=["POST"])
@jwt_required()
@require_role("admin", "manager")
def create_product():
    data = request.get_json()
    required = ["name", "sku", "category_id", "price"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    if Product.query.filter_by(sku=data["sku"]).first():
        return jsonify({"error": "SKU already exists"}), 409

    product = Product(
        name=data["name"],
        sku=data["sku"],
        description=data.get("description", ""),
        category_id=data["category_id"],
        price=data["price"],
        cost_price=data.get("cost_price", 0),
        stock_quantity=data.get("stock_quantity", 0),
        reorder_level=data.get("reorder_level", 10),
        image_url=data.get("image_url"),
        region=data.get("region", "All"),
    )
    db.session.add(product)
    db.session.commit()

    # Check and create stock alert notification
    _check_stock_alert(product)

    return jsonify({"message": "Product created", "data": product.to_dict()}), 201


# ─── Single Product ──────────────────────────────────────────────────────────
@products_bp.route("/<int:product_id>", methods=["GET"])
@jwt_required()
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict()), 200


@products_bp.route("/<int:product_id>", methods=["PUT"])
@jwt_required()
@require_role("admin", "manager")
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json()

    for field in ["name", "description", "price", "cost_price", "stock_quantity",
                  "reorder_level", "image_url", "region", "is_active", "category_id"]:
        if field in data:
            setattr(product, field, data[field])

    db.session.commit()
    _check_stock_alert(product)
    return jsonify({"message": "Product updated", "data": product.to_dict()}), 200


@products_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
@require_role("admin")
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    product.is_active = False  # Soft delete
    db.session.commit()
    return jsonify({"message": "Product deactivated"}), 200


# ─── Stock Alerts ────────────────────────────────────────────────────────────
def _check_stock_alert(product: Product):
    """Create notification if product is below reorder level."""
    if product.is_low_stock:
        from app.models import Notification
        admin_users = User.query.filter_by(role="admin", is_active=True).all()
        for admin in admin_users:
            notif = Notification(
                user_id=admin.id,
                title=f"Low Stock Alert: {product.name}",
                message=f"{product.name} (SKU: {product.sku}) has only {product.stock_quantity} units left. Reorder level: {product.reorder_level}.",
                type="warning",
                action_url=f"/products/{product.id}",
            )
            db.session.add(notif)
        db.session.commit()


@products_bp.route("/low-stock", methods=["GET"])
@jwt_required()
def low_stock_products():
    products = Product.query.filter(
        Product.is_active == True,
        Product.stock_quantity <= Product.reorder_level,
    ).all()
    return jsonify({"data": [p.to_dict() for p in products], "count": len(products)}), 200


@products_bp.route("/stats", methods=["GET"])
@jwt_required()
def product_stats():
    total = Product.query.filter_by(is_active=True).count()
    low_stock = Product.query.filter(
        Product.is_active == True,
        Product.stock_quantity <= Product.reorder_level,
    ).count()
    out_of_stock = Product.query.filter_by(stock_quantity=0, is_active=True).count()
    categories = Category.query.count()

    return jsonify({
        "total_products": total,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "total_categories": categories,
    }), 200
