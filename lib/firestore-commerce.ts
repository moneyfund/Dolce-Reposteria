"use client";
import { collection, doc, getDoc, getDocs, getFirestore, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { firebaseApp, firebaseAuth } from "@/lib/firebase-client";
import type { CartItem, Order, Product, Promotion } from "@/lib/types";

export const db = () => getFirestore(firebaseApp());
export const readableError = (error: unknown) => {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (code.includes("permission-denied")) return "No se pudo guardar: verifica que las reglas nuevas estén publicadas y que tengas permisos.";
  if (code.includes("operation-not-allowed")) return "Activa el proveedor Anónimo en Firebase Authentication para recibir pedidos sin pedirle una cuenta al cliente.";
  if (code.includes("unauthorized-domain")) return "El dominio de DOLCE debe estar autorizado en Firebase Authentication.";
  if (code.includes("network-request-failed") || code.includes("unavailable")) return "Problema de conexión. Verifica Internet e inténtalo nuevamente.";
  return error instanceof Error ? error.message : "No fue posible completar la operación.";
};
export const orderFromFirestore = (id: string, data: Record<string, unknown>): Order => {
  const created = data.createdAt as { toDate?: () => Date } | undefined;
  return { ...(data as Omit<Order, "id" | "createdAt">), id, createdAt: created?.toDate?.()?.toISOString() ?? (typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString()) };
};

export async function checkCatalogReady() {
  const snapshot = await getDocs(query(collection(db(), "products"), where("active", "==", true), limit(1)));
  return !snapshot.empty;
}

export async function createCustomerOrder(payload: {
  customer: { name: string; phone: string; address: string; method: "Retiro" | "Entrega"; requestedDate: string };
  notes: string;
  items: CartItem[];
}) {
  const auth = firebaseAuth();
  const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
  const unique = new Map<string, number>();
  for (const item of payload.items) unique.set(item.productId, (unique.get(item.productId) ?? 0) + item.quantity);
  if (unique.size < 1 || unique.size > 5) throw new Error("Puedes incluir entre 1 y 5 productos distintos por pedido.");
  if ([...unique.values()].some(q => !Number.isInteger(q) || q < 1 || q > 10)) throw new Error("Selecciona entre 1 y 10 unidades por producto.");
  const items = await Promise.all([...unique.entries()].map(async ([id,quantity]) => {
    const snapshot = await getDoc(doc(db(),"products",id));
    if (!snapshot.exists()) throw new Error("Uno de los productos ya no está disponible.");
    const p = snapshot.data() as Product;
    if (!p.active || (p.stock !== null && p.stock < quantity)) throw new Error("No hay unidades suficientes de " + p.name);
    if (!Number.isSafeInteger(p.price) || p.price < 1) throw new Error("Precio inválido para " + p.name);
    return { productId:id, name:p.name, price:p.price, quantity };
  }));
  const subtotal=items.reduce((sum,item)=>sum+item.price*item.quantity,0);
  if (!Number.isSafeInteger(subtotal) || subtotal > 250000) throw new Error("El monto del pedido excede el máximo admitido.");
  const clean = {
    name:payload.customer.name.trim(), phone:payload.customer.phone.trim(),
    address:payload.customer.address.trim(), method:payload.customer.method,
    requestedDate:payload.customer.requestedDate,
  };
  if (clean.name.length < 2 || clean.name.length > 100 || !/^[+0-9()\-\s]{8,22}$/.test(clean.phone) ||
      (clean.method === "Entrega" && clean.address.length < 8) ||
      (clean.requestedDate && clean.requestedDate.length !== 10) || payload.notes.trim().length > 500) {
    throw new Error("Revisa los datos de contacto, dirección y fecha.");
  }
  const ref = doc(collection(db(),"orders"));
  await setDoc(ref,{
    ownerUid:user.uid,customer:clean,items,subtotal,deliveryFee:0,total:subtotal,
    notes:payload.notes.trim(),status:"Nuevo",createdAt:serverTimestamp(),
  });
  // Stock is checked, NOT reserved; DOLCE confirms availability before preparation.
  return { id:ref.id, total:subtotal };
}
