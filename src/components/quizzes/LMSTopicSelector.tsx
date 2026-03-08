import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Topic {
  id?: string;
  name: string;
  description?: string;
}

interface LMSTopicSelectorProps {
  topics: Topic[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  disabledPlaceholder?: string;
  id?: string;
}

export const LMSTopicSelector = ({
  topics,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Choose a topic...",
  disabledPlaceholder = "Select a subject first",
  id,
}: LMSTopicSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return topics;
    const q = search.toLowerCase();
    return topics.filter(t => t.name.toLowerCase().includes(q));
  }, [topics, search]);

  const selectedTopic = topics.find(t => t.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal h-10"
        >
          <span className="truncate text-left flex-1">
            {selectedTopic ? selectedTopic.name : (
              <span className="text-muted-foreground">{disabled ? disabledPlaceholder : placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
          />
        </div>
        <ScrollArea className="max-h-[280px]">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No topics found</div>
          ) : (
            <div className="p-1">
              {filtered.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => {
                    onValueChange(topic.name === value ? '' : topic.name);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left hover:bg-accent transition-colors",
                    value === topic.name && "bg-accent"
                  )}
                >
                  <Check className={cn("h-4 w-4 shrink-0", value === topic.name ? "opacity-100 text-primary" : "opacity-0")} />
                  <span className="truncate">{topic.name}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
