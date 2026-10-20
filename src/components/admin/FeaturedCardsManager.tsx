import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowUp, ArrowDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { BADGES, ICONS, cardState, isValidHref, pkToday, type FeaturedCard } from '@/lib/featuredCards';
import examSnapshot from '@/data/examFactsSnapshot.json';

const FACTS: Record<string, any> = Object.fromEntries((examSnapshot as any[]).map((r) => [r.slug, r.facts]));
const SLUGS = (examSnapshot as any[]).map((r) => r.slug as string).sort();
const db = supabase as any;
const EMPTY: FeaturedCard = { title: '', subtitle: '', badge: 'PRACTICE NOW', href: '/', deadline_date: null, exam_slug: null, closed_days: 0, is_active: true, icon: 'Sparkles', placements: 'both' };
const sel = 'w-full h-10 rounded-md border bg-background px-2 text-sm';

export default function FeaturedCardsManager() {
  const [cards, setCards] = useState<FeaturedCard[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [edit, setEdit] = useState<FeaturedCard | null>(null);
  const today = pkToday(Date.now());

  const load = async () => {
    const [c, f] = await Promise.all([
      db.from('featured_cards').select('*').order('sort_order'),
      db.from('system_settings').select('value').eq('key', 'featured_block_enabled').maybeSingle(),
    ]);
    if (c.error) toast.error('Could not load featured cards'); else setCards(c.data);
    setEnabled(f.data ? f.data.value !== false : true);
  };
  useEffect(() => { load(); }, []);

  const toggleBlock = async (v: boolean) => {
    setEnabled(v);
    const { error } = await db.from('system_settings').upsert({ key: 'featured_block_enabled', value: v, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) { toast.error('Could not save'); setEnabled(!v); } else toast.success(v ? 'Featured block shown' : 'Featured block hidden');
  };
  const patch = async (id: string, values: Partial<FeaturedCard>) => {
    const { error } = await db.from('featured_cards').update(values).eq('id', id);
    if (error) toast.error(error.message); else load();
  };
  const move = async (i: number, dir: -1 | 1) => {
    const a = cards[i], b = cards[i + dir];
    if (!a || !b) return;
    await Promise.all([
      db.from('featured_cards').update({ sort_order: i + dir + 1 }).eq('id', a.id),
      db.from('featured_cards').update({ sort_order: i + 1 }).eq('id', b.id),
    ]);
    load();
  };
  const save = async () => {
    if (!edit) return;
    if (!edit.title.trim()) return toast.error('Title is required');
    if (!isValidHref(edit.href)) return toast.error('Link must start with / or https://');
    const row = { ...edit, deadline_date: edit.deadline_date || null, exam_slug: edit.exam_slug || null, closed_days: Number(edit.closed_days) || 0 };
    const { id, ...values } = row as any;
    const res = id
      ? await db.from('featured_cards').update(values).eq('id', id)
      : await db.from('featured_cards').insert({ ...values, sort_order: cards.length + 1 });
    if (res.error) return toast.error(res.error.message);
    toast.success('Card saved'); setEdit(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this card? (Switching it off is usually enough.)')) return;
    await db.from('featured_cards').delete().eq('id', id); load();
  };

  return (
    <Card className="mb-4">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          Featured Cards (homepage + /exams)
          <label className="flex items-center gap-2 text-xs font-normal">Show block <Switch checked={enabled} onCheckedChange={toggleBlock} /></label>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {cards.map((c, i) => {
          const s = cardState({ ...c, is_active: true }, FACTS, today);
          return (
            <div key={c.id} className="rounded-lg border p-2.5 flex items-center gap-2">
              <div className="flex flex-col">
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === cards.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {s ? `${s.badge}${s.note ? ' · ' + s.note : ''}` : 'Hidden (deadline passed)'} · {c.href} · {c.placements}
                </p>
              </div>
              <Switch checked={c.is_active} onCheckedChange={(v) => patch(c.id!, { is_active: v })} aria-label="Active" />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEdit(c)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
            </div>
          );
        })}
        {!edit && <Button size="sm" onClick={() => setEdit({ ...EMPTY })}><Plus className="h-4 w-4 mr-1" /> Add card</Button>}

        {edit && (
          <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
            <Input placeholder="Title" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            <Input placeholder="Short line" value={edit.subtitle} onChange={(e) => setEdit({ ...edit, subtitle: e.target.value })} />
            <Input placeholder="Link: /exams/... or https://..." value={edit.href} onChange={(e) => setEdit({ ...edit, href: e.target.value.trim() })} />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">Badge<select className={sel} value={edit.badge} onChange={(e) => setEdit({ ...edit, badge: e.target.value })}>{BADGES.map((b) => <option key={b}>{b}</option>)}</select></label>
              <label className="text-xs">Icon<select className={sel} value={edit.icon || 'Sparkles'} onChange={(e) => setEdit({ ...edit, icon: e.target.value })}>{ICONS.map((b) => <option key={b}>{b}</option>)}</select></label>
              <label className="text-xs">Show on<select className={sel} value={edit.placements} onChange={(e) => setEdit({ ...edit, placements: e.target.value as any })}><option value="both">Both</option><option value="home">Homepage</option><option value="exams">/exams</option></select></label>
              <label className="text-xs">Date from exam page<select className={sel} value={edit.exam_slug || ''} onChange={(e) => setEdit({ ...edit, exam_slug: e.target.value || null })}><option value="">None</option>{SLUGS.map((s) => <option key={s}>{s}</option>)}</select></label>
              <label className="text-xs">Own deadline (PKT)<Input type="date" value={edit.deadline_date || ''} onChange={(e) => setEdit({ ...edit, deadline_date: e.target.value || null })} /></label>
              <label className="text-xs">Show "Closed" for days<Input type="number" min={0} value={edit.closed_days ?? 0} onChange={(e) => setEdit({ ...edit, closed_days: Number(e.target.value) })} /></label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={save}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
              {edit.id && <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => remove(edit.id!)}><Trash2 className="h-4 w-4" /></Button>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
