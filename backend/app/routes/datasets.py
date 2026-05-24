"""
Dataset import, validation, cleaning, mapping, and analysis routes.
"""
import io
import json
import os
from datetime import datetime
from pathlib import Path

import pandas as pd
from flask import Blueprint, current_app, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func
from werkzeug.utils import secure_filename

from app import db
from app.models import ImportedDataset, Sale, SaleItem, Product, Category, User

datasets_bp = Blueprint("datasets", __name__)

SUPPORTED_SOURCES = [
    {
        "id": "amazon_sales",
        "name": "Amazon Sales Dataset",
        "description": "Default marketplace sales layout with order, product, customer, region, revenue, and profit fields.",
        "fields": ["order_date", "order_id", "product", "category", "customer", "region", "sales", "quantity", "profit"],
    },
    {
        "id": "superstore_sales",
        "name": "Superstore Sales Dataset",
        "description": "Classic retail BI dataset for regional, segment, product, discount, and profit analytics.",
        "fields": ["order_date", "ship_date", "segment", "category", "sub_category", "sales", "profit", "region"],
    },
    {
        "id": "retail_store",
        "name": "Retail Store Dataset",
        "description": "Point-of-sale retail store transactions for demand, inventory, and customer analysis.",
        "fields": ["date", "transaction_id", "sku", "product", "customer_id", "quantity", "price", "store", "region"],
    },
]

FIELD_ALIASES = {
    "date": ["date", "order date", "order_date", "sale date", "sale_date", "purchase date"],
    "order_id": ["order id", "order_id", "invoice", "invoice_number", "transaction id", "transaction_id"],
    "product": ["product", "product name", "product_name", "item", "sku"],
    "category": ["category", "product category", "cat"],
    "customer": ["customer", "customer name", "customer_name", "buyer", "client"],
    "region": ["region", "state", "city", "market", "territory"],
    "sales": ["sales", "revenue", "amount", "total", "total_amount", "selling price"],
    "quantity": ["quantity", "qty", "units", "units sold"],
    "profit": ["profit", "margin", "net profit"],
    "discount": ["discount", "discounts"],
}


def _admin_required():
    user = User.query.get(int(get_jwt_identity()))
    return user and user.role == "admin"


def _read_dataset(file_storage):
    filename = secure_filename(file_storage.filename or "dataset.csv")
    suffix = Path(filename).suffix.lower()
    if suffix == ".csv":
        df = pd.read_csv(file_storage)
    elif suffix in (".xlsx", ".xls"):
        df = pd.read_excel(file_storage)
    else:
        raise ValueError("Only CSV and Excel files are supported.")
    return filename, suffix.replace(".", ""), df


def _clean_frame(df: pd.DataFrame):
    original_rows = len(df)
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]
    df = df.dropna(how="all")
    duplicate_rows = int(df.duplicated().sum())
    df = df.drop_duplicates()
    missing_before = int(df.isna().sum().sum())
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(0)
        else:
            df[col] = df[col].fillna("Unknown")
    return df, {
        "original_rows": original_rows,
        "cleaned_rows": len(df),
        "removed_blank_rows": original_rows - len(df),
        "removed_duplicates": duplicate_rows,
        "missing_values_filled": missing_before,
    }


def _field_map(columns):
    normalized = {c: c.lower().strip().replace("-", " ").replace("_", " ") for c in columns}
    mapped = {}
    for target, aliases in FIELD_ALIASES.items():
        for col, norm in normalized.items():
            if norm in aliases or any(alias in norm for alias in aliases):
                mapped[target] = col
                break
    return mapped


def _analysis(df: pd.DataFrame, mapping: dict):
    result = {
        "monthly_sales": [],
        "product_analysis": [],
        "customer_analysis": [],
        "regional_analysis": [],
        "profit_analysis": {"total_profit": 0, "profit_margin": 0},
        "sales_trend": [],
        "product_demand": [],
    }
    sales_col = mapping.get("sales")
    qty_col = mapping.get("quantity")
    date_col = mapping.get("date")
    product_col = mapping.get("product")
    customer_col = mapping.get("customer")
    region_col = mapping.get("region")
    profit_col = mapping.get("profit")

    if sales_col:
        df[sales_col] = pd.to_numeric(df[sales_col], errors="coerce").fillna(0)
    if qty_col:
        df[qty_col] = pd.to_numeric(df[qty_col], errors="coerce").fillna(0)
    if profit_col:
        df[profit_col] = pd.to_numeric(df[profit_col], errors="coerce").fillna(0)

    if date_col and sales_col:
        dates = pd.to_datetime(df[date_col], errors="coerce")
        monthly = df.assign(_month=dates.dt.strftime("%Y-%m")).dropna(subset=["_month"])
        result["monthly_sales"] = (
            monthly.groupby("_month")[sales_col].sum().reset_index()
            .rename(columns={"_month": "month", sales_col: "sales"})
            .tail(12).to_dict("records")
        )
        result["sales_trend"] = result["monthly_sales"]

    if product_col and sales_col:
        product = df.groupby(product_col).agg({sales_col: "sum", **({qty_col: "sum"} if qty_col else {})}).reset_index()
        product = product.sort_values(sales_col, ascending=False).head(10)
        result["product_analysis"] = product.rename(columns={product_col: "product", sales_col: "sales", qty_col or sales_col: "quantity"}).to_dict("records")

    if product_col and qty_col:
        demand = df.groupby(product_col)[qty_col].sum().reset_index().sort_values(qty_col, ascending=False).head(10)
        result["product_demand"] = demand.rename(columns={product_col: "product", qty_col: "quantity"}).to_dict("records")

    if customer_col and sales_col:
        customers = df.groupby(customer_col)[sales_col].sum().reset_index().sort_values(sales_col, ascending=False).head(10)
        result["customer_analysis"] = customers.rename(columns={customer_col: "customer", sales_col: "sales"}).to_dict("records")

    if region_col and sales_col:
        regions = df.groupby(region_col)[sales_col].sum().reset_index().sort_values(sales_col, ascending=False)
        result["regional_analysis"] = regions.rename(columns={region_col: "region", sales_col: "sales"}).to_dict("records")

    if profit_col and sales_col:
        total_profit = float(df[profit_col].sum())
        total_sales = float(df[sales_col].sum())
        result["profit_analysis"] = {
            "total_profit": round(total_profit, 2),
            "profit_margin": round((total_profit / total_sales) * 100, 2) if total_sales else 0,
        }
    return result


def _to_json(value):
    def convert(obj):
        if hasattr(obj, "item"):
            return obj.item()
        return str(obj)
    return json.dumps(value, default=convert)


def _native_sales_analysis():
    monthly = db.session.query(
        func.date_format(Sale.sale_date, "%Y-%m").label("month"),
        func.coalesce(func.sum(Sale.total_amount), 0).label("sales"),
    ).filter(Sale.status == "completed").group_by("month").order_by("month").all()

    products = db.session.query(
        Product.name.label("product"),
        func.coalesce(func.sum(SaleItem.total), 0).label("sales"),
        func.coalesce(func.sum(SaleItem.quantity), 0).label("quantity"),
    ).join(SaleItem, Product.id == SaleItem.product_id).join(Sale, SaleItem.sale_id == Sale.id)\
     .filter(Sale.status == "completed").group_by(Product.id, Product.name)\
     .order_by(func.sum(SaleItem.total).desc()).limit(10).all()

    regions = db.session.query(Sale.region, func.coalesce(func.sum(Sale.total_amount), 0).label("sales"))\
        .filter(Sale.status == "completed").group_by(Sale.region).all()

    return {
        "monthly_sales": [{"month": m.month, "sales": float(m.sales)} for m in monthly[-12:]],
        "product_analysis": [{"product": p.product, "sales": float(p.sales), "quantity": int(p.quantity)} for p in products],
        "regional_analysis": [{"region": r.region, "sales": float(r.sales)} for r in regions],
        "product_demand": [{"product": p.product, "quantity": int(p.quantity)} for p in products],
    }


@datasets_bp.route("/sources", methods=["GET"])
@jwt_required()
def sources():
    return jsonify({"data": SUPPORTED_SOURCES}), 200


@datasets_bp.route("/", methods=["GET"])
@jwt_required()
def list_datasets():
    datasets = ImportedDataset.query.order_by(ImportedDataset.created_at.desc()).all()
    return jsonify({"data": [d.to_dict() for d in datasets]}), 200


@datasets_bp.route("/preview", methods=["POST"])
@jwt_required()
def preview_dataset():
    if not _admin_required():
        return jsonify({"error": "Admin access required"}), 403
    if "file" not in request.files:
        return jsonify({"error": "Dataset file is required"}), 400
    try:
        filename, file_type, df = _read_dataset(request.files["file"])
        df, quality = _clean_frame(df)
        mapping = _field_map(df.columns)
        return jsonify({
            "file_name": filename,
            "file_type": file_type,
            "row_count": int(len(df)),
            "column_count": int(len(df.columns)),
            "columns": list(df.columns),
            "field_map": mapping,
            "quality_report": quality,
            "preview": df.head(10).astype(str).to_dict("records"),
            "valid": bool(mapping.get("sales") and (mapping.get("date") or mapping.get("product"))),
        }), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@datasets_bp.route("/import", methods=["POST"])
@jwt_required()
def import_dataset():
    if not _admin_required():
        return jsonify({"error": "Admin access required"}), 403
    if "file" not in request.files:
        return jsonify({"error": "Dataset file is required"}), 400
    try:
        filename, file_type, df = _read_dataset(request.files["file"])
        df, quality = _clean_frame(df)
        mapping = _field_map(df.columns)
        analysis = _analysis(df, mapping)

        dataset_dir = Path(current_app.config["UPLOAD_FOLDER"]) / "datasets"
        dataset_dir.mkdir(parents=True, exist_ok=True)
        saved_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}"
        saved_path = dataset_dir / saved_name
        if file_type == "csv":
            df.to_csv(saved_path, index=False)
        else:
            df.to_excel(saved_path, index=False)

        dataset = ImportedDataset(
            name=request.form.get("name") or filename,
            source=request.form.get("source") or "upload",
            file_name=filename,
            file_path=str(saved_path),
            file_type=file_type,
            row_count=int(len(df)),
            column_count=int(len(df.columns)),
            columns_json=_to_json(list(df.columns)),
            field_map_json=_to_json(mapping),
            quality_report_json=_to_json(quality),
            analysis_json=_to_json(analysis),
            status="imported",
            created_by=int(get_jwt_identity()),
        )
        db.session.add(dataset)
        db.session.commit()
        return jsonify({"message": "Dataset imported successfully", "data": dataset.to_dict()}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@datasets_bp.route("/import-source", methods=["POST"])
@jwt_required()
def import_source():
    if not _admin_required():
        return jsonify({"error": "Admin access required"}), 403
    data = request.get_json() or {}
    source = data.get("source", "amazon_sales")
    source_meta = next((s for s in SUPPORTED_SOURCES if s["id"] == source), SUPPORTED_SOURCES[0])
    analysis = _native_sales_analysis()
    dataset = ImportedDataset(
        name=source_meta["name"],
        source=source,
        file_name=f"{source}.virtual",
        file_type="virtual",
        row_count=Sale.query.count(),
        column_count=len(source_meta["fields"]),
        columns_json=_to_json(source_meta["fields"]),
        field_map_json=_to_json({"date": "sale_date", "sales": "total_amount", "product": "product", "region": "region"}),
        quality_report_json=_to_json({"original_rows": Sale.query.count(), "cleaned_rows": Sale.query.count(), "missing_values_filled": 0}),
        analysis_json=_to_json(analysis),
        status="imported",
        created_by=int(get_jwt_identity()),
    )
    db.session.add(dataset)
    db.session.commit()
    return jsonify({"message": f"{source_meta['name']} imported from built-in retail data", "data": dataset.to_dict()}), 201


@datasets_bp.route("/<int:dataset_id>/analysis", methods=["GET"])
@jwt_required()
def dataset_analysis(dataset_id):
    dataset = ImportedDataset.query.get_or_404(dataset_id)
    return jsonify(dataset.to_dict()), 200


@datasets_bp.route("/<int:dataset_id>/export/<fmt>", methods=["GET"])
@jwt_required()
def dataset_export(dataset_id, fmt):
    dataset = ImportedDataset.query.get_or_404(dataset_id)
    if fmt == "csv" and dataset.file_path and os.path.exists(dataset.file_path):
        return send_file(dataset.file_path, as_attachment=True, download_name=f"{dataset.name}.csv")
    if fmt == "json":
        payload = json.dumps(dataset.to_dict(), indent=2)
        return send_file(io.BytesIO(payload.encode("utf-8")), mimetype="application/json", as_attachment=True, download_name=f"{dataset.name}.json")
    return jsonify({"error": "Unsupported export format"}), 400
