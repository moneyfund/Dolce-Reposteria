import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/firebase-admin";
import { promotionSchema } from "@/lib/validation";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const session = await requireStaff(request);
  if (!session) return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
  const snapshot = await session.backend.db.collection("promotions").limit(50).get();
  return NextResponse.json({ promotions: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) });
}
export async function POST(request: Request) {
  const session = await requireStaff(request);
  if (!session) return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 }); }
  const parsed = promotionSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos" }, { status: 400 });
  const { id, ...data } = parsed.data;
  await session.backend.db.collection("promotions").doc(id).set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
  return NextResponse.json({ ok: true, id });
}
