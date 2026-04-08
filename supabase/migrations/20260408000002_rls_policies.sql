-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table jobs enable row level security;
alter table proposals enable row level security;
alter table contracts enable row level security;
alter table threads enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;
alter table transactions enable row level security;

-- ---------------- profiles ----------------
create policy "profiles are viewable by everyone"
  on profiles for select using (true);
create policy "users can update own profile"
  on profiles for update using (auth.uid() = id);

-- ---------------- jobs ----------------
create policy "open jobs are viewable by everyone"
  on jobs for select using (status <> 'draft' or client_id = auth.uid());
create policy "clients can insert jobs"
  on jobs for insert with check (client_id = auth.uid());
create policy "clients can update their jobs"
  on jobs for update using (client_id = auth.uid());
create policy "clients can delete their jobs"
  on jobs for delete using (client_id = auth.uid());

-- ---------------- proposals ----------------
create policy "proposals visible to job client and worker"
  on proposals for select using (
    worker_id = auth.uid()
    or exists (select 1 from jobs j where j.id = proposals.job_id and j.client_id = auth.uid())
  );
create policy "workers can create proposals"
  on proposals for insert with check (worker_id = auth.uid());
create policy "workers can update own proposals"
  on proposals for update using (worker_id = auth.uid());

-- ---------------- contracts ----------------
create policy "contracts visible to parties"
  on contracts for select using (client_id = auth.uid() or worker_id = auth.uid());
create policy "contracts insert by client"
  on contracts for insert with check (client_id = auth.uid());
create policy "contracts update by parties"
  on contracts for update using (client_id = auth.uid() or worker_id = auth.uid());

-- ---------------- threads ----------------
create policy "threads visible to parties"
  on threads for select using (client_id = auth.uid() or worker_id = auth.uid());
create policy "threads created by parties"
  on threads for insert with check (client_id = auth.uid() or worker_id = auth.uid());

-- ---------------- messages ----------------
create policy "messages visible to thread parties"
  on messages for select using (
    exists (select 1 from threads t
            where t.id = messages.thread_id
              and (t.client_id = auth.uid() or t.worker_id = auth.uid()))
  );
create policy "messages sent by thread parties"
  on messages for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from threads t
                where t.id = messages.thread_id
                  and (t.client_id = auth.uid() or t.worker_id = auth.uid()))
  );

-- ---------------- reviews ----------------
create policy "reviews viewable by everyone"
  on reviews for select using (true);
create policy "reviews insert by contract parties"
  on reviews for insert with check (
    reviewer_id = auth.uid()
    and exists (select 1 from contracts c
                where c.id = reviews.contract_id
                  and (c.client_id = auth.uid() or c.worker_id = auth.uid())
                  and c.status = 'released')
  );

-- ---------------- transactions ----------------
create policy "transactions visible to contract parties"
  on transactions for select using (
    exists (select 1 from contracts c
            where c.id = transactions.contract_id
              and (c.client_id = auth.uid() or c.worker_id = auth.uid()))
  );
