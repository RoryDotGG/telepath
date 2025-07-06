export interface LinkSuggestion {
  url: string;
  suggestedSlug: string;
  domain: string;
  reasoning: string;
}

export interface UserSession {
  pendingLink?: LinkSuggestion;
  messageId?: number;
  availableDomains?: string[];
  setupStep?: SetupStep;
  editingLinkId?: string;
  linkManagement?: LinkManagementSession;
}

export interface UserPreferences {
  userId: number;
  defaultDomain?: string;
  preferredSlugStyle: SlugStyle;
  autoConfirm: boolean;
  showReasoning: boolean;
  setupCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum SetupStep {
  WELCOME = 'welcome',
  DOMAIN_SELECTION = 'domain_selection',
  SLUG_STYLE = 'slug_style',
  AUTO_CONFIRM = 'auto_confirm',
  SHOW_REASONING = 'show_reasoning',
  COMPLETED = 'completed'
}

export enum SlugStyle {
  INTELLIGENT = 'intelligent',
  SHORT = 'short',
  DESCRIPTIVE = 'descriptive',
  TECHNICAL = 'technical'
}

export interface DubDomain {
  id: string;
  slug: string;
  verified: boolean;
  primary: boolean;
}

export interface CreateLinkRequest {
  url: string;
  domain?: string;
  key?: string;
  title?: string;
  description?: string;
}

export interface CreateLinkResponse {
  id: string;
  domain: string;
  key: string;
  url: string;
  shortLink: string;
  createdAt: string;
}

export interface AIPromptContext {
  url: string;
  domain?: string;
  title?: string;
  description?: string;
}

export type BotAction = 'confirm' | 'edit' | 'reject' | 'select_domain' | 'links_page' | 'link_edit' | 'link_delete' | 'link_details';

export interface CallbackData {
  action: BotAction;
  data?: string;
  page?: number;
  linkId?: string;
}

export interface UserLink {
  id: string;
  userId: number;
  domain: string;
  key: string;
  url: string;
  shortLink: string;
  title?: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
  clicks?: number;
}

export interface LinkManagementSession {
  currentPage: number;
  totalLinks: number;
  selectedLink?: UserLink;
  action?: 'edit' | 'delete';
}