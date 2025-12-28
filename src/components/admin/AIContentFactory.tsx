import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Factory, Zap, Database, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GenerationResult {
  batch: number;
  requested: number;
  generated: number;
  saved: number;
  duplicates: number;
}

const AIContentFactory = () => {
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [topics, setTopics] = useState<{ id: string; name: string; subject_id: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [quantity, setQuantity] = useState<number>(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [totalDuplicates, setTotalDuplicates] = useState(0);

  // Load subjects and topics
  useEffect(() => {
    const loadData = async () => {
      const [subjectsRes, topicsRes] = await Promise.all([
        supabase.from('subjects').select('id, name').order('name'),
        supabase.from('topics').select('id, name, subject_id').order('name')
      ]);
      
      if (subjectsRes.data) setSubjects(subjectsRes.data);
      if (topicsRes.data) setTopics(topicsRes.data);
    };
    loadData();
  }, []);

  const filteredTopics = selectedSubject 
    ? topics.filter(t => t.subject_id === selectedSubject)
    : topics;

  const BATCH_SIZE = 20;

  const handleGenerate = async () => {
    if (!selectedSubject && !selectedTopic) {
      toast.error("Please select a subject or topic");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResults([]);
    setTotalSaved(0);
    setTotalDuplicates(0);

    const batches = Math.ceil(quantity / BATCH_SIZE);
    setTotalBatches(batches);

    // Get the topic/subject name for the request
    const topicName = selectedTopic 
      ? topics.find(t => t.id === selectedTopic)?.name 
      : subjects.find(s => s.id === selectedSubject)?.name || "General";

    let accumulatedSaved = 0;
    let accumulatedDuplicates = 0;

    for (let batch = 0; batch < batches; batch++) {
      setCurrentBatch(batch + 1);
      const batchQuantity = Math.min(BATCH_SIZE, quantity - (batch * BATCH_SIZE));

      try {
        const { data, error } = await supabase.functions.invoke('generate-test', {
          body: {
            topic: topicName,
            difficulty: difficulty,
            question_count: batchQuantity,
            mode: 'bank_only',
            forceNew: true
          }
        });

        if (error) {
          console.error('Batch error:', error);
          toast.error(`Batch ${batch + 1} failed: ${error.message}`);
          continue;
        }

        const batchResult: GenerationResult = {
          batch: batch + 1,
          requested: batchQuantity,
          generated: data.questions_generated || 0,
          saved: data.questions_saved || 0,
          duplicates: data.duplicates_skipped || 0
        };

        accumulatedSaved += batchResult.saved;
        accumulatedDuplicates += batchResult.duplicates;

        setResults(prev => [...prev, batchResult]);
        setTotalSaved(accumulatedSaved);
        setTotalDuplicates(accumulatedDuplicates);
        setProgress(((batch + 1) / batches) * 100);

        // Small delay between batches to avoid rate limiting
        if (batch < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error('Generation error:', err);
        toast.error(`Batch ${batch + 1} failed`);
      }
    }

    setIsGenerating(false);
    toast.success(`Generation complete! Saved ${accumulatedSaved} questions`);
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Factory className="h-5 w-5 text-primary" />
          AI Content Factory
          <Badge variant="outline" className="ml-2">Bulk Generator</Badge>
        </CardTitle>
        <CardDescription className="text-sm">
          Mass-generate questions directly into the question bank
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Subject</Label>
            <Select value={selectedSubject} onValueChange={(v) => {
              setSelectedSubject(v);
              setSelectedTopic("");
            }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Topic (Optional)</Label>
            <Select value={selectedTopic || "all"} onValueChange={(v) => setSelectedTopic(v === "all" ? "" : v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Any topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any topic</SelectItem>
                {filteredTopics.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quantity Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs">Quantity</Label>
            <Badge variant="secondary" className="text-xs">{quantity} questions</Badge>
          </div>
          <Slider
            value={[quantity]}
            onValueChange={(v) => setQuantity(v[0])}
            min={10}
            max={200}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200</span>
          </div>
        </div>

        {/* Progress Section */}
        <AnimatePresence mode="wait">
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">
                    Generating batch {currentBatch} of {totalBatches}...
                  </span>
                </div>
                <Badge variant="outline">{Math.round(progress)}%</Badge>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Saved: {totalSaved}
                </span>
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Duplicates: {totalDuplicates}
                </span>
              </div>
            </motion.div>
          )}

          {!isGenerating && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Generation Complete
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-background/50 rounded">
                  <div className="text-lg font-bold text-primary">{totalSaved}</div>
                  <div className="text-xs text-muted-foreground">Saved</div>
                </div>
                <div className="p-2 bg-background/50 rounded">
                  <div className="text-lg font-bold text-yellow-600">{totalDuplicates}</div>
                  <div className="text-xs text-muted-foreground">Duplicates</div>
                </div>
                <div className="p-2 bg-background/50 rounded">
                  <div className="text-lg font-bold">{results.length}</div>
                  <div className="text-xs text-muted-foreground">Batches</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || (!selectedSubject && !selectedTopic)}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate {quantity} Questions
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIContentFactory;
