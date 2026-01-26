import { StickyNote, Plus, Trash2, Save } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  color: string;
}

const colors = [
  'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300',
  'bg-blue-100 dark:bg-blue-900/30 border-blue-300',
  'bg-green-100 dark:bg-green-900/30 border-green-300',
  'bg-pink-100 dark:bg-pink-900/30 border-pink-300',
  'bg-purple-100 dark:bg-purple-900/30 border-purple-300',
];

const NotesTool = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedNotes = localStorage.getItem('study-notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  const saveNotes = (updatedNotes: Note[]) => {
    localStorage.setItem('study-notes', JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '',
      createdAt: new Date().toISOString(),
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    setSelectedNote(newNote);
  };

  const updateNote = (id: string, field: 'title' | 'content', value: string) => {
    const updatedNotes = notes.map(n => n.id === id ? { ...n, [field]: value } : n);
    saveNotes(updatedNotes);
    if (selectedNote?.id === id) {
      setSelectedNote({ ...selectedNote, [field]: value });
    }
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    saveNotes(updatedNotes);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
    toast({ title: 'Note deleted' });
  };

  return (
    <Header>
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500/10 mb-4">
            <StickyNote className="h-8 w-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold">Study Notes</h1>
          <p className="text-muted-foreground">Keep track of important information</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Notes List */}
          <div className="md:col-span-1 space-y-4">
            <Button onClick={addNote} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> New Note
            </Button>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {notes.map(note => (
                <Card
                  key={note.id}
                  className={`cursor-pointer transition-all hover:scale-[1.02] ${note.color} ${
                    selectedNote?.id === note.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{note.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{note.content || 'Empty note'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {notes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <StickyNote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No notes yet</p>
                  <p className="text-sm">Click "New Note" to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Note Editor */}
          <div className="md:col-span-2">
            {selectedNote ? (
              <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-white/20 h-full">
                <CardHeader className="pb-2">
                  <Input
                    value={selectedNote.title}
                    onChange={(e) => updateNote(selectedNote.id, 'title', e.target.value)}
                    className="text-lg font-medium border-none bg-transparent focus-visible:ring-0 px-0"
                    placeholder="Note title..."
                  />
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={selectedNote.content}
                    onChange={(e) => updateNote(selectedNote.id, 'content', e.target.value)}
                    placeholder="Start typing your note..."
                    className="min-h-[300px] resize-none bg-transparent border-none focus-visible:ring-0"
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-white/20 h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center text-muted-foreground">
                  <StickyNote className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p>Select a note to edit</p>
                  <p className="text-sm">or create a new one</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Header>
  );
};

export default NotesTool;
