"use client"
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ------------------------------------------------------------
// Utility data (mock)
// ------------------------------------------------------------
const leaderboard = [
  { name: "Ada L.", xp: 12450, streak: 21 },
  { name: "Carl F.", xp: 11880, streak: 12 },
  { name: "M. Seo", xp: 10320, streak: 8 },
  { name: "Noether E.", xp: 9920, streak: 5 },
];

// ------------------------------------------------------------
// Small components
// ------------------------------------------------------------
function LeaderboardCard() {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Top Solvers (This Week)</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((u, i) => (
            <div key={u.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="w-6 justify-center">{i+1}</Badge>
                <div className="font-medium">{u.name}</div>
              </div>
              <div className="text-sm text-muted-foreground">XP {u.xp} • 🔥 {u.streak}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Community() {
  return (
    <div className="p-4">
      <Tabs defaultValue="discussions">
        <TabsList>
          <TabsTrigger value="discussions">Problem Discussions</TabsTrigger>
          <TabsTrigger value="theory">Theory Q&A</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="peer">Peer Review</TabsTrigger>
        </TabsList>
        <TabsContent value="discussions" className="mt-4">
          <div className="grid gap-3">
            {["CRT hint for #1201","Geometric inversion trick","Pigeonhole principle proof idea"].map((t, i) => (
              <div key={i} className="rounded-xl border p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t}</div>
                  <div className="text-xs text-muted-foreground">Most Helpful • 24 replies</div>
                </div>
                <Button size="sm" variant="outline">Open</Button>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="theory" className="mt-4">
          <div className="rounded-xl border p-4 space-y-3">
            <div className="text-sm font-medium">Ask a question</div>
            <Input placeholder="e.g., When to use Lifting The Exponent Lemma?" />
            <Button className="w-fit">Post</Button>
          </div>
        </TabsContent>
        <TabsContent value="leaderboard" className="mt-4">
          <LeaderboardCard />
        </TabsContent>
        <TabsContent value="peer" className="mt-4">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Submit your solution for community feedback and earn points by reviewing others.</div>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm">Submit Solution</Button>
              <Button size="sm" variant="outline">Review Queue</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
