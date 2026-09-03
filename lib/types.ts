export type Role = 'admin' | 'edit' | 'view';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Topic {
  id: string;
  title: string;
  created_at: string;
  is_group: boolean;
  created_by: string | null;
}

export interface Statement {
  id: string;
  topic_id: string;
  content: string;
  created_at: string;
  sender_id: string | null;
  sender?: Profile | null;
}

export interface TopicMember {
  topic_id: string;
  user_id: string;
  role: Role;
  created_at: string;
  profile?: Profile | null;
}

export interface TopicWithPreview extends Topic {
  lastStatementPreview?: string;
  lastActivityAt?: string;
  statementCount?: number;
  unreadCount?: number;
  members?: TopicMember[];
  myRole?: Role;
  dm_peer?: Profile | null;
}
