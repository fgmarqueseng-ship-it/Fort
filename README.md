# Fort · Finances on the right track

Controle financeiro pessoal do Fabrício e da Thaís: contas, cartões, lançamentos, recorrências,
investimentos com taxas do Banco Central, calendário e projeção de até 30 anos, relatórios em PDF.

- Site estático (GitHub Pages), sem etapa de build.
- Dados e login no Supabase (tabelas `fort_docs` e `fort_members`, protegidas por RLS).
- `config.js` guarda a URL e a chave pública (anon) do projeto Supabase.
- `supabase/fort_schema.sql` cria a estrutura do banco.
