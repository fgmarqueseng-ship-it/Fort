"use strict";
/* =====================================================================
   Fort — pacote 4: sobra acumulada (orçamento e resultado do mês),
   caixa de entrada com as notificações do banco (Android), dividir
   lançamento em categorias, edição em massa e IA pelo Gemini.
   ===================================================================== */

/* =============== sobra acumulada =============== */
// Resultado do mês (receitas − despesas) que passa para o mês seguinte.
// Positivo = sobra; negativo = déficit (o que normalmente vira cheque especial).
// Por padrão acumula desde o mês do primeiro lançamento. Só usa outro mês se a pessoa escolheu em "Ajustar".
let firstYmKey='',firstYmVal='';
function firstTxYm(){const k=S.tx.length+'|'+(S.tx[S.tx.length-1]?.id||'');if(k===firstYmKey)return firstYmVal;let m='';for(const t of S.tx){const y=ymOf(t.date||'');if(/^\d{4}-\d{2}$/.test(y)&&y>='2000-01'&&(!m||y<m))m=y}firstYmKey=k;firstYmVal=m;return m}
const carryFrom=()=>{const c=appCfg();return (c.carryUser&&c.carryFrom)||firstTxYm()||curYm()};
function ensureCarryFrom(){}
const carryCache=new Map();let carryKey='';
function monthCarry(ym){ensureCarryFrom();const from=carryFrom()||curYm();if(appCfg().carryOff||ym<=from)return 0;
 const k=S.tx.length+'|'+from+'|'+(S.tx[S.tx.length-1]?.id||'');if(k!==carryKey){carryKey=k;carryCache.clear()}
 if(carryCache.has(ym))return carryCache.get(ym);
 let c=0,m=from,g=0;while(m<ym&&g++<600){c+=monthSummary(m).bal;m=addMonths(m,1)}c=r2(c);carryCache.set(ym,c);return c}
function heroCarry(ym,ms){// Só o resultado deste mês (receitas − despesas). O acumulado fica no saldo e na tela Orçamento.
 return `<button class="click" data-act="go" data-go="orcamento" title="Receitas − despesas deste mês"><small>${ms.bal<0?'Déficit':'Sobra'} do mês</small><b class="${ms.bal<0?'neg':'pos'}">${money(ms.bal)}</b></button>`}

// Orçamento por categoria com sobra acumulada (também acumula o estouro, que diminui o mês seguinte)
const budSpentCache=new Map();let budKey='';
function catSpent(catId,ym){const k=S.tx.length+'|'+(S.tx[S.tx.length-1]?.id||'');if(k!==budKey){budKey=k;budSpentCache.clear()}
 const key=catId+'|'+ym;if(budSpentCache.has(key))return budSpentCache.get(key);
 let v=0;for(const t of S.tx)if(t.categoryId===catId&&expInMonth(t,ym))v+=+t.amount||0;v=r2(v);budSpentCache.set(key,v);return v}
function budCarry(b,ym){if(b.roll===false)return 0;const since=b.since||ym;if(ym<=since)return 0;let c=0,m=since,g=0;while(m<ym&&g++<240){c+=(+b.amount||0)-catSpent(b.categoryId,m);m=addMonths(m,1)}return r2(c)}
function budInfo(b,ym){const amount=+b.amount||0,carry=budCarry(b,ym),avail=r2(amount+carry),sp=catSpent(b.categoryId,ym);return{amount,carry,avail,sp,left:r2(avail-sp),p:avail>0?sp/avail:(sp>0?9:0)}}

V.orcamento=()=>{const ym=ui.month;const rows=S.budgets.map(b=>({b,c:byId('categories',b.categoryId)})).filter(x=>x.c).map(x=>({...x,i:budInfo(x.b,ym)}));
 const totA=sum(rows,x=>x.i.avail),totS=sum(rows,x=>x.i.sp);const ms=monthSummary(ym);const off=!!appCfg().carryOff;const c=off?0:monthCarry(ym),fin=r2(c+ms.bal);
 const flow=`<div class="card mb"><div class="dh"><b>Resultado do mês</b><button class="link" data-act="carrycfg">Ajustar</button></div>
  ${off?'':`<div class="sw rline"><span class="muted">${c<0?'Déficit':'Sobra'} do mês anterior</span><b class="${c<0?'neg':c>0?'pos':''}">${money(c)}</b></div>`}
  <div class="sw rline"><span class="muted">+ Receitas</span><b class="pos">${money(ms.inc)}</b></div>
  <div class="sw rline"><span class="muted">− Despesas</span><b class="neg">${money(ms.exp)}</b></div>
  <div class="sw rline tot"><span>${off?'Balanço do mês':fin<0?'Déficit para o próximo mês':'Sobra para o próximo mês'}</span><b class="${fin<0?'neg':'pos'}">${money(off?ms.bal:fin)}</b></div>
  ${!off&&fin<0?`<div class="muted mt" style="font-size:12.5px">Gastou mais do que entrou. Se nenhuma conta cobrir a diferença, ela vira cheque especial no mês seguinte.</div>`:''}
  ${off?'':`<div class="muted mt" style="font-size:12px">Acumulando desde ${monthLabel(carryFrom()||curYm()).toLowerCase()}.</div>`}</div>`;
 return header('Orçamento',{back:'mais',month:true,actions:`<button class="btn primary" data-act="newbud">${I.plus} Limite</button>`})+flow+
 (rows.length?`<div class="card mb"><div class="sw"><span class="muted">Gasto nas categorias com limite</span><b>${money(totS)} <span class="muted">de ${money(totA)}</span></b></div><div class="bar" style="--c:${totS>totA?'var(--out)':'var(--in)'}"><i style="width:${totA>0?Math.min(100,totS/totA*100):0}%"></i></div><div class="muted mt" style="font-size:13px">${totA-totS>=0?'Ainda pode gastar '+money(totA-totS):'Passou '+money(totS-totA)+' do planejado'}</div></div>`:'')+
 `<div class="list">${rows.sort((a,b)=>a.c.name.localeCompare(b.c.name)).map(({b,c,i})=>`<button class="row" data-act="bud" data-id="${b.id}">${ib(c.emoji,c.color)}<div class="t"><div class="sw"><b>${esc(c.name)}</b><span>${money(i.sp)} <span class="muted">/ ${money(i.avail)}</span></span></div><div class="bar" style="--c:${i.p>1?'var(--out)':i.p>.8?'var(--warn)':'var(--in)'}"><i style="width:${Math.min(100,i.p*100)}%"></i></div><small>${i.left<0?'Estourou em '+money(-i.left):'Resta '+money(i.left)}${i.carry?` · <span class="${i.carry<0?'neg':'pos'}">${i.carry<0?'estouro':'sobra'} anterior ${money(i.carry)}</span>`:''}</small></div></button>`).join('')||'<div class="empty">Defina um limite mensal por categoria. O que sobrar passa para o mês seguinte; o que estourar é descontado.</div>'}</div>`};

function formBudget(b){const isNew=!b;openForm({title:b?'Editar limite':'Novo limite mensal',values:b?{...b,roll:b.roll!==false}:{roll:true},
 intro:b&&b.roll!==false&&budCarry(b,curYm())?`<div class="card sw"><span class="muted" style="font-size:13.5px">${budCarry(b,curYm())<0?'Estouro':'Sobra'} acumulado: <b class="${budCarry(b,curYm())<0?'neg':'pos'}">${money(budCarry(b,curYm()))}</b></span><button class="btn sm" data-act="budreset" data-id="${b.id}">Zerar</button></div>`:'',
 fields:[{k:'categoryId',label:'Categoria',type:'select',req:1,options:()=>catOptions('out','Escolha').filter(o=>!o.v||o.v===b?.categoryId||!S.budgets.some(x=>x.categoryId===o.v))},{k:'amount',label:'Limite por mês',type:'money',req:1},
  {k:'roll',label:'Passar a sobra (ou o estouro) para o mês seguinte',type:'toggle'}],
 onSave:v=>{const nb={...(b||{id:uid()}),...v,roll:!!v.roll};if(isNew||(!b.since&&nb.roll)||(b.roll===false&&nb.roll))nb.since=curYm();put('budgets',nb)},onDelete:b?()=>del('budgets',b.id):null})}

function budgetAlerts(){const ym=curYm();return S.budgets.map(b=>{const c=byId('categories',b.categoryId);if(!c||!(+b.amount>0))return null;const i=budInfo(b,ym);return{c,sp:i.sp,b:{...b,amount:i.avail},p:i.p}}).filter(x=>x&&x.p>=.8).sort((a,b)=>b.p-a.p)}
function budgetMini(ym){if(!S.budgets.length)return '';const rows=S.budgets.map(b=>{const c=byId('categories',b.categoryId);if(!c)return null;const i=budInfo(b,ym);return{c,i}}).filter(Boolean).sort((a,b)=>b.i.p-a.i.p).slice(0,4);
 return sec('Orçamento','orcamento')+`<div class="list">${rows.map(({c,i})=>`<div class="row">${ib(c.emoji,c.color,'sm')}<div class="t"><b>${esc(c.name)}</b><div class="bar" style="--c:${i.p>1?'var(--out)':i.p>.8?'var(--warn)':'var(--in)'}"><i style="width:${Math.min(100,i.p*100)}%"></i></div></div><div class="amt"><b>${money(i.sp)}</b><small>de ${money(i.avail)}</small></div></div>`).join('')}</div>`}

function formCarry(){const c=appCfg();openForm({title:'Sobra do mês',values:{on:!c.carryOff,from:carryFrom()},
 intro:'<div class="muted" style="font-size:13.5px">O resultado de cada mês (receitas − despesas) passa para o mês seguinte: a sobra aumenta o próximo mês e o déficit diminui.</div>',
 fields:[{k:'on',label:'Acumular a sobra (e o déficit) de um mês para o outro',type:'toggle'},{k:'from',label:'Começar a acumular em',type:'month',hint:'Padrão: mês do seu primeiro lançamento. Os meses anteriores a este não entram na conta.'}],
 onSave:v=>{const auto=firstTxYm()||curYm();saveApp({carryOff:!v.on,carryFrom:v.from||auto,carryUser:!!v.from&&v.from!==auto});carryKey='';toast('Ajuste salvo')}})}

/* =============== resumo de Transações com a sobra =============== */
const _vTx=V.transacoes;
V.transacoes=()=>{let h=_vTx();if(appCfg().carryOff)return h;const ym=ui.month;const ms=monthSummary(ym);const c=monthCarry(ym);if(!c)return h;const fin=r2(c+ms.bal);
 const line=`<div class="carryline">${c<0?"Déficit":"Sobra"} anterior <b class="${c<0?'neg':'pos'}">${money(c)}</b> · acumulado <b class="${fin<0?'neg':'pos'}">${money(fin)}</b></div>`;
 return h.replace('<div class="search">',line+'<div class="search">')};

Object.assign(A,{carrycfg:()=>formCarry(),
 budreset:async d=>{const b=byId('budgets',d.id);if(!b)return;if(!(await confirmBox('Zerar a sobra acumulada deste limite? Ele recomeça neste mês.','Zerar')))return;put('budgets',{...b,since:curYm()});closeModal();toast('Sobra zerada')}});

/* =============== caixa de entrada: notificações do banco (Android + MacroDroid) =============== */
let inboxRows=null,inboxErr='',inboxBusy=false,inboxSub=null;
const inboxAuto=()=>!!appCfg().inboxAuto;
// entende a notificação: valor, tipo, loja/pessoa, conta ou cartão
function parseNotif(n){const app=String(n.app||''),title=String(n.title||''),body=String(n.body||'');const all=(title+' · '+body).replace(/\s+/g,' ').trim();const t=norm(all);
 const r={kind:'',amount:0,desc:'',date:'',src:'',cat:'',ok:false,why:''};
 if(/recusad|negad|nao aprovad|cancelad|codigo|token|senha|verifica|limite dispon|fatura (fechou|esta fechada|disponivel)|vence (hoje|amanha)|lembrete|agendad|oferta|cashback dispon|investimento rend/.test(t)){r.why='aviso sem lançamento';return r}
 const m=all.match(/R\$\s*-?\s*(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:,\d{2})?)/i);if(!m){r.why='sem valor';return r}
 r.amount=parseFloat(m[1].replace(/\./g,'').replace(',','.'))||0;if(!(r.amount>0)){r.why='sem valor';return r}
 const isIn=/(recebeu|recebido|recebida|recebimento|deposito|credito em conta|creditad|entrou|estorno|reembolso|devolvid|pix recebido|transferencia recebida|caiu na sua conta)/.test(t);
 const isOut=/(compra|pagamento|pago|paga |enviou|enviad|debito|debitad|saque|pix enviado|transferencia enviada|transferiu|boleto)/.test(t);
 r.kind=isIn&&!/(enviou|enviad|compra)/.test(t)?'in':isOut?'out':isIn?'in':'out';
 // descrição: loja ("em LOJA") ou pessoa ("para X" / "de X")
 const after=all.slice(m.index+m[0].length);
 const pick=re=>{const x=after.match(re)||all.match(re);return x?x[1]:''};
 let d=r.kind==='in'?pick(/\b(?:de|por)\s+([^.,;\n]{2,60}?)(?=\s+(?:em|no|na|via|às|as|hoje|para)\b|[.,;]|$)/i):'';
 if(!d)d=pick(/\b(?:em|no estabelecimento|na loja)\s+([^.,;\n]{2,60}?)(?=\s+(?:para o|no cart|com o cart|em \d|às|as \d|dia \d|aprovad)|[.,;]|$)/i);
 if(!d&&r.kind==='out')d=pick(/\bpara\s+([^.,;\n]{2,60}?)(?=\s+(?:em|via|às|hoje)\b|[.,;]|$)/i);
 d=d.replace(/\b(APROVADA|APROVADO|realizada|realizado)\b/gi,'').replace(/\s+/g,' ').trim();
 const pix=/\bpix\b/.test(t);
 r.desc=d?cpStoreName(d):(pix?(r.kind==='in'?'Pix recebido':'Pix enviado'):(r.kind==='in'?'Recebimento':'Compra'));if(pix&&d)r.desc=(r.kind==='in'?'Pix de ':'Pix para ')+r.desc;
 // data: "16/11" na mensagem, senão o dia em que chegou
 const dm=all.match(/\b(\d{2})\/(\d{2})(?:\/(\d{2,4}))?\b/);const rec=String(n.created_at||'').slice(0,10)||today();
 if(dm){const y=dm[3]?(dm[3].length===2?'20'+dm[3]:dm[3]):rec.slice(0,4);const ds=`${y}-${dm[2]}-${dm[1]}`;r.date=parseDate(ds)&&ds<=today()?ds:rec}else r.date=rec;
 // conta ou cartão pelo nome do banco/app e pelo tipo
 const card=r.kind==='out'&&/(cartao|credito)/.test(t)&&!/\bdebito\b/.test(t)&&!pix;
 const hay=norm(app+' '+title+' '+body);const nm=x=>norm(x.name).replace(/[^a-z0-9 ]/g,' ').split(' ').filter(w=>w.length>=3);
 const hit=x=>nm(x).some(w=>new RegExp('\\b'+reEsc(w)).test(hay));
 if(card){const c=S.cards.filter(hit);const fin=t.match(/final\s*(\d{4})/);const c2=fin?S.cards.find(k=>String(k.final||'')===fin[1]||norm(k.name).includes(fin[1])):null;const k=c2||c[0];if(k)r.src='c:'+k.id}
 if(!r.src){const a=activeAccs().find(hit);if(a)r.src='a:'+a.id}
 if(!r.src)r.src=card&&S.cards.length===1?'c:'+S.cards[0].id:srcGuess(r.kind,'')||(activeAccs()[0]?'a:'+activeAccs()[0].id:'');
 if(r.src.startsWith('c:')&&r.kind!=='out')r.src=activeAccs()[0]?'a:'+activeAccs()[0].id:'';
 r.cat=guessCat(r.desc,r.kind,all.replace(/R\$[^ ]*/,''))||'';
 r.payer=whoEmail(n.who);r.ok=true;return r}
function whoEmail(w){w=norm(w);if(!w||typeof people!=='function')return '';const p=people().find(p=>norm(p.name).startsWith(w)||norm(p.email).startsWith(w));return p?p.email:''}

async function inboxLoad(force){if(!SB||typeof mode==='undefined'||mode!=='db'||inboxBusy)return;if(!force&&inboxRows&&Date.now()-inboxLoad.at<20000)return;inboxBusy=true;inboxLoad.at=Date.now();
 try{const{data,error}=await SB.from('fort_inbox').select('*').order('id',{ascending:true}).limit(200);
  if(error){inboxErr=/fort_inbox|relation|schema cache/i.test(error.message)?'setup':error.message;inboxRows=[];return}
  inboxErr='';inboxRows=(data||[]).map(n=>({...n,p:parseNotif(n)}));
  if(inboxAuto())for(const n of inboxRows.filter(n=>n.p.ok&&n.p.cat))await inboxPost(n,true);
  if(!inboxSub&&SB.channel){try{inboxSub=SB.channel('fort-inbox').on('postgres_changes',{event:'INSERT',schema:'public',table:'fort_inbox'},()=>{inboxBusy=false;inboxLoad(true)}).subscribe()}catch(e){}}}
 catch(e){inboxErr=String(e.message||e)}finally{inboxBusy=false;if(['inicio','caixa'].includes(ui.view)&&!$('#modal').innerHTML)render()}}
inboxLoad.at=0;
async function inboxDel(id){inboxRows=(inboxRows||[]).filter(n=>n.id!==id);try{await SB.from('fort_inbox').delete().eq('id',id)}catch(e){}}
function inboxTx(n){const p=n.p;const[st,sid]=p.src.split(':');const t={id:uid(),kind:p.kind,amount:r2(p.amount),desc:p.desc,date:p.date,purchaseDate:p.date,categoryId:p.cat||null,tags:[],note:'📥 '+[n.title,n.body].filter(Boolean).join(' · ').slice(0,300),split:!!myPrefs().splitDefault&&p.kind==='out',payer:p.payer||ME?.email||'',attach:[],paid:true,auto:true};
 if(st==='c'){const c=byId('cards',sid);t.cardId=sid;t.accountId=null;t.inv=invoiceMonthFor(c,p.date)}else{t.accountId=sid||null;t.cardId=null;t.inv=null}return t}
async function inboxPost(n,silent){if(!n.p.ok||!n.p.src)return false;await put('tx',inboxTx(n));await inboxDel(n.id);if(!silent)toast('Lançado: '+n.p.desc);return true}
function inboxRowHtml(n,full){const p=n.p;const c=byId('categories',p.cat);
 if(!p.ok)return `<div class="row inb">${ib('💬','#8e99a3','sm')}<div class="t"><b>${esc(n.title||n.app||'Notificação')}</b><small>${esc((n.body||'').slice(0,90))}</small><small class="muted">${esc(p.why)}</small></div><button class="icon-btn plain" data-act="inbdel" data-id="${n.id}" aria-label="Descartar">${I.x}</button></div>`;
 return `<div class="row inb">${ib(c?.emoji||(p.kind==='in'?'💰':'🧾'),c?.color||'#8e99a3','sm')}<button class="t" data-act="inbedit" data-id="${n.id}" style="text-align:left"><div class="sw" style="gap:8px"><b style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.desc)}</b><b class="${p.kind==='in'?'pos':'neg'}" style="white-space:nowrap">${p.kind==='in'?'+':'−'} ${money(p.amount)}</b></div><small>${brDate(p.date)} · ${esc(p.src?(p.src.startsWith('c:')?'💳 '+(byId('cards',p.src.slice(2))?.name||''):(byId('accounts',p.src.slice(2))?.name||'')):'sem conta')} · ${c?esc(c.name):'<span class="warn">sem categoria</span>'}</small></button>
  <div class="inbact"><button class="icon-btn plain ok" data-act="inbok" data-id="${n.id}" aria-label="Lançar">✓</button><button class="icon-btn plain" data-act="inbdel" data-id="${n.id}" aria-label="Descartar">${I.x}</button></div></div>`}
function inboxCard(){inboxLoad();const list=(inboxRows||[]).filter(n=>n.p.ok);if(!list.length)return '';
 return `<div class="card mb inbc"><div class="dh"><b>📥 ${list.length} lançamento${list.length>1?'s':''} das notificações</b><a class="link" data-act="go" data-go="caixa">Ver ›</a></div><div class="list flat">${list.slice(0,3).map(n=>inboxRowHtml(n)).join('')}</div>
  ${list.length>1?`<button class="btn sm primary mt" data-act="inball" style="width:100%;justify-content:center">Lançar ${list.length===2?'as 2':'todas as '+list.length}</button>`:''}</div>`}

V.caixa=()=>{inboxLoad();const rows=inboxRows||[];const ok=rows.filter(n=>n.p.ok),bad=rows.filter(n=>!n.p.ok);
 return header('Caixa de entrada',{back:'mais',actions:`<button class="btn sm" data-act="inbsetup">Configurar</button>`})+
 (inboxErr==='setup'?`<div class="banner">Falta rodar o código da caixa de entrada no Supabase. Toque em Configurar.</div>`:inboxErr?`<div class="banner">${esc(inboxErr)}</div>`:'')+
 `<div class="banner info">As compras e Pix avisados pelo banco no seu Android chegam aqui. Confira e toque em ✓ para lançar, ou no texto para ajustar antes.${inboxAuto()?' <b>Lançamento automático ligado</b>: os que já têm categoria entram sozinhos.':''}</div>
 ${ok.length?`<div class="list mb">${ok.map(n=>inboxRowHtml(n,true)).join('')}</div>${ok.length>1?`<button class="btn primary mb" data-act="inball" style="width:100%;justify-content:center">Lançar todas (${ok.length})</button>`:''}`:(inboxRows===null?'<div class="loading" style="min-height:120px"><div class="spin"></div></div>':'<div class="empty">Nada para lançar agora.</div>')}
 ${bad.length?sec('Avisos sem lançamento')+`<div class="list">${bad.map(n=>inboxRowHtml(n)).join('')}</div><button class="btn sm mt" data-act="inbclear">Limpar avisos</button>`:''}`};

async function inboxSetup(){let token='';try{const{data}=await SB.rpc('fort_inbox_token');token=data||''}catch(e){}
 const url=`${FORT_CONFIG.url}/rest/v1/rpc/fort_inbox_add`;const nm=esc(myName().split(' ')[0]||'');
 const body=`{"p_token":"${token||'TOKEN'}","p_app":"[not_app_name]","p_title":"[not_title]","p_text":"[notification]","p_who":"${nm}"}`;
 const cp=(k,v)=>`<div class="fl"><span>${k}</span><div class="qkbox"><input readonly value="${esc(v)}" onclick="this.select()"><button class="btn sm" data-act="inbcopy" data-k="${esc(v)}">Copiar</button></div></div>`;
 showModal(`<div class="sheet-hd"><h2>📥 Lançar pelas notificações</h2><button class="icon-btn" data-act="close" aria-label="Fechar">${I.x}</button></div><div class="sheet-bd">
 ${token?'':'<div class="banner">Primeiro rode o código da caixa de entrada no SQL Editor do Supabase (supabase/fort_inbox.sql). Depois abra esta tela de novo.</div>'}
 <label class="sw"><span>Lançar automaticamente <em style="display:block;font-size:12px;font-style:normal" class="muted">Quando o Fort já souber a categoria, lança sem perguntar. Os outros ficam para você conferir.</em></span><input type="checkbox" data-chg="inbauto" ${inboxAuto()?'checked':''}><i></i></label>
 <div class="muted" style="font-size:13.5px;line-height:1.5"><b>No celular Android (faça no seu e no da Thaís):</b><br>
 1. Instale o <b>MacroDroid</b> (Play Store, grátis) e toque em <b>Adicionar macro</b>.<br>
 2. <b>Gatilho</b>: Notificação › Notificação recebida › escolha os apps dos bancos (Nubank, Itaú…) › "Qualquer conteúdo".<br>
 3. <b>Ação</b>: Conectividade › <b>Requisição HTTP</b> › método <b>POST</b>, com o endereço, os 2 cabeçalhos e o corpo abaixo (tipo <b>application/json</b>).<br>
 4. Salve a macro e permita o acesso às notificações quando o Android pedir.<br>
 No celular da Thaís, troque o nome no fim do corpo para "Thaís".</div>
 ${cp('Endereço (URL)',url)}${cp('Cabeçalho 1 · nome apikey, valor:',FORT_CONFIG.anonKey)}${cp('Cabeçalho 2 · nome Content-Type, valor:','application/json')}${cp('Corpo',body)}
 <em class="muted" style="font-size:12px">O token no corpo é o que permite gravar na sua caixa de entrada. Não compartilhe.</em>
 </div><div class="sheet-ft"><span class="sp"></span><button class="btn" data-act="inbtest">Testar</button><button class="btn primary" data-act="close">Pronto</button></div>`)}

Object.assign(A,{
 inbok:async d=>{const n=(inboxRows||[]).find(x=>x.id==d.id);if(!n)return;if(!n.p.cat&&n.p.kind!=='transfer'){return A.inbedit(d)}await inboxPost(n);render()},
 inbdel:async d=>{await inboxDel(+d.id);render()},
 inbedit:d=>{const n=(inboxRows||[]).find(x=>x.id==d.id);if(!n||!n.p.ok)return;const p=n.p;ui.inbEditing=n.id;
  openTx(null,{kind:p.kind,amount:fmtNum(p.amount),desc:p.desc,date:p.date,src:p.src,cat:p.cat,paid:true,note:'📥 '+[n.title,n.body].filter(Boolean).join(' · ').slice(0,300),payer:p.payer||ME?.email||''})},
 inball:async()=>{const list=(inboxRows||[]).filter(n=>n.p.ok);const noCat=list.filter(n=>!n.p.cat).length;
  if(noCat&&!(await confirmBox(`${noCat} ${noCat>1?'estão':'está'} sem categoria e ${noCat>1?'vão':'vai'} entrar assim. Lançar todas?`,'Lançar todas')))return;
  let k=0;for(const n of list){if(await inboxPost(n,true))k++}toast(k+' lançamento'+(k>1?'s':'')+' feito'+(k>1?'s':''));render()},
 inbclear:async()=>{for(const n of (inboxRows||[]).filter(n=>!n.p.ok))await inboxDel(n.id);render()},
 inbsetup:()=>inboxSetup(),
 inbcopy:async d=>{try{await navigator.clipboard.writeText(d.k);toast('Copiado')}catch(e){toast('Toque no campo e copie')}},
 inbtest:async()=>{try{const{data:token}=await SB.rpc('fort_inbox_token');const{error}=await SB.rpc('fort_inbox_add',{p_token:token,p_app:'Teste',p_title:'Compra aprovada',p_text:'Compra de R$ 12,34 APROVADA em PADARIA TESTE para o cartão com final 0000.',p_who:''});if(error)throw error;toast('Teste enviado. Veja na Caixa de entrada.');closeModal();inboxLoad(true);go('caixa')}catch(e){toast('Não funcionou: '+(e.message||e))}}});
Object.assign(CHG,{inbauto:el=>{saveApp({inboxAuto:el.checked});toast(el.checked?'Lançamento automático ligado':'Lançamento automático desligado')}});

// ao salvar um lançamento aberto a partir da caixa de entrada, tira a notificação de lá
const _saveTx=saveTx;
saveTx=async function(){const id=ui.inbEditing;ui.inbEditing=null;const before=S.tx.length;await _saveTx();if(id&&(S.tx.length>before||!draft))inboxDel(id)};
const _closeModal=closeModal;closeModal=function(){ui.inbEditing=null;_closeModal()};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)inboxLoad(true)});
setInterval(()=>{if(!document.hidden)inboxLoad()},60000);

/* =============== dividir um lançamento em várias categorias =============== */
// Vira um lançamento por categoria (mesma data, conta e descrição), ligados por splitGroup.
// Assim todos os relatórios, orçamentos e gráficos já contam certo.
const splitAllowed=d=>d&&!d.id&&d.kind!=='transfer'&&(d.repeat||'none')==='none'&&(!d.cur||d.cur==='BRL');
function splitHtml(d){const kc=d.kind==='in'?'in':'out';const cats=S.categories.filter(c=>c.kind===kc).sort((a,b)=>a.name.localeCompare(b.name));
 const total=parseMoney(d.amount)||0;const used=r2(sum(d.parts,p=>parseMoney(p.amount)||0));const rest=r2(total-used);
 return `<div class="fl splitbox"><span>Dividir em categorias</span>${d.parts.map((p,i)=>`<div class="sprow"><select class="sp_cat" data-k="${i}"><option value="">Categoria…</option>${cats.map(c=>`<option value="${c.id}" ${p.cat===c.id?'selected':''}>${esc(c.emoji+' '+c.name)}</option>`).join('')}</select><input class="sp_amt" data-money data-k="${i}" inputmode="decimal" placeholder="0,00" value="${esc(p.amount)}" data-inp="sprest"><button class="icon-btn plain" data-act="sprm" data-k="${i}" aria-label="Remover">${I.x}</button></div>`).join('')}
 <div class="sw" style="font-size:13px"><button class="link" data-act="spadd">+ Outra categoria</button><span id="sp_rest" class="${Math.abs(rest)<0.005?'pos':'warn'}">${Math.abs(rest)<0.005?'Tudo distribuído ✓':rest>0?'Falta distribuir '+moneyRaw(rest):'Passou '+moneyRaw(-rest)+' do total'}</span></div>
 <button class="link" data-act="spoff" style="align-self:flex-start;font-size:13px">Cancelar divisão</button></div>`}
const _renderTx=renderTx;
renderTx=function(){_renderTx();const d=draft;if(!d)return;const m=$('#modal');if(!m)return;
 if(d.orig&&d.orig.splitGroup){const n=S.tx.filter(t=>t.splitGroup===d.orig.splitGroup);const ban=document.createElement('div');ban.className='banner info';ban.style.margin='0';ban.textContent=`Parte de uma compra dividida em ${n.length} categorias (total ${moneyRaw(sum(n,t=>t.amount))}). A edição vale só para esta parte.`;const bd=m.querySelector('.sheet-bd');if(bd)bd.appendChild(ban)}
 if(!splitAllowed(d)){d.parts=null;return}
 const grid=m.querySelector('.catgrid');if(!grid)return;const fl=grid.closest('.fl');
 if(d.parts&&d.parts.length){fl.style.display='none';fl.insertAdjacentHTML('afterend',splitHtml(d))}
 else fl.insertAdjacentHTML('beforeend','<button class="link" data-act="spon" style="align-self:flex-start;font-size:13px;margin-top:2px">➗ Dividir em várias categorias</button>')};
const _syncDraft=syncDraft;
syncDraft=function(){_syncDraft();const d=draft;if(!d||!d.parts)return;document.querySelectorAll('#modal .sp_cat').forEach(el=>{const p=d.parts[+el.dataset.k];if(p)p.cat=el.value});document.querySelectorAll('#modal .sp_amt').forEach(el=>{const p=d.parts[+el.dataset.k];if(p)p.amount=el.value})};
const _saveTx2=saveTx;
saveTx=async function(){syncDraft();const d=draft;
 if(!d||!d.parts||!d.parts.length||!splitAllowed(d))return _saveTx2();
 const total=parseMoney(d.amount)||0;const parts=d.parts.map(p=>({cat:p.cat,amount:r2(parseMoney(p.amount)||0)})).filter(p=>p.amount>0);
 if(!(total>0))return toast('Informe o valor total');if(parts.length<2)return toast('Divida em pelo menos 2 categorias, ou cancele a divisão');
 if(parts.some(p=>!p.cat))return toast('Escolha a categoria de cada parte');if(Math.abs(r2(sum(parts,p=>p.amount))-total)>0.005)return toast('A soma das partes precisa dar '+moneyRaw(total));
 const before=new Set(S.tx.map(t=>t.id));d.amount=fmtNum(parts[0].amount);d.cat=parts[0].cat;const ai=document.getElementById('tx_amt');if(ai)ai.value=d.amount;const keep=d.parts;d.parts=null;
 await _saveTx2();const t0=S.tx.find(t=>!before.has(t.id));if(!t0){if(draft){draft.parts=keep;draft.amount=fmtNum(total);if(ai)ai.value=draft.amount;renderTx()}return}
 const g=uid();put('tx',{...t0,splitGroup:g,splitTotal:total});parts.slice(1).forEach(p=>put('tx',{...t0,id:uid(),categoryId:p.cat,amount:p.amount,splitGroup:g,splitTotal:total}));
 toast(`Lançamento dividido em ${parts.length} categorias`)};
Object.assign(A,{
 spon:()=>{syncDraft();const total=parseMoney(draft.amount)||0;draft.parts=[{cat:draft.cat||'',amount:total?fmtNum(total):''},{cat:'',amount:''}];renderTx()},
 spoff:()=>{syncDraft();const p=(draft.parts||[]).find(x=>x.cat);draft.parts=null;if(p&&!draft.cat)draft.cat=p.cat;renderTx()},
 spadd:()=>{syncDraft();const total=parseMoney(draft.amount)||0;const rest=r2(total-sum(draft.parts,p=>parseMoney(p.amount)||0));draft.parts.push({cat:'',amount:rest>0?fmtNum(rest):''});renderTx()},
 sprm:d=>{syncDraft();draft.parts.splice(+d.k,1);if(draft.parts.length<1)draft.parts=null;renderTx()}});
Object.assign(INP,{sprest:()=>{syncDraft();const d=draft;const el=$('#sp_rest');if(!el||!d.parts)return;const rest=r2((parseMoney(d.amount)||0)-sum(d.parts,p=>parseMoney(p.amount)||0));el.className=Math.abs(rest)<0.005?'pos':'warn';el.textContent=Math.abs(rest)<0.005?'Tudo distribuído ✓':rest>0?'Falta distribuir '+moneyRaw(rest):'Passou '+moneyRaw(-rest)+' do total'}});

/* =============== edição em massa (Transações) =============== */
const _txRow=txRow;
txRow=function(t,opt){let h=_txRow(t,opt);if(ui.sel&&ui.view==='transacoes')h=h.replace('<div class="row click"',`<div class="row click selrow${ui.sel.has(t.id)?' on':''}"`);return h};
const _vTx2=V.transacoes;
V.transacoes=()=>{let h=_vTx2();
 const tool=ui.sel?`<div class="seltop"><b>${ui.sel.size} selecionado${ui.sel.size===1?'':'s'}</b><span class="sp"></span><button class="link" data-act="selall">Todos da lista</button><button class="link" data-act="seloff">Cancelar</button></div>`
  :`<div class="seltop"><span class="sp"></span><button class="link" data-act="selon">☑️ Selecionar vários</button></div>`;
 h=h.replace('<div class="search">',tool+'<div class="search">');
 if(ui.sel&&ui.sel.size)h+=`<div class="selbar"><button data-act="bulkcat">🏷️<span>Categoria</span></button><button data-act="bulksrc">👛<span>Conta</span></button><button data-act="bulkpaid">✅<span>Pago</span></button><button data-act="bulkdel" class="neg">🗑️<span>Excluir</span></button></div>`;
 return h};
const _aTx=A.tx;
A.tx=d=>{if(ui.sel&&ui.view==='transacoes'){ui.sel.has(d.id)?ui.sel.delete(d.id):ui.sel.add(d.id);render();return}return _aTx(d)};
const selTx=()=>[...(ui.sel||[])].map(id=>byId('tx',id)).filter(Boolean);
Object.assign(A,{
 selon:()=>{ui.sel=new Set();render()},seloff:()=>{ui.sel=null;render()},
 selall:()=>{document.querySelectorAll('#txlist [data-act="tx"]').forEach(el=>ui.sel.add(el.dataset.id));render()},
 bulkcat:()=>{const list=selTx().filter(t=>t.kind==='out'||t.kind==='in');if(!list.length)return toast('Nenhum lançamento com categoria selecionado');const kind=list.every(t=>t.kind==='in')?'in':'out';
  openForm({title:`Categoria de ${list.length} lançamento${list.length>1?'s':''}`,values:{},fields:[{k:'cat',label:'Nova categoria',type:'select',req:1,options:()=>catOptions(kind,'Escolha')}],intro:list.some(t=>t.kind!==kind)?'<div class="muted" style="font-size:13px">Só os lançamentos do mesmo tipo (despesa ou receita) serão alterados.</div>':'',
   onSave:v=>{if(!v.cat){toast('Escolha a categoria');return false}list.filter(t=>t.kind===kind).forEach(t=>put('tx',{...t,categoryId:v.cat}));ui.sel=null;toast('Categoria alterada')}})},
 bulksrc:()=>{const list=selTx().filter(t=>t.kind==='out'||t.kind==='in');if(!list.length)return;
  openForm({title:`Conta de ${list.length} lançamento${list.length>1?'s':''}`,values:{},fields:[{k:'src',label:'Nova conta ou cartão',type:'select',req:1,options:()=>[{v:'',l:'Escolha'},...activeAccs().map(a=>({v:'a:'+a.id,l:a.name})),...S.cards.map(c=>({v:'c:'+c.id,l:'💳 '+c.name}))]}],
   onSave:v=>{const[st,sid]=(v.src||'').split(':');if(!sid){toast('Escolha a conta');return false}let n=0;for(const t of list){if(st==='c'&&t.kind!=='out')continue;const u={...t};if(st==='c'){const c=byId('cards',sid);u.cardId=sid;u.accountId=null;u.inv=invoiceMonthFor(c,t.purchaseDate||t.date);u.paid=true}else{u.accountId=sid;u.cardId=null;u.inv=null}put('tx',u);n++}ui.sel=null;toast(n+' lançamento'+(n>1?'s':'')+' movido'+(n>1?'s':''))}})},
 bulkpaid:async()=>{const list=selTx().filter(t=>!t.cardId&&t.kind!=='invpay');if(!list.length)return toast('Lançamentos de cartão não têm “pago”');const allPaid=list.every(t=>t.paid);
  const k=await choiceBox('Situação',`${list.length} lançamento${list.length>1?'s':''}`,[['p','Marcar como pago','primary'],['n','Marcar como pendente']]);if(!k)return;list.forEach(t=>put('tx',{...t,paid:k==='p'}));ui.sel=null;toast(k==='p'?'Marcados como pagos':'Marcados como pendentes')},
 bulkdel:async()=>{const list=selTx();if(!list.length)return;if(!(await confirmBox(`Excluir ${list.length} lançamento${list.length>1?'s':''}? Não dá para desfazer.`,'Excluir')))return;list.forEach(t=>del('tx',t.id));ui.sel=null;toast('Excluídos')}});
const _go=go;go=function(v){if(v!=='transacoes')ui.sel=null;return _go(v)};

/* =============== IA no site: Gemini pela função fort-ai do Supabase =============== */
async function aiCall(payload,again){if(!SB||!SB.functions)throw Object.assign(new Error('offline'),{code:'offline'});
 if(!navigator.onLine)throw Object.assign(new Error('offline'),{code:'offline'});
 const{data,error}=await SB.functions.invoke('fort-ai',{body:payload});
 if(error){const ctx=error.context;let st=(ctx&&typeof ctx.status==='number')?ctx.status:0,det={};try{if(ctx&&ctx.json)det=await ctx.json()}catch(e){}
  if(st===404||det.error==='setup'||det.code==='NOT_FOUND'){ui.aiOff=ui.imgOff='A IA ainda não foi instalada no Supabase. Veja abaixo como ligar (é grátis).';throw Object.assign(new Error('setup'),{code:'setup'})}
  if(st===429)throw Object.assign(new Error('limite'),{code:'rate_limited'});
  if((st===401||st===403)&&!again){const ok=await reauth();if(ok)return aiCall(payload,true)}
  if(st===403)throw Object.assign(new Error('este login não tem acesso à IA do Fort (entre de novo com o e-mail liberado)'),{code:'ai_error'});
  if(st===401)throw Object.assign(new Error('sua sessão expirou, saia e entre de novo'),{code:'ai_error'});
  if(!st){// nem chegou resposta: ou a função não existe no Supabase, ou caiu a conexão
   if(!stale){ui.aiOff=ui.imgOff='Não encontrei a IA no Supabase. Veja abaixo como ligar (é grátis).';throw Object.assign(new Error('setup'),{code:'setup'})}
   throw Object.assign(new Error('offline'),{code:'offline'})}
  throw Object.assign(new Error(det.detail||det.error||error.message||('erro '+st)),{code:'ai_error'})}
 return data||{}}
function aiMerge(messages){const out=[];for(const m of messages){const role=m.role==='assistant'?'assistant':'user';const c=String(m.content||'');if(out.length&&out[out.length-1].role===role)out[out.length-1].content+='\n\n'+c;else out.push({role,content:c})}return out}
if(!SAMPLE){
 const gem=async(messages,opt={})=>{const r=await aiCall({messages:aiMerge(messages)});const text=String(r.text||'').replace(/\*\*/g,'');if(opt.onText)try{opt.onText({text})}catch(e){}return{text}};
 gem.json=async(prompt,opt={})=>{let image=null;const f=opt.images&&opt.images[0];
  if(f){const u=await imgToDataUrl(f,1600,1600,.82,false);const m=String(u).match(/^data:([^;]+);base64,(.*)$/);if(m)image={type:m[1],data:m[2]}}
  const r=await aiCall({messages:[{role:'user',content:prompt}],json:true,image});let t=String(r.text||'').trim().replace(/^```(?:json)?\s*|\s*```$/g,'');
  try{return JSON.parse(t)}catch(e){throw Object.assign(new Error('json'),{code:'invalid_json'})}};
 gem.limits=async()=>({images:true});
 SAMPLE=gem;
}

Object.assign(A,{syncretry:()=>{toast('Tentando conectar…');try{DB&&DB.reload&&DB.reload()}catch(e){}}});
function aiSetupHelp(){const sb='https://supabase.com/dashboard/project/'+String(CFG.url||'').replace(/^https:\/\/|\.supabase\.co.*$/g,'');
 return `<div class="card mb" style="line-height:1.6;font-size:14px"><b>Como ligar a IA (uma vez só, grátis)</b><br>
 1. Pegue uma chave grátis do Google em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> (<b>Create API key</b>) e copie.<br>
 2. No Supabase, abra <a href="${sb}/functions/secrets" target="_blank" rel="noopener">Edge Functions › Secrets</a>, crie o segredo <b>GEMINI_API_KEY</b> e cole a chave.<br>
 3. Abra <a href="${sb}/functions" target="_blank" rel="noopener">Edge Functions</a> › <b>Deploy a new function</b> › <b>Via Editor</b>, dê o nome <b>fort-ai</b>, apague o exemplo e cole o código do arquivo <a href="https://github.com/fgmarqueseng-ship-it/Fort/blob/main/supabase/fort-ai.ts" target="_blank" rel="noopener">supabase/fort-ai.ts</a>. Toque em <b>Deploy</b>.<br>
 4. Feche e abra o Fort de novo.</div>`}
