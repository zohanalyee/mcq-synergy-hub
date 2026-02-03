import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building, Layers, BookOpen, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EducationalSystem {
  id: string;
  name: string;
  type: string;
}

interface Level {
  id: string;
  name: string;
  system_id: string;
}

interface Subject {
  id: string;
  name: string;
  level_id: string;
}

interface Topic {
  id: string;
  name: string;
  subject_id: string;
}

export interface LMSSelection {
  systemId?: string;
  levelId?: string;
  subjectId?: string;
  topicId?: string;
}

interface DocumentLMSSelectorProps {
  value: LMSSelection;
  onChange: (selection: LMSSelection) => void;
  disabled?: boolean;
}

const DocumentLMSSelector = ({ value, onChange, disabled }: DocumentLMSSelectorProps) => {
  const [systems, setSystems] = useState<EducationalSystem[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch educational systems on mount
  useEffect(() => {
    const fetchSystems = async () => {
      const { data, error } = await supabase
        .from("educational_systems")
        .select("id, name, type")
        .eq("is_active", true)
        .order("name");

      if (!error && data) {
        setSystems(data);
      }
      setLoading(false);
    };
    fetchSystems();
  }, []);

  // Fetch levels when system changes
  useEffect(() => {
    if (!value.systemId) {
      setLevels([]);
      return;
    }

    const fetchLevels = async () => {
      const { data, error } = await supabase
        .from("levels")
        .select("id, name, system_id")
        .eq("system_id", value.systemId)
        .order("order_index");

      if (!error && data) {
        setLevels(data);
      }
    };
    fetchLevels();
  }, [value.systemId]);

  // Fetch subjects when level changes
  useEffect(() => {
    if (!value.levelId) {
      setSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, level_id")
        .eq("level_id", value.levelId)
        .order("name");

      if (!error && data) {
        setSubjects(data);
      }
    };
    fetchSubjects();
  }, [value.levelId]);

  // Fetch topics when subject changes
  useEffect(() => {
    if (!value.subjectId) {
      setTopics([]);
      return;
    }

    const fetchTopics = async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("id, name, subject_id")
        .eq("subject_id", value.subjectId)
        .order("name");

      if (!error && data) {
        setTopics(data);
      }
    };
    fetchTopics();
  }, [value.subjectId]);

  const handleSystemChange = (systemId: string) => {
    onChange({
      systemId: systemId === "none" ? undefined : systemId,
      levelId: undefined,
      subjectId: undefined,
      topicId: undefined,
    });
  };

  const handleLevelChange = (levelId: string) => {
    onChange({
      ...value,
      levelId: levelId === "none" ? undefined : levelId,
      subjectId: undefined,
      topicId: undefined,
    });
  };

  const handleSubjectChange = (subjectId: string) => {
    onChange({
      ...value,
      subjectId: subjectId === "none" ? undefined : subjectId,
      topicId: undefined,
    });
  };

  const handleTopicChange = (topicId: string) => {
    onChange({
      ...value,
      topicId: topicId === "none" ? undefined : topicId,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading LMS structure...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-xs">
          Optional: Link to LMS
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Educational System */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-sm">
            <Building className="h-3 w-3" />
            Board/System
          </Label>
          <Select
            value={value.systemId || "none"}
            onValueChange={handleSystemChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select board..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No selection</SelectItem>
              {systems.map((system) => (
                <SelectItem key={system.id} value={system.id}>
                  {system.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Level */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-sm">
            <Layers className="h-3 w-3" />
            Class/Level
          </Label>
          <Select
            value={value.levelId || "none"}
            onValueChange={handleLevelChange}
            disabled={disabled || !value.systemId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No selection</SelectItem>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-sm">
            <BookOpen className="h-3 w-3" />
            Subject
          </Label>
          <Select
            value={value.subjectId || "none"}
            onValueChange={handleSubjectChange}
            disabled={disabled || !value.levelId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subject..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No selection</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Topic */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-sm">
            <FileText className="h-3 w-3" />
            Topic
          </Label>
          <Select
            value={value.topicId || "none"}
            onValueChange={handleTopicChange}
            disabled={disabled || !value.subjectId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select topic..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No selection</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {value.topicId && (
        <p className="text-xs text-muted-foreground">
          ✓ Document will be linked to this topic for MCQ generation
        </p>
      )}
    </div>
  );
};

export default DocumentLMSSelector;
