-- =====================================================================
-- Fort · leitura de cupom fiscal (NFC-e)
-- O app lê o QR Code do cupom e pede ao Supabase a página da nota na SEFAZ
-- (o navegador não consegue abrir o site da SEFAZ direto).
-- Só aceita endereços .gov.br e só para quem está na lista do Fort.
-- Cole tudo no SQL Editor e clique em "Run". Pode rodar de novo sem problema.
-- =====================================================================
create extension if not exists http with schema extensions;

create or replace function public.fort_nfce(p_url text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  u    text := trim(coalesce(p_url, ''));
  host text;
  r    record;
begin
  if not public.fort_is_member() then raise exception 'sem acesso'; end if;
  host := lower(substring(u from '^https?://([^/?#:@]+)'));
  if host is null or host !~ '^[a-z0-9.-]+\.gov\.br$' then raise exception 'endereço não permitido'; end if;
  if length(u) > 2000 then raise exception 'endereço muito longo'; end if;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '25');
  select status, content into r from extensions.http((
    'GET', u,
    array[
      extensions.http_header('User-Agent', 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'),
      extensions.http_header('Accept', 'text/html,application/xhtml+xml'),
      extensions.http_header('Accept-Language', 'pt-BR,pt;q=0.9')
    ],
    null, null)::extensions.http_request);
  if r.status <> 200 then raise exception 'SEFAZ respondeu %', r.status; end if;
  return left(r.content, 600000);
end $$;
revoke all on function public.fort_nfce(text) from public;
grant execute on function public.fort_nfce(text) to authenticated;
