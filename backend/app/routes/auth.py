"""
SalesSphere AI – Authentication Routes
JWT-based auth with sign up, login, password reset, email verification
"""
import secrets
import string
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from app import db, mail
from app.models import User
from flask_mail import Message

auth_bp = Blueprint("auth", __name__)


def generate_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


# ─── Sign Up ─────────────────────────────────────────────────────────────────
@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    required = ["name", "email", "password"]
    if not all(field in data for field in required):
        return jsonify({"error": "Missing required fields"}), 400

    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        name=data["name"],
        email=data["email"].lower(),
        role=data.get("role", "employee"),
        phone=data.get("phone"),
        department=data.get("department"),
        verify_token=generate_token(),
        is_verified=True,  # Auto-verify for demo; set False for production email flow
    )
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    # Create welcome notification
    from app.models import Notification
    notif = Notification(
        user_id=user.id,
        title="Welcome to SalesSphere AI!",
        message=f"Hi {user.name}, your account has been created. Explore the dashboard to get started.",
        type="success",
    )
    db.session.add(notif)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message": "Account created successfully",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 201


# ─── Login ───────────────────────────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=data["email"].lower()).first()

    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Account is deactivated. Contact admin."}), 403

    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()

    # Extended expiry if "remember me"
    remember = data.get("remember_me", False)
    expires = timedelta(days=30) if remember else timedelta(hours=24)
    access_token = create_access_token(identity=str(user.id), expires_delta=expires)
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message": "Login successful",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 200


# ─── Refresh Token ───────────────────────────────────────────────────────────
@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({"access_token": access_token}), 200


# ─── Get Current User ────────────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict()), 200


# ─── Update Profile ──────────────────────────────────────────────────────────
@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    if "name" in data:
        user.name = data["name"]
    if "phone" in data:
        user.phone = data["phone"]
    if "department" in data:
        user.department = data["department"]
    if "avatar_url" in data:
        user.avatar_url = data["avatar_url"]

    db.session.commit()
    return jsonify({"message": "Profile updated", "user": user.to_dict()}), 200


# ─── Change Password ─────────────────────────────────────────────────────────
@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    if not user.check_password(data.get("current_password", "")):
        return jsonify({"error": "Current password is incorrect"}), 400

    user.set_password(data["new_password"])
    db.session.commit()
    return jsonify({"message": "Password changed successfully"}), 200


# ─── Forgot Password ─────────────────────────────────────────────────────────
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email", "").lower()
    user = User.query.filter_by(email=email).first()

    # Always return 200 to prevent email enumeration
    if user:
        token = generate_token(48)
        user.reset_token = token
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        db.session.commit()

        # Try send email (will silently fail if SMTP not configured)
        try:
            reset_url = f"http://localhost:5173/reset-password?token={token}"
            msg = Message(
                subject="SalesSphere AI – Password Reset",
                recipients=[email],
                html=f"""
                <h2>Password Reset Request</h2>
                <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                <a href="{reset_url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
                    Reset Password
                </a>
                <p>If you didn't request this, ignore this email.</p>
                """,
            )
            mail.send(msg)
        except Exception:
            pass  # Email not configured – ignore silently

    return jsonify({"message": "If your email exists, you will receive a reset link."}), 200


# ─── Reset Password ──────────────────────────────────────────────────────────
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    token = data.get("token")
    new_password = data.get("new_password")

    if not token or not new_password:
        return jsonify({"error": "Token and new password required"}), 400

    user = User.query.filter_by(reset_token=token).first()
    if not user or not user.reset_token_expiry:
        return jsonify({"error": "Invalid or expired reset token"}), 400

    if datetime.utcnow() > user.reset_token_expiry:
        return jsonify({"error": "Reset token has expired"}), 400

    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()

    return jsonify({"message": "Password reset successfully. You can now log in."}), 200
