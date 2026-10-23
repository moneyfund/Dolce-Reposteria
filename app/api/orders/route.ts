import { NextResponse } from "next/server";
import { getBackend } from "@/lib/firebase-admin";
import { orderSchema } from "@/lib/validation";
import type { Product } from "@/lib/types";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({ available: getBackend() !== null }, { headers: { "Cache-Control":"no-store" } });
}
export async function POST(request: Request) {
  const backend = getBackend();
  if (!backend) return NextResponse.json({ error: "Los pedidos en línea aún no están disponibles. Inténtalo más adelante." }, { status: 503 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 }); }
  const result = orderSchema.safeParse(payload);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message || "Revisa los datos" }, { status: 400 });
  const order = result.data;
  const consolidated = new Map<string, number>();
  for (const item of order.items) consolidated.set(item.productId, (consolidated.get(item.productId) || 0) + item.quantity);
  if ([...consolidated.values()].some(qty => qty > 30)) return NextResponse.json({ error: "Cantidad máxima excedida" }, { status: 400 });
  try {
    const created = await backend.db.runTransaction(async tx => {
      const entries = [...consolidated.entries()].map(([id,qty]) => ({ ref: backend.db.collection("products").doc(id),qty }));
      const docs = await Promise.all(entries.map(({ref}) => tx.get(ref)));
      const products = docs.map((doc,index) => {
        if (!doc.exists) throw new Error("Un producto ya no está disponible");
        const p = doc.data() as Product;
        if (!p.active || (p.stock !== null && p.stock < entries[index].qty)) throw new Error("No hay existencias suficientes para completar el pedido");
        return { doc, product: p, qty: entries[index].qty };
      });
      const items = products.map(({doc,product,qty}) => ({ productId: doc.id, name: product.name, price: product.price, quantity: qty }));
      const subtotal = items.reduce((sum,item) => sum + item.price * item.quantity, 0);
      if (!Number.isFinite(subtotal) || subtotal > 250000) throw new Error("Monto de pedido inválido");
      // Delivery is quoted by DOLCE, never silently charge an unconfigured rate.
      const deliveryFee = 0;
      const ref = backend.db.collection("orders").doc();
      const record = { customer: order.customer, items, subtotal, deliveryFee, total: subtotal + deliveryFee, notes: order.notes, status: "Nuevo", createdAt: new Date().toISOString() };
      products.forEach(({doc,product,qty}) => { if (product.stock !== null) tx.update(doc.ref, { stock: product.stock - qty }); });
      tx.set(ref,record);
      return { id: ref.id, total: record.total };
    });
    return NextResponse.json({ success: true, order: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo registrar el pedido" }, { status: 409 });
  }
}
