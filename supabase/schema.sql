-- Execute este script uma vez no Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'operator' check (role in ('admin','operator')),
  status text not null default 'pending' check (status in ('pending','approved','blocked')),
  created_at timestamptz not null default now()
);

create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  operator_names text not null,
  is_rest boolean not null default false,
  hashrate numeric,
  miners_online integer,
  miners_offline integer,
  availability numeric,
  power_mw numeric,
  monthly_kwh numeric,
  generators_online integer check (generators_online between 0 and 3),
  incidents text,
  maintenance text,
  next_shift_pending text,
  supervisor_guidance text,
  created_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_audit (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.daily_reports(id) on delete cascade,
  changed_by uuid not null,
  changed_at timestamptz not null default now(),
  old_data jsonb not null,
  new_data jsonb not null
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles where id=auth.uid() and role='admin' and status='approved')
$$;
create or replace function public.is_authorized()
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles where id=auth.uid() and status='approved')
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare admin_email constant text := 'klarethsolarte@gmail.com';
begin
 if lower(new.email)=admin_email then
   insert into public.profiles(id,email,full_name,role,status)
   values(new.id,lower(new.email),coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name'),'admin','approved')
   on conflict(id) do update set role='admin',status='approved';
 else
   if (select count(*) from public.profiles where role='operator') >= 9 then
     raise exception 'Limite de 9 contas de operador atingido. Contate o administrador.';
   end if;
   insert into public.profiles(id,email,full_name,role,status)
   values(new.id,lower(new.email),coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name'),'operator','pending')
   on conflict(id) do nothing;
 end if;
 return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_operator_status(target_user_id uuid,new_status text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_admin() then raise exception 'Acesso restrito ao administrador.'; end if;
 if new_status not in ('approved','blocked') then raise exception 'Status inválido.'; end if;
 if (select role from profiles where id=target_user_id)='admin' then raise exception 'Não é permitido alterar o administrador.'; end if;
 if new_status='approved' and (select count(*) from profiles where role='operator' and status='approved' and id<>target_user_id)>=9 then
   raise exception 'Limite de 9 operadores aprovados atingido.';
 end if;
 update profiles set status=new_status where id=target_user_id and role='operator';
end $$;

create or replace function public.audit_report_update()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.report_audit(report_id,changed_by,old_data,new_data)
 values(old.id,auth.uid(),to_jsonb(old),to_jsonb(new));
 new.updated_at=now();
 return new;
end $$;
drop trigger if exists daily_report_audit on public.daily_reports;
create trigger daily_report_audit before update on public.daily_reports
for each row execute procedure public.audit_report_update();

alter table public.profiles enable row level security;
alter table public.daily_reports enable row level security;
alter table public.report_audit enable row level security;

drop policy if exists "profile self or admin read" on public.profiles;
create policy "profile self or admin read" on public.profiles for select to authenticated
using (id=auth.uid() or public.is_admin());

drop policy if exists "authorized read reports" on public.daily_reports;
create policy "authorized read reports" on public.daily_reports for select to authenticated
using (public.is_authorized());
drop policy if exists "authorized create own reports" on public.daily_reports;
create policy "authorized create own reports" on public.daily_reports for insert to authenticated
with check (public.is_authorized() and created_by=auth.uid());
drop policy if exists "owner or admin update reports" on public.daily_reports;
create policy "owner or admin update reports" on public.daily_reports for update to authenticated
using (public.is_authorized() and (created_by=auth.uid() or public.is_admin()))
with check (public.is_authorized() and (created_by=auth.uid() or public.is_admin()));
drop policy if exists "admin read audit" on public.report_audit;
create policy "admin read audit" on public.report_audit for select to authenticated using (public.is_admin());

grant execute on function public.set_operator_status(uuid,text) to authenticated;
