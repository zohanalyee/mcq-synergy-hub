
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  AreaChart, 
  ResponsiveContainer, 
  Bar, 
  Line, 
  Pie, 
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";
import { motion } from "framer-motion";
import Header from "@/components/Header";

const data = [
  { name: "Mathematics", value: 78, color: "#3b82f6" },
  { name: "Computer Science", value: 65, color: "#10b981" },
  { name: "Physics", value: 45, color: "#8b5cf6" },
  { name: "Chemistry", value: 30, color: "#ef4444" },
  { name: "Biology", value: 50, color: "#22c55e" },
  { name: "English", value: 60, color: "#f97316" },
];

const lineData = [
  { date: "Mon", score: 65 },
  { date: "Tue", score: 59 },
  { date: "Wed", score: 80 },
  { date: "Thu", score: 81 },
  { date: "Fri", score: 56 },
  { date: "Sat", score: 75 },
  { date: "Sun", score: 85 },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">View your progress and analytics</p>
        </motion.div>

        <div className="mb-8">
          <div className="flex space-x-4 border-b border-border/40 mb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-2 px-1 transition-all ${
                activeTab === "overview" 
                  ? "border-b-2 border-primary font-medium" 
                  : "text-muted-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("performance")}
              className={`pb-2 px-1 transition-all ${
                activeTab === "performance" 
                  ? "border-b-2 border-primary font-medium" 
                  : "text-muted-foreground"
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveTab("subjects")}
              className={`pb-2 px-1 transition-all ${
                activeTab === "subjects" 
                  ? "border-b-2 border-primary font-medium" 
                  : "text-muted-foreground"
              }`}
            >
              Subjects
            </button>
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <motion.div variants={cardVariant}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Weekly Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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

          <motion.div variants={cardVariant}>
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

          <motion.div variants={cardVariant}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 mt-1.5 rounded-full bg-primary" />
                      <div>
                        <p className="font-medium">Completed {item === 1 ? "Physics" : item === 2 ? "Mathematics" : "Biology"} test</p>
                        <p className="text-muted-foreground text-xs">
                          {item === 1 ? "2 hours" : item === 2 ? "Yesterday" : "3 days"} ago
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariant} className="lg:col-span-3">
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
        </motion.div>
      </div>
    </>
  );
};

export default Dashboard;
