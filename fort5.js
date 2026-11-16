"use strict";
/* =====================================================================
   Fort — pacote 5: relatório personalizado com período livre (De/Até)
   e "Receitas e despesas" juntas; botão para apagar tudo e zerar o app.
   ===================================================================== */

/* =============== relatório personalizado =============== */
// período do relatório: opções prontas ou datas exatas (De / Até)
function rpPeriod(){const rp=ui.rp;
 if(rp.range==='custom'){let f=rp.from||(ui.month+'-01'),t=rp.to||endOf(ui.month);if(f>t)[f,t]=[t,f];
  const ms=[];let m=ymOf(f),g=0;while(m<=ymOf(t)&&g++<600){ms.push(m);m=addMonths(m,1)}
  return{from:f,to:t,ms,label:brDate(f)+' a '+brDate(t)}}
 const ms=rp.range==='ano'?range(ui.month.slice(0,4)+'-12',12):range(ui.month,+rp.range||1);
 return{from:ms[0]+'-01',to:endOf(ms[ms.length-1]),ms,label:ms.length>1?monthLabel(ms[0])+' a '+monthLabel(ms[ms.length-1]):monthLabel(ms[0])}}

function rpItems(){const rp=ui.rp,p=rpPeriod();const kinds=rp.kind==='both'?['in','out']:[rp.kind];
 let items=S.tx.filter(t=>kinds.includes(t.kind)&&t.date&&t.date>=p.from&&t.date<=p.to);
 if(rp.src){const[st,id]=rp.src.split(':');items=items.filter(t=>st==='c'?t.cardId===id:t.accountId===id&&!t.cardId)}
 if(rp.cat)items=items.filter(t=>t.categoryId===rp.cat);
 if(rp.tag)items=items.filter(t=>(t.tags||[]).includes(rp.tag));
 items.sort((a,b)=>b.date.localeCompare(a.date));return{p,items}}

const rpPct=(v,t)=>t?(v/t*100).toFixed(1).replace('.',','):'0';
const catList=(cats,tot,cls)=>cats.map(g=>`<div class="row">${ib(g.cat.emoji,g.cat.color,'sm')}<div class="t"><b>${esc(g.cat.name)}</b><div class="bar" style="--c:${g.cat.color}"><i style="width:${tot?g.total/tot*100:0}%"></i></div></div><div class="amt"><b class="${cls||''}">${money(g.total)}</b><small>${rpPct(g.total,tot)}%</small></div></div>`).join('');

V.relatorio=()=>{const rp=ui.rp;const{p,items}=rpItems();ui.rpItems=items;const n=p.ms.length||1;
 const inI=items.filter(t=>t.kind==='in'),outI=items.filter(t=>t.kind==='out');const ti=sum(inI,t=>t.amount),to=sum(outI,t=>t.amount);
 const sel=(k,opts)=>`<select data-chg="rp" data-k="${k}">${opts.map(([v,l])=>`<option value="${esc(v)}" ${rp[k]==v?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
 const catOpts=S.categories.filter(c=>rp.kind==='both'||c.kind===rp.kind).map(c=>[c.id,(rp.kind==='both'?(c.kind==='in'?'↑ ':'↓ '):'')+c.name]);
 const dates=rp.range==='custom'?`<label class="fl" style="margin:0"><span>De</span><input type="date" data-chg="rpdate" data-k="from" value="${p.from}"></label><label class="fl" style="margin:0"><span>Até</span><input type="date" data-chg="rpdate" data-k="to" value="${p.to}"></label>`:'';
 const btns=`<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" data-act="pdfreport">${I.pdf} Gerar PDF</button><button class="btn" data-act="exportcsv" data-scope="report">Exportar CSV</button></div>`;
 const sumCard=rp.kind==='both'
  ?`<div class="card mb"><div class="grid3 pend"><div><small>Receitas</small><b class="pos">${money(ti)}</b></div><div><small>Despesas</small><b class="neg">${money(to)}</b></div><div><small>Saldo</small><b class="${ti-to<0?'neg':'pos'}">${money(ti-to)}</b></div></div><div class="sw mt"><small class="muted">${esc(p.label)} · ${items.length} lançamentos</small>${btns}</div><div id="exportout"></div></div>`
  :`<div class="card mb"><div class="sw"><div><small class="muted">Total · ${items.length} lançamentos</small><div class="big ${rp.kind==='in'?'pos':'neg'}" style="font-size:28px">${money(rp.kind==='in'?ti:to)}</div><small class="muted">${esc(p.label)} · média ${money((rp.kind==='in'?ti:to)/n)}/mês</small></div>${btns}</div><div id="exportout"></div></div>`;
 const cats=rp.kind==='both'
  ?`${sec('Receitas por categoria')}<div class="list mb">${catList(byCat(inI),ti,'pos')||'<div class="empty">Sem receitas.</div>'}</div>${sec('Despesas por categoria')}<div class="list">${catList(byCat(outI),to,'neg')||'<div class="empty">Sem despesas.</div>'}</div>`
  :`${sec('Por categoria')}<div class="list">${catList(byCat(items),rp.kind==='in'?ti:to)||'<div class="empty">Nada encontrado.</div>'}</div>`;
 return header('Relatório personalizado',{back:'mais',month:rp.range!=='custom'})+`<div class="filters">${sel('range',[['custom','Escolher datas (De / Até)'],['1','Mês selecionado'],['3','Últimos 3 meses'],['6','Últimos 6 meses'],['12','Últimos 12 meses'],['ano','Ano de '+ui.month.slice(0,4)]])}${dates}${sel('kind',[['both','Receitas e despesas'],['out','Só despesas'],['in','Só receitas']])}${sel('src',[['','Todas as contas'],...S.accounts.map(a=>['a:'+a.id,a.name]),...S.cards.map(c=>['c:'+c.id,'💳 '+c.name])])}${sel('cat',[['','Todas as categorias'],...catOpts])}${sel('tag',[['','Todas as tags'],...S.tags.map(g=>[g.id,g.name])])}</div>
 ${sumCard}
 <div class="home"><div>${cats}</div>
 <div>${sec('Lançamentos')}<div class="list">${items.slice(0,300).map(t=>txRow(t,{date:true,check:false})).join('')||'<div class="empty">Nada encontrado.</div>'}</div>${items.length>300?'<div class="muted mt">Mostrando 300 de '+items.length+'. Exporte para ver todos.</div>':''}</div></div>`};

Object.assign(CHG,{
 rp:el=>{const k=el.dataset.k;ui.rp[k]=el.value;if(k==='kind')ui.rp.cat='';
  if(k==='range'&&el.value==='custom'&&!ui.rp.from){ui.rp.from=ui.month+'-01';ui.rp.to=endOf(ui.month)}render()},
 rpdate:el=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(el.value))return;ui.rp[el.dataset.k]=el.value;render()}
});

function pdfReport(){const rp=ui.rp;const{p,items:its}=rpItems();const items=[...its].sort((a,b)=>a.date.localeCompare(b.date));const n=p.ms.length||1;
 const inI=items.filter(t=>t.kind==='in'),outI=items.filter(t=>t.kind==='out');const ti=sum(inI,t=>t.amount),to=sum(outI,t=>t.amount);
 const f=[rp.kind==='both'?'Receitas e despesas':rp.kind==='in'?'Receitas':'Despesas',rp.src?(rp.src.startsWith('c:')?byId('cards',rp.src.slice(2))?.name:byId('accounts',rp.src.slice(2))?.name):'Todas as contas',rp.cat?byId('categories',rp.cat)?.name:'Todas as categorias',rp.tag?'Tag: '+(byId('tags',rp.tag)?.name||''):''].filter(Boolean).join(' · ');
 const catTable=(arr,tot)=>ptable(['Categoria','Lançamentos','Valor','%'],byCat(arr).map(g=>`<tr><td>${esc(g.cat.name)}</td><td>${g.items.length}</td><td class="r">${pm$(g.total)}</td><td class="r">${rpPct(g.total,tot)}%</td></tr>`),`<tr><td>Total</td><td>${arr.length}</td><td class="r">${pm$(tot)}</td><td class="r">100%</td></tr>`);
 const inMonth=(arr,m)=>sum(arr.filter(t=>ymOf(t.date)===m),t=>t.amount);
 let body;
 if(rp.kind==='both'){
  body=pkpis([['Receitas',pm$(ti),'pos'],['Despesas',pm$(to),'neg'],['Saldo',pm$(ti-to),ti-to<0?'neg':'pos'],['Lançamentos',String(items.length)]])+
   `<h3>Receitas por categoria</h3>`+catTable(inI,ti)+`<h3>Despesas por categoria</h3>`+catTable(outI,to)+
   `<h3>Por mês</h3>`+ptable(['Mês','Receitas','Despesas','Saldo'],p.ms.map(m=>{const a=inMonth(inI,m),b=inMonth(outI,m);return `<tr><td>${monthLabel(m)}</td><td class="r pos">${pm$(a)}</td><td class="r neg">${pm$(b)}</td><td class="r ${a-b<0?'neg':''}">${pm$(a-b)}</td></tr>`}),`<tr><td>Total</td><td class="r">${pm$(ti)}</td><td class="r">${pm$(to)}</td><td class="r">${pm$(ti-to)}</td></tr>`);
 }else{const tot=rp.kind==='in'?ti:to;const cats=byCat(items);
  body=pkpis([['Total',pm$(tot),rp.kind==='in'?'pos':'neg'],['Lançamentos',String(items.length)],['Média por mês',pm$(tot/n)],['Maior categoria',cats[0]?esc(cats[0].cat.name):'—']])+
   `<h3>Por categoria</h3>`+catTable(items,tot)+`<h3>Por mês</h3>`+ptable(['Mês','Valor'],p.ms.map(m=>`<tr><td>${monthLabel(m)}</td><td class="r">${pm$(inMonth(items,m))}</td></tr>`));
 }
 const last=rp.kind==='both'?`<tr><td colspan="5">Saldo</td><td class="r">${pm$(ti-to)}</td></tr>`:`<tr><td colspan="5">Total</td><td class="r">${pm$(rp.kind==='in'?ti:to)}</td></tr>`;
 printDoc('Relatório personalizado',`${p.label} · ${f}`,body+`<h3>Todos os lançamentos</h3>`+ptable(['Data','Descrição','Categoria','Conta/cartão','Situação','Valor'],items.map(txLine),last))}

/* =============== apagar tudo e zerar o app =============== */
function dangerSection(){return `<div class="mt">${sec('Zerar o app')}<div class="card"><p class="muted" style="font-size:14px;line-height:1.5;margin:0 0 12px">Apaga <b>todos</b> os lançamentos, contas, cartões, categorias, orçamentos, metas, investimentos e demais dados — para você e para todas as pessoas com acesso. Não dá para desfazer. Faça um backup antes, se quiser guardar uma cópia.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="backup">Fazer backup antes</button><button class="btn danger" data-act="zerar">🗑️ Apagar tudo e zerar o app</button></div><div id="exportout"></div></div></div>`}
{const _aj=V.ajustes;V.ajustes=()=>_aj()+dangerSection()}

function zerarDialog(){$('#dlg').innerHTML=`<div class="ov" data-ov="dlg" style="z-index:70;align-items:center;padding:20px"><div class="sheet" style="max-width:440px;border-radius:20px"><div class="sheet-hd"><h2>Apagar tudo?</h2></div><div class="sheet-bd">
 <div class="banner">Isso apaga todos os dados do Fort, no computador e no celular, seu e da Thaís. <b>Não dá para desfazer.</b></div>
 <label class="row sw" style="cursor:pointer"><span>Apagar também os ajustes (foto, fundo, cor, alertas, taxas)</span><input type="checkbox" id="zr_set"><i></i></label>
 <label class="row sw" style="cursor:pointer"><span>Recriar as categorias padrão depois</span><input type="checkbox" id="zr_cat" checked><i></i></label>
 <label class="fl mt"><span>Para confirmar, digite <b>ZERAR</b></span><input id="zr_txt" autocomplete="off" autocapitalize="characters" placeholder="ZERAR"></label>
 <p class="muted" style="font-size:13px">As pessoas com acesso e as senhas continuam iguais.</p>
 <button class="btn danger" style="justify-content:center" data-act="zerarok">Apagar tudo agora</button>
 <button class="btn ghost" style="justify-content:center" data-act="dlg" data-k="">Cancelar</button></div></div></div>`}

async function zerarApp(){if((($('#zr_txt')?.value)||'').trim().toUpperCase()!=='ZERAR')return toast('Digite ZERAR para confirmar');
 const keepSet=!$('#zr_set')?.checked,seed=!!$('#zr_cat')?.checked;
 const cols=COLS.filter(c=>!(keepSet&&c==='settings'));
 if(typeof SB!=='undefined'&&SB&&DB){
  if(!navigator.onLine)return toast('Conecte-se à internet para zerar o app');
  const b=$('[data-act="zerarok"]');if(b){b.disabled=true;b.textContent='Apagando…'}
  try{
   const{error}=await SB.from('fort_docs').delete().in('col',cols);if(error)throw error;
   try{await SB.from('fort_inbox').delete().gt('id',0)}catch(e){}
   if(seed){const now=new Date().toISOString();const rows=DEF_CATS.map(([kind,name,emoji,color])=>({col:'categories',id:uid(),data:{kind,name,emoji,color},updated_by:ME?.email||null,updated_at:now}));const r=await SB.from('fort_docs').upsert(rows);if(r.error)console.warn('seed',r.error)}
  }catch(e){console.warn('zerar',e);if(b){b.disabled=false;b.textContent='Apagar tudo agora'}return toast('Não foi possível apagar: '+(e.message||'verifique a conexão'))}
  try{localStorage.removeItem('fort.outbox')}catch(e){}
  try{await SNAP.del(snapKey())}catch(e){}
 }else{try{localStorage.removeItem('fort.data')}catch(e){}}
 $('#dlg').innerHTML='';toast('Tudo apagado. Reabrindo o Fort…');setTimeout(()=>location.reload(),900)}

Object.assign(A,{zerar:()=>zerarDialog(),zerarok:()=>zerarApp()});
ui.rp.kind='both';

/* =============== campo de valor estilo caixa eletrônico =============== */
// Digita só números: 1 → 0,01 · 12 → 0,12 · 1234 → 12,34 · 123456 → 1.234,56
// Um sinal de menos (− ou -) em qualquer posição deixa o valor negativo.
function maskMoney(el){const raw=String(el.value||'');const neg=/[-−]/.test(raw);const dg=raw.replace(/\D/g,'').replace(/^0+/,'');
 if(!dg){el.value=neg?'−':'';return}
 const c=dg.padStart(3,'0');const int=c.slice(0,-2).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
 el.value=(neg?'−':'')+int+','+c.slice(-2);
 try{const n=el.value.length;el.setSelectionRange(n,n)}catch(e){}}
// valor que veio pronto (ex.: 123.45 ou 50) vira 123,45 / 50,00 ao tocar no campo
function normMoney(el){const v=String(el.value||'').trim();if(!v||/,\d{2}$/.test(v))return;const n=parseMoney(v.replace('−','-'));if(!isNaN(n)&&v.replace(/[^\d]/g,''))el.value=(n<0?'−':'')+fmtNum(Math.abs(n))}
document.addEventListener('input',e=>{const el=e.target;if(el&&el.matches&&el.matches('input[data-money]'))maskMoney(el)},true);
document.addEventListener('focusin',e=>{const el=e.target;if(el&&el.matches&&el.matches('input[data-money]')){normMoney(el);setTimeout(()=>{try{const n=el.value.length;el.setSelectionRange(n,n)}catch(x){}},0)}},true);
