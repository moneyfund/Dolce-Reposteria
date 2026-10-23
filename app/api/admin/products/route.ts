import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/firebase-admin";
import { productSchema } from "@/lib/validation";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const session = await requireStaff(request);
  if (!session) return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
  const docs = await session.backend.db.collection("products").limit(150).get();
  return NextResponse.json({ products: docs.docs.map(doc => ({ ...doc.data(), id: doc.id })) });
}
export async function POST(request: Request) {
  const session = await requireStaff(request);
  if (!session) return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 }); }
  const result = productSchema.safeParse(payload);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message || "Datos inválidos" }, { status: 400 });
  const product = result.data;
  const { id, ...data } = product;
  await session.backend.db.collection("products").doc(id).set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
  return NextResponse.json({ ok: true, id });
}
