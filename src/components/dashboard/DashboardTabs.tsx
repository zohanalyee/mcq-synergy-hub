
import { useState } from "react";

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DashboardTabs = ({ activeTab, setActiveTab }: DashboardTabsProps) => {
  return (
    <div className="mb-8">
      <div className="flex space-x-4 border-b border-border/40 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2 px-1 transition-all ${
            activeTab === "overview" 
              ? "border-b-2 border-primary font-medium" 
              : "text-muted-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("performance")}
          className={`pb-2 px-1 transition-all ${
            activeTab === "performance" 
              ? "border-b-2 border-primary font-medium" 
              : "text-muted-foreground"
          }`}
        >
          Performance
        </button>
        <button
          onClick={() => setActiveTab("subjects")}
          className={`pb-2 px-1 transition-all ${
            activeTab === "subjects" 
              ? "border-b-2 border-primary font-medium" 
              : "text-muted-foreground"
          }`}
        >
          Subjects
        </button>
      </div>
    </div>
  );
};

export default DashboardTabs;
