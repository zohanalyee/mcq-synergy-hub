import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, CheckSquare, XSquare } from 'lucide-react';
import { SyllabusSubject } from './interfaces';

interface TopicsSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: SyllabusSubject[];
  perTopicCounts: Record<string, number>;
  topicQuestionCounts: Record<string, number>;
  onApply: (counts: Record<string, number>, deselectedTopicIds: string[]) => void;
}

export const TopicsSelectorModal = ({
  open,
  onOpenChange,
  subjects,
  perTopicCounts,
  topicQuestionCounts,
  onApply,
}: TopicsSelectorModalProps) => {
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});
  const [localDeselected, setLocalDeselected] = useState<Set<string>>(new Set());

  // Get selected subjects (those with at least one selected topic)
  const selectedSubjects = useMemo(() => 
    subjects.filter(s => s.topics.some(t => t.isSelected)),
    [subjects]
  );

  // Reset local state when modal opens
  useEffect(() => {
    if (open) {
      setLocalCounts({ ...perTopicCounts });
      setLocalDeselected(new Set());
    }
  }, [open, perTopicCounts]);

  const toggleTopic = (topicId: string) => {
    setLocalDeselected(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const updateCount = (topicId: string, count: number) => {
    const clamped = Math.max(1, Math.min(count, 50));
    setLocalCounts(prev => ({ ...prev, [topicId]: clamped }));
  };

  const selectAll = () => setLocalDeselected(new Set());

  const deselectAll = () => {
    const allIds = new Set<string>();
    selectedSubjects.forEach(s => s.topics.forEach(t => {
      if (t.isSelected) allIds.add(t.id);
    }));
    setLocalDeselected(allIds);
  };

  // Calculate totals
  const { activeTopics, totalQuestions } = useMemo(() => {
    let topics = 0;
    let questions = 0;
    selectedSubjects.forEach(s => {
      s.topics.forEach(t => {
        if (t.isSelected && !localDeselected.has(t.id)) {
          topics++;
          questions += localCounts[t.id] || 5;
        }
      });
    });
    return { activeTopics: topics, totalQuestions: questions };
  }, [selectedSubjects, localDeselected, localCounts]);

  const handleApply = () => {
    onApply(localCounts, Array.from(localDeselected));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden" style={{ zIndex: 110 }}>
        <DialogHeader>
          <DialogTitle className="text-base">Customize Topics & Questions</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Select topics and set question counts for each
          </p>
        </DialogHeader>

        {/* Quick actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll} className="h-7 text-xs">
            <CheckSquare className="h-3 w-3 mr-1" /> Select All
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll} className="h-7 text-xs">
            <XSquare className="h-3 w-3 mr-1" /> Deselect All
          </Button>
        </div>

        {/* Topics list */}
        <div className="-mx-6 px-6 min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4 py-2">
            {selectedSubjects.map(subject => (
              <div key={subject.id}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {subject.name} — {subject.levelName}
                </h4>
                <div className="space-y-1.5">
                  {subject.topics.filter(t => t.isSelected).map(topic => {
                    const isActive = !localDeselected.has(topic.id);
                    const count = localCounts[topic.id] || 5;
                    const available = topicQuestionCounts[topic.id] || 0;

                    return (
                      <div
                        key={topic.id}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                          isActive ? 'bg-card border-border' : 'bg-muted/30 border-transparent opacity-60'
                        }`}
                      >
                        <Checkbox
                          checked={isActive}
                          onCheckedChange={() => toggleTopic(topic.id)}
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{topic.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {available > 0 ? `${available} in bank` : 'AI generated'}
                          </p>
                        </div>

                        {isActive && (
                          <div className="flex items-center border rounded-md shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-r-none"
                              onClick={() => updateCount(topic.id, count - 1)}
                              disabled={count <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={count}
                              onChange={(e) => updateCount(topic.id, parseInt(e.target.value) || 1)}
                              className="w-12 h-7 text-xs text-center border-0 border-x rounded-none px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-l-none"
                              onClick={() => updateCount(topic.id, count + 1)}
                              disabled={count >= 50}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row items-center justify-between sm:justify-between border-t pt-3 gap-2">
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              {activeTopics} Topics
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {totalQuestions} Qs
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleApply} disabled={activeTopics === 0}>
              Apply
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
