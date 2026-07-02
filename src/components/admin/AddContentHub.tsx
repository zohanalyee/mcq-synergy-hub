import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Zap, Cpu } from "lucide-react";
import AIContentFactory from "./AIContentFactory";
import AutoFillDashboard from "./auto-fill/AutoFillDashboard";
import DocumentMCQConverter from "./DocumentMCQConverter";

/**
 * AddContentHub — unified entry point for all AI content generation workflows.
 * - "Generate MCQs": single/targeted generation (AIContentFactory)
 * - "AI Batch Fill": bulk auto-fill for thin topics (AutoFillDashboard)
 * - "Doc → MCQ": convert uploaded documents into MCQs
 */
const AddContentHub = () => {
  const [mode, setMode] = useState("generate");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-violet-400" />
        <h2 className="text-lg font-semibold">Add Content</h2>
      </div>

      <Tabs value={mode} onValueChange={setMode}>
        <TabsList className="bg-muted/30 border border-border/30">
          <TabsTrigger value="generate" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Generate MCQs
          </TabsTrigger>
          <TabsTrigger value="batch-fill" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" /> AI Batch Fill
          </TabsTrigger>
          <TabsTrigger value="doc-to-mcq" className="gap-1.5">
            <Cpu className="h-3.5 w-3.5" /> Doc → MCQ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4">
          <AIContentFactory />
        </TabsContent>

        <TabsContent value="batch-fill" className="mt-4">
          <AutoFillDashboard />
        </TabsContent>

        <TabsContent value="doc-to-mcq" className="mt-4">
          <DocumentMCQConverter />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddContentHub;
