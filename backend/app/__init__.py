"""
SalesSphere AI – Flask Application Factory
"""
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_cors import CORS
from flask_mail import Mail

from config import config

# ── Extensions (created here, initialized in create_app) ─────────────────────
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()
mail = Mail()


def create_app(config_name: str = "default") -> Flask:
    """Application factory pattern."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # ── Create upload folder ─────────────────────────────────────────────
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # ── Initialize extensions ────────────────────────────────────────────
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    # ── Register blueprints ──────────────────────────────────────────────
    from app.routes.auth import auth_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.products import products_bp
    from app.routes.sales import sales_bp
    from app.routes.analytics import analytics_bp
    from app.routes.reports import reports_bp
    from app.routes.ai_assistant import ai_bp
    from app.routes.notifications import notifications_bp
    from app.routes.users import users_bp
    from app.routes.datasets import datasets_bp
    from app.routes.invoices import invoices_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(sales_bp, url_prefix="/api/sales")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(datasets_bp, url_prefix="/api/datasets")
    app.register_blueprint(invoices_bp, url_prefix="/api/invoices")

    # ── Health check ─────────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return {"status": "ok", "version": "1.0.0", "app": "SalesSphere AI"}

    return app
