import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, BookOpen, Loader2, FileText, ChevronDown, Plus, Trash2,
  MessageSquare, Sparkles, Bot, User, ChevronRight, Layers, GraduationCap, X, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Source {
  documentId: string;
  title: string;
  pageNumber: number | null;
  similarity: number;
  excerpt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  context?: { type: "subject" | "topic"; id: string; name: string };
}

interface LMSSubject {
  id: string;
  name: string;
  topics?: { id: string; name: string }[];
}

// ─── Suggested questions per context ───────────────────────────────────────

const GENERIC_QUESTIONS = [
  "What is photosynthesis?",
  "Explain the causes of World War I",
  "How do plant cells differ from animal cells?",
  "What are Newton's laws of motion?",
];

function getContextQuestions(name: string) {
  return [
    `Summarize the key concepts in ${name}`,
    `What are the most important topics in ${name}?`,
    `Give me practice questions about ${name}`,
    `Explain the fundamentals of ${name}`,
  ];
}

// ─── Storage helpers ────────────────────────────────────────────────────────

const STORAGE_KEY = "aq_conversations_v2";

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((c: Conversation) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      messages: c.messages.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }));
  } catch {
    return [];
  }
}

function saveConversations(convos: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convos.slice(0, 50)));
  } catch { /* ignore */ }
}

// ─── Typing indicator ───────────────────────────────────────────────────────

const TypingDots = () => (
  <div className="flex gap-1 items-center py-1">
    {[0, 1, 2].map(i => (
      <motion.span
        key={i}
        className="w-2 h-2 rounded-full bg-muted-foreground/50"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

// ─── Message Bubble ─────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser && "items-end")}>
        {/* Bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted/60 border border-border text-foreground rounded-tl-sm"
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:mt-2 prose-headings:mb-1">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground">
                <FileText className="h-3 w-3" />
                {message.sources.length} source{message.sources.length > 1 ? "s" : ""}
                <ChevronDown className={cn("h-3 w-3 transition-transform", sourcesOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-1.5">
              {message.sources.map((source, i) => (
                <div key={i} className="bg-background rounded-xl border border-border p-2.5 text-xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="h-3 w-3 text-primary" />
                    <span className="font-semibold">{source.title}</span>
                    {source.pageNumber && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">p.{source.pageNumber}</Badge>
                    )}
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 ml-auto">
                      {Math.round(source.similarity * 100)}% match
                    </Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">{source.excerpt}</p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground/60 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

const AskDocument: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [subjects, setSubjects] = useState<LMSSubject[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [subjectTopics, setSubjectTopics] = useState<Record<string, { id: string; name: string }[]>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const active = conversations.find(c => c.id === activeId) ?? null;

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages, isLoading]);

  // Persist
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Fetch doc count
  useEffect(() => {
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .then(({ count }) => setDocumentsCount(count || 0));
  }, []);

  // Fetch LMS subjects
  useEffect(() => {
    supabase
      .from("subjects")
      .select("id, name")
      .eq("approved", true)
      .order("name")
      .limit(30)
      .then(({ data }) => setSubjects(data || []));
  }, []);

  const loadTopicsForSubject = useCallback(async (subjectId: string) => {
    if (subjectTopics[subjectId]) return;
    const { data } = await supabase
      .from("topics")
      .select("id, name")
      .eq("subject_id", subjectId)
      .eq("approved", true)
      .order("name")
      .limit(20);
    setSubjectTopics(prev => ({ ...prev, [subjectId]: data || [] }));
  }, [subjectTopics]);

  // ── Conversation management ──

  const newConversation = (context?: Conversation["context"]) => {
    const id = crypto.randomUUID();
    const title = context ? `${context.name}` : "New conversation";
    const convo: Conversation = { id, title, messages: [], createdAt: new Date(), context };
    setConversations(prev => [convo, ...prev]);
    setActiveId(id);
    setInput("");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const updateConversation = (id: string, updater: (c: Conversation) => Conversation) => {
    setConversations(prev => prev.map(c => c.id === id ? updater(c) : c));
  };

  // ── Send message ──

  const sendMessage = async (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading) return;

    // Create convo if none
    let convId = activeId;
    if (!convId) {
      const id = crypto.randomUUID();
      const convo: Conversation = { id, title: trimmed.slice(0, 40), messages: [], createdAt: new Date() };
      setConversations(prev => [convo, ...prev]);
      setActiveId(id);
      convId = id;
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed, timestamp: new Date() };
    updateConversation(convId, c => ({
      ...c,
      title: c.messages.length === 0 ? trimmed.slice(0, 45) : c.title,
      messages: [...c.messages, userMsg],
    }));
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("rag-search", {
        body: { query: trimmed, topK: 5 },
      });
      if (error) throw new Error(error.message);

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer || "I couldn't find a relevant answer in the documents.",
        sources: data.sources || [],
        timestamp: new Date(),
      };
      updateConversation(convId, c => ({ ...c, messages: [...c.messages, assistantMsg] }));
    } catch (err) {
      toast.error("Failed to get response. Please try again.");
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      updateConversation(convId, c => ({ ...c, messages: [...c.messages, errMsg] }));
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = active?.context
    ? getContextQuestions(active.context.name)
    : GENERIC_QUESTIONS;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Header>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-shrink-0 border-r border-border bg-muted/20 flex flex-col overflow-hidden"
            >
              {/* Sidebar header */}
              <div className="p-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm">AI Tutor</span>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => newConversation()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-3 space-y-4">

                  {/* Document count */}
                  <div className="flex items-center gap-2 px-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{documentsCount} document{documentsCount !== 1 ? "s" : ""} indexed</span>
                  </div>

                  {/* History */}
                  {conversations.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">Recent</p>
                      <div className="space-y-0.5">
                        {conversations.map(c => (
                          <div
                            key={c.id}
                            onClick={() => setActiveId(c.id)}
                            className={cn(
                              "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                              c.id === activeId
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="flex-1 truncate text-xs">{c.title}</span>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="opacity-0 group-hover:opacity-100 h-5 w-5"
                              onClick={e => { e.stopPropagation(); deleteConversation(c.id); }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* LMS Subjects */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" /> Browse Subjects
                    </p>
                    <div className="space-y-0.5">
                      {subjects.map(subject => (
                        <div key={subject.id}>
                          <div
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors group",
                              "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => {
                              if (expandedSubject === subject.id) {
                                setExpandedSubject(null);
                              } else {
                                setExpandedSubject(subject.id);
                                loadTopicsForSubject(subject.id);
                              }
                            }}
                          >
                            <Layers className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="flex-1 truncate">{subject.name}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100"
                                onClick={e => { e.stopPropagation(); newConversation({ type: "subject", id: subject.id, name: subject.name }); }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <ChevronRight className={cn("h-3 w-3 transition-transform", expandedSubject === subject.id && "rotate-90")} />
                            </div>
                          </div>

                          {/* Topics */}
                          <AnimatePresence>
                            {expandedSubject === subject.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden pl-5"
                              >
                                {(subjectTopics[subject.id] || []).map(topic => (
                                  <button
                                    key={topic.id}
                                    onClick={() => newConversation({ type: "topic", id: topic.id, name: topic.name })}
                                    className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                  >
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                                    <span className="truncate">{topic.name}</span>
                                  </button>
                                ))}
                                {subjectTopics[subject.id]?.length === 0 && (
                                  <p className="px-3 py-1.5 text-xs text-muted-foreground/50">No topics</p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main chat area ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Chat toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
            <Button variant="ghost" size="icon-sm" onClick={() => setSidebarOpen(v => !v)}>
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              {active ? (
                <div className="flex items-center gap-2">
                  {active.context && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      {active.context.type === "subject" ? <Layers className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                      {active.context.name}
                    </Badge>
                  )}
                  <span className="text-sm font-medium text-foreground truncate">{active.title}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">AI Tutor</span>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <FileText className="h-3 w-3" />{documentsCount} docs
                  </Badge>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => newConversation()}>
              <Plus className="h-3.5 w-3.5" /> New chat
            </Button>
          </div>

          {/* Feature Coming Soon */}
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="flex flex-col items-center justify-center min-h-full py-16 gap-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Bot className="h-8 w-8 text-white" />
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                  <Sparkles className="h-3.5 w-3.5" />
                  Feature Coming Soon
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Ask Your Documents</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We are currently fine-tuning our AI to help you chat with your documents. Stay tuned for the launch!
                </p>
              </motion.div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 opacity-40 pointer-events-none select-none">
                {suggestedQuestions.map((q) => (
                  <div
                    key={q}
                    className="text-left p-3 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary/50 flex-shrink-0" />
                      <span>{q}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Disabled Input bar */}
          <div className="px-4 py-3 border-t border-border bg-background/80 backdrop-blur-sm opacity-50 pointer-events-none select-none">
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 items-end">
                <Textarea
                  disabled
                  placeholder="Chat is currently disabled — coming soon..."
                  rows={1}
                  className="flex-1 resize-none min-h-[44px] max-h-32 rounded-xl border-border text-sm cursor-not-allowed"
                />
                <Button disabled size="icon" className="h-11 w-11 rounded-xl flex-shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Header>
  );
};

export default AskDocument;
