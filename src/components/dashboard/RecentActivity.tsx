
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
        <CardHeader className="pb-1.5">
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <ul className="space-y-3">
            {activities.map((item) => (
              <li key={item.id} className="flex items-start gap-2.5 text-sm">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-primary" />
                <div>
                  <p className="font-medium text-sm">Completed {item.subject} test</p>
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
