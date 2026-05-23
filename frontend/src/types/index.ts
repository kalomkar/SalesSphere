// SalesSphere AI – TypeScript Type Definitions

export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  phone?: string;
  department?: string;
  last_login?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  product_count: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  category_id: number;
  category?: string;
  price: number;
  cost_price: number;
  profit_margin: number;
  stock_quantity: number;
  reorder_level: number;
  is_low_stock: boolean;
  image_url?: string;
  region: string;
  is_active: boolean;
  created_at: string;
}

export interface SaleItem {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  user_id: number;
  salesperson?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  region: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  payment_method: 'cash' | 'card' | 'online' | 'bank_transfer';
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  notes?: string;
  sale_date: string;
  created_at: string;
  items: SaleItem[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'ai_insight';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface DashboardSummary {
  period: { year: number; month: number };
  revenue: { current: number; previous: number; growth: number; currency: string };
  orders: { current: number; previous: number; growth: number };
  profit: { current: number; margin: number };
  active_customers: number;
  total_products: number;
  low_stock_count: number;
  total_users: number;
}

export interface ChartDataPoint {
  month: string;
  revenue: number;
  orders?: number;
}

export interface CategorySales {
  name: string;
  color: string;
  revenue: number;
  units: number;
  percentage: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIInsight {
  id: number;
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'neutral';
  priority: 'high' | 'medium' | 'low';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  per_page?: number;
}

export interface RegionSales {
  region: string;
  revenue: number;
  orders: number;
}

export interface AIPrediction {
  predicted_revenue: number;
  last_month_revenue: number;
  growth_forecast: number;
  confidence: number;
  model: string;
}

export interface ProductPerformance {
  id: number;
  name: string;
  category: string;
  units_sold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}
