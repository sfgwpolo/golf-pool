import PublicHeader from "../../PublicHeader";
import PublicPoolClient from "./PublicPoolClient";

export default async function PoolPage({
  params,
  searchParams,
}: {
  params: Promise<{ poolId: string }>;
  searchParams: Promise<{ org?: string }>;
}) {
  const { poolId } = await params;
  const { org } = await searchParams;

  const backHref = org ? `/org/${org}` : "/";
  const backLabel = org ? "Back to Organization" : "All Organizations";

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <PublicHeader backHref={backHref} backLabel={backLabel} />
      <PublicPoolClient poolId={poolId} />
    </div>
  );
}
