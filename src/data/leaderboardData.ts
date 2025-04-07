
// Leaderboard data organized by time period
export const weeklyLeaders = [
  { id: 1, name: "Alex Johnson", score: 956, rank: 1, subject: "Computer Science" },
  { id: 2, name: "Sarah Williams", score: 942, rank: 2, subject: "Mathematics" },
  { id: 3, name: "Michael Chen", score: 925, rank: 3, subject: "Physics" },
  { id: 4, name: "Jessica Taylor", score: 918, rank: 4, subject: "Chemistry" },
  { id: 5, name: "David Brown", score: 903, rank: 5, subject: "Biology" },
  { id: 6, name: "Emily Wilson", score: 897, rank: 6, subject: "Mathematics" },
  { id: 7, name: "James Lee", score: 885, rank: 7, subject: "Computer Science" },
  { id: 8, name: "Sophia Martinez", score: 872, rank: 8, subject: "Physics" },
  { id: 9, name: "Daniel Jackson", score: 865, rank: 9, subject: "Chemistry" },
  { id: 10, name: "Olivia Thomas", score: 852, rank: 10, subject: "Biology" },
];

export const monthlyLeaders = [
  { id: 1, name: "Emma Davis", score: 3856, rank: 1, subject: "Mathematics" },
  { id: 2, name: "Noah Wilson", score: 3742, rank: 2, subject: "Computer Science" },
  { id: 3, name: "Ava Johnson", score: 3625, rank: 3, subject: "Physics" },
  { id: 4, name: "Liam Smith", score: 3518, rank: 4, subject: "Biology" },
  { id: 5, name: "Isabella Brown", score: 3503, rank: 5, subject: "Chemistry" },
  { id: 6, name: "Mason Taylor", score: 3497, rank: 6, subject: "Mathematics" },
  { id: 7, name: "Sophia Rodriguez", score: 3485, rank: 7, subject: "Computer Science" },
  { id: 8, name: "Lucas Martinez", score: 3372, rank: 8, subject: "Physics" },
  { id: 9, name: "Mia Anderson", score: 3365, rank: 9, subject: "Chemistry" },
  { id: 10, name: "Ethan Thomas", score: 3352, rank: 10, subject: "Biology" },
];

export const allTimeLeaders = [
  { id: 1, name: "Olivia Walker", score: 12856, rank: 1, subject: "Mathematics" },
  { id: 2, name: "William Johnson", score: 12742, rank: 2, subject: "Computer Science" },
  { id: 3, name: "Sophia Harris", score: 12625, rank: 3, subject: "Physics" },
  { id: 4, name: "James Davis", score: 12518, rank: 4, subject: "Chemistry" },
  { id: 5, name: "Emma Wilson", score: 12503, rank: 5, subject: "Biology" },
  { id: 6, name: "Benjamin Taylor", score: 12497, rank: 6, subject: "Mathematics" },
  { id: 7, name: "Ava Clark", score: 12485, rank: 7, subject: "Computer Science" },
  { id: 8, name: "Alexander Rodriguez", score: 12372, rank: 8, subject: "Physics" },
  { id: 9, name: "Charlotte Lewis", score: 12365, rank: 9, subject: "Chemistry" },
  { id: 10, name: "Daniel Walker", score: 12352, rank: 10, subject: "Biology" },
];

export type LeaderboardEntry = {
  id: number;
  name: string;
  score: number;
  rank: number;
  subject: string;
};
