-- =====================================================================
-- Fort · caixa de entrada (notificações do banco no Android)
-- O MacroDroid manda cada notificação de compra/Pix para cá; o Fort mostra
-- para você lançar com um toque (ou lança sozinho, se ligar essa opção).
-- Cole tudo no SQL Editor e clique em "Run". Pode rodar de novo sem problema.
-- =====================================================================
create table if not exists public.fort_secrets (k text primary key, v text);
alter table public.fort_secrets enable row level security;
revoke all on public.fort_secrets from anon, authenticated;

insert into public.fort_secrets (k, v)
  values ('inbox_token', md5(random()::text || clock_timestamp()::text) || md5(random()::text))
on conflict (k) do nothing;

create table if not exists public.fort_inbox (
  id         bigserial primary key,
  app        text,
  title      text,
  body       text,
  who        text,
  created_at timestamptz not null default now()
);
alter table public.fort_inbox enable row level security;
drop policy if exists fort_inbox_rw on public.fort_inbox;
create policy fort_inbox_rw on public.fort_inbox for all to authenticated
  using (public.fort_is_member()) with check (public.fort_is_member());
revoke all on public.fort_inbox from anon;
grant select, delete on public.fort_inbox to authenticated;

-- recebe a notificação (chamada pelo MacroDroid, com o token)
create or replace function public.fort_inbox_add(p_token text, p_app text default '', p_title text default '', p_text text default '', p_who text default '')
returns text language plpgsql security definer set search_path = public as $$
begin
  if p_token is null or p_token <> (select v from fort_secrets where k = 'inbox_token') then
    raise exception 'token inválido';
  end if;
  if coalesce(p_text, '') = '' and coalesce(p_title, '') = '' then return 'vazio'; end if;
  if (select count(*) from fort_inbox where created_at > now() - interval '1 hour') > 300 then
    raise exception 'muitas mensagens';
  end if;
  -- ignora a mesma notificação repetida em menos de 2 minutos
  if exists (select 1 from fort_inbox where body = left(p_text, 1000) and coalesce(title,'') = left(coalesce(p_title,''), 200)
             and created_at > now() - interval '2 minutes') then return 'repetida'; end if;
  insert into fort_inbox (app, title, body, who)
    values (left(coalesce(p_app,''), 80), left(coalesce(p_title,''), 200), left(coalesce(p_text,''), 1000), left(coalesce(p_who,''), 60));
  delete from fort_inbox where created_at < now() - interval '60 days';
  return 'ok';
end $$;
revoke all on function public.fort_inbox_add(text, text, text, text, text) from public;
grant execute on function public.fort_inbox_add(text, text, text, text, text) to anon, authenticated;

-- mostra o token só para quem é do Fort (tela de configuração)
create or replace function public.fort_inbox_token()
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.fort_is_member() then raise exception 'sem acesso'; end if;
  return (select v from fort_secrets where k = 'inbox_token');
end $$;
revoke all on function public.fort_inbox_token() from public;
grant execute on function public.fort_inbox_token() to authenticated;

-- atualização em tempo real
do $$ begin
  alter publication supabase_realtime add table public.fort_inbox;
exception when duplicate_object then null; when undefined_object then null;
end $$;
