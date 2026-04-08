// Supabase DBの型定義 (手動維持 / 本格運用時は `supabase gen types typescript` で自動生成)

export type JobStatus = "draft" | "open" | "in_progress" | "completed" | "canceled";
export type ProposalStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type ContractStatus =
  | "funded" | "working" | "submitted" | "released" | "disputed" | "refunded";

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
  rating_avg: number;
  rating_count: number;
  created_at: string;
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
  budget_type: "fixed" | "hourly";
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
  status: ContractStatus;
  stripe_payment_intent_id: string | null;
  funded_at: string | null;
  released_at: string | null;
  created_at: string;
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
