import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  Archive, 
  BookOpen, 
  CheckCircle2, 
  FolderTree,
  RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchContentStats, AggregatedStats } from "@/services/contentStatsService";
import { toast } from "sonner";

const ContentInventory = () => {
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchContentStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load content stats:", error);
      toast.error("Failed to load content statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!stats) return [];
    if (selectedSubject === "all") return stats.subjects;
    return stats.subjects.filter((s) => s.name === selectedSubject);
  }, [stats, selectedSubject]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Content Inventory
          </h2>
          <p className="text-sm text-muted-foreground">
            Track question counts by subject and topic to identify gaps
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Archive className="h-3.5 w-3.5" />
              Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">{stats.grandTotal.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">{stats.subjects.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5" />
              Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">{stats.totalTopics}</p>
          </CardContent>
        </Card>

        <Card className={stats.lowContentCount > 0 ? "border-destructive/50 bg-destructive/5" : "border-green-500/50 bg-green-500/5"}>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              {stats.lowContentCount > 0 ? (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              )}
              Low Content
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className={`text-2xl font-bold ${stats.lowContentCount > 0 ? "text-destructive" : "text-green-600"}`}>
              {stats.lowContentCount}
            </p>
            <p className="text-[10px] text-muted-foreground">Topics with &lt;10 questions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by:</span>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {stats.subjects.map((s) => (
              <SelectItem key={s.name} value={s.name}>
                {s.name} ({s.totalApproved})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Accordion Table */}
      {filteredSubjects.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No subjects found
          </CardContent>
        </Card>
      ) : (
        <Accordion 
          type="multiple" 
          className="space-y-2"
          defaultValue={filteredSubjects.length <= 5 ? filteredSubjects.map(s => s.name) : []}
        >
          {filteredSubjects.map((subject) => (
            <AccordionItem 
              key={subject.name} 
              value={subject.name}
              className="border rounded-lg bg-card px-4"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between flex-1 mr-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium">{subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {subject.topics.length} topics
                    </Badge>
                    <Badge variant="outline" className="text-xs font-semibold">
                      {subject.totalApproved} questions
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60%]">Topic</TableHead>
                      <TableHead className="text-right">Approved Questions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subject.topics.map((topic) => {
                      const isLowContent = topic.approvedCount < 10;
                      return (
                        <TableRow key={topic.name}>
                          <TableCell className="font-medium">{topic.name}</TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-sm font-medium ${
                                isLowContent
                                  ? "bg-destructive/10 text-destructive"
                                  : ""
                              }`}
                            >
                              {isLowContent && (
                                <AlertTriangle className="h-3.5 w-3.5" />
                              )}
                              {topic.approvedCount}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </motion.div>
  );
};

export default ContentInventory;
