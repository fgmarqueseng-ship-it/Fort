-- =====================================================================
-- Fort · estrutura do banco (Supabase)
-- Cole tudo no SQL Editor do projeto e clique em "Run". Pode rodar de novo sem problema.
-- =====================================================================

-- 1) Quem pode acessar (lista de e-mails liberados)
create table if not exists public.fort_members (
  email      text primary key,
  created_at timestamptz not null default now()
);

-- 2) Todos os dados do app (contas, lançamentos, investimentos, ajustes...)
create table if not exists public.fort_docs (
  col        text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (col, id)
);

-- 3) Função que diz se o usuário logado está na lista
create or replace function public.fort_is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.fort_members m
    where lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.fort_is_member() from public;
grant execute on function public.fort_is_member() to authenticated;

-- 4) Segurança: só quem está na lista lê e grava
alter table public.fort_members enable row level security;
alter table public.fort_docs    enable row level security;

drop policy if exists fort_docs_rw       on public.fort_docs;
drop policy if exists fort_members_read  on public.fort_members;
drop policy if exists fort_members_add   on public.fort_members;
drop policy if exists fort_members_del   on public.fort_members;

create policy fort_docs_rw on public.fort_docs
  for all to authenticated
  using (public.fort_is_member()) with check (public.fort_is_member());

create policy fort_members_read on public.fort_members
  for select to authenticated using (public.fort_is_member());
create policy fort_members_add on public.fort_members
  for insert to authenticated with check (public.fort_is_member());
create policy fort_members_del on public.fort_members
  for delete to authenticated
  using (public.fort_is_member() and lower(email) <> lower(coalesce(auth.jwt() ->> 'email', '')));

revoke all on public.fort_docs, public.fort_members from anon;
grant select, insert, update, delete on public.fort_docs to authenticated;
grant select, insert, delete on public.fort_members to authenticated;

-- 5) Atualização em tempo real entre computador e celular
do $$ begin
  alter publication supabase_realtime add table public.fort_docs;
exception when duplicate_object then null; when undefined_object then null;
end $$;

-- 6) Taxas do Banco Central pelo servidor (reserva, caso o navegador não consiga buscar direto)
do $$ begin
  create extension if not exists http with schema extensions;
exception when others then raise notice 'Extensão http indisponível: o app busca as taxas direto do navegador.';
end $$;

create or replace function public.fort_bcb(code int, n int)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare r record;
begin
  if not public.fort_is_member() then raise exception 'sem acesso'; end if;
  if code not in (432, 4389, 13522, 433, 226) then raise exception 'série não permitida'; end if;
  n := least(greatest(coalesce(n, 1), 1), 240);
  select status, content into r
    from extensions.http_get(format('https://api.bcb.gov.br/dados/serie/bcdata.sgs.%s/dados/ultimos/%s?formato=json', code, n));
  if r.status <> 200 then raise exception 'Banco Central respondeu %', r.status; end if;
  return r.content::jsonb;
end $$;
revoke all on function public.fort_bcb(int, int) from public;
grant execute on function public.fort_bcb(int, int) to authenticated;
