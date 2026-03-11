import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, ChevronLeft, Calendar, TrendingUp, Users, UserCheck, UserX } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a855f7', '#6366f1', '#e11d48', '#84cc16', '#0ea5e9', '#d946ef'];

const AttendanceAnalytics = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-analytics', date, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_attendance_summary' as any)
        .select('*')
        .eq('attendance_date', date)
        .order('class_id');
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const stats = (attendanceData || []).reduce(
    (acc: any, curr: any) => ({
      totalStudents: acc.totalStudents + (curr.total_students || 0),
      totalPresent: acc.totalPresent + (curr.present_students || 0),
      totalAbsent: acc.totalAbsent + (curr.absent_students || 0),
    }),
    { totalStudents: 0, totalPresent: 0, totalAbsent: 0 }
  );

  const overallPercentage = stats.totalStudents > 0
    ? Math.round((stats.totalPresent / stats.totalStudents) * 100) : 0;

  const barChartData = (attendanceData || []).map((d: any) => ({
    class: d.class_name,
    Present: d.present_students,
    Absent: d.absent_students,
  }));

  const pieChartData = [
    { name: 'Present', value: stats.totalPresent, color: '#22c55e' },
    { name: 'Absent', value: stats.totalAbsent, color: '#ef4444' },
  ];

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const element = document.getElementById('analytics-content');
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2, logging: false, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Daily Attendance Report', pdfWidth / 2, 15, { align: 'center' });

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      pdf.text(formattedDate, pdfWidth / 2, 23, { align: 'center' });

      // Content
      let yPosition = 30;
      if (imgHeight > pdfHeight - 50) {
        let heightLeft = imgHeight;
        let position = 0;
        while (heightLeft > 0) {
          pdf.addImage(imgData, 'PNG', 10, yPosition - position, imgWidth, imgHeight);
          heightLeft -= (pdfHeight - 50);
          position += (pdfHeight - 50);
          if (heightLeft > 0) {
            pdf.addPage();
            yPosition = 10;
          }
        }
      } else {
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
      }

      // Watermark
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(40);
        pdf.setTextColor(220, 220, 220);
        pdf.text('AI-MCQs Point', pdfWidth / 2, pdfHeight / 2, { align: 'center', angle: 45 });
        // Footer
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text('AI-MCQs Point | mcqsai.com', pdfWidth / 2, pdfHeight - 8, { align: 'center' });
      }

      pdf.save(`attendance-report-${date}.pdf`);
      toast.success('PDF report downloaded!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (pct: number) => {
    if (pct >= 75) return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0">Good</Badge>;
    if (pct >= 50) return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0">Poor</Badge>;
  };

  const getBarColor = (pct: number) => {
    if (pct >= 75) return 'bg-green-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <Header>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Header>
    );
  }

  return (
    <Header>
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tools/hr"><ChevronLeft className="h-4 w-4" /> Back</Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Attendance Analytics</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
            <Button onClick={generatePDF} disabled={generating || !attendanceData?.length}>
              {generating ? (
                <><span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" /> Generating...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> PDF Report</>
              )}
            </Button>
          </div>
        </motion.div>

        {!attendanceData?.length ? (
          <Card className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold">No Data for This Date</h2>
            <p className="text-muted-foreground text-sm mt-1">Use Quick Manual Entry to record attendance first.</p>
            <Button className="mt-4" asChild>
              <Link to="/tools/hr/quick-entry">Go to Quick Entry</Link>
            </Button>
          </Card>
        ) : (
          <div id="analytics-content" className="space-y-5 bg-background p-1">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                { label: 'Present', value: stats.totalPresent, icon: UserCheck, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' },
                { label: 'Absent', value: stats.totalAbsent, icon: UserX, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
                { label: 'Overall %', value: `${overallPercentage}%`, icon: TrendingUp, color: overallPercentage >= 75 ? 'text-green-600 dark:text-green-400' : overallPercentage >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={stat.bg}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${stat.bg}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Class-wise Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="class" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={70} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Overall Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Detailed Class Report</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold">Class</th>
                      <th className="text-center px-4 py-2 font-semibold">Total</th>
                      <th className="text-center px-4 py-2 font-semibold">Present</th>
                      <th className="text-center px-4 py-2 font-semibold">Absent</th>
                      <th className="text-center px-4 py-2 font-semibold w-44">Percentage</th>
                      <th className="text-center px-4 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(attendanceData || []).map((row: any) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className="px-4 py-2 font-medium">{row.class_name}</td>
                        <td className="px-4 py-2 text-center">{row.total_students}</td>
                        <td className="px-4 py-2 text-center text-green-600 dark:text-green-400 font-medium">{row.present_students}</td>
                        <td className="px-4 py-2 text-center text-red-600 dark:text-red-400 font-medium">{row.absent_students}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className={cn('h-full rounded-full', getBarColor(row.attendance_percentage))} style={{ width: `${row.attendance_percentage}%` }} />
                            </div>
                            <span className="text-xs font-semibold w-10 text-right">{row.attendance_percentage}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">{getStatusBadge(row.attendance_percentage)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Header>
  );
};

export default AttendanceAnalytics;
