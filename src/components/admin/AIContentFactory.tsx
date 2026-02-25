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
import { Factory, Zap, Database, Loader2, CheckCircle, AlertCircle, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface GenerationResult {
  batch: number;
  requested: number;
  generated: number;
  saved: number;
  duplicates: number;
}

interface LMSItem {
  id: string;
  name: string;
}

const AIContentFactory = () => {
  const [systems, setSystems] = useState<LMSItem[]>([]);
  const [levels, setLevels] = useState<(LMSItem & { system_id: string })[]>([]);
  const [subjects, setSubjects] = useState<(LMSItem & { level_id: string })[]>([]);
  const [topics, setTopics] = useState<(LMSItem & { subject_id: string })[]>([]);

  const [selectedSystem, setSelectedSystem] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [quantity, setQuantity] = useState(100);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [totalDuplicates, setTotalDuplicates] = useState(0);
  const [topicQuestionCount, setTopicQuestionCount] = useState<number | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    const loadPrefs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPreferencesLoaded(true); return; }
      const { data } = await supabase
        .from('user_generation_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setDifficulty(data.default_difficulty || 'medium');
        setQuantity(data.default_quantity || 100);
        if (data.last_board_id) setSelectedSystem(data.last_board_id);
        if (data.last_class_id) setSelectedLevel(data.last_class_id);
        if (data.last_subject_id) setSelectedSubject(data.last_subject_id);
        if (data.last_topic_id) setSelectedTopic(data.last_topic_id);
      }
      setPreferencesLoaded(true);
    };
    loadPrefs();
  }, []);

  // Load all hierarchy data
  useEffect(() => {
    const loadData = async () => {
      const [systemsRes, levelsRes, subjectsRes, topicsRes] = await Promise.all([
        supabase.from('educational_systems').select('id, name').eq('is_active', true).order('name'),
        supabase.from('levels').select('id, name, system_id').order('name'),
        supabase.from('subjects').select('id, name, level_id').order('name'),
        supabase.from('topics').select('id, name, subject_id').order('name')
      ]);
      if (systemsRes.data) setSystems(systemsRes.data);
      if (levelsRes.data) setLevels(levelsRes.data as any);
      if (subjectsRes.data) setSubjects(subjectsRes.data as any);
      if (topicsRes.data) setTopics(topicsRes.data as any);
    };
    loadData();
  }, []);

  const [crossBoardCount, setCrossBoardCount] = useState<number | null>(null);
  const [crossBoardNames, setCrossBoardNames] = useState<string[]>([]);

  // Load question count + cross-board stats for selected topic/subject
  useEffect(() => {
    const loadCount = async () => {
      const topicName = selectedTopic
        ? topics.find(t => t.id === selectedTopic)?.name
        : selectedSubject
          ? subjects.find(s => s.id === selectedSubject)?.name
          : null;
      if (!topicName) { setTopicQuestionCount(null); setCrossBoardCount(null); setCrossBoardNames([]); return; }

      const canonicalName = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { count } = await supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .eq('category', 'mcq')
        .eq('status', 'approved')
        .ilike('topic', topicName);
      setTopicQuestionCount(count ?? 0);

      // Check how many boards share this topic
      if (selectedTopic) {
        const { data: matchingTopics } = await supabase
          .from('topics')
          .select('id, subjects!inner(levels!inner(educational_systems!inner(name)))')
          .ilike('name', topicName);
        
        const boardNames = [...new Set(
          (matchingTopics || []).map((t: any) => t.subjects?.levels?.educational_systems?.name).filter(Boolean)
        )];
        setCrossBoardCount(boardNames.length);
        setCrossBoardNames(boardNames as string[]);
      } else {
        setCrossBoardCount(null);
        setCrossBoardNames([]);
      }
    };
    loadCount();
  }, [selectedTopic, selectedSubject, topics, subjects]);

  const filteredLevels = selectedSystem ? levels.filter(l => l.system_id === selectedSystem) : [];
  const filteredSubjects = selectedLevel ? subjects.filter(s => s.level_id === selectedLevel) : [];
  const filteredTopics = selectedSubject ? topics.filter(t => t.subject_id === selectedSubject) : [];

  const selectionSteps = [
    { label: "Board", done: !!selectedSystem },
    { label: "Class", done: !!selectedLevel },
    { label: "Subject", done: !!selectedSubject },
    { label: "Topic", done: !!selectedTopic },
  ];
  const isReady = selectedSubject || selectedTopic;

  const BATCH_SIZE = 20;

  const handleGenerate = async () => {
    if (!isReady) {
      toast.error("Please select at least a subject");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResults([]);
    setTotalSaved(0);
    setTotalDuplicates(0);

    const batches = Math.ceil(quantity / BATCH_SIZE);
    setTotalBatches(batches);

    const systemName = systems.find(s => s.id === selectedSystem)?.name;
    const levelName = filteredLevels.find(l => l.id === selectedLevel)?.name;
    const subjectName = filteredSubjects.find(s => s.id === selectedSubject)?.name
      || subjects.find(s => s.id === selectedSubject)?.name;
    const topicName = filteredTopics.find(t => t.id === selectedTopic)?.name
      || topics.find(t => t.id === selectedTopic)?.name;

    const generationTopic = topicName || subjectName || "General";

    let accumulatedSaved = 0;
    let accumulatedDuplicates = 0;

    for (let batch = 0; batch < batches; batch++) {
      setCurrentBatch(batch + 1);
      const batchQuantity = Math.min(BATCH_SIZE, quantity - (batch * BATCH_SIZE));

      try {
        const { data, error } = await supabase.functions.invoke('generate-test', {
          body: {
            topic: generationTopic,
            difficulty,
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
          saved: data.questions_approved || 0,
          duplicates: data.duplicates_flagged || 0
        };

        accumulatedSaved += batchResult.saved;
        accumulatedDuplicates += batchResult.duplicates;

        setResults(prev => [...prev, batchResult]);
        setTotalSaved(accumulatedSaved);
        setTotalDuplicates(accumulatedDuplicates);
        setProgress(((batch + 1) / batches) * 100);

        if (batch < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error('Generation error:', err);
        toast.error(`Batch ${batch + 1} failed`);
      }
    }

    setIsGenerating(false);

    // Save preferences after generation
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_generation_preferences').upsert({
          user_id: user.id,
          default_difficulty: difficulty,
          default_quantity: quantity,
          last_board_id: selectedSystem || null,
          last_class_id: selectedLevel || null,
          last_subject_id: selectedSubject || null,
          last_topic_id: selectedTopic || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }

    // Build descriptive summary
    const parts = [levelName, subjectName, topicName].filter(Boolean).join(" - ");
    const summary = parts ? ` for ${parts}` : "";

    if (quantity >= 500 && accumulatedSaved > 0) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }

    toast.success(`✅ Generated ${accumulatedSaved} MCQs${summary}${accumulatedDuplicates > 0 ? `, ${accumulatedDuplicates} flagged` : ""}`);
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
        {/* Selection Progress */}
        <div className="flex items-center gap-1 text-xs">
          {selectionSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1">
              {i > 0 && <span className="text-muted-foreground">→</span>}
              <span className={step.done ? "text-primary font-medium flex items-center gap-0.5" : "text-muted-foreground"}>
                {step.label} {step.done && <Check className="h-3 w-3" />}
              </span>
            </div>
          ))}
          {isReady && <span className="ml-2 text-primary font-medium">Ready!</span>}
        </div>

        {/* 4-column LMS Hierarchy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Board</Label>
            <Select value={selectedSystem} onValueChange={(v) => {
              setSelectedSystem(v);
              setSelectedLevel("");
              setSelectedSubject("");
              setSelectedTopic("");
            }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select board" />
              </SelectTrigger>
              <SelectContent>
                {systems.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Class</Label>
            <Select value={selectedLevel} onValueChange={(v) => {
              setSelectedLevel(v);
              setSelectedSubject("");
              setSelectedTopic("");
            }} disabled={!selectedSystem}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={selectedSystem ? "Select class" : "Select board first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredLevels.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Subject</Label>
            <Select value={selectedSubject} onValueChange={(v) => {
              setSelectedSubject(v);
              setSelectedTopic("");
            }} disabled={!selectedLevel}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={selectedLevel ? "Select subject" : "Select class first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredSubjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Topic</Label>
            <Select value={selectedTopic || "all"} onValueChange={(v) => setSelectedTopic(v === "all" ? "" : v)} disabled={!selectedSubject}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={selectedSubject ? "Any topic" : "Select subject first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any topic</SelectItem>
                {filteredTopics.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Difficulty */}
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
            max={1000}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10</span>
            <span>100</span>
            <span>250</span>
            <span>500</span>
            <span>1000</span>
          </div>
        </div>

        {/* Topic Stats */}
        {topicQuestionCount !== null && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Database className="h-3 w-3" />
              Current bank: <span className="font-medium text-foreground">{topicQuestionCount.toLocaleString()}</span> questions (canonical match)
            </div>
            {crossBoardCount !== null && crossBoardCount > 1 && (
              <div className="text-xs text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Shared across {crossBoardCount} boards ({crossBoardNames.join(', ')}) — questions available everywhere ✅
              </div>
            )}
          </div>
        )}

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
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  Flagged: {totalDuplicates}
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
                  <div className="text-xs text-muted-foreground">Flagged</div>
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
          disabled={isGenerating || !isReady}
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
