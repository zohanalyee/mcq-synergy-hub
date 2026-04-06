import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useJobTestManagement } from '@/hooks/useJobTestManagement';
import AddJobTestDialog from './job-test/AddJobTestDialog';
import JobTestTable from './job-test/JobTestTable';
import { BulkJobTestImportDialog } from './job-test/BulkJobTestImportDialog';
import { Button } from '@/components/ui/button';
import { FileJson } from 'lucide-react';

const JobTestManager = () => {
  const queryClient = useQueryClient();
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  
  const {
    jobTests,
    isAddDialogOpen,
    setIsAddDialogOpen,
    title, setTitle,
    description, setDescription,
    organization, setOrganization,
    duration, setDuration,
    questions, setQuestions,
    syllabusItems,
    handleAddSyllabusItem,
    handleRemoveSyllabusItem,
    handleSyllabusItemChange,
    handleAddJobTest,
    handleRemoveJobTest,
    resetForm
  } = useJobTestManagement();

  const handleBulkImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["job-tests"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Job Tests</h3>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsBulkImportOpen(true)}
            className="gap-2"
          >
            <FileJson className="h-4 w-4" />
            Bulk Import JSON
          </Button>
          
          <AddJobTestDialog
            isOpen={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            organization={organization}
            setOrganization={setOrganization}
            duration={duration}
            setDuration={setDuration}
            questions={questions}
            setQuestions={setQuestions}
            syllabusItems={syllabusItems}
            onAddSyllabusItem={handleAddSyllabusItem}
            onRemoveSyllabusItem={handleRemoveSyllabusItem}
            onSyllabusItemChange={handleSyllabusItemChange}
            onAddJobTest={handleAddJobTest}
            onReset={resetForm}
          />
        </div>
      </div>
      
      <JobTestTable 
        jobTests={jobTests} 
        onRemove={handleRemoveJobTest} 
      />

      <BulkJobTestImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        onSuccess={handleBulkImportSuccess}
      />
    </div>
  );
};

export default JobTestManager;
