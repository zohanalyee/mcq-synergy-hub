
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { SyllabusItem } from "@/data/jobTestsData";
import SyllabusItemForm from "./SyllabusItemForm";

interface AddJobTestDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  organization: string;
  setOrganization: (organization: string) => void;
  duration: number;
  setDuration: (duration: number) => void;
  questions: number;
  setQuestions: (questions: number) => void;
  syllabusItems: SyllabusItem[];
  onAddSyllabusItem: () => void;
  onRemoveSyllabusItem: (index: number) => void;
  onSyllabusItemChange: (index: number, field: keyof SyllabusItem, value: string | number) => void;
  onAddJobTest: () => void;
  onReset: () => void;
}

const AddJobTestDialog = ({
  isOpen,
  onOpenChange,
  title,
  setTitle,
  description,
  setDescription,
  organization,
  setOrganization,
  duration,
  setDuration,
  questions,
  setQuestions,
  syllabusItems,
  onAddSyllabusItem,
  onRemoveSyllabusItem,
  onSyllabusItemChange,
  onAddJobTest,
  onReset
}: AddJobTestDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Job Test
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
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
          
          <SyllabusItemForm 
            syllabusItems={syllabusItems}
            onAdd={onAddSyllabusItem}
            onRemove={onRemoveSyllabusItem}
            onChange={onSyllabusItemChange}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
            onReset();
          }}>
            Cancel
          </Button>
          <Button onClick={onAddJobTest}>
            Add Job Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobTestDialog;
