
import React from 'react';
import { useJobTestManagement } from '@/hooks/useJobTestManagement';
import AddJobTestDialog from './job-test/AddJobTestDialog';
import JobTestTable from './job-test/JobTestTable';

const JobTestManager = () => {
  const {
    jobTests,
    isAddDialogOpen,
    setIsAddDialogOpen,
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
    handleAddSyllabusItem,
    handleRemoveSyllabusItem,
    handleSyllabusItemChange,
    handleAddJobTest,
    handleRemoveJobTest,
    resetForm
  } = useJobTestManagement();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Job Tests</h3>
        
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
      
      <JobTestTable 
        jobTests={jobTests} 
        onRemove={handleRemoveJobTest} 
      />
    </div>
  );
};

export default JobTestManager;
