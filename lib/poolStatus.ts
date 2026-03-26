export type PublicPoolStatus = "Open" | "Closed" | "Locked" | "Not Started" | "Final";

type PoolStatusInput = {
  startsAt: string | Date;
  entriesCloseAt: string | Date;
  endedAt?: string | Date | null;
  locked?: boolean;
  isArchived?: boolean;
};

export function getPoolStatus(pool: PoolStatusInput): PublicPoolStatus {
  const now = new Date();
  const startsAt = new Date(pool.startsAt);
  const entriesCloseAt = new Date(pool.entriesCloseAt);
  const endedAt = pool.endedAt ? new Date(pool.endedAt) : null;

  if (pool.isArchived) return "Final";
  if (endedAt && now >= endedAt) return "Final";
  if (pool.locked) return "Locked";
  if (now < startsAt) return "Not Started";
  if (now >= entriesCloseAt) return "Closed";
  return "Open";
}