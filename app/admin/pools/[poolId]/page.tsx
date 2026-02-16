import AdminPoolClient from "./AdminPoolClient";

export default async function AdminPoolPage({
  params,
}: {
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;
  return <AdminPoolClient poolId={poolId} />;
}
