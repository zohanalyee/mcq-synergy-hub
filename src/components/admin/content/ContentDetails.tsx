
import { Calendar } from "lucide-react";
import { ContentItem } from "@/interfaces/content";

interface ContentDetailsProps {
  item: ContentItem;
}

const ContentDetails: React.FC<ContentDetailsProps> = ({ item }) => {
  const details = [];
  
  if (item.deadline) {
    details.push(
      <div key="deadline" className="flex items-center text-sm text-muted-foreground">
        <Calendar className="h-3 w-3 mr-1" />
        <span>Deadline: {item.deadline}</span>
      </div>
    );
  }
  
  switch (item.category) {
    case 'job':
      if (item.cadre) {
        details.push(<div key="cadre" className="text-sm text-muted-foreground mt-0.5">Cadre: {item.cadre}</div>);
      }
      if (item.department) {
        details.push(<div key="dept" className="text-sm text-muted-foreground mt-0.5">Department: {item.department}</div>);
      }
      if (item.governmentLevel) {
        details.push(<div key="level" className="text-sm text-muted-foreground mt-0.5">Level: {item.governmentLevel}</div>);
      }
      break;
      
    case 'scholarship':
      if (item.scholarshipType) {
        details.push(<div key="type" className="text-sm text-muted-foreground mt-0.5">Type: {item.scholarshipType}</div>);
      }
      if (item.institution) {
        details.push(<div key="inst" className="text-sm text-muted-foreground mt-0.5">Institution: {item.institution}</div>);
      }
      break;
      
    case 'past_paper':
      if (item.examType) {
        details.push(<div key="examType" className="text-sm text-muted-foreground mt-0.5">Type: {item.examType}</div>);
      }
      if (item.examYear) {
        details.push(<div key="examYear" className="text-sm text-muted-foreground mt-0.5">Year: {item.examYear}</div>);
      }
      break;
  }
  
  return details.length > 0 ? <div className="mt-1">{details}</div> : null;
};

export default ContentDetails;
