
import { useState } from 'react';
import SubjectTable from './subjects/SubjectTable';
import AddSubjectDialog from './subjects/AddSubjectDialog';
import { useSubjects } from './subjects/useSubjects';

const SubjectManager = () => {
  const { subjects, handleAddSubject, handleRemoveSubject, categoriesList } = useSubjects();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Subjects</h3>
        <AddSubjectDialog 
          onAddSubject={handleAddSubject} 
          categories={categoriesList} 
        />
      </div>
      
      <SubjectTable 
        subjects={subjects} 
        onRemove={handleRemoveSubject}
      />
    </div>
  );
};

export default SubjectManager;
