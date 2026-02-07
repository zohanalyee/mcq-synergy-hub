
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTopicManagement } from "@/hooks/useTopicManagement";
import TopicList from "./topic/TopicList";
import AddTopicDialog from "./topic/AddTopicDialog";

const TopicManager = () => {
  const {
    subjects,
    selectedSubject,
    setSelectedSubject,
    isAddDialogOpen,
    setIsAddDialogOpen,
    title,
    setTitle,
    content,
    setContent,
    currentTopics,
    handleAddTopic,
    handleRemoveTopic,
    resetForm,
    refreshTopics,
  } = useTopicManagement();

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
                <SelectItem key={subject.name || subject.id} value={subject.name || ''}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end justify-end">
          <AddTopicDialog 
            isOpen={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            selectedSubject={selectedSubject}
            title={title}
            setTitle={setTitle}
            content={content}
            setContent={setContent}
            onAddTopic={handleAddTopic}
            onReset={resetForm}
          />
        </div>
      </div>
      
      {selectedSubject ? (
        <TopicList 
          topics={currentTopics} 
          onRemoveTopic={handleRemoveTopic}
          onRefresh={refreshTopics}
        />
      ) : (
        <div className="text-center p-10 border rounded-md bg-muted/10">
          <p className="text-muted-foreground">Please select a subject to manage its topics.</p>
        </div>
      )}
    </div>
  );
};

export default TopicManager;
