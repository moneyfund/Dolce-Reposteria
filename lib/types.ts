export type Category = "Pasteles" | "Cupcakes" | "Postres" | "Panadería" | "Detalles";
export type Product = {
  id: string;
  name: string;
  category: Category;
  description: string;
  price: number;
  image: string;
  badge?: string;
  featured?: boolean;
  active: boolean;
  stock: number | null;
};
export type CartItem = { productId: string; name: string; price: number; image: string; quantity: number };
export type OrderStatus = "Nuevo" | "Confirmado" | "Preparando" | "Listo" | "Entregado" | "Cancelado";
export type DeliveryMethod = "Retiro" | "Entrega";
export type Order = {
  id: string;
  customer: { name: string; phone: string; address: string; method: DeliveryMethod; requestedDate?: string };
  items: { productId: string; name: string; price: number; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes: string;
  status: OrderStatus;
  createdAt: string;
};
export const categories = ["Todos", "Pasteles", "Cupcakes", "Postres", "Panadería", "Detalles"] as const;
export const currency = (amount: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO", maximumFractionDigits: 0 }).format(amount);
