export type LeaderboardPlayer = {
  golferId: string;
  golferName: string;
  position: number;   // 1 = leader
  earnings: number;   // placeholder scoring input
};

export async function fetchMockLeaderboard(): Promise<LeaderboardPlayer[]> {
  // Pretend this came from PGA Tour. We'll swap later.
  return [
    { golferId: "g1", golferName: "Golfer One", position: 1, earnings: 2500000 },
    { golferId: "g2", golferName: "Golfer Two", position: 2, earnings: 1500000 },
    { golferId: "g3", golferName: "Golfer Three", position: 3, earnings: 900000 },
    { golferId: "g4", golferName: "Golfer Four", position: 4, earnings: 650000 },
    { golferId: "g5", golferName: "Golfer Five", position: 5, earnings: 500000 },
    { golferId: "g6", golferName: "Golfer Six", position: 6, earnings: 350000 },
    { golferId: "g7", golferName: "Golfer Seven", position: 7, earnings: 250000 },
    { golferId: "g8", golferName: "Golfer Eight", position: 8, earnings: 175000 },
    { golferId: "g9", golferName: "Golfer Nine", position: 9, earnings: 125000 },
    { golferId: "g10", golferName: "Golfer Ten", position: 10, earnings: 90000 },
  ];
}
