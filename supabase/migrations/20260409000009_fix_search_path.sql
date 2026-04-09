-- ============================================================
-- security definer 関数の search_path 明示
-- (auth schema コンテキストから呼ばれる際に public の関数/テーブルを解決するため)
-- ============================================================
alter function public.handle_new_user() set search_path = public, auth;
alter function public.on_profile_created_badge() set search_path = public, auth;
alter function public.award_badge(uuid, text) set search_path = public, auth;
alter function public.award_xp(uuid, xp_reason, integer, jsonb) set search_path = public, auth;
alter function public.on_proposal_gamify() set search_path = public, auth;
alter function public.on_job_gamify() set search_path = public, auth;
alter function public.on_contract_gamify() set search_path = public, auth;
alter function public.on_contract_released_gamify() set search_path = public, auth;
alter function public.on_review_gamify() set search_path = public, auth;
alter function public.notify_on_proposal() set search_path = public, auth;
alter function public.notify_on_contract() set search_path = public, auth;
alter function public.notify_on_deliverable() set search_path = public, auth;
alter function public.notify_on_message() set search_path = public, auth;
