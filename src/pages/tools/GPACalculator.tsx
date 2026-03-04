import { Plus, Trash2, Info } from 'lucide-react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface Course {
  id: string;
  name: string;
  credits: number;
  grade: string;
}

const gradePoints: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
};

const GPACalculator = () => {
  const [courses, setCourses] = useState<Course[]>([
    { id: '1', name: '', credits: 3, grade: 'A' },
  ]);

  const addCourse = () => {
    setCourses([...courses, { id: Date.now().toString(), name: '', credits: 3, grade: 'A' }]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof Course, value: string | number) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const calculateGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;
    courses.forEach(course => {
      const points = gradePoints[course.grade] || 0;
      totalPoints += points * course.credits;
      totalCredits += course.credits;
    });
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  const gpa = calculateGPA();

  return (
    <Header>
      <ToolWrapper toolId="gpa-calculator" title="GPA Calculator" description="Calculate your grade point average" category="Student Tools">
        {/* How-to info box */}
        <div className="rounded-lg border border-border/60 bg-accent/30 p-4 mb-6">
          <div className="flex gap-2 items-start">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">How to calculate your GPA:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Enter each course/subject name</li>
                <li>Select the grade you received (A+, A, B+, etc.)</li>
                <li>Enter the credit hours for that course (usually 1–6)</li>
                <li>Click "Add Course" for more courses</li>
                <li>Your GPA is calculated automatically</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-[2rem_1fr_5rem_6rem_2.5rem] gap-3 items-center mb-2 px-1">
          <span className="text-xs text-muted-foreground">#</span>
          <Label className="text-xs">Course Name</Label>
          <Label className="text-xs">Credits</Label>
          <Label className="text-xs">Grade</Label>
          <span />
        </div>

        <div className="space-y-3">
          {courses.map((course, index) => (
            <div key={course.id} className="grid grid-cols-1 sm:grid-cols-[2rem_1fr_5rem_6rem_2.5rem] gap-2 sm:gap-3 items-end sm:items-center p-3 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-border/40">
              <span className="hidden sm:block text-sm text-muted-foreground text-center">{index + 1}.</span>

              <div className="space-y-1 sm:space-y-0">
                <Label className="sm:hidden text-xs text-muted-foreground">Course Name</Label>
                <Input
                  placeholder="e.g. Mathematics"
                  value={course.name}
                  onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="flex gap-2 sm:contents">
                <div className="flex-1 sm:flex-none space-y-1 sm:space-y-0">
                  <Label className="sm:hidden text-xs text-muted-foreground">Credits</Label>
                  <Input
                    type="number"
                    min="1"
                    max="6"
                    value={course.credits}
                    onChange={(e) => updateCourse(course.id, 'credits', parseInt(e.target.value) || 1)}
                    className="bg-background"
                    placeholder="3"
                  />
                </div>

                <div className="flex-1 sm:flex-none space-y-1 sm:space-y-0">
                  <Label className="sm:hidden text-xs text-muted-foreground">Grade</Label>
                  <Select value={course.grade} onValueChange={(v) => updateCourse(course.id, 'grade', v)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(gradePoints).map(([grade, pts]) => (
                        <SelectItem key={grade} value={grade}>{grade} ({pts.toFixed(1)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCourse(course.id)}
                  disabled={courses.length === 1}
                  className="self-end sm:self-auto shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addCourse} className="mt-4 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Course
        </Button>

        {/* GPA Result */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-5 rounded-xl bg-accent/30 text-center space-y-2"
        >
          <p className="text-sm text-muted-foreground">Your GPA</p>
          <p className="text-5xl font-bold text-foreground">{gpa}</p>
          <p className="text-sm text-muted-foreground">
            Based on {courses.length} course{courses.length !== 1 ? 's' : ''} · {courses.reduce((s, c) => s + c.credits, 0)} total credits
          </p>
          <CopyButton text={gpa} />
        </motion.div>
      </ToolWrapper>
    </Header>
  );
};

export default GPACalculator;
