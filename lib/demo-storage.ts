"use client";
import { demoOrders, demoProducts } from "@/lib/demo";
import type { Order, Product } from "@/lib/types";
const PRODUCTS_KEY = "dolce-demo-products-v1";
const ORDERS_KEY = "dolce-demo-orders-v1";
function read<T>(key: string, defaults: T): T {
  if (typeof window === "undefined") return defaults;
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : defaults; } catch { return defaults; }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("dolce-demo-change"));
}
export const getDemoProducts = () => read<Product[]>(PRODUCTS_KEY, demoProducts);
export const saveDemoProducts = (products: Product[]) => write(PRODUCTS_KEY, products);
export const getDemoOrders = () => read<Order[]>(ORDERS_KEY, demoOrders);
export const saveDemoOrders = (orders: Order[]) => write(ORDERS_KEY, orders);
export const demoMode = !Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
