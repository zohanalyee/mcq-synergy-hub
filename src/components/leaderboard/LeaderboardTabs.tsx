
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeaderboardList from "./LeaderboardList";
import { weeklyLeaders, monthlyLeaders, allTimeLeaders } from "@/data/leaderboardData";

interface LeaderboardTabsProps {
  filter: string;
}

const LeaderboardTabs = ({ filter }: LeaderboardTabsProps) => {
  return (
    <Tabs defaultValue="weekly" className="mt-6">
      <TabsList className="mb-6">
        <TabsTrigger value="weekly">Weekly</TabsTrigger>
        <TabsTrigger value="monthly">Monthly</TabsTrigger>
        <TabsTrigger value="allTime">All Time</TabsTrigger>
      </TabsList>
      
      <TabsContent value="weekly">
        <LeaderboardList leaders={weeklyLeaders} filter={filter} />
      </TabsContent>
      
      <TabsContent value="monthly">
        <LeaderboardList leaders={monthlyLeaders} filter={filter} />
      </TabsContent>
      
      <TabsContent value="allTime">
        <LeaderboardList leaders={allTimeLeaders} filter={filter} />
      </TabsContent>
    </Tabs>
  );
};

export default LeaderboardTabs;
