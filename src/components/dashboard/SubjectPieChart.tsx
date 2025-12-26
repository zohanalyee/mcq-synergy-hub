import {
  PieChart,
  ResponsiveContainer,
  Pie,
  Cell,
  Tooltip,
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
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Subject Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* Donut Chart */}
            <div className="flex-shrink-0">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Score']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex-1 space-y-1.5 max-h-40 overflow-y-auto">
              {data.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground truncate flex-1">
                    {entry.name}
                  </span>
                  <span className="font-medium text-foreground">
                    {entry.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SubjectPieChart;
