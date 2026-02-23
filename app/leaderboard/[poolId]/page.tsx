import LeaderboardClient from "./LeaderboardClient";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;
  return <LeaderboardClient poolId={poolId} />;
}
