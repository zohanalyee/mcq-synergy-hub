
import TopicCard from "./TopicCard";
import { Card, CardContent } from "@/components/ui/card";

interface Topic {
  title: string;
  content: string;
}

interface TopicsListProps {
  topics: Topic[];
  purpose: string;
}

const TopicsList = ({ topics, purpose }: TopicsListProps) => {
  if (topics.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground py-8">
            Content for this subject is coming soon! Check back later for {purpose === "reading" ? "reading" : "practice"} materials.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {topics.map((topic, index) => (
        <TopicCard 
          key={index}
          title={topic.title} 
          content={topic.content} 
          index={index}
        />
      ))}
    </div>
  );
};

export default TopicsList;
