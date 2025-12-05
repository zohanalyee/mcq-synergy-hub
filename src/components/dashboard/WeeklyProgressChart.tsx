
import {
  LineChart,
  ResponsiveContainer,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface WeeklyProgressChartProps {
  data: Array<{
    date: string;
    score: number;
  }>;
}

const WeeklyProgressChart = ({ data }: WeeklyProgressChartProps) => {
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
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" opacity={0.3} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeeklyProgressChart;
