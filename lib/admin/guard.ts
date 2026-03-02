import { redirect } from "next/navigation";
import { getAdminFromRequest } from "./session";

export async function requireAdminPage(req: Request) {
  const admin = await getAdminFromRequest(req);
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireSuperAdminPage(req: Request) {
  const admin = await getAdminFromRequest(req);
  if (!admin) redirect("/admin/login");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin"); // or a friendly "not authorized" page
  return admin;
}
