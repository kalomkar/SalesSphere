-- SalesSphere AI – Database Schema & Seed Data
-- Run this after: flask db upgrade (or python run.py to auto-create)

CREATE DATABASE IF NOT EXISTS salessphere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE salessphere;

-- Users
INSERT INTO users (name, email, password_hash, role, is_active, is_verified, department, created_at)
VALUES
  ('Admin User', 'admin@salessphere.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMkTKmBl1kYflZJm.EfH8lWPe2', 'admin', 1, 1, 'Management', NOW()),
  ('Sarah Johnson', 'sarah@salessphere.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMkTKmBl1kYflZJm.EfH8lWPe2', 'manager', 1, 1, 'Sales', NOW()),
  ('Mike Chen', 'mike@salessphere.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMkTKmBl1kYflZJm.EfH8lWPe2', 'employee', 1, 1, 'Sales', NOW()),
  ('Priya Sharma', 'priya@salessphere.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMkTKmBl1kYflZJm.EfH8lWPe2', 'employee', 1, 1, 'Sales', NOW());
-- Default password for all: admin123

-- Categories
INSERT INTO categories (name, description, color, icon) VALUES
  ('Electronics', 'Laptops, phones, tablets, accessories', '#6366f1', 'cpu'),
  ('Apparel', 'Clothing, shoes, accessories', '#ec4899', 'shirt'),
  ('Home & Garden', 'Furniture, decor, garden tools', '#10b981', 'home'),
  ('Sports & Fitness', 'Equipment, activewear, nutrition', '#f59e0b', 'activity'),
  ('Books & Media', 'Books, courses, software', '#3b82f6', 'book'),
  ('Health & Beauty', 'Skincare, wellness, personal care', '#8b5cf6', 'heart');

-- Products (30 realistic products)
INSERT INTO products (name, sku, description, category_id, price, cost_price, stock_quantity, reorder_level, region) VALUES
  ('MacBook Pro 16" M3', 'ELC-001', 'Apple MacBook Pro 16 inch with M3 chip, 18GB RAM', 1, 2499.99, 1800.00, 25, 5, 'North'),
  ('iPhone 15 Pro Max', 'ELC-002', 'Apple iPhone 15 Pro Max 256GB Natural Titanium', 1, 1199.99, 850.00, 42, 10, 'North'),
  ('Sony WH-1000XM5', 'ELC-003', 'Industry leading noise canceling wireless headphones', 1, 349.99, 220.00, 78, 15, 'South'),
  ('Samsung 65" QLED TV', 'ELC-004', 'Samsung 65-inch QLED 4K Smart TV', 1, 1299.99, 900.00, 18, 5, 'East'),
  ('iPad Air 5th Gen', 'ELC-005', 'Apple iPad Air 10.9-inch Wi-Fi 64GB', 1, 749.99, 520.00, 35, 8, 'West'),
  ('Dell XPS 15', 'ELC-006', 'Dell XPS 15 Intel Core i9, 32GB RAM, 1TB SSD', 1, 1899.99, 1400.00, 14, 4, 'North'),
  ('LG 27" 4K Monitor', 'ELC-007', 'LG 27UK850-W 4K UHD IPS Monitor with USB-C', 1, 449.99, 300.00, 52, 10, 'South'),

  ('Nike Air Max 270', 'APL-001', 'Nike Air Max 270 Running Shoes', 2, 149.99, 85.00, 120, 20, 'North'),
  ('Levi''s 501 Jeans', 'APL-002', 'Classic Levi''s 501 Original Fit Jeans', 2, 69.99, 40.00, 200, 30, 'South'),
  ('Adidas Ultraboost 23', 'APL-003', 'Adidas Ultraboost 23 Running Shoes', 2, 179.99, 100.00, 95, 20, 'East'),
  ('Ray-Ban Aviator', 'APL-004', 'Classic Ray-Ban Aviator Sunglasses Gold', 2, 163.99, 90.00, 80, 15, 'West'),

  ('IKEA KALLAX Shelf', 'HMG-001', 'IKEA KALLAX Shelf Unit 4x4 White', 3, 249.99, 160.00, 30, 8, 'North'),
  ('Dyson V15 Vacuum', 'HMG-002', 'Dyson V15 Detect Absolute Cordless Vacuum', 3, 749.99, 500.00, 20, 4, 'South'),
  ('Instant Pot Duo', 'HMG-003', 'Instant Pot Duo 7-in-1 Electric Pressure Cooker 6Qt', 3, 99.99, 60.00, 65, 12, 'East'),
  ('Weber Genesis Grill', 'HMG-004', 'Weber Genesis II E-335 Gas Grill', 3, 899.99, 620.00, 12, 3, 'West'),
  ('Philips Hue Starter', 'HMG-005', 'Philips Hue White and Color Ambiance Starter Kit', 3, 199.99, 130.00, 45, 10, 'North'),

  ('Peloton Bike+', 'SPT-001', 'Peloton Bike+ Indoor Exercise Bike', 4, 2495.00, 1800.00, 8, 2, 'North'),
  ('Whey Protein 5lb', 'SPT-002', 'Optimum Nutrition Gold Standard Whey 5lb Vanilla', 4, 54.99, 30.00, 150, 25, 'South'),
  ('Yoga Mat Premium', 'SPT-003', 'Liforme Yoga Mat with Alignment Markers', 4, 149.99, 85.00, 60, 12, 'East'),
  ('Garmin Forerunner 265', 'SPT-004', 'Garmin Forerunner 265 GPS Running Smartwatch', 4, 449.99, 300.00, 28, 6, 'West'),
  ('Bowflex Dumbbells', 'SPT-005', 'Bowflex SelectTech 552 Adjustable Dumbbells', 4, 399.99, 260.00, 22, 5, 'North'),

  ('Python Crash Course', 'BKS-001', 'Python Crash Course 3rd Edition by Eric Matthes', 5, 39.99, 20.00, 200, 30, 'All'),
  ('Adobe Creative Cloud', 'BKS-002', 'Adobe Creative Cloud All Apps Annual Plan', 5, 599.99, 0.00, 999, 0, 'All'),
  ('Microsoft Office 365', 'BKS-003', 'Microsoft 365 Personal 1-Year Subscription', 5, 69.99, 0.00, 999, 0, 'All'),

  ('La Mer Moisturizer', 'HLT-001', 'La Mer Crème de la Mer Moisturizing Cream 1oz', 6, 195.00, 80.00, 40, 8, 'North'),
  ('Oura Ring Gen3', 'HLT-002', 'Oura Ring Generation 3 Health Tracking Ring', 6, 299.99, 150.00, 25, 5, 'South'),
  ('Theragun Pro', 'HLT-003', 'Theragun PRO Percussive Therapy Device', 6, 599.00, 350.00, 15, 3, 'East'),
  ('Vitamix A3500', 'HLT-004', 'Vitamix A3500 Ascent Series Smart Blender', 6, 649.99, 420.00, 10, 2, 'West'),
  ('Fitbit Charge 6', 'HLT-005', 'Fitbit Charge 6 Fitness Tracker with GPS', 6, 159.99, 90.00, 55, 10, 'North'),
  ('Nespresso Vertuo', 'HLT-006', 'Nespresso Vertuo Next Coffee Machine', 6, 199.99, 120.00, 38, 8, 'South');
