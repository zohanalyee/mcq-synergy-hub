import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Search, Filter } from "lucide-react";
import { QuestionFilters } from "@/services/questionBankService";
import { getSubjects } from "@/services/supabaseSubjectService";
import { getTopics } from "@/services/supabaseTopicService";

interface QuestionBankFiltersProps {
  filters: QuestionFilters;
  onFiltersChange: (filters: QuestionFilters) => void;
  onSearch: () => void;
}

interface Subject {
  id?: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
  subject_id: string;
}

export const QuestionBankFilters = ({ filters, onFiltersChange, onSearch }: QuestionBankFiltersProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadSubjectsAndTopics();
  }, []);

  const loadSubjectsAndTopics = async () => {
    try {
      const { getSubjectsWithQuestions, getTopicsWithQuestions } = await import('@/services/questionUploadService');
      
      // Get only subjects that have questions
      const subjectNames = await getSubjectsWithQuestions();
      
      // Get full subject data for these subjects
      const allSubjects = await getSubjects();
      const validSubjects = allSubjects.filter(s => subjectNames.includes(s.name));
      
      setSubjects(validSubjects);
      
      // Get topics that have questions for each subject
      const topicsArray: Topic[] = [];
      for (const subject of validSubjects) {
        const topicNames = await getTopicsWithQuestions(subject.name);
        const subjectTopics = await getTopics();
        
        if (subjectTopics[subject.name]) {
          subjectTopics[subject.name]
            .filter(t => topicNames.includes(t.name))
            .forEach(topic => {
              topicsArray.push({
                id: topic.id || '',
                name: topic.name,
                subject_id: subject.id || ''
              });
            });
        }
      }
      
      setTopics(topicsArray);
    } catch (error) {
      console.error("Error loading subjects and topics:", error);
    }
  };

  const handleSubjectChange = (subjectName: string) => {
    const currentSubjects = filters.subjects || [];
    const newSubjects = currentSubjects.includes(subjectName)
      ? currentSubjects.filter(s => s !== subjectName)
      : [...currentSubjects, subjectName];
    
    onFiltersChange({
      ...filters,
      subjects: newSubjects,
      topics: [] // Reset topics when subjects change
    });
  };

  const handleTopicChange = (topicName: string) => {
    const currentTopics = filters.topics || [];
    const newTopics = currentTopics.includes(topicName)
      ? currentTopics.filter(t => t !== topicName)
      : [...currentTopics, topicName];
    
    onFiltersChange({
      ...filters,
      topics: newTopics
    });
  };

  const handleDifficultyChange = (difficulty: string) => {
    const currentDifficulties = filters.difficulties || [];
    const newDifficulties = currentDifficulties.includes(difficulty)
      ? currentDifficulties.filter(d => d !== difficulty)
      : [...currentDifficulties, difficulty];
    
    onFiltersChange({
      ...filters,
      difficulties: newDifficulties
    });
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    onFiltersChange({});
  };

  const getFilteredTopics = () => {
    if (!filters.subjects?.length) return topics;
    
    const selectedSubjectIds = subjects
      .filter(s => filters.subjects?.includes(s.name))
      .map(s => s.id);
    
    return topics.filter(t => selectedSubjectIds.includes(t.subject_id));
  };

  const activeFiltersCount = [
    filters.subjects?.length || 0,
    filters.topics?.length || 0,
    filters.difficulties?.length || 0,
    filters.is_featured ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Question Bank Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount} active</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            />
          </div>
          <Button onClick={onSearch}>Search</Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            Advanced Filters
          </Button>
          {activeFiltersCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          )}
        </div>

        {/* Subjects */}
        <div>
          <Label className="text-sm font-medium">Subjects</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`subject-${subject.id}`}
                  checked={filters.subjects?.includes(subject.name) || false}
                  onCheckedChange={() => handleSubjectChange(subject.name)}
                />
                <Label htmlFor={`subject-${subject.id}`} className="text-sm">
                  {subject.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Topics */}
        {filters.subjects?.length && (
          <div>
            <Label className="text-sm font-medium">Topics</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {getFilteredTopics().map((topic) => (
                <div key={topic.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`topic-${topic.id}`}
                    checked={filters.topics?.includes(topic.name) || false}
                    onCheckedChange={() => handleTopicChange(topic.name)}
                  />
                  <Label htmlFor={`topic-${topic.id}`} className="text-sm">
                    {topic.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        {showAdvanced && (
          <>
            {/* Difficulty */}
            <div>
              <Label className="text-sm font-medium">Difficulty</Label>
              <div className="flex gap-2 mt-2">
                {['Easy', 'Medium', 'Hard'].map((difficulty) => (
                  <div key={difficulty} className="flex items-center space-x-2">
                    <Checkbox
                      id={`difficulty-${difficulty}`}
                      checked={filters.difficulties?.includes(difficulty) || false}
                      onCheckedChange={() => handleDifficultyChange(difficulty)}
                    />
                    <Label htmlFor={`difficulty-${difficulty}`} className="text-sm">
                      {difficulty}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Type */}
            <div>
              <Label className="text-sm font-medium">Question Type</Label>
              <Select
                value={filters.question_type || "all"}
                onValueChange={(value) => onFiltersChange({
                  ...filters,
                  question_type: value === "all" ? undefined : value
                })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Featured Questions */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={filters.is_featured || false}
                onCheckedChange={(checked) => onFiltersChange({
                  ...filters,
                  is_featured: checked as boolean
                })}
              />
              <Label htmlFor="featured" className="text-sm">
                Featured questions only
              </Label>
            </div>

            {/* Results Limit */}
            <div>
              <Label className="text-sm font-medium">Results per page</Label>
              <Select
                value={filters.limit?.toString() || "50"}
                onValueChange={(value) => onFiltersChange({
                  ...filters,
                  limit: parseInt(value)
                })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div>
            <Label className="text-sm font-medium">Active Filters</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.subjects?.map((subject) => (
                <Badge key={subject} variant="secondary" className="gap-1">
                  {subject}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleSubjectChange(subject)}
                  />
                </Badge>
              ))}
              {filters.topics?.map((topic) => (
                <Badge key={topic} variant="secondary" className="gap-1">
                  {topic}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleTopicChange(topic)}
                  />
                </Badge>
              ))}
              {filters.difficulties?.map((difficulty) => (
                <Badge key={difficulty} variant="secondary" className="gap-1">
                  {difficulty}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleDifficultyChange(difficulty)}
                  />
                </Badge>
              ))}
              {filters.is_featured && (
                <Badge variant="secondary" className="gap-1">
                  Featured
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onFiltersChange({ ...filters, is_featured: false })}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};