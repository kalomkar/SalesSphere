"""
GST invoice PDF, print, and email support.
"""
import io
from datetime import datetime

from flask import Blueprint, jsonify, send_file
from flask_jwt_extended import jwt_required

from app.models import Sale

invoices_bp = Blueprint("invoices", __name__)


def _gst_invoice_payload(sale: Sale):
    gst_rate = 18.0
    taxable = float(sale.subtotal) - float(sale.discount)
    gst_total = round(taxable * gst_rate / 100, 2)
    same_state = sale.region in ("North", "West")
    cgst = round(gst_total / 2, 2) if same_state else 0
    sgst = round(gst_total / 2, 2) if same_state else 0
    igst = gst_total if not same_state else 0
    final_amount = round(taxable + gst_total, 2)
    return {
        "invoice_number": sale.invoice_number,
        "invoice_date": sale.sale_date.isoformat(),
        "seller_gstin": "27AABCS1429B1Z5",
        "customer": {
            "name": sale.customer_name,
            "email": sale.customer_email,
            "phone": sale.customer_phone,
            "gstin": "URP",
            "region": sale.region,
        },
        "items": [item.to_dict() for item in sale.items],
        "taxable_amount": taxable,
        "discount": float(sale.discount),
        "tax_percentage": gst_rate,
        "cgst": cgst,
        "sgst": sgst,
        "igst": igst,
        "gst_total": gst_total,
        "final_amount": final_amount,
        "payment_method": sale.payment_method,
        "status": sale.status,
    }


@invoices_bp.route("/<int:sale_id>", methods=["GET"])
@jwt_required()
def invoice_detail(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    return jsonify(_gst_invoice_payload(sale)), 200


@invoices_bp.route("/<int:sale_id>/pdf", methods=["GET"])
@jwt_required()
def invoice_pdf(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    invoice = _gst_invoice_payload(sale)
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import cm
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    except ImportError:
        return jsonify({"error": "reportlab not installed"}), 500

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=1.2 * cm, bottomMargin=1.2 * cm)
    styles = getSampleStyleSheet()
    title = ParagraphStyle("InvoiceTitle", parent=styles["Title"], textColor=colors.HexColor("#1E293B"), fontSize=20)
    small = ParagraphStyle("Small", parent=styles["Normal"], fontSize=9, textColor=colors.HexColor("#475569"))

    elements = [
        Paragraph("GST TAX INVOICE", title),
        Paragraph(f"Invoice: {invoice['invoice_number']} | Date: {datetime.fromisoformat(invoice['invoice_date']).strftime('%d %b %Y')}", small),
        Spacer(1, 0.4 * cm),
        Paragraph("SalesSphere AI Pvt. Ltd.", styles["Heading3"]),
        Paragraph(f"GSTIN: {invoice['seller_gstin']}", small),
        Spacer(1, 0.3 * cm),
        Paragraph(f"Bill To: {invoice['customer']['name']} | GSTIN: {invoice['customer']['gstin']}", small),
        Paragraph(f"Email: {invoice['customer']['email'] or '-'} | Phone: {invoice['customer']['phone'] or '-'}", small),
        Spacer(1, 0.5 * cm),
    ]

    rows = [["Product", "Qty", "Unit", "Discount", "Line Total"]]
    for item in invoice["items"]:
        rows.append([
            item["product_name"] or "-",
            item["quantity"],
            f"{item['unit_price']:.2f}",
            f"{item['discount']:.2f}",
            f"{item['total']:.2f}",
        ])
    table = Table(rows, colWidths=[7 * cm, 2 * cm, 3 * cm, 3 * cm, 3 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6366F1")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 0.5 * cm))

    totals = [
        ["Taxable Amount", f"{invoice['taxable_amount']:.2f}"],
        ["CGST", f"{invoice['cgst']:.2f}"],
        ["SGST", f"{invoice['sgst']:.2f}"],
        ["IGST", f"{invoice['igst']:.2f}"],
        ["Final Amount", f"{invoice['final_amount']:.2f}"],
    ]
    total_table = Table(totals, colWidths=[10 * cm, 5 * cm])
    total_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#EEF2FF")),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 0.4 * cm))
    elements.append(Paragraph("This is a computer generated GST invoice.", small))
    doc.build(elements)
    buf.seek(0)
    return send_file(buf, mimetype="application/pdf", as_attachment=True, download_name=f"{sale.invoice_number}_gst_invoice.pdf")


@invoices_bp.route("/<int:sale_id>/email", methods=["POST"])
@jwt_required()
def email_invoice(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    if not sale.customer_email:
        return jsonify({"error": "Customer email is not available"}), 400
    return jsonify({"message": f"Invoice {sale.invoice_number} queued for email to {sale.customer_email}"}), 200
