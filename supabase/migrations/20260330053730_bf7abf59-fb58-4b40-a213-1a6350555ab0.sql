
-- Create enum types for agent tasks
CREATE TYPE agent_task_type AS ENUM ('blog', 'mcq', 'scholarship', 'job');
CREATE TYPE agent_task_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'review');

-- Create agent_tasks table
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type agent_task_type NOT NULL,
  status agent_task_status NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 0,
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB,
  quality_score JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  needs_review BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_type ON agent_tasks(task_type);
CREATE INDEX idx_agent_tasks_priority ON agent_tasks(priority DESC);
CREATE INDEX idx_agent_tasks_created ON agent_tasks(created_at DESC);

-- Enable RLS
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage all agent tasks"
  ON agent_tasks FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
