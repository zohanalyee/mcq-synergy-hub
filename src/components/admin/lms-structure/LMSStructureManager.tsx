import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { EducationalSystem, Level } from "@/types/lms.types";
import { getEducationalSystems, getLevelsBySystem } from "@/services/lmsStructureService";
import { SystemsSidebar } from "./SystemsSidebar";
import { LevelManager } from "./LevelManager";
import { Layers, BookOpen } from "lucide-react";

export function LMSStructureManager() {
  const [systems, setSystems] = useState<EducationalSystem[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<EducationalSystem | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelsLoading, setLevelsLoading] = useState(false);

  useEffect(() => {
    loadSystems();
  }, []);

  useEffect(() => {
    if (selectedSystem) {
      loadLevels(selectedSystem.id);
    } else {
      setLevels([]);
    }
  }, [selectedSystem]);

  const loadSystems = async () => {
    setLoading(true);
    const data = await getEducationalSystems();
    setSystems(data);
    setLoading(false);
  };

  const loadLevels = async (systemId: string) => {
    setLevelsLoading(true);
    const data = await getLevelsBySystem(systemId);
    setLevels(data);
    setLevelsLoading(false);
  };

  const handleSystemsChange = () => {
    loadSystems();
  };

  const handleLevelsChange = () => {
    if (selectedSystem) {
      loadLevels(selectedSystem.id);
      loadSystems(); // Refresh level counts
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] min-h-[500px]">
      <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
        {/* Left Sidebar - Systems */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <SystemsSidebar
            systems={systems}
            selectedSystem={selectedSystem}
            onSelectSystem={setSelectedSystem}
            onSystemsChange={handleSystemsChange}
            loading={loading}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main Content - Levels and Subjects */}
        <ResizablePanel defaultSize={70}>
          {selectedSystem ? (
            <LevelManager
              system={selectedSystem}
              levels={levels}
              onLevelsChange={handleLevelsChange}
              loading={levelsLoading}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <div className="bg-muted/50 rounded-full p-6 mb-4">
                <Layers className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium mb-2">Select an Educational System</h3>
              <p className="text-center text-sm max-w-md">
                Choose a system from the sidebar to view and manage its levels, subjects, and topics.
              </p>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
