import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronLeft, Plus, Trash2, Calendar, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getHolidays, addHoliday, deleteHoliday } from '@/services/attendanceService';
import type { Holiday } from '@/types/attendance.types';

const HolidaysPage = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [form, setForm] = useState({ name: '', date: '', type: 'Public' as any, applies_to: 'All' as any, description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHolidays().then(h => { setHolidays(h); setLoading(false); }).catch(console.error);
  }, []);

  const handleAdd = async () => {
    if (!form.name || !form.date) return toast.error('Name and date are required');
    try {
      await addHoliday(form);
      setForm({ name: '', date: '', type: 'Public', applies_to: 'All', description: '' });
      toast.success('Holiday added!');
      getHolidays().then(setHolidays);
    } catch { toast.error('Failed to add holiday'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHoliday(id);
      toast.success('Holiday removed');
      getHolidays().then(setHolidays);
    } catch { toast.error('Failed to delete'); }
  };

  const TYPE_COLORS: Record<string, string> = {
    Public: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300',
    Restricted: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300',
    Optional: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300',
  };

  return (
    <Header>
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tools/hr"><ChevronLeft className="h-4 w-4" /> Back</Link>
          </Button>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-600" /> Holiday Calendar
          </h1>
        </div>

        {/* Add Holiday */}
        <Card>
          <CardHeader><CardTitle className="text-base">Add Holiday</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input placeholder="Holiday name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Public Holiday</SelectItem>
                <SelectItem value="Restricted">Restricted Holiday</SelectItem>
                <SelectItem value="Optional">Optional Holiday</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.applies_to} onValueChange={v => setForm(p => ({ ...p, applies_to: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All (Staff + Students)</SelectItem>
                <SelectItem value="Staff">Staff Only</SelectItem>
                <SelectItem value="Students">Students Only</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Description (optional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1" /> Add Holiday</Button>
          </CardContent>
        </Card>

        {/* Holiday List */}
        <div className="text-sm text-muted-foreground">{holidays.length} holidays defined</div>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-2">
            {holidays.map((h, i) => (
              <motion.div key={h.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="border">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-lg font-bold text-primary leading-none">{new Date(h.date + 'T00:00:00').getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{h.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-[10px] ${TYPE_COLORS[h.type || 'Public']}`}>{h.type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{h.applies_to}</span>
                        {h.description && <span className="text-[10px] text-muted-foreground truncate">· {h.description}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive shrink-0" onClick={() => handleDelete(h.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {holidays.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No holidays added yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Header>
  );
};

export default HolidaysPage;
