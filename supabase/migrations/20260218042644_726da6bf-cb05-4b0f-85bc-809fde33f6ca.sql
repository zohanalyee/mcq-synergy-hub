
-- Create PDF processing queue table for large PDFs
CREATE TABLE public.pdf_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  total_pages INTEGER NOT NULL,
  processed_pages INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  current_batch INTEGER DEFAULT 0,
  total_batches INTEGER,
  extracted_text TEXT DEFAULT '',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdf_processing_queue ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_pdf_queue_status ON public.pdf_processing_queue(status);
CREATE INDEX idx_pdf_queue_document ON public.pdf_processing_queue(document_id);

-- RLS policies
CREATE POLICY "Admins can manage pdf queue" ON public.pdf_processing_queue FOR ALL USING (is_admin());
CREATE POLICY "Anyone can view pdf queue status" ON public.pdf_processing_queue FOR SELECT USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_pdf_queue_updated_at
  BEFORE UPDATE ON public.pdf_processing_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
