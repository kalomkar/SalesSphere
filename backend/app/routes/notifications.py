"""
SalesSphere AI – Notifications & Users Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Notification, User

notifications_bp = Blueprint("notifications", __name__)
users_bp = Blueprint("users", __name__)


# ─── Notifications ────────────────────────────────────────────────────────────
@notifications_bp.route("/", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    limit = int(request.args.get("limit", 20))
    unread_only = request.args.get("unread_only", "false").lower() == "true"

    query = Notification.query.filter_by(user_id=user_id)
    if unread_only:
        query = query.filter_by(is_read=False)

    notifs = query.order_by(Notification.created_at.desc()).limit(limit).all()
    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()

    return jsonify({
        "data": [n.to_dict() for n in notifs],
        "unread_count": unread_count,
    }), 200


@notifications_bp.route("/<int:notif_id>/read", methods=["PUT"])
@jwt_required()
def mark_read(notif_id):
    user_id = get_jwt_identity()
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first_or_404()
    notif.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200


@notifications_bp.route("/read-all", methods=["PUT"])
@jwt_required()
def mark_all_read():
    user_id = get_jwt_identity()
    Notification.query.filter_by(user_id=user_id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All notifications marked as read"}), 200


@notifications_bp.route("/<int:notif_id>", methods=["DELETE"])
@jwt_required()
def delete_notification(notif_id):
    user_id = get_jwt_identity()
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first_or_404()
    db.session.delete(notif)
    db.session.commit()
    return jsonify({"message": "Notification deleted"}), 200


# ─── Users (Admin) ────────────────────────────────────────────────────────────
@users_bp.route("/", methods=["GET"])
@jwt_required()
def get_users():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if current_user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    search = request.args.get("search", "")
    role = request.args.get("role")

    query = User.query
    if search:
        query = query.filter(
            User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    if role:
        query = query.filter_by(role=role)

    paginated = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "data": [u.to_dict() for u in paginated.items],
        "total": paginated.total,
        "page": page,
        "pages": paginated.pages,
    }), 200


@users_bp.route("/<int:user_id>", methods=["PUT"])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if current_user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    user = User.query.get_or_404(user_id)
    data = request.get_json()

    for field in ["name", "role", "is_active", "department", "phone"]:
        if field in data:
            setattr(user, field, data[field])

    db.session.commit()
    return jsonify({"message": "User updated", "data": user.to_dict()}), 200


@users_bp.route("/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if current_user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    user = User.query.get_or_404(user_id)
    user.is_active = False
    db.session.commit()
    return jsonify({"message": "User deactivated"}), 200


@users_bp.route("/stats", methods=["GET"])
@jwt_required()
def user_stats():
    return jsonify({
        "total": User.query.filter_by(is_active=True).count(),
        "admins": User.query.filter_by(role="admin", is_active=True).count(),
        "managers": User.query.filter_by(role="manager", is_active=True).count(),
        "employees": User.query.filter_by(role="employee", is_active=True).count(),
        "viewers": User.query.filter_by(role="viewer", is_active=True).count(),
    }), 200
