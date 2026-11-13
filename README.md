# Fort · Finances on the right track

Controle financeiro pessoal do Fabrício e da Thaís: contas, cartões, lançamentos, recorrências,
investimentos com taxas do Banco Central, calendário e projeção de até 30 anos, relatórios em PDF.

- Site estático (GitHub Pages), sem etapa de build.
- Dados e login no Supabase (tabelas `fort_docs` e `fort_members`, protegidas por RLS).
- `config.js` guarda a URL e a chave pública (anon) do projeto Supabase.
- `supabase/fort_schema.sql` cria a estrutura do banco.

Recursos do pacote 3:
- Lançamento rápido por frase ou voz (`fort3.js` › `parseQuick`), busca global (Ctrl+K) e atalhos do ícone (`manifest.json` › `shortcuts`, `?acao=`).
- Funciona sem internet: cópia local dos dados no IndexedDB e fila de envio (`boot.js`).
- Importação de fatura/extrato em PDF (`pdfparse.js` + `vendor/pdfjs`, Apache-2.0).
- “Fique de olho” no Início e tela de Assinaturas.
- Resumo semanal por notificação: `supabase/fort_weekly.sql` + Edge Function `supabase/fort-weekly.ts` (preencher token e chave privada no Supabase, nunca no GitHub).
