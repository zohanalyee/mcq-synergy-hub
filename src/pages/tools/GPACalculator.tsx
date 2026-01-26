import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

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

  return (
    <Header>
      <div className="container py-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 mb-4">
            <GraduationCap className="h-8 w-8 text-violet-500" />
          </div>
          <h1 className="text-2xl font-bold">GPA Calculator</h1>
          <p className="text-muted-foreground">Calculate your grade point average</p>
        </div>
        
        <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-white/20 mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Your Courses</CardTitle>
            <Button size="sm" variant="outline" onClick={addCourse}>
              <Plus className="h-4 w-4 mr-1" /> Add Course
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {courses.map((course, index) => (
              <div key={course.id} className="flex gap-3 items-center">
                <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                <Input
                  placeholder="Course name"
                  value={course.name}
                  onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                  className="flex-1 bg-background"
                />
                <Input
                  type="number"
                  min="1"
                  max="6"
                  value={course.credits}
                  onChange={(e) => updateCourse(course.id, 'credits', parseInt(e.target.value) || 1)}
                  className="w-20 bg-background"
                />
                <Select value={course.grade} onValueChange={(v) => updateCourse(course.id, 'grade', v)}>
                  <SelectTrigger className="w-24 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(gradePoints).map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCourse(course.id)}
                  disabled={courses.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-violet-500/10 border-violet-500/20">
          <CardContent className="py-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Your GPA</div>
              <div className="text-5xl font-bold text-violet-500">{calculateGPA()}</div>
              <div className="text-sm text-muted-foreground mt-2">
                Total Credits: {courses.reduce((sum, c) => sum + c.credits, 0)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Header>
  );
};

export default GPACalculator;
