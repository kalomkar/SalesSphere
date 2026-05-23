"""
SalesSphere AI – Database Seeder
Generates 12 months of realistic sales data
Run: python seed.py
"""
import os
import sys
import random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))
os.environ["FLASK_ENV"] = "development"

from app import create_app, db
from app.models import User, Category, Product, Sale, SaleItem, Notification

app = create_app("development")

CUSTOMERS = [
    ("Acme Corp", "orders@acme.com", "+1-555-0101", "North"),
    ("TechVision Ltd", "purchasing@techvision.com", "+1-555-0102", "South"),
    ("Global Traders", "buy@globaltraders.com", "+1-555-0103", "East"),
    ("StartupHub Inc", "ops@startuphub.io", "+1-555-0104", "West"),
    ("Enterprise Solutions", "accounts@enterprise.com", "+1-555-0105", "North"),
    ("Creative Studios", "finance@creativestudios.com", "+1-555-0106", "South"),
    ("Future Labs", "procurement@futurelabs.ai", "+1-555-0107", "East"),
    ("Retail Giants", "orders@retailgiants.com", "+1-555-0108", "West"),
    ("Metro Business", "buy@metrobusiness.com", "+1-555-0109", "North"),
    ("Innovation Co", "finance@innovation.co", "+1-555-0110", "South"),
    ("Digital Dynamics", "ops@digitaldynamics.com", "+1-555-0111", "East"),
    ("Prime Ventures", "purchase@primeventures.com", "+1-555-0112", "West"),
    ("Cloud Systems", "admin@cloudsystems.net", "+1-555-0113", "North"),
    ("Smart Solutions", "orders@smartsolutions.in", "+1-555-0114", "South"),
    ("Peak Performance", "buy@peakperformance.com", "+1-555-0115", "East"),
]

PAYMENT_METHODS = ["card", "cash", "online", "bank_transfer"]
STATUSES = ["completed"] * 85 + ["pending"] * 10 + ["cancelled"] * 5


def seed():
    with app.app_context():
        print("🌱 Starting database seed...")
        db.create_all()

        # ── Users ─────────────────────────────────────────────────────────
        if User.query.count() == 0:
            users_data = [
                ("Admin User", "admin@salessphere.ai", "admin123", "admin", "Management"),
                ("Sarah Johnson", "sarah@salessphere.ai", "admin123", "manager", "Sales"),
                ("Mike Chen", "mike@salessphere.ai", "admin123", "employee", "Sales"),
                ("Priya Sharma", "priya@salessphere.ai", "admin123", "employee", "Sales"),
                ("James Wilson", "james@salessphere.ai", "admin123", "employee", "Sales"),
            ]
            users = []
            for name, email, pwd, role, dept in users_data:
                u = User(name=name, email=email, role=role, department=dept,
                         is_active=True, is_verified=True)
                u.set_password(pwd)
                db.session.add(u)
                users.append(u)
            db.session.commit()
            print(f"  ✅ Created {len(users)} users")
        else:
            users = User.query.all()
            print(f"  ℹ️  {len(users)} users already exist")

        # ── Categories ───────────────────────────────────────────────────
        if Category.query.count() == 0:
            cats_data = [
                ("Electronics", "Laptops, phones, tablets, accessories", "#6366f1", "cpu"),
                ("Apparel", "Clothing, shoes, fashion accessories", "#ec4899", "shirt"),
                ("Home & Garden", "Furniture, decor, garden tools", "#10b981", "home"),
                ("Sports & Fitness", "Equipment, activewear, nutrition", "#f59e0b", "activity"),
                ("Books & Media", "Books, courses, software licenses", "#3b82f6", "book"),
                ("Health & Beauty", "Skincare, wellness, personal care", "#8b5cf6", "heart"),
            ]
            categories = []
            for name, desc, color, icon in cats_data:
                c = Category(name=name, description=desc, color=color, icon=icon)
                db.session.add(c)
                categories.append(c)
            db.session.commit()
            print(f"  ✅ Created {len(categories)} categories")
        else:
            categories = Category.query.all()
            print(f"  ℹ️  {len(categories)} categories already exist")

        # ── Products ─────────────────────────────────────────────────────
        if Product.query.count() == 0:
            cat_map = {c.name: c.id for c in Category.query.all()}
            products_data = [
                # Electronics
                ("MacBook Pro 16\" M3", "ELC-001", cat_map["Electronics"], 2499.99, 1800.00, 25, 5, "North"),
                ("iPhone 15 Pro Max", "ELC-002", cat_map["Electronics"], 1199.99, 850.00, 42, 10, "North"),
                ("Sony WH-1000XM5", "ELC-003", cat_map["Electronics"], 349.99, 220.00, 78, 15, "South"),
                ("Samsung 65\" QLED TV", "ELC-004", cat_map["Electronics"], 1299.99, 900.00, 18, 5, "East"),
                ("iPad Air 5th Gen", "ELC-005", cat_map["Electronics"], 749.99, 520.00, 35, 8, "West"),
                ("Dell XPS 15", "ELC-006", cat_map["Electronics"], 1899.99, 1400.00, 14, 4, "North"),
                ("LG 27\" 4K Monitor", "ELC-007", cat_map["Electronics"], 449.99, 300.00, 52, 10, "South"),
                # Apparel
                ("Nike Air Max 270", "APL-001", cat_map["Apparel"], 149.99, 85.00, 120, 20, "North"),
                ("Levi's 501 Jeans", "APL-002", cat_map["Apparel"], 69.99, 40.00, 200, 30, "South"),
                ("Adidas Ultraboost 23", "APL-003", cat_map["Apparel"], 179.99, 100.00, 95, 20, "East"),
                ("Ray-Ban Aviator", "APL-004", cat_map["Apparel"], 163.99, 90.00, 80, 15, "West"),
                # Home & Garden
                ("IKEA KALLAX Shelf", "HMG-001", cat_map["Home & Garden"], 249.99, 160.00, 30, 8, "North"),
                ("Dyson V15 Vacuum", "HMG-002", cat_map["Home & Garden"], 749.99, 500.00, 20, 4, "South"),
                ("Instant Pot Duo", "HMG-003", cat_map["Home & Garden"], 99.99, 60.00, 65, 12, "East"),
                ("Philips Hue Starter", "HMG-004", cat_map["Home & Garden"], 199.99, 130.00, 45, 10, "North"),
                # Sports
                ("Whey Protein 5lb", "SPT-001", cat_map["Sports & Fitness"], 54.99, 30.00, 150, 25, "South"),
                ("Yoga Mat Premium", "SPT-002", cat_map["Sports & Fitness"], 149.99, 85.00, 60, 12, "East"),
                ("Garmin Forerunner 265", "SPT-003", cat_map["Sports & Fitness"], 449.99, 300.00, 28, 6, "West"),
                ("Bowflex Dumbbells", "SPT-004", cat_map["Sports & Fitness"], 399.99, 260.00, 22, 5, "North"),
                # Books
                ("Python Crash Course", "BKS-001", cat_map["Books & Media"], 39.99, 20.00, 200, 30, "All"),
                ("Adobe Creative Cloud", "BKS-002", cat_map["Books & Media"], 599.99, 0.00, 999, 0, "All"),
                ("Microsoft Office 365", "BKS-003", cat_map["Books & Media"], 69.99, 0.00, 999, 0, "All"),
                # Health
                ("Theragun PRO", "HLT-001", cat_map["Health & Beauty"], 599.00, 350.00, 15, 3, "East"),
                ("Fitbit Charge 6", "HLT-002", cat_map["Health & Beauty"], 159.99, 90.00, 55, 10, "North"),
                ("Nespresso Vertuo", "HLT-003", cat_map["Health & Beauty"], 199.99, 120.00, 38, 8, "South"),
                ("Oura Ring Gen3", "HLT-004", cat_map["Health & Beauty"], 299.99, 150.00, 25, 5, "West"),
            ]
            products = []
            for name, sku, cat_id, price, cost, stock, reorder, region in products_data:
                p = Product(
                    name=name, sku=sku, category_id=cat_id,
                    price=price, cost_price=cost,
                    stock_quantity=stock, reorder_level=reorder,
                    region=region, is_active=True,
                )
                db.session.add(p)
                products.append(p)
            db.session.commit()
            print(f"  ✅ Created {len(products)} products")
        else:
            products = Product.query.all()
            print(f"  ℹ️  {len(products)} products already exist")

        # ── Sales (12 months of data) ─────────────────────────────────────
        if Sale.query.count() == 0:
            all_products = Product.query.all()
            all_users = User.query.all()
            sale_count = 0

            # Monthly volume with seasonal variation
            monthly_targets = {
                1: 28, 2: 22, 3: 35, 4: 30, 5: 33, 6: 40,
                7: 38, 8: 36, 9: 42, 10: 44, 11: 55, 12: 60,
            }

            year = datetime.utcnow().year - 0  # Current year

            for month, target_sales in monthly_targets.items():
                if month > datetime.utcnow().month:
                    target_sales = int(target_sales * 0.3)  # partial month

                for _ in range(target_sales):
                    # Random day in month
                    day = random.randint(1, 28)
                    hour = random.randint(8, 20)
                    sale_date = datetime(year, month, day, hour, random.randint(0, 59))

                    customer = random.choice(CUSTOMERS)
                    user = random.choice(all_users)
                    status = random.choice(STATUSES)

                    # 1-4 items per sale
                    num_items = random.randint(1, 4)
                    selected_products = random.sample(all_products, min(num_items, len(all_products)))

                    subtotal = 0.0
                    sale_items_data = []
                    for prod in selected_products:
                        qty = random.randint(1, 5)
                        unit_price = float(prod.price) * random.uniform(0.95, 1.05)
                        item_discount = unit_price * qty * random.uniform(0, 0.05)
                        total = (unit_price * qty) - item_discount
                        subtotal += total
                        sale_items_data.append((prod, qty, unit_price, item_discount, total))

                    discount = subtotal * random.uniform(0, 0.03)
                    tax = subtotal * 0.08
                    total_amount = subtotal - discount + tax

                    invoice = f"INV-{year}-{str(sale_count + 1).zfill(5)}"
                    sale = Sale(
                        invoice_number=invoice,
                        user_id=user.id,
                        customer_name=customer[0],
                        customer_email=customer[1],
                        customer_phone=customer[2],
                        region=customer[3],
                        status=status,
                        payment_method=random.choice(PAYMENT_METHODS),
                        subtotal=round(subtotal, 2),
                        discount=round(discount, 2),
                        tax=round(tax, 2),
                        total_amount=round(total_amount, 2),
                        sale_date=sale_date,
                        created_at=sale_date,
                    )
                    db.session.add(sale)
                    db.session.flush()

                    for prod, qty, unit_price, item_discount, total in sale_items_data:
                        si = SaleItem(
                            sale_id=sale.id,
                            product_id=prod.id,
                            quantity=qty,
                            unit_price=round(unit_price, 2),
                            discount=round(item_discount, 2),
                            total=round(total, 2),
                        )
                        db.session.add(si)

                    sale_count += 1

            db.session.commit()
            print(f"  ✅ Created {sale_count} sales records")

        # ── Notifications ─────────────────────────────────────────────────
        if Notification.query.count() == 0:
            admin = User.query.filter_by(role="admin").first()
            if admin:
                sample_notifs = [
                    ("High Revenue Month Detected", "November 2024 achieved 28% growth over target!", "success"),
                    ("Low Stock Alert: Sony WH-1000XM5", "Only 3 units remaining. Reorder recommended.", "warning"),
                    ("AI Insight: Electronics Surge", "Electronics category grew 22% this month driven by promotions.", "ai_insight"),
                    ("New Team Member Added", "Priya Sharma has joined the Sales team.", "info"),
                    ("Monthly Report Ready", "November 2024 sales report is ready to download.", "info"),
                ]
                for title, msg, typ in sample_notifs:
                    db.session.add(Notification(
                        user_id=admin.id, title=title, message=msg, type=typ
                    ))
                db.session.commit()
                print(f"  ✅ Created {len(sample_notifs)} notifications")

        print("\n🎉 Database seeded successfully!")
        print("   Login: admin@salessphere.ai / admin123")
        print("   Login: sarah@salessphere.ai / admin123")


if __name__ == "__main__":
    seed()
