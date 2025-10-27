"use client"
import React from "react";

type LearningContextType = {
  selectedNode: string | null;
  setSelectedNode: (id: string | null) => void;
};

const LearningContext = React.createContext<LearningContextType | undefined>(undefined);

export function LearningSyncProvider({ children }: { children: React.ReactNode }) {
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);

  const value = React.useMemo(
    () => ({ selectedNode, setSelectedNode }),
    [selectedNode]
  );

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearningSync() {
  const ctx = React.useContext(LearningContext);
  if (!ctx) {
    // Provide a safe fallback so components can be used standalone
    return {
      selectedNode: null,
      setSelectedNode: (_: string | null) => {},
    };
  }
  return ctx;
}
