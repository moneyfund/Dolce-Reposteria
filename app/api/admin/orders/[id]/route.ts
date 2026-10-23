import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/firebase-admin";
import { statuses } from "@/lib/validation";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff(request);
  if (!session) return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
  const { id } = await params;
  if (!/^[a-zA-Z0-9-]{5,70}$/.test(id)) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 }); }
  const result = z.object({ status: z.enum(statuses) }).safeParse(payload);
  if (!result.success) return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  const ref = session.backend.db.collection("orders").doc(id);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  await ref.update({ status: result.data.status, updatedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
