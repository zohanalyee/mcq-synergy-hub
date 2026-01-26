import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Save, Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Note {
  id: number;
  title: string;
  content: string;
  updatedAt: number;
}

const FloatingNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('floating-notes');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotes(parsed);
      if (parsed.length > 0) {
        setActiveNote(parsed[0]);
        setTitle(parsed[0].title);
        setContent(parsed[0].content);
      }
    }
  }, []);

  const saveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('floating-notes', JSON.stringify(updatedNotes));
  };

  const createNote = () => {
    const newNote: Note = {
      id: Date.now(),
      title: 'New Note',
      content: '',
      updatedAt: Date.now(),
    };
    saveNotes([newNote, ...notes]);
    setActiveNote(newNote);
    setTitle(newNote.title);
    setContent(newNote.content);
  };

  const saveCurrentNote = () => {
    if (!activeNote) return;
    const updated = notes.map(n => 
      n.id === activeNote.id 
        ? { ...n, title, content, updatedAt: Date.now() }
        : n
    );
    saveNotes(updated);
  };

  const deleteNote = (id: number) => {
    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
    if (activeNote?.id === id) {
      if (updated.length > 0) {
        setActiveNote(updated[0]);
        setTitle(updated[0].title);
        setContent(updated[0].content);
      } else {
        setActiveNote(null);
        setTitle('');
        setContent('');
      }
    }
  };

  const selectNote = (note: Note) => {
    if (activeNote) saveCurrentNote();
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" onClick={createNote} className="gap-1 flex-1">
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
        {activeNote && (
          <Button variant="default" size="sm" onClick={saveCurrentNote} className="gap-1">
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        )}
      </div>

      {notes.length > 0 && (
        <ScrollArea className="h-20 border rounded-md">
          <div className="p-1.5 space-y-1">
            {notes.map(note => (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                className={`flex items-center justify-between p-1.5 rounded cursor-pointer text-xs ${
                  activeNote?.id === note.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                }`}
              >
                <span className="truncate flex-1">{note.title || 'Untitled'}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {activeNote ? (
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="h-8 text-sm font-medium"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note..."
            className="min-h-[100px] text-sm resize-none"
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Click "New" to create a note
        </p>
      )}
    </div>
  );
};

export default FloatingNotes;
