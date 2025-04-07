
import {
  BarChart,
  ResponsiveContainer,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface SubjectBarChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const SubjectBarChart = ({ data }: SubjectBarChartProps) => {
  return (
    <motion.div variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3 }
      }
    }} className="lg:col-span-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Subject Scores Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Score">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SubjectBarChart;
