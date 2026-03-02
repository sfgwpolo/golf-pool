import { prisma } from "./prisma";
import { getAdminFromRequest } from "./admin/session";

export type AdminContext = {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "ORG_ADMIN";
};

export async function requireAnyAdmin(req: Request): Promise<AdminContext> {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    throw new Error("Unauthorized");
  }
  return { id: admin.id, email: admin.email, role: admin.role as any };
}

/**
 * Require that the requester is either SUPER_ADMIN, or an ORG_ADMIN
 * for the organization that owns the given poolId.
 */
export async function requireOrgAdminForPool(req: Request, poolId: string) {
  const admin = await requireAnyAdmin(req);
  if (admin.role === "SUPER_ADMIN") return admin;

  // find pool -> orgId
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    select: { orgId: true },
  });
  if (!pool) throw new Error("Pool not found");

  // membership check
  const membership = await prisma.orgAdmin.findUnique({
    where: { orgId_adminId: { orgId: pool.orgId, adminId: admin.id } },
    select: { id: true },
  });

  if (!membership) {
    throw new Error("Forbidden");
  }

  return admin;
}

/**
 * If you have org-level routes that take orgId directly.
 */
export async function requireOrgAdmin(req: Request, orgId: string) {
  const admin = await requireAnyAdmin(req);
  if (admin.role === "SUPER_ADMIN") return admin;

  const membership = await prisma.orgAdmin.findUnique({
    where: { orgId_adminId: { orgId, adminId: admin.id } },
    select: { id: true },
  });

  if (!membership) throw new Error("Forbidden");
  return admin;
}
