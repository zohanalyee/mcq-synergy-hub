import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowUp, ArrowDown, Plus, Trash2, Navigation, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string | null;
  position: number;
  is_visible: boolean;
  target_audience: string | null;
}

const NavigationManager = () => {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newHref, setNewHref] = useState('');
  const [newIcon, setNewIcon] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-navigation-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('navigation_items')
        .select('*')
        .order('position');
      if (error) throw error;
      return data as NavItem[];
    },
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase.from('navigation_items').update({ is_visible }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-navigation-items'] });
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
    },
  });

  const moveItem = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const idx = items.findIndex(i => i.id === id);
      if (idx < 0) return;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= items.length) return;

      const updates = [
        supabase.from('navigation_items').update({ position: items[swapIdx].position }).eq('id', items[idx].id),
        supabase.from('navigation_items').update({ position: items[idx].position }).eq('id', items[swapIdx].id),
      ];
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-navigation-items'] });
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
    },
  });

  const addItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('navigation_items').insert({
        label: newLabel,
        href: newHref,
        icon: newIcon || null,
        position: items.length,
        is_visible: true,
        target_audience: 'all',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-navigation-items'] });
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      setAddOpen(false);
      setNewLabel('');
      setNewHref('');
      setNewIcon('');
      toast.success('Navigation item added');
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('navigation_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-navigation-items'] });
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      toast.success('Navigation item deleted');
    },
  });

  if (isLoading) return <div className="text-muted-foreground p-4">Loading navigation items...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Navigation Manager
          </CardTitle>
          <CardDescription>Control header menu items, visibility, and order</CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Navigation Item</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Label</Label><Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Tools" /></div>
              <div><Label>URL Path</Label><Input value={newHref} onChange={e => setNewHref(e.target.value)} placeholder="e.g. /tools" /></div>
              <div><Label>Icon Name</Label><Input value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="e.g. Wrench" /></div>
              <Button onClick={() => addItem.mutate()} disabled={!newLabel || !newHref}>Add Item</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card">
              <div className="flex flex-col gap-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => moveItem.mutate({ id: item.id, direction: 'up' })}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === items.length - 1} onClick={() => moveItem.mutate({ id: item.id, direction: 'down' })}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.label}</p>
                <p className="text-xs text-muted-foreground truncate">{item.href}</p>
              </div>
              <div className="flex items-center gap-2">
                {item.is_visible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                <Switch checked={item.is_visible} onCheckedChange={(v) => toggleVisibility.mutate({ id: item.id, is_visible: v })} />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem.mutate(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NavigationManager;
