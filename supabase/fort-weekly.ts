import webpush from "npm:web-push@3.6.7";

// Fort · resumo semanal (Supabase Edge Function "fort-weekly")
const TOKEN = "COLE_AQUI_O_TOKEN";
const VAPID_PUBLIC = "BDWChwFj2Sk4AM49FP3za2Nw7MzwZipmUctxZc7p570Knq2VWUBOwVjK7-XbtDnBgtEL6mB-cGfdf_20uX_PgDE";
const VAPID_PRIVATE = "COLE_AQUI_A_CHAVE_PRIVADA";
webpush.setVapidDetails("mailto:alertas@fort.app", VAPID_PUBLIC, VAPID_PRIVATE);

function computeWeekly(today: string, tx: any[], cards: any[], categories: any[], budgets: any[]): any {
  const pad = n => String(n).padStart(2, '0');
  const lastDay = ym => { const [y, m] = ym.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
  const dateIn = (ym, d) => ym + '-' + pad(Math.max(1, Math.min(+d || 1, lastDay(ym))));
  const shift = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const brl = v => 'R$ ' + (Math.round(v * 100) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const r2 = v => Math.round(v * 100) / 100;
  const ym = today.slice(0, 7);
  const catName = id => (categories.find(c => c.id === id) || {}).name || 'Sem categoria';
  const spentDate = t => t.purchaseDate || t.date;
  const isSpend = t => t.kind === 'out' && (t.cardId || t.paid);
  // semana passada (7 dias antes de hoje) e média das 8 semanas anteriores
  const w0 = shift(today, -7), w1 = shift(today, -1), a0 = shift(today, -63), a1 = shift(today, -8);
  let week = 0, prev = 0, inc = 0; const byCat = new Map();
  for (const t of tx) {
    const d = spentDate(t); if (!d) continue;
    if (isSpend(t)) {
      if (d >= w0 && d <= w1) { week += +t.amount || 0; const k = t.categoryId || '_'; byCat.set(k, (byCat.get(k) || 0) + (+t.amount || 0)); }
      else if (d >= a0 && d <= a1) prev += +t.amount || 0;
    }
    if (t.kind === 'in' && !t.cardId && t.paid && t.date >= w0 && t.date <= w1) inc += +t.amount || 0;
  }
  week = r2(week); const avg = r2(prev / 8);
  // próximos 7 dias
  const n0 = today, n1 = shift(today, 6); let payN = 0, payV = 0, recV = 0;
  for (const t of tx) {
    if (t.paid || t.cardId || !t.date || t.date < n0 || t.date > n1) continue;
    if (t.kind === 'out') { payN++; payV += +t.amount || 0; } else if (t.kind === 'in') recV += +t.amount || 0;
  }
  for (const c of cards) {
    const yms = new Set(tx.filter(t => t.cardId === c.id && t.inv).map(t => t.inv));
    for (const m of yms) {
      const due = dateIn(m, c.due); if (due < n0 || due > n1) continue;
      let total = 0, paid = 0;
      for (const t of tx) { if (t.cardId !== c.id || t.inv !== m) continue; if (t.kind === 'out') total += +t.amount || 0; else if (t.kind === 'in') total -= +t.amount || 0; else if (t.kind === 'invpay') paid += +t.amount || 0; }
      const rem = r2(total - paid); if (rem > 0.004) { payN++; payV += rem; }
    }
  }
  // orçamento do mês
  const monthCat = new Map();
  for (const t of tx) { if (t.kind !== 'out') continue; const inMonth = t.cardId ? t.inv === ym : (t.date || '').slice(0, 7) === ym; if (inMonth) { const k = t.categoryId || '_'; monthCat.set(k, (monthCat.get(k) || 0) + (+t.amount || 0)); } }
  const bud = budgets.filter(b => +b.amount > 0 && b.categoryId).map(b => ({ name: catName(b.categoryId), p: (monthCat.get(b.categoryId) || 0) / +b.amount })).filter(x => x.p >= 0.8).sort((a, b) => b.p - a.p);
  const lines = [];
  if (week > 0) {
    let cmp = '';
    if (avg > 0) { const p = Math.round((week / avg - 1) * 100); cmp = Math.abs(p) < 5 ? ' (na média)' : p > 0 ? ` (${p}% acima da média)` : ` (${-p}% abaixo da média)`; }
    lines.push(`💸 Semana passada: ${brl(week)} em despesas${cmp}`);
    const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] > 0) lines.push(`🏷️ Onde mais gastaram: ${top[0] === '_' ? 'Sem categoria' : catName(top[0])} · ${brl(top[1])}`);
  } else lines.push('💸 Nenhuma despesa registrada na semana passada.');
  if (inc > 0) lines.push(`💰 Entraram ${brl(inc)}`);
  lines.push(payN ? `📅 Próximos 7 dias: ${payN} conta${payN > 1 ? 's' : ''} · ${brl(payV)}${recV > 0 ? ` · a receber ${brl(recV)}` : ''}` : `📅 Nenhuma conta vence nos próximos 7 dias${recV > 0 ? ` · a receber ${brl(recV)}` : ''}`);
  for (const b of bud.slice(0, 2)) lines.push(`🥧 ${b.name}: ${Math.round(b.p * 100)}% do orçamento${b.p >= 1 ? ' (estourado)' : ''}`);
  return { title: 'Fort · resumo da semana', body: lines.join('\n'), tag: 'fort-semana' };
}

Deno.serve(async (req: Request) => {
  try {
    const b = await req.json();
    if (b.token !== TOKEN) return new Response(JSON.stringify({ error: "token inválido" }), { status: 401 });
    const msg = computeWeekly(b.today, (b.tx || []).map((r: any) => r || {}), b.cards || [], b.categories || [], b.budgets || []);
    let sent = 0; const gone: string[] = []; const errors: string[] = [];
    for (const s of (b.subs || [])) {
      try {
        await webpush.sendNotification(s.sub, JSON.stringify({ ...msg, url: "./#inicio" }), { TTL: 60 * 60 * 12 });
        sent++;
      } catch (e) {
        if (e && (e.statusCode === 404 || e.statusCode === 410)) gone.push(s.endpoint);
        else errors.push(String(e?.statusCode || "") + " " + String(e?.body || e?.message || e));
      }
    }
    return new Response(JSON.stringify({ ok: true, sent, gone, errors, body: msg.body }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
