
import {
  PieChart,
  ResponsiveContainer,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface SubjectPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const SubjectPieChart = ({ data }: SubjectPieChartProps) => {
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
          <CardTitle className="text-lg font-medium">Subject Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SubjectPieChart;
