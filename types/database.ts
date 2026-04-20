// ============================================================
// MOAI Crowd — 全テーブル型定義
// マイグレーションファイルに基づいて手動管理
// 本格運用時は `supabase gen types typescript` で自動生成推奨
// ============================================================

// ── Enums ──────────────────────────────────────────

export type JobStatus = "draft" | "open" | "in_progress" | "completed" | "canceled";
export type ProposalStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type ContractStatus = "funded" | "working" | "submitted" | "released" | "disputed" | "refunded";
export type TransactionKind = "escrow_fund" | "escrow_release" | "platform_fee" | "refund" | "transfer_failed" | "charge_failed";
export type NotificationKind =
  | "proposal_received" | "proposal_accepted" | "proposal_rejected"
  | "deliverable_submitted" | "deliverable_approved" | "revision_requested"
  | "message_received" | "contract_funded" | "review_received"
  | "post_commented" | "post_liked" | "comment_replied" | "new_follower";
export type ReportTarget = "user" | "job" | "proposal" | "message" | "deliverable";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type PostKind = "discussion" | "question" | "showcase" | "announcement";
export type LikeTarget = "post" | "comment";
export type XpReason =
  | "signup" | "profile_complete" | "first_post" | "post_created" | "comment_created"
  | "received_like" | "first_proposal" | "first_contract" | "contract_completed"
  | "five_star_review" | "daily_login" | "streak_bonus" | "event_attended";
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";
export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
export type CreditTxKind = "welcome_bonus" | "admin_grant" | "campaign_bonus" | "purchase" | "consume" | "refund" | "referral_signup" | "referral_first_deal";
export type Availability = "available" | "busy" | "limited" | "unavailable";
export type UserRole = "user" | "admin" | "moderator";
export type CrowdRole = "student" | "alumni" | "general" | "client" | "lecturer" | "community_manager";
export type JobLevel = "L1" | "L2" | "L3" | "L4";
export type JobSource = "direct" | "andcrew_overflow" | "andcrew_non_core" | "andcrew_small" | "andcrew_alumni_only";
export type Region = "okinawa" | "fukuoka" | "other";
export type BudgetType = "fixed" | "hourly";
export type ReviewStatus = "pending" | "approved" | "revision_requested";
export type PayoutCycle = "immediate" | "weekly" | "monthly";
export type EventAttendeeStatus = "going" | "maybe" | "canceled";

// ── Core Tables ────────────────────────────────────

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  hourly_rate_jpy: number | null;
  location: string | null;
  website: string | null;
  is_client: boolean;
  is_worker: boolean;
  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  rating_avg: number;
  rating_count: number;
  // Admin / moderation
  role: UserRole;
  is_suspended: boolean;
  suspended_reason: string | null;
  // MOAI ecosystem
  crowd_role: CrowdRole;
  cohort: number | null;
  enrollment_date: string | null;
  graduation_date: string | null;
  github_username: string | null;
  moai_badge_display: boolean;
  region: Region | null;
  // LINE integration
  line_user_id: string | null;
  notify_email: boolean;
  notify_line: boolean;
  // Profile extensions
  tagline: string | null;
  years_experience: number | null;
  availability: Availability;
  work_hours: string | null;
  response_hours: number | null;
  languages: string[];
  service_areas: string[];
  timezone: string;
  profile_completion: number;
  follower_count: number;
  following_count: number;
  // SNS
  twitter_handle: string | null;
  instagram_handle: string | null;
  github_handle: string | null;
  linkedin_url: string | null;
  behance_url: string | null;
  youtube_url: string | null;
  tiktok_handle: string | null;
  // Verification
  verified_identity: boolean;
  verified_identity_at: string | null;
  verified_skills: boolean;
  verified_skills_at: string | null;
  trust_score: number;
  // Invoicing
  is_individual: boolean;
  tax_exempt: boolean;
  invoice_name: string | null;
  invoice_address: string | null;
  invoice_registration_number: string | null;
  // Gamification
  xp: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
  // Credits
  credits_balance: number;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget_min_jpy: number | null;
  budget_max_jpy: number | null;
  budget_type: BudgetType;
  deadline: string | null;
  status: JobStatus;
  proposal_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  job_id: string;
  worker_id: string;
  cover_letter: string;
  proposed_amount_jpy: number;
  proposed_days: number | null;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  job_id: string;
  proposal_id: string;
  client_id: string;
  worker_id: string;
  amount_jpy: number;
  platform_fee_jpy: number;
  worker_payout_jpy: number;
  withholding_tax_jpy: number;
  net_payout_jpy: number | null;
  status: ContractStatus;
  stripe_payment_intent_id: string | null;
  funded_at: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Thread {
  id: string;
  job_id: string | null;
  client_id: string;
  worker_id: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  contract_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// ── Deliverables & Notifications ──────────────────

export interface Deliverable {
  id: string;
  contract_id: string;
  worker_id: string;
  message: string;
  file_urls: string[];
  submitted_at: string;
  reviewed_at: string | null;
  review_status: ReviewStatus;
  revision_note: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Category {
  slug: string;
  label: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

// ── Transactions ──────────────────────────────────

export interface Transaction {
  id: string;
  contract_id: string | null;
  kind: TransactionKind;
  amount_jpy: number;
  stripe_ref: string | null;
  note: string | null;
  created_at: string;
}

// ── Community ─────────────────────────────────────

export interface Post {
  id: string;
  author_id: string;
  kind: PostKind;
  title: string;
  body: string;
  tags: string[];
  is_solved: boolean;
  accepted_comment_id: string | null;
  comment_count: number;
  like_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  like_count: number;
  created_at: string;
}

export interface Like {
  user_id: string;
  target_kind: LikeTarget;
  target_id: string;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  followee_id: string;
  created_at: string;
}

export interface PostBookmark {
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Event {
  id: string;
  host_id: string;
  title: string;
  description: string;
  location: string | null;
  meeting_url: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  attendee_count: number;
  cover_image_url: string | null;
  tags: string[];
  created_at: string;
}

export interface EventAttendee {
  event_id: string;
  user_id: string;
  status: EventAttendeeStatus;
  created_at: string;
}

// ── Admin / Moderation ────────────────────────────

export interface Report {
  id: string;
  reporter_id: string;
  target_kind: ReportTarget;
  target_id: string;
  reason: string;
  detail: string | null;
  status: ReportStatus;
  handled_by: string | null;
  handled_at: string | null;
  admin_note: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_kind: string | null;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

// ── Gamification ──────────────────────────────────

export interface XpEvent {
  id: string;
  user_id: string;
  reason: XpReason;
  amount: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Badge {
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  tier: BadgeTier;
  xp_reward: number;
}

export interface UserBadge {
  user_id: string;
  badge_slug: string;
  awarded_at: string;
}

// ── Invoicing ─────────────────────────────────────

export interface Invoice {
  id: string;
  invoice_number: string;
  contract_id: string | null;
  issuer_id: string;
  recipient_id: string;
  subject: string;
  subtotal_jpy: number;
  tax_jpy: number;
  withholding_tax_jpy: number;
  total_jpy: number;
  issued_at: string;
  due_date: string | null;
  paid_at: string | null;
  status: InvoiceStatus;
  pdf_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_jpy: number;
  subtotal_jpy: number;
  sort_order: number;
}

export interface PayoutSchedule {
  user_id: string;
  cycle: PayoutCycle;
  cutoff_day: number;
  payout_day: number;
  minimum_jpy: number;
  updated_at: string;
}

// ── Credits ───────────────────────────────────────

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  kind: CreditTxKind;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_jpy: number;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  description: string | null;
}

export interface AiFeature {
  slug: string;
  name: string;
  description: string | null;
  credits_cost: number;
  is_free_during_beta: boolean;
  is_active: boolean;
  sort_order: number;
}

// ── Referrals ─────────────────────────────────────

export interface ReferralCode {
  code: string;
  owner_id: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  code: string;
  signup_rewarded_at: string | null;
  first_deal_rewarded_at: string | null;
  referee_segment: "client" | "worker" | null;
  created_at: string;
}

// ── LINE Integration ──────────────────────────────

export interface LineLinkToken {
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

// ── Profile Extensions ────────────────────────────

export interface Portfolio {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  external_url: string | null;
  tags: string[];
  client_name: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface WorkExperience {
  id: string;
  user_id: string;
  company: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  sort_order: number;
}

export interface Education {
  id: string;
  user_id: string;
  school: string;
  degree: string | null;
  field: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  sort_order: number;
}

export interface Certification {
  id: string;
  user_id: string;
  name: string;
  issuer: string | null;
  issued_date: string | null;
  expires_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  sort_order: number;
}

// ── New Feature: Bookmarks ────────────────────────

export interface Bookmark {
  user_id: string;
  job_id: string;
  created_at: string;
}

// ── New Feature: Notification Preferences ─────────

export interface NotificationPreference {
  user_id: string;
  kind: NotificationKind;
  channel_email: boolean;
  channel_line: boolean;
  channel_inapp: boolean;
}
