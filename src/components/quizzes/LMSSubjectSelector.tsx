import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

export interface LMSSubject {
  id: string;
  name: string;
  levelName: string;
  systemName: string;
  systemType: string;
}

interface LMSSubjectSelectorProps {
  value: string; // subject ID
  onValueChange: (id: string, subject: LMSSubject | null) => void;
  placeholder?: string;
  id?: string;
}

export const LMSSubjectSelector = ({ value, onValueChange, placeholder = "Choose a subject...", id }: LMSSubjectSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [subjects, setSubjects] = useState<LMSSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          id, name,
          levels!inner(name, educational_systems!inner(name, type, is_active))
        `)
        .or('approved.is.null,approved.eq.true')
        .order('name');

      if (!error && data) {
        const mapped: LMSSubject[] = data
          .filter((s: any) => s.levels?.educational_systems?.is_active !== false)
          .map((s: any) => ({
            id: s.id,
            name: s.name,
            levelName: s.levels?.name || '',
            systemName: s.levels?.educational_systems?.name || '',
            systemType: s.levels?.educational_systems?.type || '',
          }));
        setSubjects(mapped);
      }
      setLoading(false);
    };
    fetchSubjects();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return subjects;
    const q = search.toLowerCase();
    return subjects.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.levelName.toLowerCase().includes(q) ||
      s.systemName.toLowerCase().includes(q)
    );
  }, [subjects, search]);

  // Group by system > level
  const grouped = useMemo(() => {
    const map = new Map<string, LMSSubject[]>();
    filtered.forEach(s => {
      const key = `${s.systemName} › ${s.levelName}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [filtered]);

  const selectedSubject = subjects.find(s => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-10"
        >
          <span className="truncate text-left flex-1">
            {selectedSubject ? (
              <span className="flex items-center gap-2">
                <span>{selectedSubject.name}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                  {selectedSubject.systemName} › {selectedSubject.levelName}
                </Badge>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search subjects, boards, classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
          />
        </div>
        <ScrollArea className="max-h-[280px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading subjects...</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No subjects found</div>
          ) : (
            <div className="p-1">
              {Array.from(grouped.entries()).map(([groupLabel, items]) => (
                <div key={groupLabel}>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <GraduationCap className="h-3 w-3" />
                    {groupLabel}
                  </div>
                  {items.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => {
                        onValueChange(subject.id === value ? '' : subject.id, subject.id === value ? null : subject);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left hover:bg-accent transition-colors",
                        value === subject.id && "bg-accent"
                      )}
                    >
                      <Check className={cn("h-4 w-4 shrink-0", value === subject.id ? "opacity-100 text-primary" : "opacity-0")} />
                      <span className="truncate">{subject.name}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
