import PublicHeader from "../../PublicHeader";
import LeaderboardClient from "./LeaderboardClient";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;
  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <PublicHeader backHref="/" backLabel="All Organizations" />
      <LeaderboardClient poolId={poolId} />
    </div>
  );
}
