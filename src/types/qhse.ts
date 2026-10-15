export type NodeStatus = 'draft' | 'active' | 'review' | 'closed';

export const NODE_STATUSES: NodeStatus[] = ['draft', 'active', 'review', 'closed'];

export interface QHSENode {
  id: string;
  parentId: string | null;
  title: string;
  description?: string;
  owner?: string;
  dueDate?: string;
  status: NodeStatus;
  evidence?: string[]; // file URLs
  notes?: string;
  children: QHSENode[];
  updatedAt: string;
}

export type WebhookEvent =
  | 'node.updated'
  | 'node.created'
  | 'export.done'
  | 'incident.reported';

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  'node.updated',
  'node.created',
  'export.done',
  'incident.reported',
];

export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: WebhookEvent[];
  active: boolean;
  lastTriggered?: string;
  failureCount: number;
}

export interface WebhookLogEntry {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  url: string;
  ok: boolean;
  httpStatus?: number;
  error?: string | null;
  at: string;
}

export interface WebhookResult {
  hookId?: string;
  success: boolean;
  error: string | null;
}
