import AdminHeader from "../../AdminHeader";
import AdminPoolClient from "./AdminPoolClient";

export default async function AdminPoolPage({
  params,
}: {
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 960 }}>
        <AdminHeader />
        <AdminPoolClient poolId={poolId} />
      </div>
    </div>
  );
}
