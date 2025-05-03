
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash, Edit, Plus as PlusIcon, X } from "lucide-react";
import { JobTest, SyllabusItem } from "@/data/jobTestsData";
import { getJobTests, addJobTest, removeJobTest } from "@/services/adminService";

const JobTestManager = () => {
  const [jobTests, setJobTests] = useState<JobTest[]>(getJobTests());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organization, setOrganization] = useState('');
  const [duration, setDuration] = useState(90);
  const [questions, setQuestions] = useState(100);
  const [syllabusItems, setSyllabusItems] = useState<SyllabusItem[]>([
    { topic: '', percentage: 0 }
  ]);

  const handleAddSyllabusItem = () => {
    setSyllabusItems([...syllabusItems, { topic: '', percentage: 0 }]);
  };

  const handleRemoveSyllabusItem = (index: number) => {
    setSyllabusItems(syllabusItems.filter((_, i) => i !== index));
  };

  const handleSyllabusItemChange = (index: number, field: 'topic' | 'percentage', value: string | number) => {
    const newItems = [...syllabusItems];
    newItems[index][field] = value;
    setSyllabusItems(newItems);
  };

  const handleAddJobTest = () => {
    if (!title || !description || !organization || !duration || !questions) {
      toast.error("Please fill out all required fields");
      return;
    }

    // Validate syllabus items
    const validSyllabusItems = syllabusItems.filter(item => item.topic && item.percentage > 0);
    if (validSyllabusItems.length === 0) {
      toast.error("Please add at least one valid syllabus item");
      return;
    }

    // Check if total percentage adds up to around 100
    const totalPercentage = validSyllabusItems.reduce((sum, item) => sum + item.percentage, 0);
    if (totalPercentage < 90 || totalPercentage > 110) {
      toast.error(`Total syllabus percentage (${totalPercentage}%) should be approximately 100%`);
      return;
    }

    const newJobTest = {
      title,
      description,
      organization,
      duration,
      questions,
      syllabus: validSyllabusItems,
    };

    const added = addJobTest(newJobTest);
    
    if (added) {
      setJobTests(getJobTests());
      setIsAddDialogOpen(false);
      resetForm();
      toast.success(`Job Test "${title}" added successfully`);
    } else {
      toast.error("Failed to add job test");
    }
  };

  const handleRemoveJobTest = (id: number) => {
    if (window.confirm(`Are you sure you want to delete this job test?`)) {
      const removed = removeJobTest(id);
      
      if (removed) {
        setJobTests(getJobTests());
        toast.success("Job test removed successfully");
      } else {
        toast.error("Failed to remove job test");
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setOrganization('');
    setDuration(90);
    setQuestions(100);
    setSyllabusItems([{ topic: '', percentage: 0 }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Job Tests</h3>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Job Test
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Job Test</DialogTitle>
              <DialogDescription>
                Create a new job test with syllabus details.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">Title</label>
                <Input
                  id="title"
                  placeholder="e.g., Election Officer (BPS-17)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this job test"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="organization" className="text-sm font-medium">Organization</label>
                <Input
                  id="organization"
                  placeholder="e.g., Election Commission"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    placeholder="90"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="questions" className="text-sm font-medium">Number of Questions</label>
                  <Input
                    id="questions"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={questions}
                    onChange={(e) => setQuestions(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Syllabus Items</label>
                  <Button 
                    type="button" 
                    variant="outline"
                    size="sm"
                    onClick={handleAddSyllabusItem}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {syllabusItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Topic (e.g., English)"
                        value={item.topic}
                        onChange={(e) => handleSyllabusItemChange(index, 'topic', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="% (e.g., 20)"
                        value={item.percentage === 0 ? '' : item.percentage}
                        onChange={(e) => handleSyllabusItemChange(index, 'percentage', Number(e.target.value))}
                        className="w-20"
                        min="1"
                        max="100"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveSyllabusItem(index)}
                        disabled={syllabusItems.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
              <Button onClick={handleAddJobTest}>
                Add Job Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {jobTests.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Organization</TableHead>
                <TableHead className="hidden md:table-cell">Duration</TableHead>
                <TableHead className="hidden md:table-cell">Questions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobTests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>
                    <span className="font-medium">{test.title}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {test.organization}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {test.duration} mins
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {test.questions}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveJobTest(test.id)}
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
          <p className="text-muted-foreground">No job tests added yet. Create your first job test.</p>
        </div>
      )}
    </div>
  );
};

export default JobTestManager;
