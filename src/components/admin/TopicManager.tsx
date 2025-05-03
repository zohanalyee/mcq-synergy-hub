
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash, FileText } from "lucide-react";
import { Topic, TopicsData } from "@/data/topicsData";
import { getSubjects } from "@/services/adminService";
import { getTopics, addTopic, removeTopic } from "@/services/adminService";

const TopicManager = () => {
  const [allTopics, setAllTopics] = useState<TopicsData>(getTopics());
  const [subjects, setSubjects] = useState(getSubjects());
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Get topics for the selected subject
  const currentTopics = selectedSubject ? (allTopics[selectedSubject] || []) : [];

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].title);
    }
  }, [subjects, selectedSubject]);

  const handleAddTopic = () => {
    if (!title || !content || !selectedSubject) {
      toast.error("Please fill out all required fields");
      return;
    }

    const newTopic: Topic = {
      title,
      content,
    };

    const added = addTopic(selectedSubject, newTopic);
    
    if (added) {
      setAllTopics(getTopics());
      setIsAddDialogOpen(false);
      resetForm();
      toast.success(`Topic "${title}" added to ${selectedSubject}`);
    } else {
      toast.error("Failed to add topic");
    }
  };

  const handleRemoveTopic = (topicTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the topic "${topicTitle}"?`)) {
      const removed = removeTopic(selectedSubject, topicTitle);
      
      if (removed) {
        setAllTopics(getTopics());
        toast.success(`Topic "${topicTitle}" removed successfully`);
      } else {
        toast.error("Failed to remove topic");
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Topics</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label htmlFor="subject-select" className="block text-sm font-medium">
            Select Subject
          </label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger id="subject-select">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.title} value={subject.title}>
                  {subject.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedSubject}>
                <Plus className="mr-2 h-4 w-4" /> Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Topic</DialogTitle>
                <DialogDescription>
                  Add a topic to {selectedSubject || "the selected subject"}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="title" className="text-sm font-medium">Topic Title</label>
                  <Input
                    id="title"
                    placeholder="e.g., Algebra Fundamentals"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="content" className="text-sm font-medium">Content</label>
                  <Textarea
                    id="content"
                    placeholder="Topic content or description"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleAddTopic}>
                  Add Topic
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {selectedSubject ? (
        currentTopics.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Content Preview</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTopics.map((topic) => (
                  <TableRow key={topic.title}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium">{topic.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {topic.content.length > 100 
                        ? `${topic.content.substring(0, 100)}...`
                        : topic.content}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveTopic(topic.title)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-10 border rounded-md bg-muted/10">
            <p className="text-muted-foreground">No topics added for {selectedSubject} yet. Create your first topic.</p>
          </div>
        )
      ) : (
        <div className="text-center p-10 border rounded-md bg-muted/10">
          <p className="text-muted-foreground">Please select a subject to manage its topics.</p>
        </div>
      )}
    </div>
  );
};

export default TopicManager;
