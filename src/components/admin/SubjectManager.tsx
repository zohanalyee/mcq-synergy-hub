
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit, Trash } from "lucide-react";
import { Subject } from "@/data/subjectsData";
import { getSubjects, addSubject, removeSubject } from "@/services/adminService";

const SubjectManager = () => {
  const [subjects, setSubjects] = useState<Subject[]>(getSubjects());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Core Sciences');
  const [purpose, setPurpose] = useState<'reading' | 'mcqs'>('reading');
  const [color, setColor] = useState('#3b82f6');

  const handleAddSubject = () => {
    if (!title || !description) {
      toast.error("Please fill out all required fields");
      return;
    }

    const newSubject = {
      title,
      description,
      category,
      purpose,
      color,
      icon: <Plus className="h-6 w-6" style={{ color }} />,
    };

    const added = addSubject(newSubject);
    
    if (added) {
      setSubjects(getSubjects());
      setIsAddDialogOpen(false);
      resetForm();
      toast.success(`Subject "${title}" added successfully`);
    } else {
      toast.error("Failed to add subject");
    }
  };

  const handleRemoveSubject = (title: string) => {
    if (window.confirm(`Are you sure you want to delete the subject "${title}"?`)) {
      const removed = removeSubject(title);
      
      if (removed) {
        setSubjects(getSubjects());
        toast.success(`Subject "${title}" removed successfully`);
      } else {
        toast.error("Failed to remove subject");
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Core Sciences');
    setPurpose('reading');
    setColor('#3b82f6');
  };

  const categories = [
    "Core Sciences",
    "Social Sciences",
    "Agriculture & Environment",
    "Management Sciences",
    "Engineering",
    "Medical Sciences",
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Subjects</h3>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>
                Create a new subject that will be available across the platform.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">Title</label>
                <Input
                  id="title"
                  placeholder="e.g., Mathematics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this subject"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="category" className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="purpose" className="text-sm font-medium">Purpose</label>
                <Select value={purpose} onValueChange={(val: 'reading' | 'mcqs') => setPurpose(val)}>
                  <SelectTrigger id="purpose">
                    <SelectValue placeholder="Select a purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="mcqs">MCQs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="color" className="text-sm font-medium">Color</label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddSubject}>
                Add Subject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {subjects.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Topics</TableHead>
                <TableHead className="hidden md:table-cell">Purpose</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.title}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: subject.color }} 
                      />
                      <span className="font-medium">{subject.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {subject.category}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {subject.topicCount}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {subject.purpose === 'mcqs' ? 'MCQs' : 'Reading'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveSubject(subject.title)}
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
          <p className="text-muted-foreground">No subjects added yet. Create your first subject.</p>
        </div>
      )}
    </div>
  );
};

export default SubjectManager;
