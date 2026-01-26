import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface Course {
  id: number;
  credits: string;
  grade: string;
}

const gradePoints: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0,
};

const FloatingGPACalculator = () => {
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, credits: '', grade: '' }
  ]);

  const addCourse = () => {
    setCourses([...courses, { id: Date.now(), credits: '', grade: '' }]);
  };

  const removeCourse = (id: number) => {
    if (courses.length > 1) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  const updateCourse = (id: number, field: 'credits' | 'grade', value: string) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const calculateGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;
    
    courses.forEach(course => {
      const credits = parseFloat(course.credits);
      const points = gradePoints[course.grade];
      if (!isNaN(credits) && points !== undefined) {
        totalPoints += credits * points;
        totalCredits += credits;
      }
    });
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {courses.map((course, index) => (
          <div key={course.id} className="flex gap-1.5 items-center">
            <Input
              type="number"
              placeholder="Credits"
              value={course.credits}
              onChange={(e) => updateCourse(course.id, 'credits', e.target.value)}
              className="w-20 h-8 text-sm"
              min="0"
              max="6"
            />
            <Select value={course.grade} onValueChange={(v) => updateCourse(course.id, 'grade', v)}>
              <SelectTrigger className="flex-1 h-8 text-sm">
                <SelectValue placeholder="Grade" />
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
              className="h-8 w-8 shrink-0"
              onClick={() => removeCourse(course.id)}
              disabled={courses.length === 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addCourse} className="w-full gap-1">
        <Plus className="h-3.5 w-3.5" />
        Add Course
      </Button>

      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <p className="text-xs text-muted-foreground">Your GPA</p>
        <p className="text-2xl font-bold text-primary">{calculateGPA()}</p>
      </div>
    </div>
  );
};

export default FloatingGPACalculator;
