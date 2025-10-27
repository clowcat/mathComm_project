"use client"
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ------------------------------------------------------------
// Utility data (mock)
// ------------------------------------------------------------
const masteryByTopic = [
  { topic: "Algebra", percent: 78 },
  { topic: "Number Theory", percent: 56 },
  { topic: "Geometry", percent: 42 },
  { topic: "Combinatorics", percent: 61 },
];

// ------------------------------------------------------------
// Small components
// ------------------------------------------------------------
function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs"><span>{label}</span><span className="font-mono">{value}%</span></div>
      <Progress value={value} />
    </div>
  );
}

function MasteryChart() {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Mastery by Topic</CardTitle></CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={masteryByTopic}>
            <XAxis dataKey="topic" tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="percent" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function Stats() {
  return (
    <div className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Activity (Last 30 Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 * 5 }).map((_, i) => (
                <div key={i} className="h-6 rounded bg-muted" />
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Darker squares indicate more activity</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Achievements</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              "100 Problems Solved",
              "First Olympiad Win",
              "Number Theory Specialist",
              "Week-long Streak",
            ].map((a) => (
              <Badge key={a} variant="secondary" className="rounded-full">{a}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <MasteryChart />
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Difficulty Ladder</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <StatBar label="Basic" value={92} />
            <StatBar label="Intermediate" value={74} />
            <StatBar label="Advanced" value={48} />
            <StatBar label="Olympiad" value={19} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
