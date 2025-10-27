"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar?: string;
  score: number;
  streak: number;
  level: string;
}

const mockLeaderboardData: LeaderboardEntry[] = [
  { rank: 1, name: "Alex Chen", score: 2847, streak: 12, level: "Expert" },
  { rank: 2, name: "Sarah Johnson", score: 2653, streak: 8, level: "Advanced" },
  { rank: 3, name: "Mike Rodriguez", score: 2521, streak: 15, level: "Expert" },
  { rank: 4, name: "Emma Wilson", score: 2389, streak: 6, level: "Advanced" },
  { rank: 5, name: "David Kim", score: 2256, streak: 9, level: "Intermediate" },
  { rank: 6, name: "Lisa Zhang", score: 2134, streak: 4, level: "Intermediate" },
  { rank: 7, name: "Tom Brown", score: 2012, streak: 7, level: "Intermediate" },
  { rank: 8, name: "Anna Lee", score: 1890, streak: 3, level: "Beginner" },
];

export default function Leaderboard() {
  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500";
    if (rank === 2) return "bg-gray-400";
    if (rank === 3) return "bg-amber-600";
    return "bg-gray-200";
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Expert": return "bg-purple-500";
      case "Advanced": return "bg-blue-500";
      case "Intermediate": return "bg-green-500";
      case "Beginner": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockLeaderboardData.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${getRankColor(entry.rank)}`}>
                  {entry.rank}
                </div>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={entry.avatar} />
                  <AvatarFallback>
                    {entry.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{entry.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-white ${getLevelColor(entry.level)}`}>
                      {entry.level}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      🔥 {entry.streak} day streak
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{entry.score}</p>
                <p className="text-sm text-muted-foreground">points</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
