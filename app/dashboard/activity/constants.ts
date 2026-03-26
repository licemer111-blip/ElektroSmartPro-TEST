export type ActivityLog = {
  id: string;
  user_id: string;
  project_id: string | null;
  action_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  // Joined data
  user?: {
    full_name: string | null;
    email: string | null;
  };
  project?: {
    name: string | null;
  };
};

export type ActivityActionType = 
  | 'project_created' | 'project_updated' | 'project_deleted' | 'project_archived'
  | 'project_duplicated' | 'project_finalized' | 'project_shared'
  | 'item_added' | 'item_updated' | 'item_deleted' | 'items_imported'
  | 'member_invited' | 'member_removed' | 'member_role_changed'
  | 'invitation_accepted' | 'invitation_declined'
  | 'pdf_generated' | 'email_sent' | 'invoice_created'
  | 'template_created' | 'template_used';

// Action type to emoji/icon mapping
export const ACTION_TYPE_ICONS: Record<string, string> = {
  project_created: '📁',
  project_updated: '✏️',
  project_deleted: '🗑️',
  project_archived: '📦',
  project_duplicated: '📋',
  project_finalized: '✅',
  project_shared: '🔗',
  item_added: '➕',
  item_updated: '📝',
  item_deleted: '❌',
  items_imported: '📥',
  member_invited: '📧',
  member_removed: '👋',
  member_role_changed: '🔄',
  invitation_accepted: '✅',
  invitation_declined: '❌',
  pdf_generated: '📄',
  email_sent: '📨',
  invoice_created: '🧾',
  template_created: '📋',
  template_used: '📋',
};
