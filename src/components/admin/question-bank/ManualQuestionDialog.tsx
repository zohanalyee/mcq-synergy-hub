import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ManualQuestionDialogProps {
  onQuestionAdded?: () => void;
}

const ManualQuestionDialog = ({ onQuestionAdded }: ManualQuestionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "",
    subject: "",
    topic: "",
    subtopic: "",
    difficulty: "",
    explanation: "",
    tags: [] as string[]
  });
  const [currentTag, setCurrentTag] = useState("");

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (formData.subject) {
      loadTopics(formData.subject);
    }
  }, [formData.subject]);

  const loadSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').order('name');
    setSubjects(data || []);
  };

  const loadTopics = async (subjectName: string) => {
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', subjectName)
      .single();
    
    if (subjectData) {
      const { data } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', subjectData.id)
        .order('name');
      setTopics(data || []);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title || !formData.question || !formData.subject || !formData.difficulty) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.option_a || !formData.option_b || !formData.option_c || !formData.option_d) {
      toast.error("Please provide all four options");
      return;
    }

    if (!formData.correct_option) {
      toast.error("Please select the correct option");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const questionData = {
        title: formData.title,
        description: formData.question,
        category: 'mcq',
        subject: formData.subject,
        topic: formData.topic || null,
        subtopic: formData.subtopic || null,
        difficulty: formData.difficulty,
        explanation: formData.explanation || null,
        options: {
          A: formData.option_a,
          B: formData.option_b,
          C: formData.option_c,
          D: formData.option_d
        },
        correct_option: formData.correct_option,
        tags: formData.tags,
        question_type: 'mcq',
        status: 'approved', // Direct to Question Bank
        created_by: user?.id,
        show_in_subjects: true,
        show_in_syllabus: true,
        show_in_mock_tests: true
      };

      const { error } = await supabase
        .from('content_items')
        .insert(questionData);

      if (error) throw error;

      toast.success("Question added to Question Bank successfully!");
      setIsOpen(false);
      resetForm();
      onQuestionAdded?.();
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Failed to add question");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      question: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "",
      subject: "",
      topic: "",
      subtopic: "",
      difficulty: "",
      explanation: "",
      tags: []
    });
    setCurrentTag("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Question Manually
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Question to Question Bank</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Question Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter question title"
              />
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Question */}
          <div>
            <Label htmlFor="question">Question Text *</Label>
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) => handleInputChange('question', e.target.value)}
              placeholder="Enter the question"
              rows={3}
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="option_a">Option A *</Label>
              <Input
                id="option_a"
                value={formData.option_a}
                onChange={(e) => handleInputChange('option_a', e.target.value)}
                placeholder="Option A"
              />
            </div>
            <div>
              <Label htmlFor="option_b">Option B *</Label>
              <Input
                id="option_b"
                value={formData.option_b}
                onChange={(e) => handleInputChange('option_b', e.target.value)}
                placeholder="Option B"
              />
            </div>
            <div>
              <Label htmlFor="option_c">Option C *</Label>
              <Input
                id="option_c"
                value={formData.option_c}
                onChange={(e) => handleInputChange('option_c', e.target.value)}
                placeholder="Option C"
              />
            </div>
            <div>
              <Label htmlFor="option_d">Option D *</Label>
              <Input
                id="option_d"
                value={formData.option_d}
                onChange={(e) => handleInputChange('option_d', e.target.value)}
                placeholder="Option D"
              />
            </div>
          </div>

          {/* Correct Option */}
          <div>
            <Label htmlFor="correct_option">Correct Answer *</Label>
            <Select value={formData.correct_option} onValueChange={(value) => handleInputChange('correct_option', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select correct option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject and Topic */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Select value={formData.topic} onValueChange={(value) => handleInputChange('topic', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.name}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subtopic">Subtopic</Label>
              <Input
                id="subtopic"
                value={formData.subtopic}
                onChange={(e) => handleInputChange('subtopic', e.target.value)}
                placeholder="Enter subtopic"
              />
            </div>
          </div>

          {/* Explanation */}
          <div>
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => handleInputChange('explanation', e.target.value)}
              placeholder="Explain the correct answer"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags (Optional)</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button type="button" onClick={addTag} size="sm">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Adding..." : "Add to Question Bank"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualQuestionDialog;