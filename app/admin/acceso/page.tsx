import { redirect } from "next/navigation";

// El propietario accede directamente a /admin con Google.
export default function LegacyAccessPage() {
  redirect("/admin");
}
