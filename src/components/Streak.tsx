"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  streakGoal: number;
  lastActivity: string;
  weeklyProgress: number[];
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

const mockStreakData: StreakData = {
  currentStreak: 8,
  longestStreak: 15,
  totalDays: 45,
  streakGoal: 30,
  lastActivity: "2 hours ago",
  weeklyProgress: [1, 1, 1, 1, 0, 1, 1], // 1 = completed, 0 = missed
  achievements: [
    {
      id: "1",
      name: "First Steps",
      description: "Complete your first problem",
      icon: "🎯",
      unlocked: true
    },
    {
      id: "2", 
      name: "Week Warrior",
      description: "Maintain a 7-day streak",
      icon: "🔥",
      unlocked: true
    },
    {
      id: "3",
      name: "Month Master",
      description: "Maintain a 30-day streak",
      icon: "🏆",
      unlocked: false,
      progress: 8,
      maxProgress: 30
    },
    {
      id: "4",
      name: "Problem Solver",
      description: "Solve 100 problems",
      icon: "🧮",
      unlocked: false,
      progress: 67,
      maxProgress: 100
    }
  ]
};

export default function Streak() {
  const streakProgress = (mockStreakData.currentStreak / mockStreakData.streakGoal) * 100;
  const weeklyCompletion = (mockStreakData.weeklyProgress.filter(day => day === 1).length / 7) * 100;

  const getStreakMessage = () => {
    if (mockStreakData.currentStreak >= 7) return "🔥 On fire! Keep it up!";
    if (mockStreakData.currentStreak >= 3) return "💪 Great momentum!";
    return "🚀 Start your streak today!";
  };

  const getDayStatus = (day: number, index: number) => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return (
      <div key={index} className="flex flex-col items-center gap-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          day === 1 
            ? 'bg-green-500 text-white' 
            : 'bg-gray-200 text-gray-500'
        }`}>
          {day === 1 ? '✓' : '○'}
        </div>
        <span className="text-xs text-muted-foreground">{dayNames[index]}</span>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔥 Streak Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Streak Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 text-white">
            <div className="text-3xl font-bold">{mockStreakData.currentStreak}</div>
            <div className="text-sm opacity-90">Current Streak</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 text-white">
            <div className="text-3xl font-bold">{mockStreakData.longestStreak}</div>
            <div className="text-sm opacity-90">Best Streak</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-400 to-teal-500 text-white">
            <div className="text-3xl font-bold">{mockStreakData.totalDays}</div>
            <div className="text-sm opacity-90">Total Days</div>
          </div>
        </div>

        {/* Streak Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Streak Progress</span>
            <span className="text-sm text-muted-foreground">
              {mockStreakData.currentStreak}/{mockStreakData.streakGoal} days
            </span>
          </div>
          <Progress value={streakProgress} className="h-3" />
          <p className="text-sm text-center text-muted-foreground">
            {getStreakMessage()}
          </p>
        </div>

        {/* Weekly Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">This Week</span>
            <Badge variant="outline">
              {Math.round(weeklyCompletion)}% Complete
            </Badge>
          </div>
          <div className="flex justify-between">
            {mockStreakData.weeklyProgress.map((day, index) => getDayStatus(day, index))}
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Achievements</h3>
          <div className="grid grid-cols-2 gap-3">
            {mockStreakData.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg border ${
                  achievement.unlocked 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{achievement.icon}</span>
                  <span className={`text-sm font-medium ${
                    achievement.unlocked ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {achievement.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {achievement.description}
                </p>
                {achievement.progress && achievement.maxProgress && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <Progress 
                      value={(achievement.progress / achievement.maxProgress) * 100} 
                      className="h-2" 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full" size="lg">
          🎯 Practice Now - Keep Your Streak!
        </Button>
      </CardContent>
    </Card>
  );
}
