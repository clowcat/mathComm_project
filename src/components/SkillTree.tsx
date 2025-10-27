"use client"
import React from "react";
import { useLearningSync } from "@/lib/learningSync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network } from "lucide-react";

// Simple skill-tree graph: nodes + edges (centered positions)
const skillNodes = [
  { id: "nt-basics", label: "Number Theory Basics", x: 200, y: 80, unlocked: true, level: "Basic" },
  { id: "div", label: "Divisibility", x: 380, y: 80, unlocked: true, level: "Basic" },
  { id: "mod", label: "Modular Arithmetic", x: 560, y: 120, unlocked: true, level: "Intermediate" },
  { id: "crt", label: "CRT", x: 740, y: 160, unlocked: false, level: "Advanced" },
  { id: "order", label: "Order & Cycles", x: 560, y: 220, unlocked: false, level: "Advanced" },
  { id: "qr", label: "Quadratic Residues", x: 740, y: 260, unlocked: false, level: "Olympiad" },
];
const skillEdges = [
  ["nt-basics", "div"],
  ["div", "mod"],
  ["mod", "crt"],
  ["mod", "order"],
  ["order", "qr"],
];

function SkillTreeCanvas({ onOpenNode }: { onOpenNode?: (id: string) => void }) {
  const { selectedNode, setSelectedNode } = useLearningSync();

  // quick lookup for positions
  const positions = React.useMemo(() => Object.fromEntries(skillNodes.map(n => [n.id, n])), []);
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-base">Number Theory – Tech Tree</CardTitle>
        <div className="flex items-center gap-2">
          <Badge>Branching</Badge>
          <Badge variant="secondary">Academic UI</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[420px] w-full">
          {/* Edges */}
          <svg className="absolute inset-0 h-full w-full">
            {skillEdges.map(([a, b], idx) => {
              const A = positions[a];
              const B = positions[b];
              return (
                <line key={idx} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#d1d5db" strokeWidth={2} markerEnd="url(#arrow)" />
              );
            })}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#d1d5db" />
              </marker>
            </defs>
          </svg>
          {/* Nodes */}
          {skillNodes.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                // toggle selection
                setSelectedNode(selectedNode === n.id ? null : n.id);
                if (onOpenNode) onOpenNode(n.id);
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-3 py-2 shadow-sm backdrop-blur ${
                n.unlocked ? "bg-white" : "bg-muted/70"}
              ${selectedNode === n.id ? "ring-2 ring-blue-500" : ""}`}
              style={{ left: n.x, top: n.y }}
            >
              <div className="flex items-center gap-2 text-sm">
                {n.unlocked ? <span className="text-emerald-600">✓</span> : <span className="text-gray-400">🔒</span>}
                <span className="font-medium">{n.label}</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">{n.level}</div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SkillTree() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold flex items-center gap-2">
          <Network className="h-5 w-5"/>
          Skill Tree
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Algebra</Badge>
          <Badge>Number Theory</Badge>
          <Badge variant="outline">Geometry</Badge>
          <Badge variant="outline">Combinatorics</Badge>
        </div>
      </div>
      <SkillTreeCanvas onOpenNode={(id) => {
        console.log("Opening skill node:", id);
        // You can add more functionality here, like showing a modal or navigating to a specific skill page
      }} />
    </div>
  );
}
