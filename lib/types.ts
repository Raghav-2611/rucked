export interface Topic {
  id: string;
  title: string;
  created_at: string;
}

export interface Statement {
  id: string;
  topic_id: string;
  content: string;
  created_at: string;
}

export interface TopicWithPreview extends Topic {
  lastStatementPreview?: string;
  lastActivityAt?: string;
  statementCount?: number;
}
