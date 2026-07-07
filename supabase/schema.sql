-- Coworking Management Platform - Supabase schema
-- Run this in the Supabase SQL Editor for a fresh local/dev project.
-- It resets the public application tables, enums, policies and auth trigger.

begin;

drop view if exists public.space_utilization cascade;
drop table if exists public.reservations cascade;
drop table if exists public.spaces cascade;
drop table if exists public.profiles cascade;
drop table if exists public.organizations cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.user_org_id() cascade;
drop function if exists public.user_role() cascade;
drop type if exists public.user_role cascade;
drop type if exists public.space_type cascade;
drop type if exists public.reservation_status cascade;

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.user_role as enum ('office_manager', 'member');
create type public.space_type as enum ('desk', 'meeting_room', 'phone_booth', 'event_space');
create type public.reservation_status as enum ('confirmed', 'cancelled');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now()
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  type public.space_type not null default 'desk',
  capacity int not null default 1 check (capacity between 1 and 500),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.reservation_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  constraint valid_time_range check (end_time > start_time)
);

alter table public.reservations
add constraint no_overlapping_reservations
exclude using gist (
  space_id with =,
  tstzrange(start_time, end_time) with &&
) where (status = 'confirmed');

create index idx_profiles_org on public.profiles(org_id);
create index idx_profiles_email on public.profiles(email);
create index idx_spaces_org on public.spaces(org_id);
create index idx_reservations_org on public.reservations(org_id);
create index idx_reservations_user on public.reservations(user_id);
create index idx_reservations_space_time on public.reservations(space_id, start_time, end_time);

create view public.space_utilization
with (security_invoker = true)
as
select
  s.id as space_id,
  s.name,
  s.org_id,
  s.type as space_type,
  count(r.id)::int as total_reservations,
  coalesce(sum(extract(epoch from (r.end_time - r.start_time)) / 3600), 0)::numeric as total_hours_booked
from public.spaces s
left join public.reservations r
  on r.space_id = s.id
  and r.status = 'confirmed'
  and r.start_time >= now() - interval '30 days'
group by s.id, s.name, s.org_id, s.type;

create or replace function public.user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid();
$$;

create or replace function public.user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
  requested_role public.user_role;
  organization_name text;
begin
  target_org_id := nullif(new.raw_user_meta_data->>'org_id', '')::uuid;
  organization_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'org_name',
    ''
  )), '');

  if target_org_id is null then
    insert into public.organizations (name)
    values (coalesce(organization_name, split_part(new.email, '@', 1) || ' Workspace'))
    returning id into target_org_id;

    requested_role := 'office_manager';
  else
    requested_role := coalesce(
      nullif(new.raw_user_meta_data->>'role', '')::public.user_role,
      'member'
    );
  end if;

  insert into public.profiles (id, org_id, full_name, email, role)
  values (
    new.id,
    target_org_id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), new.email),
    new.email,
    requested_role
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.reservations enable row level security;

create policy "Members can view their organization"
on public.organizations for select
using (id = public.user_org_id());

create policy "Managers can update their organization"
on public.organizations for update
using (id = public.user_org_id() and public.user_role() = 'office_manager')
with check (id = public.user_org_id() and public.user_role() = 'office_manager');

create policy "Members can view profiles in their organization"
on public.profiles for select
using (org_id = public.user_org_id());

create policy "Users can update their own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid() and org_id = public.user_org_id());

create policy "Managers can update profiles in their organization"
on public.profiles for update
using (org_id = public.user_org_id() and public.user_role() = 'office_manager')
with check (org_id = public.user_org_id());

create policy "Members can view spaces in their organization"
on public.spaces for select
using (org_id = public.user_org_id());

create policy "Managers can create spaces"
on public.spaces for insert
with check (org_id = public.user_org_id() and public.user_role() = 'office_manager');

create policy "Managers can update spaces"
on public.spaces for update
using (org_id = public.user_org_id() and public.user_role() = 'office_manager')
with check (org_id = public.user_org_id() and public.user_role() = 'office_manager');

create policy "Managers can delete spaces"
on public.spaces for delete
using (org_id = public.user_org_id() and public.user_role() = 'office_manager');

create policy "Members can view reservations in their organization"
on public.reservations for select
using (org_id = public.user_org_id());

create policy "Members can create their own reservations"
on public.reservations for insert
with check (org_id = public.user_org_id() and user_id = auth.uid());

create policy "Users can cancel own reservations and managers can cancel any"
on public.reservations for update
using (
  org_id = public.user_org_id()
  and (user_id = auth.uid() or public.user_role() = 'office_manager')
)
with check (
  org_id = public.user_org_id()
  and (user_id = auth.uid() or public.user_role() = 'office_manager')
);

grant usage on schema public to anon, authenticated;
grant select on public.space_utilization to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.spaces to authenticated;
grant select, insert, update, delete on public.reservations to authenticated;

commit;
