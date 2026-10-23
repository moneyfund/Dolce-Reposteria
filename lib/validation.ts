import { z } from "zod";
export const productSchema = z.object({
  id: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(120),
  category: z.enum(["Pasteles", "Cupcakes", "Postres", "Panadería", "Detalles"]),
  description: z.string().trim().max(400),
  price: z.number().finite().min(1).max(100000),
  image: z.string().url().max(2000).refine(value => value.startsWith("https://"), "HTTPS requerido"),
  badge: z.string().max(30).optional(),
  featured: z.boolean().optional(),
  active: z.boolean(),
  stock: z.number().int().min(0).max(100000).nullable(),
});
export const orderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(8).max(22).regex(/^[+0-9()\-\s]+$/),
    address: z.string().trim().max(240),
    method: z.enum(["Retiro", "Entrega"]),
    requestedDate: z.string().max(30).optional(),
  }),
  items: z.array(z.object({ productId: z.string().min(1).max(80), quantity: z.number().int().min(1).max(30) })).min(1).max(30),
  notes: z.string().trim().max(500),
}).superRefine((data,ctx) => {
  if(data.customer.method === "Entrega" && data.customer.address.length < 8) ctx.addIssue({ code: "custom", message: "Indica una dirección de entrega", path: ["customer","address"] });
});
export const statuses = ["Nuevo","Confirmado","Preparando","Listo","Entregado","Cancelado"] as const;

export const promotionSchema = z.object({id:z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),title:z.string().trim().min(3).max(100),subtitle:z.string().trim().max(240),eyebrow:z.string().trim().min(2).max(40),image:z.string().url().max(2000).refine(v=>v.startsWith("https://")),ctaLabel:z.string().trim().min(2).max(40),active:z.boolean()});
