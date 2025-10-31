// Main MathQuest UI Application
// This is the root page component that handles navigation and renders different views

"use client"
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, Flame, Search, MessageSquare, Trophy, LineChart, LayoutDashboard, Network, Users, Brain } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import Problems from "@/components/Problems";
import Stats from "@/components/Stats";
import Community, { CommunityTab } from "@/components/Community";
import SkillTree from "@/components/SkillTree";

// ------------------------------------------------------------
// Navigation Components
// ------------------------------------------------------------

/**
 * SideNav Component - Left sidebar navigation
 * @param active - Currently active page/section
 * @param onChange - Callback function to change active page
 */
function SideNav({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  // Navigation menu items with icons and labels
  const items = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: "skill-tree", label: "Skill Tree", icon: <Network className="h-4 w-4" /> },
    { key: "problems", label: "Problems", icon: <Brain className="h-4 w-4" /> },
    { key: "stats", label: "Stats", icon: <LineChart className="h-4 w-4" /> },
    { key: "community", label: "Community", icon: <Users className="h-4 w-4" /> },
  ];
  
  return (
    <div className="h-full w-64 border-r bg-white/60 backdrop-blur p-3 hidden xl:flex xl:flex-col">
      {/* App Logo and Title */}
      <div className="flex items-center gap-2 px-2 py-3">
        <Crown className="h-5 w-5" />
        <div className="font-bold">MathQuest</div>
      </div>
      
      {/* Navigation Menu Items */}
      <div className="mt-2 space-y-1">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-muted ${
              active === it.key ? "bg-muted font-semibold" : ""
            }`}
          >
            {it.icon}
            <span>{it.label}</span>
          </button>
        ))}
      </div>
      
      {/* User Profile Section */}
      <div className="mt-auto p-3">
        <div className="rounded-xl border bg-white/60 backdrop-blur p-3">
          <div className="pb-2">
            <div className="text-sm font-semibold">Your Profile</div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8"><AvatarFallback>MS</AvatarFallback></Avatar>
            <div>
              <div className="text-sm font-medium">M. Seo</div>
              <div className="text-xs text-muted-foreground">Rank #3 • Level 7</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TopBar Component - Top navigation bar with search and quick actions
 */
function TopBar({ onCommunityNavigate }: { onCommunityNavigate: (tab: CommunityTab) => void }) {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 border-b bg-white/70 backdrop-blur px-4 py-3">
      {/* Mobile Logo (hidden on desktop) */}
      <div className="xl:hidden flex items-center gap-2 font-bold"><Crown className="h-5 w-5"/>MathQuest</div>
      
      {/* Search Bar */}
      <div className="relative max-w-lg flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search problems, skills, users…" />
      </div>
      
      {/* Quick Action Buttons */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1"
        onClick={() => onCommunityNavigate("leaderboard")}
      >
        <Trophy className="h-4 w-4" />
        Leaderboard
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1"
        onClick={() => onCommunityNavigate("discussions")}
      >
        <MessageSquare className="h-4 w-4" />
        Discussions
      </Button>
      <Button size="sm" className="gap-1"><Flame className="h-4 w-4"/>Streak 8</Button>
    </div>
  );
}

/**
 * Main MathQuest UI Component
 * Handles page routing and renders the appropriate component based on active page
 */
export default function MathQuestUIMock() {
  // State to track the currently active page/section
  const [page, setPage] = useState("dashboard");
  const [communityTab, setCommunityTab] = useState<CommunityTab>("discussions");

  const handleCommunityNavigate = (tab: CommunityTab) => {
    setPage("community");
    setCommunityTab(tab);
  };
  
  return (
    <div className="h-screen w-full bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Top Navigation Bar */}
      <TopBar onCommunityNavigate={handleCommunityNavigate} />
      
      {/* Main Layout Container */}
      <div className="flex h-[calc(100vh-56px)]">
        {/* Left Sidebar Navigation */}
        <SideNav active={page} onChange={setPage} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {/* Conditional Rendering based on active page */}
          {page === "dashboard" && <Dashboard />}
          {page === "skill-tree" && <SkillTree />}
          {page === "problems" && <Problems />}
          {page === "stats" && <Stats />}
          {page === "community" && <Community activeTab={communityTab} onTabChange={setCommunityTab} />}
        </main>
      </div>
    </div>
  );
}
