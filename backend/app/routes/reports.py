"""
SalesSphere AI – Reports Routes
PDF, Excel, CSV export generation
"""
import io
import csv
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, Response
from flask_jwt_extended import jwt_required
from sqlalchemy import func, extract
from app import db
from app.models import Sale, SaleItem, Product, Category

reports_bp = Blueprint("reports", __name__)


# ─── CSV Export ──────────────────────────────────────────────────────────────
@reports_bp.route("/export/csv", methods=["GET"])
@jwt_required()
def export_csv():
    year = int(request.args.get("year", datetime.utcnow().year))
    month = request.args.get("month")

    query = Sale.query.filter(
        extract("year", Sale.sale_date) == year,
        Sale.status == "completed",
    )
    if month:
        query = query.filter(extract("month", Sale.sale_date) == int(month))

    sales = query.order_by(Sale.sale_date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Invoice #", "Date", "Customer", "Email", "Region",
        "Payment", "Status", "Subtotal", "Discount", "Tax", "Total"
    ])

    for s in sales:
        writer.writerow([
            s.invoice_number,
            s.sale_date.strftime("%Y-%m-%d"),
            s.customer_name,
            s.customer_email or "",
            s.region,
            s.payment_method,
            s.status,
            f"{s.subtotal:.2f}",
            f"{s.discount:.2f}",
            f"{s.tax:.2f}",
            f"{s.total_amount:.2f}",
        ])

    output.seek(0)
    filename = f"sales_report_{year}"
    if month:
        filename += f"_{str(month).zfill(2)}"
    filename += ".csv"

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ─── Excel Export ─────────────────────────────────────────────────────────────
@reports_bp.route("/export/excel", methods=["GET"])
@jwt_required()
def export_excel():
    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from openpyxl.utils import get_column_letter
    except ImportError:
        return jsonify({"error": "openpyxl not installed"}), 500

    year = int(request.args.get("year", datetime.utcnow().year))
    month = request.args.get("month")

    query = Sale.query.filter(extract("year", Sale.sale_date) == year)
    if month:
        query = query.filter(extract("month", Sale.sale_date) == int(month))
    sales = query.order_by(Sale.sale_date.desc()).all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Sales Report"

    # Styles
    header_fill = PatternFill("solid", fgColor="6366F1")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    title_font = Font(bold=True, size=16, color="1E293B")

    # Title
    ws.merge_cells("A1:K1")
    ws["A1"] = f"SalesSphere AI – Sales Report {year}"
    ws["A1"].font = title_font
    ws["A1"].alignment = Alignment(horizontal="center")

    ws.merge_cells("A2:K2")
    ws["A2"] = f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
    ws["A2"].alignment = Alignment(horizontal="center")

    # Headers
    headers = ["Invoice #", "Date", "Customer", "Email", "Region",
               "Payment", "Status", "Subtotal", "Discount", "Tax", "Total"]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=4, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")

    # Data
    for row_idx, s in enumerate(sales, 5):
        ws.cell(row=row_idx, column=1, value=s.invoice_number)
        ws.cell(row=row_idx, column=2, value=s.sale_date.strftime("%Y-%m-%d"))
        ws.cell(row=row_idx, column=3, value=s.customer_name)
        ws.cell(row=row_idx, column=4, value=s.customer_email or "")
        ws.cell(row=row_idx, column=5, value=s.region)
        ws.cell(row=row_idx, column=6, value=s.payment_method)
        ws.cell(row=row_idx, column=7, value=s.status)
        ws.cell(row=row_idx, column=8, value=float(s.subtotal))
        ws.cell(row=row_idx, column=9, value=float(s.discount))
        ws.cell(row=row_idx, column=10, value=float(s.tax))
        ws.cell(row=row_idx, column=11, value=float(s.total_amount))

        # Alternate row color
        if row_idx % 2 == 0:
            for col in range(1, 12):
                ws.cell(row=row_idx, column=col).fill = PatternFill("solid", fgColor="F1F5F9")

    # Auto-width
    for col in range(1, 12):
        ws.column_dimensions[get_column_letter(col)].width = 16

    # Summary sheet
    ws2 = wb.create_sheet("Summary")
    total_rev = sum(float(s.total_amount) for s in sales if s.status == "completed")
    ws2["A1"] = "Total Revenue"
    ws2["B1"] = total_rev
    ws2["A2"] = "Total Orders"
    ws2["B2"] = len([s for s in sales if s.status == "completed"])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f"sales_report_{year}"
    if month:
        filename += f"_{str(month).zfill(2)}"
    filename += ".xlsx"

    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=filename,
    )


# ─── PDF Report ───────────────────────────────────────────────────────────────
@reports_bp.route("/export/pdf", methods=["GET"])
@jwt_required()
def export_pdf():
    try:
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm, inch
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Table, TableStyle, Paragraph,
            Spacer, HRFlowable
        )
    except ImportError:
        return jsonify({"error": "reportlab not installed"}), 500

    year = int(request.args.get("year", datetime.utcnow().year))
    month = request.args.get("month")

    query = Sale.query.filter(
        extract("year", Sale.sale_date) == year,
        Sale.status == "completed",
    )
    if month:
        query = query.filter(extract("month", Sale.sale_date) == int(month))
    sales = query.order_by(Sale.sale_date.desc()).limit(50).all()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4), topMargin=1.5*cm, bottomMargin=1.5*cm)

    styles = getSampleStyleSheet()
    purple = colors.HexColor("#6366F1")
    dark = colors.HexColor("#1E293B")

    elements = []

    # Title
    title_style = ParagraphStyle("Title", parent=styles["Title"],
                                  textColor=dark, fontSize=20, spaceAfter=6)
    sub_style = ParagraphStyle("Sub", parent=styles["Normal"],
                                textColor=colors.HexColor("#64748B"), fontSize=10)

    period_str = f"Year {year}"
    if month:
        period_str = f"{datetime(year, int(month), 1).strftime('%B %Y')}"

    elements.append(Paragraph("SalesSphere AI – Sales Report", title_style))
    elements.append(Paragraph(f"Period: {period_str} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", sub_style))
    elements.append(Spacer(1, 0.4*cm))
    elements.append(HRFlowable(width="100%", thickness=2, color=purple))
    elements.append(Spacer(1, 0.4*cm))

    # Summary KPIs
    total_rev = sum(float(s.total_amount) for s in sales)
    total_orders = len(sales)
    avg_order = total_rev / total_orders if total_orders else 0

    kpi_data = [
        ["Metric", "Value"],
        ["Total Revenue", f"${total_rev:,.2f}"],
        ["Total Orders", str(total_orders)],
        ["Average Order Value", f"${avg_order:,.2f}"],
    ]
    kpi_table = Table(kpi_data, colWidths=[6*cm, 5*cm])
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), purple),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 0.6*cm))

    # Sales table
    elements.append(Paragraph("Sales Transactions", styles["Heading2"]))
    elements.append(Spacer(1, 0.2*cm))

    table_data = [["Invoice #", "Date", "Customer", "Region", "Payment", "Status", "Total"]]
    for s in sales[:30]:
        table_data.append([
            s.invoice_number,
            s.sale_date.strftime("%Y-%m-%d"),
            s.customer_name[:25],
            s.region,
            s.payment_method,
            s.status.upper(),
            f"${float(s.total_amount):,.2f}",
        ])

    col_widths = [3.5*cm, 2.8*cm, 5*cm, 2.5*cm, 2.5*cm, 2.5*cm, 3*cm]
    sales_table = Table(table_data, colWidths=col_widths)
    sales_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), purple),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(sales_table)

    # Footer
    elements.append(Spacer(1, 0.5*cm))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0")))
    elements.append(Paragraph("Generated by SalesSphere AI Analytics Platform – Confidential", sub_style))

    doc.build(elements)
    buf.seek(0)

    filename = f"sales_report_{year}"
    if month:
        filename += f"_{str(month).zfill(2)}"
    filename += ".pdf"

    return send_file(
        buf,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=filename,
    )


# ─── Report Summary Stats ────────────────────────────────────────────────────
@reports_bp.route("/summary", methods=["GET"])
@jwt_required()
def report_summary():
    year = int(request.args.get("year", datetime.utcnow().year))
    month = request.args.get("month")

    query = Sale.query.filter(
        extract("year", Sale.sale_date) == year,
        Sale.status == "completed",
    )
    if month:
        query = query.filter(extract("month", Sale.sale_date) == int(month))

    sales = query.all()
    total_rev = sum(float(s.total_amount) for s in sales)
    total_disc = sum(float(s.discount) for s in sales)
    avg = total_rev / len(sales) if sales else 0

    return jsonify({
        "total_orders": len(sales),
        "total_revenue": total_rev,
        "total_discounts": total_disc,
        "average_order_value": avg,
        "period": {"year": year, "month": month},
    }), 200
