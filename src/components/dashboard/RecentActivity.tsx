
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const RecentActivity = () => {
  const activities = [
    { id: 1, subject: "Physics", timeAgo: "2 hours" },
    { id: 2, subject: "Mathematics", timeAgo: "Yesterday" },
    { id: 3, subject: "Biology", timeAgo: "3 days" }
  ];

  return (
    <motion.div variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3 }
      }
    }}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {activities.map((item) => (
              <li key={item.id} className="flex items-start gap-3 text-sm">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-primary" />
                <div>
                  <p className="font-medium">Completed {item.subject} test</p>
                  <p className="text-muted-foreground text-xs">
                    {item.timeAgo} ago
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecentActivity;
