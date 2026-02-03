-- Add LMS hierarchy columns to documents table for linking PDFs to educational structure
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES educational_systems(id),
  ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES levels(id),
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id),
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id);

-- Add index for efficient filtering by LMS hierarchy
CREATE INDEX IF NOT EXISTS idx_documents_system_id ON documents(system_id);
CREATE INDEX IF NOT EXISTS idx_documents_level_id ON documents(level_id);
CREATE INDEX IF NOT EXISTS idx_documents_subject_id ON documents(subject_id);
CREATE INDEX IF NOT EXISTS idx_documents_topic_id ON documents(topic_id);

-- Add source column to content_items to track RAG-generated questions
ALTER TABLE content_items 
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_document_id UUID REFERENCES documents(id);

-- Create index for finding RAG-generated content
CREATE INDEX IF NOT EXISTS idx_content_items_source ON content_items(source_type);
CREATE INDEX IF NOT EXISTS idx_content_items_source_document ON content_items(source_document_id);