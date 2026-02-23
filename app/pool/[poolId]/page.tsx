import PublicPoolClient from "./PublicPoolClient";

export default async function PoolPage({
  params,
}: {
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;
  return <PublicPoolClient poolId={poolId} />;
}
