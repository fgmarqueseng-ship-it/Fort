-- =====================================================================
-- Fort · resumo semanal no celular (toda segunda às 8h05, horário de Brasília)
-- Usa a tabela fort_push e o token já guardados pelos alertas de vencimento.
-- Pode rodar de novo sem problema.
-- =====================================================================
alter table public.fort_push add column if not exists weekly boolean not null default true;

insert into public.fort_secrets (k, v) values
  ('weekly_url', 'https://krraobpyldnnsjemznej.supabase.co/functions/v1/fort-weekly')
on conflict (k) do update set v = excluded.v;

create or replace function public.fort_send_weekly(p_email text default null)
returns bigint language plpgsql security definer set search_path = public, extensions as $$
declare
  d date := (now() at time zone 'America/Sao_Paulo')::date;
  body jsonb; rid bigint;
begin
  body := jsonb_build_object(
    'token', (select v from fort_secrets where k = 'alerts_token'),
    'today', to_char(d, 'YYYY-MM-DD'),
    'tx', coalesce((select jsonb_agg(data) from fort_docs where col = 'tx' and (
            (data->>'date') between to_char(d - 70, 'YYYY-MM-DD') and to_char(d + 10, 'YYYY-MM-DD')
            or (data->>'purchaseDate') between to_char(d - 70, 'YYYY-MM-DD') and to_char(d, 'YYYY-MM-DD')
            or (data->>'inv') >= to_char(d - 45, 'YYYY-MM'))), '[]'::jsonb),
    'cards', coalesce((select jsonb_agg(data || jsonb_build_object('id', id)) from fort_docs where col = 'cards'), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(data || jsonb_build_object('id', id)) from fort_docs where col = 'categories'), '[]'::jsonb),
    'budgets', coalesce((select jsonb_agg(data || jsonb_build_object('id', id)) from fort_docs where col = 'budgets'), '[]'::jsonb),
    'subs', coalesce((select jsonb_agg(jsonb_build_object('endpoint', endpoint, 'sub', sub)) from fort_push
            where weekly is not false and (p_email is null or lower(email) = lower(p_email))), '[]'::jsonb)
  );
  select net.http_post(
    url := (select v from fort_secrets where k = 'weekly_url'),
    body := body,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 30000
  ) into rid;
  return rid;
end $$;
revoke all on function public.fort_send_weekly(text) from public, anon, authenticated;

-- botão "Enviar resumo de teste" (manda só para os aparelhos de quem tocou)
create or replace function public.fort_test_weekly()
returns bigint language plpgsql security definer set search_path = public as $$
begin
  if not public.fort_is_member() then raise exception 'sem acesso'; end if;
  return public.fort_send_weekly(coalesce(auth.jwt() ->> 'email', ''));
end $$;
revoke all on function public.fort_test_weekly() from public, anon;
grant execute on function public.fort_test_weekly() to authenticated;

-- agenda: toda segunda às 8h05 (horário de Brasília = 11h05 UTC)
select cron.unschedule(jobid) from cron.job where jobname = 'fort-resumo-semanal';
select cron.schedule('fort-resumo-semanal', '5 11 * * 1', $$select public.fort_send_weekly(null)$$);
