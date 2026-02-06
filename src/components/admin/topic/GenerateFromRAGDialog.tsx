import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, BookOpen, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateForTopic } from "@/services/autoFillService";
import { toast } from "sonner";

interface GenerateFromRAGDialogProps {
  topicId: string;
  topicName: string;
  subjectName: string;
  hasDocuments: boolean;
  onSuccess?: () => void;
}

type GenerationState = 'idle' | 'generating' | 'success' | 'error';

const GenerateFromRAGDialog = ({
  topicId,
  topicName,
  subjectName,
  hasDocuments,
  onSuccess
}: GenerateFromRAGDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [count, setCount] = useState(5);
  const [state, setState] = useState<GenerationState>('idle');
  const [result, setResult] = useState<{ saved: number; error?: string } | null>(null);

  const handleGenerate = async () => {
    setState('generating');
    setResult(null);

    try {
      const response = await generateForTopic({
        topic_id: topicId,
        topic_name: topicName,
        subject_name: subjectName,
        difficulty,
        count
      });

      if (response.success) {
        setState('success');
        setResult({ saved: response.saved });
        toast.success(`Generated ${response.saved} questions`, {
          description: `${response.duplicates > 0 ? `${response.duplicates} duplicates skipped` : 'Added to Question Bank'}`
        });
        onSuccess?.();
      } else {
        setState('error');
        setResult({ saved: 0, error: response.error });
        toast.error('Generation failed', { description: response.error });
      }
    } catch (error) {
      setState('error');
      setResult({ saved: 0, error: 'Unexpected error occurred' });
      toast.error('Generation failed');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setState('idle');
      setResult(null);
    }, 200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={!hasDocuments}
          title={hasDocuments ? "Generate MCQs from course material" : "No documents uploaded for this topic"}
        >
          <Sparkles className={`h-4 w-4 ${hasDocuments ? 'text-amber-500' : 'text-muted-foreground'}`} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Generate MCQs from Course Material
          </DialogTitle>
          <DialogDescription>
            Create questions from uploaded PDFs for <strong>{topicName}</strong>
          </DialogDescription>
        </DialogHeader>

        {state === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 pt-4"
          >
            {/* Topic Info */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Subject</p>
              <p className="font-medium">{subjectName}</p>
              <p className="text-sm text-muted-foreground mt-2">Topic</p>
              <p className="font-medium">{topicName}</p>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Easy
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="hard">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Hard
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Count Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Number of Questions</Label>
                <span className="text-sm font-medium">{count}</span>
              </div>
              <Slider
                value={[count]}
                onValueChange={([val]) => setCount(val)}
                min={1}
                max={5}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Max 5 questions per generation for quota safety
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate
              </Button>
            </div>
          </motion.div>
        )}

        {state === 'generating' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-12 text-center"
          >
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="font-medium">Generating questions...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Reading course material and creating MCQs
            </p>
          </motion.div>
        )}

        {state === 'success' && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl font-bold">Success!</p>
            <p className="text-muted-foreground mt-1">
              {result.saved} questions added to Question Bank
            </p>
            <Button onClick={handleClose} className="mt-6">
              Done
            </Button>
          </motion.div>
        )}

        {state === 'error' && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <p className="text-xl font-bold">Generation Failed</p>
            <p className="text-muted-foreground mt-1">
              {result.error || 'An error occurred'}
            </p>
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => setState('idle')}>
                Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GenerateFromRAGDialog;
