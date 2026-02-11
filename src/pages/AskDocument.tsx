import React, { useState, useRef, useEffect } from "react";
import { Send, BookOpen, Loader2, FileText, ChevronDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const AskDocument: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [documentsCount, setDocumentsCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch document count on mount
  useEffect(() => {
    const fetchDocumentCount = async () => {
      const { count } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");
      setDocumentsCount(count || 0);
    };
    fetchDocumentCount();
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("rag-search", {
        body: { query: trimmedInput, topK: 5 },
      });

      if (error) {
        throw new Error(error.message || "Failed to get response");
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer || "I couldn't find an answer to your question.",
        sources: data.sources || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("RAG search error:", error);
      toast.error("Failed to get response. Please try again.");
      
      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-2 pb-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Ask Your Documents</h1>
              <p className="text-muted-foreground text-sm">
                Get answers from your course materials
              </p>
            </div>
          </div>
          
          {/* Document count badge */}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary" className="gap-1">
              <FileText className="h-3 w-3" />
              {documentsCount} document{documentsCount !== 1 ? "s" : ""} available
            </Badge>
            {documentsCount === 0 && (
              <span className="text-xs text-muted-foreground">
                (Ask your teacher to upload course materials)
              </span>
            )}
          </div>
        </div>

        {/* Chat area */}
        <Card className="mb-4">
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Start a conversation</h3>
                  <p className="text-sm max-w-md">
                    Ask any question about your course materials. I'll find the answer 
                    from the uploaded documents.
                  </p>
                  <div className="mt-4 text-xs bg-muted/50 rounded-lg p-3 max-w-sm">
                    <p className="font-medium mb-1">Example questions:</p>
                    <ul className="space-y-1 text-left">
                      <li>• What is photosynthesis?</li>
                      <li>• Explain the causes of World War I</li>
                      <li>• How do plant cells differ from animal cells?</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Searching documents...</span>
                    </div>
                  )}
                  
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question from your course material..."
            disabled={isLoading || documentsCount === 0}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading || documentsCount === 0}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {documentsCount === 0 && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            No documents available. Contact your administrator to upload course materials.
          </p>
        )}
      </main>
    </div>
  );
};

// Message bubble component
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg p-3 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        
        {/* Sources section for assistant messages */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-auto p-1 text-xs hover:bg-background/50"
              >
                <Info className="h-3 w-3 mr-1" />
                {message.sources.length} source{message.sources.length > 1 ? "s" : ""}
                <ChevronDown
                  className={`h-3 w-3 ml-1 transition-transform ${
                    sourcesOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {message.sources.map((source, index) => (
                <div
                  key={index}
                  className="bg-background/50 rounded p-2 text-xs"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-3 w-3 text-primary" />
                    <span className="font-medium">{source.title}</span>
                    {source.pageNumber && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        Page {source.pageNumber}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground line-clamp-2">
                    {source.excerpt}
                  </p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
        
        <p className="text-[10px] opacity-60 mt-1">
          {message.timestamp.toLocaleTimeString([], { 
            hour: "2-digit", 
            minute: "2-digit" 
          })}
        </p>
      </div>
    </div>
  );
};

export default AskDocument;
