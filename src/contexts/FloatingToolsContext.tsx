import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OpenTool {
  id: string;
  isMinimized: boolean;
}

interface FloatingToolsContextType {
  openTools: OpenTool[];
  openTool: (id: string) => void;
  closeTool: (id: string) => void;
  toggleMinimize: (id: string) => void;
  bringToFront: (id: string) => void;
}

const FloatingToolsContext = createContext<FloatingToolsContextType | undefined>(undefined);

export const FloatingToolsProvider = ({ children }: { children: ReactNode }) => {
  const [openTools, setOpenTools] = useState<OpenTool[]>([]);

  const openTool = (id: string) => {
    setOpenTools(prev => {
      const existing = prev.find(t => t.id === id);
      if (existing) {
        // If already open, bring to front and unminimize
        return [...prev.filter(t => t.id !== id), { ...existing, isMinimized: false }];
      }
      return [...prev, { id, isMinimized: false }];
    });
  };

  const closeTool = (id: string) => {
    setOpenTools(prev => prev.filter(t => t.id !== id));
  };

  const toggleMinimize = (id: string) => {
    setOpenTools(prev =>
      prev.map(t => (t.id === id ? { ...t, isMinimized: !t.isMinimized } : t))
    );
  };

  const bringToFront = (id: string) => {
    setOpenTools(prev => {
      const tool = prev.find(t => t.id === id);
      if (!tool) return prev;
      return [...prev.filter(t => t.id !== id), tool];
    });
  };

  return (
    <FloatingToolsContext.Provider value={{ openTools, openTool, closeTool, toggleMinimize, bringToFront }}>
      {children}
    </FloatingToolsContext.Provider>
  );
};

export const useFloatingTools = (): FloatingToolsContextType => {
  const context = useContext(FloatingToolsContext);
  if (context === undefined) {
    throw new Error('useFloatingTools must be used within a FloatingToolsProvider');
  }
  return context;
};
