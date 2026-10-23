import type { Metadata } from "next";
import AccessSetup from "@/components/access-setup";
export const metadata: Metadata = { title: "Preparar acceso del propietario" };
export default function SetupPage(){ return <AccessSetup/>; }
