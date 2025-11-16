import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Prefer': 'return=representation'
    }
  }
});

// Types for database tables
export type UserType = 'admin' | 'customer';
export type OrderStatus = 'pending' | 'confirmed' | 'delivered';

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  admin_id: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  cpf?: string;
  phone?: string;
  user_type: UserType;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  active: boolean;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryZone {
  id: string;
  store_id: string;
  radius_km: number;
  delivery_fee: number;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  user_id: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  store_id: string;
  customer_id: string;
  status: OrderStatus;
  total: number;
  delivery_address: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip_code?: string;
  delivery_zone_id?: string;
  delivery_fee: number;
  customer_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  notes?: string;
  created_at: string;
  product?: Product;
}

