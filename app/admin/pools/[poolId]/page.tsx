import AdminHeader from "../../AdminHeader";
import AdminPoolClient from "./AdminPoolClient";

export default async function AdminPoolPage({
  params,
}: {
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;

  return (
    <div className="p-5 font-sans max-w-4xl mx-auto bg-white dark:bg-gray-900 text-black dark:text-white">
      <div style={{ maxWidth: 960 }}>
        <AdminHeader />
        <AdminPoolClient poolId={poolId} />
      </div>
    </div>
  );
}
