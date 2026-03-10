import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type UploadType = 'students' | 'staff';

interface BulkCSVUploadDialogProps {
  type: UploadType;
  classes: { id: string; name: string }[];
  sections: { id: string; class_id: string; name: string }[];
  onSuccess: () => void;
  children: React.ReactNode;
}

interface ParsedRow {
  [key: string]: string;
}

const STUDENT_HEADERS = ['admission_number', 'full_name', 'class_name', 'section_name', 'roll_number', 'parent_mobile', 'parent_email'];
const STAFF_HEADERS = ['employee_id', 'full_name', 'designation', 'department', 'mobile', 'email'];

// Flexible column name aliases for robust CSV matching
const COLUMN_ALIASES: Record<string, string[]> = {
  admission_number: ['admission_number', 'admission_no', 'adm_no', 'admno', 'admission', 'reg_no', 'registration_number', 'registration_no'],
  full_name: ['full_name', 'fullname', 'name', 'student_name', 'studentname', 'student'],
  class_name: ['class_name', 'classname', 'class', 'grade', 'form', 'standard', 'std'],
  section_name: ['section_name', 'sectionname', 'section', 'stream', 'division', 'div', 'sec'],
  roll_number: ['roll_number', 'rollnumber', 'roll_no', 'rollno', 'roll', 'sr_no', 'serial'],
  parent_mobile: ['parent_mobile', 'parentmobile', 'parent_phone', 'parentphone', 'mobile', 'phone', 'contact', 'father_mobile', 'mother_mobile', 'guardian_mobile'],
  parent_email: ['parent_email', 'parentemail', 'email', 'parent_mail', 'guardian_email'],
  employee_id: ['employee_id', 'employeeid', 'emp_id', 'empid', 'employee_no', 'emp_no'],
  designation: ['designation', 'position', 'role', 'title', 'job_title'],
  department: ['department', 'dept', 'department_name'],
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_\s]+/g, '_').trim();
}

function mapHeaderToCanonical(rawHeader: string): string {
  const normalized = normalizeHeader(rawHeader);
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some(a => normalized === a || normalized.startsWith(a) || a.startsWith(normalized))) {
      return canonical;
    }
  }
  return normalized;
}

const BulkCSVUploadDialog = ({ type, classes, sections, onSuccess, children }: BulkCSVUploadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const headers = type === 'students' ? STUDENT_HEADERS : STAFF_HEADERS;

  const downloadTemplate = () => {
    const csv = headers.join(',') + '\n' +
      (type === 'students'
        ? 'STU001,Ali Khan,Class 10,A,1,03001234567,parent@email.com\nSTU002,Sara Ahmed,Class 10,B,2,03009876543,'
        : 'EMP001,Ahmad Ali,Teacher,Mathematics,03001234567,ahmad@email.com\nEMP002,Fatima Khan,Admin,Administration,03009876543,');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const rawHeaders = lines[0].split(',').map(h => h.trim());
    const canonicalHeaders = rawHeaders.map(h => mapHeaderToCanonical(h));
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      const row: ParsedRow = {};
      canonicalHeaders.forEach((h, i) => { row[h] = vals[i] || ''; });
      return row;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      setErrors(['Please upload a .csv file']);
      return;
    }
    setFile(f);
    setErrors([]);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target?.result as string);
      setPreview(rows.slice(0, 5));
      // Validate
      const errs: string[] = [];
      if (rows.length === 0) errs.push('CSV is empty or has no data rows');
      rows.forEach((row, i) => {
        if (type === 'students') {
          if (!row.admission_number) errs.push(`Row ${i + 2}: Missing admission_number`);
          if (!row.full_name) errs.push(`Row ${i + 2}: Missing full_name`);
        } else {
          if (!row.employee_id) errs.push(`Row ${i + 2}: Missing employee_id`);
          if (!row.full_name) errs.push(`Row ${i + 2}: Missing full_name`);
          if (!row.designation) errs.push(`Row ${i + 2}: Missing designation`);
        }
      });
      if (errs.length > 10) setErrors([...errs.slice(0, 10), `...and ${errs.length - 10} more errors`]);
      else setErrors(errs);
    };
    reader.readAsText(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      const text = await new Promise<string>((res) => {
        reader.onload = (e) => res(e.target?.result as string);
        reader.readAsText(file);
      });
      const rows = parseCSV(text);
      let success = 0, failed = 0;
      let classesCreated = 0, sectionsCreated = 0;

      if (type === 'students') {
        // Build mutable maps from existing data
        const classMap = new Map(classes.map(c => [c.name.toLowerCase(), c.id]));
        const sectionsList = [...sections];

        // 1. Collect unique class names from CSV
        const uniqueClassNames = new Set(
          rows.map(r => r.class_name?.trim()).filter(Boolean)
        );

        // 2. Auto-create missing classes
        for (const className of uniqueClassNames) {
          if (!classMap.has(className.toLowerCase())) {
            const { data, error } = await supabase
              .from('classes')
              .insert({ name: className })
              .select()
              .single();
            if (data && !error) {
              classMap.set(className.toLowerCase(), data.id);
              classesCreated++;
            } else {
              console.error('Failed to create class:', className, error);
            }
          }
        }

        // 3. Collect unique (class, section) pairs and auto-create missing sections
        const sectionPairs = new Set(
          rows
            .filter(r => r.class_name?.trim() && r.section_name?.trim())
            .map(r => `${r.class_name.trim().toLowerCase()}|||${r.section_name.trim().toLowerCase()}`)
        );

        for (const pair of sectionPairs) {
          const [classKey, sectionKey] = pair.split('|||');
          const classId = classMap.get(classKey);
          if (!classId) continue;
          const exists = sectionsList.some(
            s => s.class_id === classId && s.name.toLowerCase() === sectionKey
          );
          if (!exists) {
            const sectionName = rows.find(
              r => r.section_name?.trim().toLowerCase() === sectionKey
            )?.section_name?.trim() || sectionKey;
            const { data, error } = await supabase
              .from('sections')
              .insert({ class_id: classId, name: sectionName })
              .select()
              .single();
            if (data && !error) {
              sectionsList.push({ id: data.id, class_id: classId, name: data.name });
              sectionsCreated++;
            } else {
              console.error('Failed to create section:', sectionName, error);
            }
          }
        }

        // 4. Map students using complete lookup maps
        const records = rows.map(row => {
          const classId = classMap.get(row.class_name?.trim().toLowerCase() || '') || null;
          const sectionId = classId
            ? sectionsList.find(s => s.class_id === classId && s.name.toLowerCase() === (row.section_name?.trim().toLowerCase() || ''))?.id || null
            : null;
          return {
            admission_number: row.admission_number,
            full_name: row.full_name,
            class_id: classId,
            section_id: sectionId,
            roll_number: row.roll_number || null,
            parent_mobile: row.parent_mobile || null,
            parent_email: row.parent_email || null,
            status: 'Active',
          };
        }).filter(r => r.admission_number && r.full_name);

        for (let i = 0; i < records.length; i += 50) {
          const chunk = records.slice(i, i + 50);
          const { error } = await supabase.from('att_students').insert(chunk);
          if (error) { failed += chunk.length; console.error(error); }
          else success += chunk.length;
        }
      } else {
        const records = rows.map(row => ({
          employee_id: row.employee_id,
          full_name: row.full_name,
          designation: row.designation || 'Staff',
          department: row.department || null,
          mobile: row.mobile || null,
          email: row.email || null,
          status: 'Active',
        })).filter(r => r.employee_id && r.full_name);

        for (let i = 0; i < records.length; i += 50) {
          const chunk = records.slice(i, i + 50);
          const { error } = await supabase.from('att_staff').insert(chunk);
          if (error) { failed += chunk.length; console.error(error); }
          else success += chunk.length;
        }
      }

      setResult({ success, failed });
      if (success > 0) {
        const extras = [];
        if (classesCreated > 0) extras.push(`${classesCreated} classes`);
        if (sectionsCreated > 0) extras.push(`${sectionsCreated} sections`);
        const extraMsg = extras.length > 0 ? ` (auto-created ${extras.join(' & ')})` : '';
        toast.success(`${success} ${type} imported successfully${extraMsg}`);
        onSuccess();
      }
      if (failed > 0) toast.error(`${failed} records failed to import`);
    } catch (e) {
      console.error(e);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk Import {type === 'students' ? 'Students' : 'Staff'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" /> Download CSV Template
          </Button>

          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            {file ? (
              <div className="space-y-1">
                <FileSpreadsheet className="h-8 w-8 mx-auto text-primary" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">Click to change file</p>
              </div>
            ) : (
              <div className="space-y-1 text-muted-foreground">
                <Upload className="h-8 w-8 mx-auto" />
                <p className="text-sm">Click to select a CSV file</p>
                <p className="text-xs">Headers: {headers.join(', ')}</p>
              </div>
            )}
          </div>

          {preview.length > 0 && (
            <div className="border rounded-md overflow-x-auto max-h-40">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>{Object.keys(preview[0]).map(h => <th key={h} className="px-2 py-1 text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t">
                      {Object.values(row).map((v, j) => <td key={j} className="px-2 py-1 truncate max-w-[120px]">{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4 text-xs space-y-0.5">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm">
                Imported <strong>{result.success}</strong> records.
                {result.failed > 0 && <> <strong className="text-destructive">{result.failed}</strong> failed.</>}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpload}
              disabled={!file || errors.length > 0 || uploading || !!result}
            >
              {uploading ? 'Importing...' : `Import ${type === 'students' ? 'Students' : 'Staff'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkCSVUploadDialog;
