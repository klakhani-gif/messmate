-- Apply once in your Supabase SQL editor. Existing tables are not dropped.
create table public.messmate_enquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('student','partner')),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 200),
  area text not null check (char_length(area) between 1 and 150),
  details text not null check (char_length(details) between 1 and 2500),
  provider text not null default '' check (char_length(provider)<=100),
  status text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz not null default now()
);
create index messmate_enquiries_created_idx on public.messmate_enquiries (created_at desc);
create index messmate_enquiries_email_created_idx on public.messmate_enquiries (email,created_at desc);
alter table public.messmate_enquiries enable row level security;
revoke all on public.messmate_enquiries from public,anon,authenticated;
grant select,insert,update,delete on public.messmate_enquiries to service_role;

-- Server-only RPC. One transaction serializes submissions for the same email.
create function public.messmate_submit_enquiry(p_data jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  enquiry_id uuid;
  normal_email text := lower(trim(p_data->>'email'));
begin
  if normal_email is null or normal_email = '' then raise exception 'invalid_email'; end if;
  perform pg_advisory_xact_lock(hashtextextended(normal_email,0));
  if (select count(*) from public.messmate_enquiries where email=normal_email and created_at>now()-interval '1 hour')>=5 then
    raise exception 'enquiry_rate_limit';
  end if;
  insert into public.messmate_enquiries (kind,name,email,area,details,provider)
  values (p_data->>'kind',trim(p_data->>'name'),normal_email,trim(p_data->>'area'),trim(p_data->>'details'),coalesce(p_data->>'provider',''))
  returning id into enquiry_id;
  return enquiry_id;
end;
$$;
revoke all on function public.messmate_submit_enquiry(jsonb) from public,anon,authenticated;
grant execute on function public.messmate_submit_enquiry(jsonb) to service_role;
