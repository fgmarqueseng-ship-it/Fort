"use strict";
/* ================= utilidades ================= */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const r2=v=>Math.round((+v||0)*100)/100;
const sum=(a,f=x=>x)=>r2(a.reduce((s,x)=>s+(+f(x)||0),0));
const BRL=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
let hideVals=false;try{hideVals=localStorage.getItem('fort.hide')==='1'}catch(e){}
const money=v=>hideVals?'R$ •••••':BRL.format(+v||0).replace(/ /g,' ');
const moneyRaw=v=>BRL.format(+v||0).replace(/ /g,' ');
const fmtNum=v=>(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const parseMoney=s=>{s=String(s??'').trim().replace(/[R$\s]/g,'');if(!s)return 0;if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');const v=parseFloat(s);return isNaN(v)?0:v};
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>ymd(new Date());
const ymOf=s=>String(s).slice(0,7);
const addMonths=(ym,n)=>{let[y,m]=ym.split('-').map(Number);m+=n;y+=Math.floor((m-1)/12);m=((m-1)%12+12)%12+1;return y+'-'+pad(m)};
const lastDay=ym=>{const[y,m]=ym.split('-').map(Number);return new Date(y,m,0).getDate()};
const dateIn=(ym,day)=>ym+'-'+pad(Math.max(1,Math.min(+day||1,lastDay(ym))));
const addMonthsDate=(d,n)=>dateIn(addMonths(ymOf(d),n),+d.slice(8,10));
const endOf=ym=>ym+'-'+pad(lastDay(ym));
const MES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MESC=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const monthLabel=ym=>cap(MES[+ym.slice(5)-1])+' '+ym.slice(0,4);
const monShort=ym=>MESC[+ym.slice(5)-1];
const monYr=ym=>MESC[+ym.slice(5)-1]+'/'+ym.slice(2,4);
const fmtDay=d=>d.slice(8,10)+' de '+monShort(ymOf(d));
const brDate=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'';
const DOW=['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const dowOf=d=>{const[y,m,dd]=d.split('-').map(Number);return new Date(y,m-1,dd).getDay()};
const range=(endYm,n)=>{const a=[];for(let i=n-1;i>=0;i--)a.push(addMonths(endYm,-i));return a};
const initials=s=>String(s||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const horizon=()=>addMonths(ymOf(today()),12);
const compact=v=>{const a=Math.abs(v);let s;if(a>=1e6)s=(v/1e6).toFixed(1).replace('.',',')+' mi';else if(a>=1000)s=String(Math.round(v/100)/10).replace('.',',')+' mil';else s=String(Math.round(v));return 'R$ '+s};

/* ================= ícones ================= */
const ic=p=>`<svg class="i" viewBox="0 0 24 24">${p}</svg>`;
const I={
 home:ic('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
 swap:ic('<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),
 chart:ic('<path d="M5 20V12M12 20V5M19 20v-9"/>'),
 dots:ic('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
 plus:ic('<path d="M12 5v14M5 12h14"/>'),
 x:ic('<path d="M6 6l12 12M18 6L6 18"/>'),
 check:ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
 back:ic('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
 left:ic('<path d="M15 6l-6 6 6 6"/>'),
 right:ic('<path d="M9 6l6 6-6 6"/>'),
 down:ic('<path d="M6 9l6 6 6-6"/>'),
 up:ic('<path d="M6 15l6-6 6 6"/>'),
 eye:ic('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
 eyeoff:ic('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><path d="M4 4l16 16"/>'),
 search:ic('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
 trash:ic('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
 gear:ic('<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
 arrUp:ic('<path d="M12 19V5M6 11l6-6 6 6"/>'),
 arrDn:ic('<path d="M12 5v14M6 13l6 6 6-6"/>'),
 card:ic('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h4"/>'),
 send:ic('<path d="M4 12l16-8-6 16-3-7z"/>'),
 lock:ic('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0"/>'),
 cal:ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
 trend:ic('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
 pdf:ic('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
 out:ic('<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H4"/>')
};

/* ================= dados ================= */
const COLS=['accounts','cards','categories','tags','tx','recurrences','budgets','goals','loans','debts','investments','settings','settles','rules','assets'];
const S={};COLS.forEach(c=>S[c]=[]);
let DB=null,USER=null,SAMPLE=null,DL=null;
let mode='loading',seen=new Set(),confirmed=new Set(),loadTimer=null,stale=false,ver=0,readOnly=false;
const byId=(col,id)=>id?S[col].find(x=>x.id===id):undefined;
const PALETTE=['#4fb3a9','#5fae86','#e08a6d','#d9b25c','#9a8be0','#6d9be0','#e07a9b','#7fbf5a','#c98fd9','#e0a35c','#5cc4d9','#8e99a3','#8a05be','#cc0000','#1f6fd1','#ff7a00'];
const EMOJIS=['🍽️','🛒','🏠','🚗','⛽','🚌','💊','🏥','🎓','📚','🎬','🎮','🛍️','👕','🔧','💡','📱','🌐','📺','🐾','🎁','✈️','🏖️','💪','💇','🧾','🤝','🏦','💳','💼','💻','📈','↩️','➕','💰','🐷','👶','❤️','☕','🍺','⛪','🧹','🏋️','🎵','🚕','🅿️','📦','•••'];
const DEF_CATS=[
 ['out','Alimentação','🍽️','#9a8be0'],['out','Mercado','🛒','#7fbf5a'],['out','Moradia','🏠','#5fae86'],['out','Transporte','🚗','#e08a6d'],['out','Saúde','💊','#e07a9b'],['out','Educação','🎓','#e0a35c'],['out','Lazer','🎬','#c98fd9'],['out','Compras','🛍️','#d9b25c'],['out','Serviços','🔧','#6d9be0'],['out','Assinaturas','📺','#5cc4d9'],['out','Pets','🐾','#7fbf5a'],['out','Dívida','🤝','#4fb3a9'],['out','Empréstimo','🏦','#d9b25c'],['out','Impostos e taxas','🧾','#8e99a3'],['out','Outros','•••','#5fae86'],
 ['in','Salário','💼','#3ccf91'],['in','Freelance','💻','#5cc4d9'],['in','Rendimentos','📈','#9a8be0'],['in','Reembolso','↩️','#d9b25c'],['in','Outras receitas','➕','#8e99a3']
];
const ACC_TYPES=[{v:'corrente',l:'Conta corrente'},{v:'poupanca',l:'Poupança'},{v:'alimentacao',l:'Vale-alimentação / refeição'},{v:'dinheiro',l:'Dinheiro'},{v:'investimento',l:'Investimento'},{v:'outra',l:'Outra'}];

function loadLocal(){try{const d=JSON.parse(localStorage.getItem('fort.data')||'{}');COLS.forEach(c=>S[c]=Array.isArray(d[c])?d[c]:[])}catch(e){}ver++}
function saveLocal(){try{const d={};COLS.forEach(c=>d[c]=S[c]);localStorage.setItem('fort.data',JSON.stringify(d))}catch(e){}}
const queue=[];let active=0;
function enqueue(fn){return new Promise((res,rej)=>{queue.push({fn,res,rej});pump()})}
function pump(){while(active<4&&queue.length){const j=queue.shift();active++;j.fn().then(j.res,j.rej).finally(()=>{active--;pump()})}}
async function withRetry(fn){try{return await fn()}catch(e){if(e&&e.code==='unavailable'){await new Promise(r=>setTimeout(r,400+Math.random()*900));return fn()}throw e}}
const clean=o=>JSON.parse(JSON.stringify(o));
function onWriteErr(e){const c=e&&e.code;console.warn('write',e);
 if(c==='invalid_argument'){readOnly=true;toast('Sem permissão para alterar. Confira se este e-mail está em Ajustes e perfil → Pessoas com acesso.')}
 else if(c==='quota_exceeded')toast('Limite de armazenamento atingido. Exclua lançamentos antigos.');
 else if(c==='resource_exhausted')toast('Muitas alterações seguidas. Aguarde um instante.');
 else toast('Não foi possível salvar agora. Verifique a conexão.');}
function put(col,obj){obj=clean(obj);const i=S[col].findIndex(x=>x.id===obj.id);if(i>=0)S[col][i]=obj;else S[col].push(obj);ver++;scheduleRender();
 if(DB){const{id,...body}=obj;return enqueue(()=>withRetry(()=>DB.collection(col).doc(id).set(body))).catch(onWriteErr)}
 saveLocal();return Promise.resolve()}
function del(col,id){S[col]=S[col].filter(x=>x.id!==id);ver++;scheduleRender();
 if(DB)return enqueue(()=>withRetry(()=>DB.collection(col).doc(id).delete())).catch(onWriteErr);
 saveLocal();return Promise.resolve()}
function subscribe(){
 COLS.forEach(col=>{
  DB.collection(col).onSnapshot(snap=>{
   S[col]=snap.docs.map(d=>({...d.data(),id:d.id}));ver++;
   seen.add(col);if(!snap.metadata.fromCache)confirmed.add(col);
   if(confirmed.size===COLS.length){clearTimeout(loadTimer);stale=false;maintain()}
   if(mode==='loading'&&seen.size===COLS.length)mode='db';
   scheduleRender();
  },e=>{console.warn('snap',col,e);seen.add(col);confirmed.add(col);if(mode==='loading'&&seen.size===COLS.length)mode='db';
   if(e&&e.code!=='revoked')stale=true;scheduleRender()});
 });
 loadTimer=setTimeout(()=>{stale=true;if(mode==='loading')mode='db';scheduleRender()},10000);
}

/* ================= regras financeiras ================= */
function invoiceMonthFor(card,date){const ym=ymOf(date),d=+date.slice(8,10);const cm=d>=(+card.closing||1)?addMonths(ym,1):ym;return (+card.due>+card.closing)?cm:addMonths(cm,1)}
function closingDate(card,inv){const cm=(+card.due>+card.closing)?inv:addMonths(inv,-1);return dateIn(cm,card.closing)}
function dueDate(card,inv){return dateIn(inv,card.due)}
let cache={ver:-1};
function idx(){if(cache.ver===ver)return cache;const inv=new Map();
 for(const t of S.tx){if(!t.cardId||!t.inv)continue;let m=inv.get(t.cardId);if(!m){m=new Map();inv.set(t.cardId,m)}let o=m.get(t.inv);if(!o){o={items:[],total:0,paid:0,pays:[]};m.set(t.inv,o)}
  if(t.kind==='invpay'){o.paid+=t.amount;o.pays.push(t)}else if(t.kind==='out'){o.items.push(t);o.total+=t.amount}else if(t.kind==='in'){o.items.push(t);o.total-=t.amount}}
 cache={ver,inv};return cache}
function invoice(card,inv){const o=(idx().inv.get(card.id)||new Map()).get(inv)||{items:[],total:0,paid:0,pays:[]};
 const total=r2(o.total),paid=r2(o.paid),td=today(),cl=closingDate(card,inv),du=dueDate(card,inv);
 let status;if(!o.items.length&&!paid)status='vazia';else if(total>0&&paid>=total-0.005)status='paga';else if(total<=0)status='paga';else if(td>du)status='vencida';else if(td>=cl)status='fechada';else status='aberta';
 return{items:o.items,pays:o.pays,total,paid,remaining:r2(Math.max(0,total-paid)),status,inv,closing:cl,due:du}}
function cardInvoices(card){return [...((idx().inv.get(card.id))||new Map()).keys()].sort()}
function cardUsed(card){return sum(cardInvoices(card),inv=>invoice(card,inv).remaining)}
function unpaidInvoicesFor(accId,uptoYm){let s=0;for(const c of S.cards){if(c.payAccount!==accId)continue;for(const inv of cardInvoices(c))if(inv<=uptoYm)s+=invoice(c,inv).remaining}return r2(s)}
function accDelta(t,id){
 if(t.kind==='in'&&!t.cardId&&t.accountId===id)return t.amount;
 if(t.kind==='out'&&!t.cardId&&t.accountId===id)return -t.amount;
 if(t.kind==='transfer'){if(t.accountId===id)return -t.amount;if(t.toAccountId===id)return t.amount}
 if(t.kind==='invpay'&&t.accountId===id)return -t.amount;
 return 0}
function accBalance(a,until,withPending){let b=(a.since&&ymOf(until)<a.since)?0:(+a.initial||0);for(const t of S.tx){if(t.date>until)continue;if(!withPending&&!t.paid)continue;b+=accDelta(t,a.id)}if(withPending)b-=unpaidInvoicesFor(a.id,ymOf(until));return r2(b)}
const activeAccs=()=>S.accounts.filter(a=>!a.archived).sort((a,b)=>String(a.name).localeCompare(b.name));
function totalBalance(ym,withPending){return sum(S.accounts,a=>accBalance(a,endOf(ym),withPending))}
const expInMonth=(t,ym)=>t.kind==='out'&&(t.cardId?t.inv===ym:ymOf(t.date)===ym);
const isVR=id=>byId('accounts',id)?.type==='alimentacao';
const incInMonth=(t,ym)=>t.kind==='in'&&!t.cardId&&ymOf(t.date)===ym&&!isVR(t.accountId);
function monthSummary(ym){let inc=0,exp=0;for(const t of S.tx){if(incInMonth(t,ym))inc+=t.amount;else if(expInMonth(t,ym))exp+=t.amount}return{inc:r2(inc),exp:r2(exp),bal:r2(inc-exp)}}
const monthExp=ym=>S.tx.filter(t=>expInMonth(t,ym));
const monthInc=ym=>S.tx.filter(t=>incInMonth(t,ym));
function newSpend(ym){return S.tx.filter(t=>t.kind==='out'&&ymOf(t.purchaseDate||t.date)===ym&&(!t.inst||t.inst.n===1)).map(t=>({t,v:t.inst?(+t.total||t.amount*t.inst.of):t.amount}))}
function byCat(items,val=x=>x.amount,get=x=>x){const m=new Map();for(const it of items){const t=get(it);const k=t.categoryId||'_';const o=m.get(k)||{id:k,cat:catOf(t),total:0,items:[]};o.total+=val(it);o.items.push(t);m.set(k,o)}return [...m.values()].map(o=>({...o,total:r2(o.total)})).sort((a,b)=>b.total-a.total)}
function catOf(t){if(t.kind==='transfer')return{name:'Transferência',emoji:'⇄',color:'#8e99a3'};if(t.kind==='invpay')return{name:'Pagamento de fatura',emoji:'💳',color:'#8e99a3'};return byId('categories',t.categoryId)||{name:t.kind==='in'?'Receita':'Sem categoria',emoji:'•',color:'#8e99a3'}}
function srcName(t){if(t.kind==='transfer')return(byId('accounts',t.accountId)?.name||'—')+' → '+(byId('accounts',t.toAccountId)?.name||'—');if(t.cardId)return byId('cards',t.cardId)?.name||'Cartão';return byId('accounts',t.accountId)?.name||'Sem conta'}
const txTitle=t=>t.desc||catOf(t).name;
function genRecurrence(r,h){const out=[];if(!r.start)return out;let ym=ymOf(r.start);const end=r.end||null;let guard=0;
 while(ym<=h&&(!end||ym<=end)&&guard++<400){const id='r_'+r.id+'_'+ym;
  if(!byId('tx',id)&&!(r.skip||[]).includes(ym)){const date=dateIn(ym,r.day);const t={id,kind:r.kind,amount:r.amount,desc:r.desc||'',date,purchaseDate:date,categoryId:r.categoryId||null,tags:r.tags||[],recurId:r.id,paid:false};if(r.split){t.split=true;t.payer=r.payer||''}
   const c=byId('cards',r.cardId);if(c){t.cardId=c.id;t.inv=invoiceMonthFor(c,date);t.paid=true}else t.accountId=r.accountId;out.push(t)}
  ym=addMonths(ym,1)}return out}
function genLoan(l,h){const out=[];const n=+l.n||0;for(let i=(+l.paidBefore||0);i<n;i++){const date=addMonthsDate(l.first,i);if(ymOf(date)>h)break;const id='l_'+l.id+'_'+(i+1);if(byId('tx',id)||(l.skip||[]).includes(i+1))continue;
  out.push({id,kind:'out',amount:loanAmt(l,i+1),desc:l.name+' '+(i+1)+'/'+n,date,purchaseDate:date,accountId:l.accountId,categoryId:l.categoryId||null,tags:[],loanId:l.id,loanN:i+1,paid:false})}return out}
let maintained=false;
function maintain(){if(maintained)return;maintained=true;const h=horizon();for(const r of S.recurrences){if(r.active===false)continue;genRecurrence(r,h).forEach(t=>put('tx',t))}for(const l of S.loans)genLoan(l,h).forEach(t=>put('tx',t))}
function loanStats(l){const txs=S.tx.filter(t=>t.loanId===l.id);const paidN=(+l.paidBefore||0)+txs.filter(t=>t.paid).length;const n=+l.n||0;const rem=Math.max(0,n-paidN);const next=txs.filter(t=>!t.paid).sort((a,b)=>a.date<b.date?-1:1)[0];return{paidN,n,rem,saldo:loanSaldo(l,paidN),next,pct:n?paidN/n:0}}

/* ================= gráficos ================= */
function niceMax(m){if(m<=0)return 1;const p=10**Math.floor(Math.log10(m));for(const f of[1,1.2,1.5,2,2.5,3,4,5,6,8,10])if(f*p>=m)return f*p;return 10*p}
function donut(segs,label,value){const R=70,C=2*Math.PI*R,tot=segs.reduce((s,x)=>s+x.v,0);let off=0,parts='';
 if(tot>0)for(const s of segs){const len=s.v/tot*C;const gap=segs.length>1&&len>3?1.5:0;parts+=`<circle r="${R}" cx="100" cy="100" fill="none" stroke="${s.color}" stroke-width="24" stroke-dasharray="${Math.max(0,len-gap)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)"/>`;off+=len}
 else parts=`<circle r="${R}" cx="100" cy="100" fill="none" stroke="#262c31" stroke-width="24"/>`;
 return `<svg viewBox="0 0 200 200" style="width:220px;max-width:70%;display:block;margin:4px auto 0">${parts}<text x="100" y="94" text-anchor="middle" style="fill:#8d969e;font:700 11px Manrope,sans-serif;letter-spacing:1.5px">${esc(label)}</text><text x="100" y="116" text-anchor="middle" style="fill:#eef1f3;font:800 15px Manrope,sans-serif">${esc(value)}</text></svg>`}
function barChart(data,keys){const W=640,H=250,pl=62,pb=28,pt=12,ih=H-pb-pt,iw=W-pl-10;const mx=niceMax(Math.max(1,...data.flatMap(d=>keys.map(k=>d[k[0]]||0))));const gw=iw/Math.max(1,data.length);const bw=Math.min(28,gw/(keys.length+1.2));
 let g='';for(let i=0;i<=4;i++){const y=pt+ih*(1-i/4);g+=`<line x1="${pl}" x2="${W-6}" y1="${y}" y2="${y}" stroke="#232a2f"/><text x="${pl-10}" y="${y+4}" text-anchor="end">${compact(mx*i/4)}</text>`}
 data.forEach((d,i)=>{const cx=pl+gw*i+gw/2;const tw=keys.length*bw+(keys.length-1)*4;keys.forEach((k,j)=>{const v=Math.max(0,d[k[0]]||0);const h=v/mx*ih;const x=cx-tw/2+j*(bw+4);if(h>0)g+=`<rect x="${x}" y="${pt+ih-h}" width="${bw}" height="${h}" rx="5" fill="${k[1]}"><title>${esc(d.label)}: ${esc(moneyRaw(v))}</title></rect>`});g+=`<text x="${cx}" y="${H-8}" text-anchor="middle">${esc(d.label)}</text>`});
 return `<svg viewBox="0 0 ${W} ${H}" class="chart">${g}</svg>`}
function lineChart(pts,color){const W=640,H=250,pl=72,pb=28,pt=14,ih=H-pb-pt,iw=W-pl-16;const v=pts.map(p=>p.v);let mn=Math.min(0,...v),mx=Math.max(0,...v);if(mx===mn)mx=mn+1;const span=mx-mn;mx+=span*.08;if(mn<0)mn-=span*.08;
 const y=val=>pt+ih*(mx-val)/(mx-mn),x=i=>pl+(pts.length===1?iw/2:iw*i/(pts.length-1));let g='';
 for(let i=0;i<=4;i++){const val=mn+(mx-mn)*i/4,yy=y(val);g+=`<line x1="${pl}" x2="${W-6}" y1="${yy}" y2="${yy}" stroke="#232a2f"/><text x="${pl-10}" y="${yy+4}" text-anchor="end">${compact(val)}</text>`}
 g+=`<line x1="${pl}" x2="${W-6}" y1="${y(0)}" y2="${y(0)}" stroke="#3a4248"/>`;
 const c=color||(v[v.length-1]>=0?'#3ccf91':'#f37a72');const d=pts.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.v).toFixed(1)).join(' ');
 g+=`<path d="${d} L${x(pts.length-1)} ${y(0)} L${x(0)} ${y(0)} Z" fill="${c}" opacity=".13"/><path d="${d}" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`;
 pts.forEach((p,i)=>{g+=`<circle cx="${x(i)}" cy="${y(p.v)}" r="3.5" fill="${c}"><title>${esc(p.label)}: ${esc(moneyRaw(p.v))}</title></circle><text x="${x(i)}" y="${H-8}" text-anchor="middle">${esc(p.label)}</text>`});
 return `<svg viewBox="0 0 ${W} ${H}" class="chart">${g}</svg>`}

/* ================= componentes ================= */
const ib=(emoji,color,cls='')=>`<span class="ib ${cls}" style="--c:${esc(color||'#8e99a3')}">${esc(emoji||'•')}</span>`;
const av=(name,color,logo)=>/^data:image\//.test(logo||'')?`<span class="av img"><img src="${esc(logo)}" alt=""></span>`:`<span class="av" style="background:${esc(color||'#4fb3a9')}">${esc(initials(name))}</span>`;
const monthNav=()=>`<div class="mnav"><button class="icon-btn plain" data-act="mprev" aria-label="Mês anterior">${I.left}</button><b>${monthLabel(ui.month)}</b><button class="icon-btn plain" data-act="mnext" aria-label="Próximo mês">${I.right}</button></div>`;
function header(title,o={}){return `<header class="hd">${o.back?`<button class="icon-btn" data-act="go" data-go="${o.back}" aria-label="Voltar">${I.back}</button>`:''}<h1>${esc(title)}</h1><div class="right">${o.month?monthNav():''}${o.back?'':`<button class="icon-btn mob" data-act="search" aria-label="Buscar">${I.search}</button>`}${o.actions||''}</div></header>`}
const sec=(title,go,extra='')=>`<div class="sec"><h2>${esc(title)}</h2>${go?`<a data-act="go" data-go="${go}">Ver tudo ›</a>`:extra}</div>`;
const amtCls=t=>t.kind==='in'?'pos':(t.kind==='out'||t.kind==='invpay')?'neg':'mut';
const signed=t=>(t.kind==='in'?'+ ':t.kind==='transfer'?'':'− ')+money(t.amount);
function txRow(t,opt={}){const c=catOf(t);const bits=[];if(opt.date)bits.push(fmtDay(t.date));bits.push(srcName(t));if(t.desc&&t.desc!==c.name&&t.kind!=='transfer')bits.unshift(c.name);if(t.inst)bits.push(t.inst.n+'/'+t.inst.of);if(t.recurId)bits.push('fixa');if(t.cur&&t.cur!=='BRL')bits.push(curFmt(t.curAmt,t.cur));
 const chk=(!t.cardId&&t.kind!=='invpay')?`<span class="check ${t.paid?'on':''}" data-act="paid" data-id="${t.id}" title="${t.paid?'Pago':'Pendente'}">${I.check}</span>`:'';
 return `<div class="row click" data-act="tx" data-id="${t.id}">${ib(c.emoji,c.color)}<div class="t"><b>${esc(txTitle(t))}</b><small>${esc(bits.join(' · '))}</small></div><div class="amt"><b class="${amtCls(t)}">${signed(t)}</b>${!t.paid&&!t.cardId&&t.kind!=='invpay'?'<small class="warn">pendente</small>':''}</div>${opt.check!==false?chk:''}</div>`}

/* ================= estado de tela ================= */
const ui={view:'inicio',month:ymOf(today()),txf:'all',txq:'',txsrc:'',ana:'mes',anaKind:'out',exp:'',catTab:'out',cardId:'',cardInv:'',range:6,rp:{range:'3',kind:'out',src:'',cat:'',tag:''},cmp:'',chat:[],projVar:true,parcTab:'ativos'};
const MORE=[
 ['Organizar',[['contas','Contas','👛','#4fb3a9'],['cartoes','Cartões de crédito','💳','#4fb3a9'],['categorias','Categorias','🏷️','#4fb3a9'],['regras','Regras automáticas','⚡','#4fb3a9'],['tags','Tags','#️⃣','#4fb3a9']]],
 ['Casal',[['casal','Divisão do casal','💞','#e07a9b']]],
 ['Planejar',[['patrimonio','Patrimônio','🏛️','#3ccf91'],['investimentos','Investimentos','📈','#3ccf91'],['reserva','Reserva de emergência','🛟','#3ccf91'],['calendario','Calendário','📅','#3ccf91'],['projecoes','Projeção de longo prazo','🔭','#3ccf91'],['orcamento','Orçamento','🥧','#3ccf91'],['metas','Metas e caixinhas','🎯','#3ccf91']]],
 ['Acompanhar',[['assinaturas','Assinaturas','📺','#efb34d'],['recorrencias','Recorrências','🔁','#efb34d'],['parcelamentos','Parcelamentos','🧩','#efb34d'],['financiamentos','Financiamentos','🏦','#efb34d'],['emprestimos','Empréstimos','🤝','#efb34d'],['quem-me-deve','Quem me deve','💸','#efb34d']]],
 ['Analisar',[['analise','Análise do mês','📊','#6d9be0'],['relatorio','Relatório personalizado','📄','#6d9be0'],['avancados','Relatórios avançados','🗂️','#6d9be0']]],
 ['Ferramentas',[['importar-exportar','Importar e exportar','📁','#e08a6d'],['ajustes','Ajustes e perfil','⚙️','#e08a6d']]]
];
const MAIN=['inicio','transacoes','investimentos','mais'];

function shell(body){const v=ui.view;const mainOf=MAIN.includes(v)?v:(v==='investimento'?'investimentos':'mais');
 const navOn=k=>v===k||(k==='cartoes'&&v==='cartao')||(k==='avancados'&&v.startsWith('rel-'))||(k==='investimentos'&&v==='investimento');
 const side=`<aside class="side"><div class="brand">${brandMark()}<div><div class="bn">${esc(APP.name)}</div><div class="bs">${esc(APP.slogan)}</div></div></div><button class="btn primary" data-act="newtx">${I.plus} Novo lançamento</button><div class="sidequick"><button class="btn" data-act="quick">⚡ Rápido</button><button class="btn" data-act="search" title="Buscar (Ctrl+K)">🔍 Buscar</button></div>${installBtn('sideinst')}
 ${[['inicio','Início','🏠'],['transacoes','Transações','⇄']].map(([k,l,e])=>`<button class="nav-i ${navOn(k)?'on':''}" data-act="go" data-go="${k}"><span class="em">${e}</span>${l}</button>`).join('')}
 ${MORE.map(([g,items])=>`<div class="navg">${g}</div>`+items.map(([k,l,e])=>`<button class="nav-i ${navOn(k)?'on':''}" data-act="go" data-go="${k}"><span class="em">${e}</span>${l}</button>`).join('')).join('')}
 <div class="sp"></div>${sideProfile()}</aside>`;
 const bottom=`<nav class="bottom"><button class="${mainOf==='inicio'?'on':''}" data-act="go" data-go="inicio">${I.home}Início</button><button class="${mainOf==='transacoes'?'on':''}" data-act="go" data-go="transacoes">${I.swap}Transações</button><button class="fab" data-act="fabmenu" aria-label="Novo lançamento">${I.plus}</button><button class="${mainOf==='investimentos'?'on':''}" data-act="go" data-go="investimentos">${I.trend}Investir</button><button class="${mainOf==='mais'?'on':''}" data-act="go" data-go="mais">${I.dots}Mais</button></nav>`;
 const banner=mode==='local'?`<div class="banner">Modo local: os dados ficam só neste navegador.</div>`:stale?(()=>{const n=DB&&DB.pendingCount?DB.pendingCount():0;return `<div class="banner offb">📴 ${navigator.onLine?'Sem conexão com a nuvem agora.':'Sem internet.'} Pode continuar lançando normalmente${n?`: <b>${n} alteraç${n>1?'ões':'ão'}</b> aguardando envio`:''}. Tudo é enviado sozinho quando a conexão voltar.</div>`})():readOnly?`<div class="banner">Você está só visualizando: suas alterações não serão salvas.</div>`:'';
 return `<div class="shell">${side}<main class="main"><div class="page">${banner}${body}</div></main>${bottom}</div>`}

/* ================= telas ================= */
const V={};
V.loading=()=>`<div class="loading"><div class="spin"></div><div>Carregando suas finanças…</div></div>`;

function onboarding(){const hasCat=S.categories.length>0,hasAcc=S.accounts.length>0;if(hasCat&&hasAcc)return '';
 return `<div class="card onb mb"><div style="font-size:20px;font-weight:800">Bem-vindo ao Fort 👋</div><div class="muted">Dois passos rápidos e você já pode lançar seus gastos.</div>
 <div class="step"><span class="n ${hasCat?'ok':''}">${hasCat?'✓':'1'}</span><div class="sp">Criar as categorias padrão (dá para editar depois)</div>${hasCat?'':'<button class="btn primary sm" data-act="seedcats">Criar</button>'}</div>
 <div class="step"><span class="n ${hasAcc?'ok':''}">${hasAcc?'✓':'2'}</span><div class="sp">Cadastrar sua primeira conta bancária</div>${hasAcc?'':'<button class="btn primary sm" data-act="newacc">Cadastrar</button>'}</div></div>`}

V.inicio=()=>{const ym=ui.month,end=endOf(ym);const accs=activeAccs();
 const rows=accs.map(a=>({a,real:accBalance(a,end,false),prev:accBalance(a,end,true)}));
 const totR=sum(S.accounts,a=>accBalance(a,end,false)),totP=sum(S.accounts,a=>accBalance(a,end,true));
 const ms=monthSummary(ym);
 const pagar=sum(S.tx.filter(t=>t.kind==='out'&&!t.cardId&&!t.paid&&ymOf(t.date)===ym),t=>t.amount);
 const receber=sum(S.tx.filter(t=>t.kind==='in'&&!t.cardId&&!t.paid&&ymOf(t.date)===ym),t=>t.amount);
 const faturas=sum(S.cards,c=>invoice(c,ym).remaining);
 const recent=S.tx.filter(t=>t.kind==='out'&&t.date<=today()).sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(a.id)).slice(0,5);
 const cardRows=S.cards.map(c=>{const iv=invoice(c,ym);const st=iv.status;const icon=st==='paga'?`<span class="pos">✓</span>`:st==='aberta'?'<span class="mut">🔓</span>':st==='vencida'?'<span class="neg">!</span>':'<span class="warn">🔒</span>';
  const lab={paga:'Fatura paga',aberta:'Fecha em '+brDate(iv.closing),fechada:'Fechada · vence '+brDate(iv.due),vencida:'Vencida em '+brDate(iv.due),vazia:'Sem lançamentos'}[st];
  return `<button class="row" data-act="card" data-id="${c.id}">${av(c.name,c.color,c.logo)}<div class="t"><b>${esc(c.name)}</b><small>${lab}</small></div><div class="amt"><b>${money(iv.total)} ${icon}</b><small>${c.limit?'Disponível '+money(Math.max(0,c.limit-cardUsed(c))):'Vence '+brDate(iv.due)}</small></div></button>`}).join('');
 const L=`<div>
  <div class="card center"><div class="lbl">Saldo total <button class="icon-btn plain" style="width:28px;height:28px" data-act="hide" aria-label="Mostrar/ocultar valores">${hideVals?I.eyeoff:I.eye}</button></div><div class="big ${totR<0?'neg':''}" style="margin-top:4px">${money(totR)}</div><div class="muted" style="font-size:13px;margin-top:4px">Previsto no fim do mês: <b class="${totP<0?'neg':'pos'}">${money(totP)}</b></div></div>
  <div class="grid2" style="margin-top:12px"><div class="card center click" data-act="gotx" data-k="in"><div class="lbl"><span class="dot in">${I.arrUp}</span>Receitas</div><div style="font-size:22px;font-weight:800;margin-top:8px" class="pos">${money(ms.inc)}</div></div><div class="card center click" data-act="gotx" data-k="out"><div class="lbl"><span class="dot out">${I.arrDn}</span>Despesas</div><div style="font-size:22px;font-weight:800;margin-top:8px" class="neg">${money(ms.exp)}</div></div></div>
  ${sec('Pendências')}
  <div class="card grid3 pend"><div class="click" data-act="gotx" data-k="pagar"><span class="dot out">${I.arrDn}</span><small>Pagar</small><b class="neg">${money(pagar)}</b></div><div class="click" data-act="gotx" data-k="receber"><span class="dot in">${I.arrUp}</span><small>Receber</small><b class="pos">${money(receber)}</b></div><div class="click" data-act="go" data-go="cartoes"><span class="dot n">${I.card}</span><small>Faturas</small><b class="warn">${money(faturas)}</b></div></div>
  ${sec('Contas','contas')}
  <div class="list">${rows.length?rows.map(({a,real,prev})=>`<button class="row" data-act="acc" data-id="${a.id}">${av(a.name,a.color,a.logo)}<div class="t"><b>${esc(a.name)}</b><small>Previsto${odInfo(a,real)}</small></div><div class="amt"><b class="${real<0?'neg':''}">${money(real)}</b><small class="${prev<0?'neg':''}">${money(prev)}</small></div></button>`).join('')+`<div class="row"><div class="t"><b>Total</b><small>Previsto</small></div><div class="amt"><b class="${totR<0?'neg':''}">${money(totR)}</b><small class="${totP<0?'neg':''}">${money(totP)}</small></div></div>`:`<div class="empty">Nenhuma conta ainda.<br><button class="btn primary sm mt" data-act="newacc">${I.plus} Nova conta</button></div>`}</div>
 </div>`;
 const R=`<div>
  ${sec('Cartões','cartoes')}
  <div class="list">${S.cards.length?cardRows+`<div class="row"><div class="t"><b>Total</b><small>Faturas de ${monShort(ym)}</small></div><div class="amt"><b>${money(sum(S.cards,c=>invoice(c,ym).total))}</b><small>a pagar ${money(faturas)}</small></div></div>`:`<div class="empty">Nenhum cartão cadastrado.<br><button class="btn sm mt" data-act="newcard">${I.plus} Novo cartão</button></div>`}</div>
  ${sec('Despesas recentes','transacoes')}
  <div class="list">${recent.length?recent.map(t=>txRow(t,{date:true,check:false})).join(''):'<div class="empty">Seus últimos gastos aparecem aqui.</div>'}</div>
  ${homeInvest(ym)}
  ${homeLoans()}
  ${budgetMini(ym)}
 </div>`;
 return header(monthLabel(ym).split(' ')[0]+' '+ym.slice(0,4),{actions:`${monthNav()}<button class="icon-btn mob avbtn" data-act="go" data-go="ajustes" aria-label="Perfil e ajustes">${meAvatar(40)}</button>`}).replace(/<h1>.*?<\/h1>/,'<h1 class="desk">Início</h1>')+homeGreeting()+installBanner()+onboarding()+odCard()+dueCard()+budgetCard()+insightsCard()+homeCharts(ym,'desk')+`<div class="home">${L}${R}</div>`+homeCharts(ym,'mob')};
function budgetMini(ym){if(!S.budgets.length)return '';const exp=byCat(monthExp(ym));const rows=S.budgets.map(b=>{const c=byId('categories',b.categoryId);if(!c)return '';const sp=exp.find(x=>x.id===b.categoryId)?.total||0;const p=b.amount?sp/b.amount:0;return {c,sp,b,p}}).filter(Boolean).sort((a,b)=>b.p-a.p).slice(0,4);
 return sec('Orçamento','orcamento')+`<div class="list">${rows.map(({c,sp,b,p})=>`<div class="row">${ib(c.emoji,c.color,'sm')}<div class="t"><b>${esc(c.name)}</b><div class="bar" style="--c:${p>1?'var(--out)':p>.8?'var(--warn)':'var(--in)'}"><i style="width:${Math.min(100,p*100)}%"></i></div></div><div class="amt"><b>${money(sp)}</b><small>de ${money(b.amount)}</small></div></div>`).join('')}</div>`}

V.transacoes=()=>{const ym=ui.month;const ms=monthSummary(ym);
 const srcOpts=`<option value="">Todas as contas e cartões</option>`+S.accounts.map(a=>`<option value="a:${a.id}" ${ui.txsrc==='a:'+a.id?'selected':''}>${esc(a.name)}</option>`).join('')+S.cards.map(c=>`<option value="c:${c.id}" ${ui.txsrc==='c:'+c.id?'selected':''}>💳 ${esc(c.name)}</option>`).join('');
 return header('Transações',{month:true,actions:`<button class="btn primary desk" data-act="newtx">${I.plus} Novo</button>`})+
 `<div class="card grid3 pend mb"><div><small>Entradas</small><b class="pos">${money(ms.inc)}</b></div><div><small>Saídas</small><b class="neg">${money(ms.exp)}</b></div><div><small>Balanço</small><b class="${ms.bal<0?'neg':'pos'}">${money(ms.bal)}</b></div></div>
 <div class="search"><span>${I.search}</span><input id="txq" data-inp="txq" placeholder="Buscar por descrição, categoria ou valor" value="${esc(ui.txq)}"></div>
 <div class="filters"><div class="chips">${[['all','Todas'],['out','Despesas'],['pagas','Pagas'],['pagar','A pagar'],['in','Receitas'],['recebidas','Recebidas'],['receber','A receber'],['transfer','Transferências'],['pend','Pendentes']].map(([k,l])=>`<button class="chip ${ui.txf===k?'on':''}" data-act="txf" data-k="${k}">${l}</button>`).join('')}</div><select data-chg="txsrc">${srcOpts}</select></div>
 <div id="txlist">${txListHtml()}</div>`};
function txListHtml(){const ym=ui.month,q=norm(ui.txq);let list=S.tx.filter(t=>ymOf(t.date)===ym);
 if(ui.txf==='pend')list=list.filter(t=>!t.paid&&!t.cardId&&t.kind!=='invpay');else if(ui.txf==='pagar')list=list.filter(t=>!t.paid&&!t.cardId&&t.kind==='out');else if(ui.txf==='receber')list=list.filter(t=>!t.paid&&!t.cardId&&t.kind==='in');else if(ui.txf==='pagas')list=list.filter(t=>t.kind==='out'&&(t.paid||t.cardId));else if(ui.txf==='recebidas')list=list.filter(t=>t.kind==='in'&&t.paid);else if(ui.txf!=='all')list=list.filter(t=>t.kind===ui.txf);
 if(ui.txsrc){const[st,id]=ui.txsrc.split(':');list=list.filter(t=>st==='c'?t.cardId===id:(t.accountId===id&&!t.cardId)||t.toAccountId===id)}
 if(q)list=list.filter(t=>norm(txTitle(t)+' '+catOf(t).name+' '+srcName(t)+' '+fmtNum(t.amount)+' '+(t.note||'')).includes(q));
 list.sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(a.id));
 const ftot=ui.txf!=='all'&&ui.txf!=='transfer'?`<div class="muted" style="font-size:13px;margin:-4px 0 8px">${list.length} lançamento${list.length===1?'':'s'} · total ${money(sum(list,x=>x.amount))}</div>`:'';
 if(!list.length)return `<div class="list"><div class="empty">Nenhum lançamento neste mês${q||ui.txf!=='all'||ui.txsrc?' com esses filtros':''}.</div></div>`;
 let html='',cur='',buf=[];const flush=()=>{if(buf.length)html+=`<div class="dayh">${DOW[dowOf(cur)]}, ${fmtDay(cur)}</div><div class="list">${buf.join('')}</div>`;buf=[]};
 for(const t of list){if(t.date!==cur){flush();cur=t.date}buf.push(txRow(t))}flush();return ftot+html}

V.analise=()=>{const ym=ui.month;const ms=monthSummary(ym);const prev=monthSummary(addMonths(ym,-1));
 let top='',groups,tot,lab,sub;
 if(ui.ana==='mes'){const items=ui.anaKind==='out'?monthExp(ym):monthInc(ym);groups=byCat(items);tot=sum(items,t=>t.amount);lab=ui.anaKind==='out'?'Despesas por categoria':'Receitas por categoria';sub='Visão detalhada do seu mês';
  const dv=prev.exp>0?Math.round((ms.exp-prev.exp)/prev.exp*100):null;
  top=`<div class="card"><div style="display:flex;gap:20px;align-items:center"><div style="display:flex;gap:10px;align-items:flex-end;height:110px">${(()=>{const m=Math.max(ms.inc,ms.exp,1);return `<div style="width:26px;height:100%;background:var(--panel2);border-radius:13px;display:flex;align-items:flex-end"><div style="width:100%;height:${ms.inc/m*100}%;background:var(--in);border-radius:13px"></div></div><div style="width:26px;height:100%;background:var(--panel2);border-radius:13px;display:flex;align-items:flex-end"><div style="width:100%;height:${ms.exp/m*100}%;background:var(--out);border-radius:13px"></div></div>`})()}</div>
   <div style="flex:1"><div class="muted" style="font-size:13px;font-weight:700;margin-bottom:8px">Balanço do mês</div><div class="sw" style="padding:4px 0"><span>Receitas</span><b class="pos">${money(ms.inc)}</b></div><div class="sw" style="padding:4px 0"><span>Despesas</span><b class="neg">${money(ms.exp)}</b></div><div class="sw" style="padding:8px 0 0;border-top:1px solid var(--line);margin-top:6px"><span>Balanço</span><b class="${ms.bal<0?'neg':'pos'}">${money(ms.bal)}</b></div>${dv!==null?`<div class="pill ${dv>0?'bad':'ok'} mt">Despesas ${dv>0?'+':''}${dv}% vs mês anterior</div>`:''}</div></div></div>`}
 else{const items=newSpend(ym);groups=byCat(items,x=>x.v,x=>x.t);tot=sum(items,x=>x.v);lab='Novos gastos por categoria';sub='Compras feitas neste mês (parcelados pelo valor total)';
  top=`<div class="card"><div class="lbl" style="justify-content:flex-start">Novos gastos do mês</div><div class="big" style="font-size:28px;margin-top:4px">${money(tot)}</div><div class="kpis"><div><small>Categorias</small><b>${groups.length}</b></div><div><small>Média</small><b class="neg">${money(groups.length?tot/groups.length:0)}</b></div><div><small>Maior peso</small><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(groups[0]?.cat.name||'—')}</b></div></div></div>`}
 const list=groups.map(g=>{const p=tot?g.total/tot:0;const open=ui.exp===g.id;return `<div class="row click" data-act="exp" data-id="${g.id}">${ib(g.cat.emoji,g.cat.color)}<div class="t"><div class="sw"><b>${esc(g.cat.name)}</b><b>${money(g.total)}</b></div><div style="display:flex;align-items:center;gap:10px"><div class="bar" style="flex:1;--c:${esc(g.cat.color)}"><i style="width:${p*100}%"></i></div><small style="min-width:44px;text-align:right">${(p*100).toFixed(1).replace('.',',')}%</small></div></div><span class="mut">${open?I.up:I.down}</span></div>${open?g.items.sort((a,b)=>b.date.localeCompare(a.date)).map(t=>txRow(t,{date:true,check:false})).join(''):''}`}).join('');
 const months=range(ym,6).map(m=>({label:monShort(m),...monthSummary(m)}));
 const pat=range(ym,12).map(m=>({label:monShort(m),v:totalBalance(m,m>ymOf(today()))}));
 const last=pat[pat.length-1].v,first=pat[0].v;
 return header('Análise',{month:true})+`<div class="seg mb" style="max-width:460px"><button class="${ui.ana==='mes'?'on':''}" data-act="ana" data-k="mes">No mês</button><button class="${ui.ana==='novos'?'on':''}" data-act="ana" data-k="novos">Novos gastos</button></div>
 <div class="home"><div>${top}
 <div class="card mt">${ui.ana==='mes'?`<div class="chips"><button class="chip ${ui.anaKind==='out'?'on':''}" data-act="anak" data-k="out">Despesas</button><button class="chip ${ui.anaKind==='in'?'on':''}" data-act="anak" data-k="in">Receitas</button></div>`:''}
 ${donut(groups.slice(0,10).map(g=>({v:g.total,color:g.cat.color})).concat(groups.length>10?[{v:sum(groups.slice(10),g=>g.total),color:'#8e99a3'}]:[]),ui.anaKind==='in'&&ui.ana==='mes'?'TOTAL RECEBIDO':'TOTAL GASTO',money(tot))}
 <div class="center mt"><div style="font-size:18px;font-weight:800">${lab}</div><div class="muted" style="font-size:14px">${sub}</div></div></div>
 <div class="list mt">${list||'<div class="empty">Sem lançamentos para mostrar.</div>'}</div></div>
 <div>${sec('Fluxo mensal','',`<span class="muted" style="font-size:14px">Últimos 6 meses</span>`)}<div class="card"><div class="legend"><span><i style="background:var(--in)"></i>Receitas</span><span><i style="background:var(--out)"></i>Despesas</span></div>${barChart(months,[['inc','#3ccf91'],['exp','#f37a72']])}</div>
 ${sec('Patrimônio','',`<span class="muted" style="font-size:14px">12 meses</span>`)}<div class="card"><div class="sw"><div><div class="muted" style="font-size:14px;font-weight:600">Saldo total</div><div class="big ${last<0?'neg':''}" style="font-size:28px">${money(last)}</div></div><span class="pill ${last-first>=0?'ok':'bad'}">${last-first>=0?'+':''}${money(last-first)} em 12 meses</span></div><div class="mt">${lineChart(pat)}</div></div>
 <button class="list row mt" data-act="go" data-go="avancados" style="border:1px solid var(--line)">${ib('📊','#6d9be0')}<div class="t"><b>Relatórios avançados</b><small>Fixas × variáveis, comparativo, fluxo de caixa…</small></div>${I.right}</button></div></div>`};

V.mais=()=>header('Mais',{actions:`<button class="icon-btn" data-act="go" data-go="ajustes" aria-label="Ajustes">${I.gear}</button>`})+`<div class="morecols">${MORE.map(([g,items])=>`<div>${sec(g)}<div class="list">${items.map(([k,l,e,c])=>`<button class="row" data-act="go" data-go="${k}">${ib(e,c)}<div class="t"><b>${l}</b></div><span class="mut">${I.right}</span></button>`).join('')}</div></div>`).join('')}</div>`;

V.contas=()=>{const end=endOf(ymOf(today()));const arch=S.accounts.filter(a=>a.archived);
 const row=a=>{const b=accBalance(a,end,false);return `<button class="row" data-act="acc" data-id="${a.id}">${av(a.name,a.color,a.logo)}<div class="t"><b>${esc(a.name)}</b><small>${esc(ACC_TYPES.find(x=>x.v===a.type)?.l||'Conta')}${odInfo(a,accBalance(a,today(),false))}</small></div><div class="amt"><b class="${b<0?'neg':''}">${money(b)}</b><small>previsto ${money(accBalance(a,end,true))}</small></div></button>`};
 return header('Contas',{back:'mais',actions:`<button class="btn primary" data-act="newacc">${I.plus} Nova</button>`})+`<div class="list">${activeAccs().map(row).join('')||'<div class="empty">Cadastre suas contas: banco, poupança, vale-alimentação, dinheiro…</div>'}</div>${arch.length?sec('Arquivadas')+`<div class="list">${arch.map(row).join('')}</div>`:''}
 <div class="grid2 mt"><button class="btn" data-act="newtx" data-kind="transfer">${I.swap} Transferir entre contas</button><button class="btn" data-act="adjust">Ajustar saldo</button></div>`};

V.cartoes=()=>header('Cartões de crédito',{back:'mais',actions:`<button class="btn primary" data-act="newcard">${I.plus} Novo</button>`})+`<div class="list">${S.cards.map(c=>{const inv=currentInvOf(c);const iv=invoice(c,inv);const used=cardUsed(c);return `<button class="row" data-act="card" data-id="${c.id}">${av(c.name,c.color,c.logo)}<div class="t"><b>${esc(c.name)}</b><small>Fecha dia ${c.closing} · vence dia ${c.due}</small>${c.limit?`<div class="bar" style="--c:${used/c.limit>.8?'var(--out)':'var(--accent)'}"><i style="width:${Math.min(100,used/c.limit*100)}%"></i></div>`:''}</div><div class="amt"><b>${money(iv.total)}</b><small>fatura de ${monShort(inv)}</small>${c.limit?`<small>livre ${money(Math.max(0,c.limit-used))}</small>`:''}</div></button>`}).join('')||'<div class="empty">Nenhum cartão. Cadastre com o dia de fechamento e de vencimento para o app montar as faturas.</div>'}</div>`;
function currentInvOf(c){return invoiceMonthFor(c,today())}

V.cartao=()=>{const c=byId('cards',ui.cardId);if(!c)return V.cartoes();const inv=ui.cardInv||currentInvOf(c);const iv=invoice(c,inv);const used=cardUsed(c);
 const stPill={paga:'<span class="pill ok">Paga</span>',aberta:'<span class="pill">Aberta</span>',fechada:'<span class="pill w">Fechada</span>',vencida:'<span class="pill bad">Vencida</span>',vazia:'<span class="pill">Sem lançamentos</span>'}[iv.status];
 return header(c.name,{back:'cartoes',actions:`<button class="btn" data-act="editcard" data-id="${c.id}">Editar</button>`})+
 `<div class="mnav mb" style="justify-content:center"><button class="icon-btn plain" data-act="invprev">${I.left}</button><b>Fatura de ${monthLabel(inv)}</b><button class="icon-btn plain" data-act="invnext">${I.right}</button></div>
 <div class="card"><div class="sw"><div><div class="muted" style="font-size:14px;font-weight:600">Total da fatura</div><div class="big" style="font-size:30px">${money(iv.total)}</div></div>${stPill}</div>
 <div class="kpis"><div><small>Fecha</small><b>${brDate(iv.closing)}</b></div><div><small>Vence</small><b>${brDate(iv.due)}</b></div><div><small>Pago</small><b class="pos">${money(iv.paid)}</b></div></div>
 ${c.limit?`<div class="mt"><div class="sw muted" style="font-size:13px"><span>Limite usado ${money(used)}</span><span>de ${money(c.limit)}</span></div><div class="bar"><i style="width:${Math.min(100,used/c.limit*100)}%"></i></div></div>`:''}
 <div class="grid2 mt"><button class="btn" data-act="newtx" data-card="${c.id}">${I.plus} Nova compra</button><button class="btn primary" data-act="payinv" ${iv.remaining>0?'':'disabled'}>Pagar fatura</button></div></div>
 ${sec('Lançamentos ('+iv.items.length+')')}<div class="list">${iv.items.sort((a,b)=>b.date.localeCompare(a.date)).map(t=>txRow(t,{date:true,check:false})).join('')||'<div class="empty">Nenhuma compra nesta fatura.</div>'}</div>
 ${iv.pays.length?sec('Pagamentos')+`<div class="list">${iv.pays.map(t=>txRow(t,{date:true,check:false})).join('')}</div>`:''}`};

V.categorias=()=>{const list=S.categories.filter(c=>c.kind===ui.catTab).sort((a,b)=>a.name.localeCompare(b.name));const cnt=id=>S.tx.filter(t=>t.categoryId===id).length;
 return header('Categorias',{back:'mais',actions:`<button class="btn primary" data-act="newcat">${I.plus} Nova</button>`})+`<div class="seg mb" style="max-width:420px"><button class="${ui.catTab==='out'?'on out':''}" data-act="cattab" data-k="out">Despesas</button><button class="${ui.catTab==='in'?'on in':''}" data-act="cattab" data-k="in">Receitas</button></div>
 <div class="list">${list.map(c=>`<button class="row" data-act="cat" data-id="${c.id}">${ib(c.emoji,c.color)}<div class="t"><b>${esc(c.name)}</b><small>${cnt(c.id)} lançamentos</small></div><span class="mut">${I.right}</span></button>`).join('')||`<div class="empty">Nenhuma categoria.<br><button class="btn primary sm mt" data-act="seedcats">Criar categorias padrão</button></div>`}</div>`};

V.tags=()=>header('Tags',{back:'mais',actions:`<button class="btn primary" data-act="newtag">${I.plus} Nova</button>`})+`<div class="banner info">Tags marcam lançamentos de categorias diferentes, por exemplo "Viagem Natal" ou "Casamento". Veja o total no Relatório personalizado.</div><div class="list">${S.tags.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(g=>{const items=S.tx.filter(t=>(t.tags||[]).includes(g.id)&&t.kind==='out');return `<button class="row" data-act="tag" data-id="${g.id}">${ib('#','#9a8be0')}<div class="t"><b>${esc(g.name)}</b><small>${items.length} lançamentos</small></div><div class="amt"><b>${money(sum(items,t=>t.amount))}</b></div></button>`}).join('')||'<div class="empty">Nenhuma tag criada.</div>'}</div>`;

V.orcamento=()=>{const ym=ui.month;const exp=byCat(monthExp(ym));const rows=S.budgets.map(b=>({b,c:byId('categories',b.categoryId)})).filter(x=>x.c);const totB=sum(rows,x=>x.b.amount),totS=sum(rows,x=>exp.find(e=>e.id===x.b.categoryId)?.total||0);
 return header('Orçamento',{back:'mais',month:true,actions:`<button class="btn primary" data-act="newbud">${I.plus} Limite</button>`})+
 (rows.length?`<div class="card mb"><div class="sw"><span class="muted">Gasto nas categorias com limite</span><b>${money(totS)} <span class="muted">de ${money(totB)}</span></b></div><div class="bar" style="--c:${totS>totB?'var(--out)':'var(--in)'}"><i style="width:${totB?Math.min(100,totS/totB*100):0}%"></i></div><div class="muted mt" style="font-size:13px">${totB-totS>=0?'Ainda pode gastar '+money(totB-totS):'Passou '+money(totS-totB)+' do planejado'}</div></div>`:'')+
 `<div class="list">${rows.sort((a,b)=>a.c.name.localeCompare(b.c.name)).map(({b,c})=>{const sp=exp.find(e=>e.id===b.categoryId)?.total||0;const p=b.amount?sp/b.amount:0;return `<button class="row" data-act="bud" data-id="${b.id}">${ib(c.emoji,c.color)}<div class="t"><div class="sw"><b>${esc(c.name)}</b><span>${money(sp)} <span class="muted">/ ${money(b.amount)}</span></span></div><div class="bar" style="--c:${p>1?'var(--out)':p>.8?'var(--warn)':'var(--in)'}"><i style="width:${Math.min(100,p*100)}%"></i></div><small>${p>1?'Estourou em '+money(sp-b.amount):'Resta '+money(b.amount-sp)}</small></div></button>`}).join('')||'<div class="empty">Defina um limite mensal por categoria para acompanhar seus gastos.</div>'}</div>`};

V.metas=()=>header('Metas e caixinhas',{back:'mais',actions:`<button class="btn primary" data-act="newgoal">${I.plus} Nova</button>`})+`<div class="list">${S.goals.map(g=>{const saved=sum(g.moves||[],m=>m.amount);const p=g.target?saved/g.target:0;return `<button class="row" data-act="goal" data-id="${g.id}">${ib(g.emoji||'🎯',g.color)}<div class="t"><div class="sw"><b>${esc(g.name)}</b><span>${money(saved)}</span></div>${g.target?`<div class="bar" style="--c:${esc(g.color||'var(--in)')}"><i style="width:${Math.min(100,p*100)}%"></i></div><small>${Math.round(p*100)}% de ${money(g.target)}${g.deadline?' · até '+brDate(g.deadline):''}</small>`:'<small>Caixinha sem meta</small>'}</div></button>`}).join('')||'<div class="empty">Crie metas (viagem, reserva de emergência, casamento) e caixinhas para guardar dinheiro.</div>'}</div>`;

V.projecoes=()=>{const cur=ymOf(today());const months=range(addMonths(cur,5),6);const past=range(addMonths(cur,-1),3);
 const varAvg=r2(sum(past,m=>sum(monthExp(m).filter(t=>!t.recurId&&!t.loanId&&!t.inst),t=>t.amount))/3);
 let acc=0;const rows=months.map((m,i)=>{const ms=monthSummary(m);const extra=ui.projVar&&i>0?varAvg:0;acc+=extra;return{m,...ms,extra,end:r2(totalBalance(m,true)-acc)}});
 return header('Projeções',{back:'mais'})+`<div class="banner info">Saldo previsto somando os lançamentos agendados (recorrências, parcelas, financiamentos e pendências).</div>
 <label class="sw card mb"><span>Descontar gasto variável médio (${money(varAvg)}/mês, média dos últimos 3 meses)</span><input type="checkbox" data-chg="projvar" ${ui.projVar?'checked':''}><i></i></label>
 <div class="card mb">${lineChart(rows.map(r=>({label:monShort(r.m),v:r.end})))}</div>
 <div class="card scroll-x"><table class="tb"><tr><th>Mês</th><th>Receitas</th><th>Despesas</th>${ui.projVar?'<th>Variável</th>':''}<th>Saldo final</th></tr>${rows.map(r=>`<tr><td>${monYr(r.m)}</td><td class="pos">${money(r.inc)}</td><td class="neg">${money(r.exp)}</td>${ui.projVar?`<td class="mut">${r.extra?money(r.extra):'—'}</td>`:''}<td class="${r.end<0?'neg':''}"><b>${money(r.end)}</b></td></tr>`).join('')}</table></div>`};

V.recorrencias=()=>header('Recorrências',{back:'mais',actions:`<button class="btn primary" data-act="newrec">${I.plus} Nova</button>`})+`<div class="banner info">Contas fixas que se repetem todo mês (aluguel, internet, salário, assinaturas). O app lança automaticamente os próximos 12 meses como pendentes.</div>
 <div class="list">${S.recurrences.slice().sort((a,b)=>(a.day||0)-(b.day||0)).map(r=>{const c=byId('categories',r.categoryId)||{emoji:'🔁',color:'#efb34d',name:''};return `<button class="row" data-act="rec" data-id="${r.id}">${ib(c.emoji,c.color)}<div class="t"><b>${esc(r.desc||c.name)}</b><small>Todo dia ${r.day} · ${esc(r.cardId?byId('cards',r.cardId)?.name||'Cartão':byId('accounts',r.accountId)?.name||'Conta')}${r.end?' · até '+monYr(r.end):''}${r.active===false?' · pausada':''}</small></div><div class="amt"><b class="${r.kind==='in'?'pos':'neg'}">${money(r.amount)}</b></div></button>`}).join('')||'<div class="empty">Nenhuma recorrência. Dica: ao lançar uma despesa, escolha "Fixo mensal".</div>'}</div>`;

V.parcelamentos=()=>{const groups=new Map();for(const t of S.tx){if(!t.group)continue;const g=groups.get(t.group)||[];g.push(t);groups.set(t.group,g)}
 const td=today();const list=[...groups.values()].map(items=>{items.sort((a,b)=>a.inst.n-b.inst.n);const f=items[0];const of=f.inst?.of||items.length;const done=(+f.paidBefore||Math.max(0,(f.inst?.n||1)-1))+items.filter(t=>t.cardId?t.date<=td:t.paid).length;const restante=sum(items.filter(t=>t.cardId?t.date>td:!t.paid),t=>t.amount);return{f,items,of,done,restante,total:+f.total||sum(items,t=>t.amount),last:items[items.length-1].date}});
 const act=list.filter(x=>x.restante>0),fin=list.filter(x=>x.restante<=0);const show=ui.parcTab==='ativos'?act:fin;
 return header('Parcelamentos',{back:'mais'})+`<div class="card grid2 mb center"><div><small class="muted">Ativos</small><div style="font-size:20px;font-weight:800">${act.length}</div></div><div><small class="muted">Falta pagar</small><div style="font-size:20px;font-weight:800" class="neg">${money(sum(act,x=>x.restante))}</div></div></div>
 <div class="seg mb" style="max-width:420px"><button class="${ui.parcTab==='ativos'?'on':''}" data-act="parctab" data-k="ativos">Em andamento</button><button class="${ui.parcTab==='fim'?'on':''}" data-act="parctab" data-k="fim">Concluídos</button></div>
 <div class="list">${show.sort((a,b)=>a.last.localeCompare(b.last)).map(x=>{const c=catOf(x.f);return `<button class="row" data-act="tx" data-id="${x.f.id}">${ib(c.emoji,c.color)}<div class="t"><b>${esc(txTitle(x.f))}</b><small>${esc(srcName(x.f))} · ${x.done}/${x.of} pagas · termina ${monYr(ymOf(x.last))}</small><div class="bar"><i style="width:${x.done/x.of*100}%"></i></div></div><div class="amt"><b>${money(x.f.amount)}</b><small>restam ${money(x.restante)}</small></div></button>`}).join('')||'<div class="empty">Nada por aqui. Ao lançar uma compra (no cartão ou na conta), escolha <b>Repetir › Parcelado</b>. Se já pagou algumas parcelas, informe quantas: o Fort lança só as que faltam.</div>'}</div>`};

function loansView(kind,title,txt){const list=S.loans.filter(l=>l.kind===kind);return header(title,{back:'mais',actions:`<button class="btn primary" data-act="newloan" data-k="${kind}">${I.plus} Novo</button>`})+`<div class="banner info">${txt}</div>`+
 (list.length?`<div class="card grid2 mb center"><div><small class="muted">Saldo devedor</small><div style="font-size:20px;font-weight:800" class="neg">${money(sum(list,l=>loanStats(l).saldo))}</div></div><div><small class="muted">Parcelas por mês</small><div style="font-size:20px;font-weight:800">${money(sum(list.filter(l=>loanStats(l).rem>0),l=>l.parcel))}</div></div></div>`:'')+
 `<div class="list">${list.map(l=>{const s=loanStats(l);return `<button class="row" data-act="loan" data-id="${l.id}">${ib(kind==='financiamento'?'🏦':'🤝','#d9b25c')}<div class="t"><b>${esc(l.name)}</b><small>${esc(l.inst||'')}${l.inst?' · ':''}${s.paidN}/${s.n} parcelas${s.next?' · próxima '+brDate(s.next.date):''}</small><div class="bar" style="--c:var(--in)"><i style="width:${s.pct*100}%"></i></div></div><div class="amt"><b>${money(l.parcel)}</b><small>deve ${money(s.saldo)}</small></div></button>`}).join('')||'<div class="empty">Nenhum cadastrado.</div>'}</div>`}
V.financiamentos=()=>loansView('financiamento','Financiamentos','Imóvel, carro e outros financiamentos. As parcelas entram como pendentes na conta escolhida.');
V.emprestimos=()=>loansView('emprestimo','Empréstimos','Empréstimos que você pegou (banco, consignado, de alguém). Para dinheiro que te devem, use "Quem me deve".');

V['quem-me-deve']=()=>{const people=new Map();for(const d of S.debts){const rec=sum(d.payments||[],p=>p.amount);const o=people.get(d.person)||{person:d.person,items:[],rem:0};o.items.push({d,rec,rem:r2(d.amount-rec)});o.rem+=d.amount-rec;people.set(d.person,o)}
 const ps=[...people.values()].sort((a,b)=>b.rem-a.rem);
 return header('Quem me deve',{back:'mais',actions:`<button class="btn primary" data-act="newdebt">${I.plus} Novo</button>`})+`<div class="card center mb"><small class="muted">Total a receber</small><div class="big pos" style="font-size:28px">${money(sum(ps,p=>Math.max(0,p.rem)))}</div></div>`+
 (ps.map(p=>sec(p.person,'',`<b class="${p.rem>0.004?'pos':'mut'}">${p.rem>0.004?money(p.rem):'quitado'}</b>`)+`<div class="list">${p.items.map(({d,rec,rem})=>`<button class="row" data-act="debt" data-id="${d.id}">${ib('💸','#3ccf91','sm')}<div class="t"><b>${esc(d.desc||'Empréstimo')}</b><small>${brDate(d.date)} · recebido ${money(rec)} de ${money(d.amount)}</small></div><div class="amt"><b class="${rem>0.004?'pos':'mut'}">${rem>0.004?money(rem):'✓'}</b></div></button>`).join('')}</div>`).join('')||'<div class="list"><div class="empty">Anote aqui quem te deve dinheiro e vá registrando o que recebeu.</div></div>')};

/* ---- relatórios ---- */
function rangeSel(){return `<select data-chg="range">${[[1,'Mês selecionado'],[3,'Últimos 3 meses'],[6,'Últimos 6 meses'],[12,'Últimos 12 meses']].map(([v,l])=>`<option value="${v}" ${ui.range==v?'selected':''}>${l}</option>`).join('')}</select>`}
const REPORTS=[['rel-faturas','Relatório de faturas','Total por cartão e categoria nas faturas','💳'],['rel-fluxo','Fluxo de caixa','Entradas, saídas e saldo acumulado mês a mês','↕️'],['rel-resultado','Resultado por categoria','Entradas, saídas e saldo por período','📈'],['rel-comparar','Comparar períodos','Um mês contra outro, por categoria','⇆'],['rel-semana','Despesas por dia da semana','Em que dias você mais gasta','📅'],['rel-fixas','Fixas × variáveis','Recorrentes vs gastos avulsos','🔁'],['rel-previsto','Previsto × realizado','Orçado vs gasto, mês a mês','⚖️'],['rel-exportar','Exportar para planilha','Todas as transações em CSV (abre no Excel)','📑']];
V.avancados=()=>header('Relatórios avançados',{back:'mais'})+`<div class="card mb"><b>Relatórios em PDF</b><p class="muted" style="font-size:14px;margin:4px 0 12px">Com o nome do Fort, data de geração e todos os dados. No celular, escolha “Salvar como PDF” na tela de impressão.</p><div class="chips"><button class="btn primary sm" data-act="pdfmonth">${I.pdf} Resumo de ${monthLabel(ui.month)}</button><button class="btn sm" data-act="pdfinv">${I.pdf} Investimentos</button><button class="btn sm" data-act="pdfproj">${I.pdf} Projeção de longo prazo</button><button class="btn sm" data-act="pdfyear">${I.pdf} Anual e IR ${ui.month.slice(0,4)}</button><button class="btn sm" data-act="pdfyearprev">${I.pdf} Anual e IR ${+ui.month.slice(0,4)-1}</button><button class="btn sm" data-act="go" data-go="relatorio">${I.pdf} Relatório personalizado</button></div></div><div class="list">${REPORTS.map(([k,l,d,e])=>`<button class="row" data-act="go" data-go="${k}">${ib(e,'#5cc4d9')}<div class="t"><b>${l}</b><small>${d}</small></div><span class="mut">${I.right}</span></button>`).join('')}</div>`;
const relHd=(t,o={})=>header(t,{back:'avancados',month:o.month!==false,...o});
V['rel-faturas']=()=>{const ms=range(ui.month,ui.range);const rows=S.cards.map(c=>({c,vals:ms.map(m=>invoice(c,m).total)}));const items=S.tx.filter(t=>t.cardId&&t.kind==='out'&&ms.includes(t.inv));const cats=byCat(items);const tot=sum(items,t=>t.amount);
 return relHd('Relatório de faturas')+`<div class="filters">${rangeSel()}</div><div class="card scroll-x mb"><table class="tb"><tr><th>Cartão</th>${ms.map(m=>`<th>${monYr(m)}</th>`).join('')}<th>Total</th></tr>${rows.map(r=>`<tr><td>${esc(r.c.name)}</td>${r.vals.map(v=>`<td>${money(v)}</td>`).join('')}<td><b>${money(sum(r.vals))}</b></td></tr>`).join('')}<tr class="tot"><td>Total</td>${ms.map((m,i)=>`<td>${money(sum(rows,r=>r.vals[i]))}</td>`).join('')}<td>${money(sum(rows,r=>sum(r.vals)))}</td></tr></table></div>
 ${sec('Por categoria')}<div class="list">${cats.map(g=>`<div class="row">${ib(g.cat.emoji,g.cat.color,'sm')}<div class="t"><b>${esc(g.cat.name)}</b><div class="bar" style="--c:${g.cat.color}"><i style="width:${tot?g.total/tot*100:0}%"></i></div></div><div class="amt"><b>${money(g.total)}</b></div></div>`).join('')||'<div class="empty">Sem compras no cartão no período.</div>'}</div>
 ${sec('Por tag')}<div class="list">${S.tags.map(g=>({g,v:sum(items.filter(t=>(t.tags||[]).includes(g.id)),t=>t.amount)})).filter(x=>x.v>0).map(x=>`<div class="row">${ib('#','#9a8be0','sm')}<div class="t"><b>${esc(x.g.name)}</b></div><div class="amt"><b>${money(x.v)}</b></div></div>`).join('')||'<div class="empty">Nenhuma compra com tag.</div>'}</div>`};
V['rel-fluxo']=()=>{const ms=range(ui.month,Math.max(ui.range,3));let acc=0;const rows=ms.map(m=>{const s=monthSummary(m);acc+=s.bal;return{m,...s,acc:r2(acc)}});
 return relHd('Fluxo de caixa')+`<div class="filters">${rangeSel()}</div><div class="card mb"><div class="legend"><span><i style="background:var(--in)"></i>Entradas</span><span><i style="background:var(--out)"></i>Saídas</span></div>${barChart(rows.map(r=>({label:monShort(r.m),inc:r.inc,exp:r.exp})),[['inc','#3ccf91'],['exp','#f37a72']])}</div>
 <div class="card scroll-x"><table class="tb"><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th><th>Acumulado</th></tr>${rows.map(r=>`<tr><td>${monYr(r.m)}</td><td class="pos">${money(r.inc)}</td><td class="neg">${money(r.exp)}</td><td class="${r.bal<0?'neg':'pos'}">${money(r.bal)}</td><td class="${r.acc<0?'neg':''}"><b>${money(r.acc)}</b></td></tr>`).join('')}</table></div>`};
V['rel-resultado']=()=>{const ms=range(ui.month,ui.range);const outI=ms.flatMap(monthExp),inI=ms.flatMap(monthInc);const o=byCat(outI),i=byCat(inI);const to=sum(outI,t=>t.amount),ti=sum(inI,t=>t.amount);
 const block=(arr,tot,cls)=>arr.map(g=>`<div class="row">${ib(g.cat.emoji,g.cat.color,'sm')}<div class="t"><b>${esc(g.cat.name)}</b><small>${g.items.length} lançamentos · média ${money(g.total/ms.length)}/mês</small></div><div class="amt"><b class="${cls}">${money(g.total)}</b><small>${tot?(g.total/tot*100).toFixed(1).replace('.',','):0}%</small></div></div>`).join('');
 return relHd('Resultado por categoria')+`<div class="filters">${rangeSel()}</div><div class="card grid3 pend mb"><div><small>Entradas</small><b class="pos">${money(ti)}</b></div><div><small>Saídas</small><b class="neg">${money(to)}</b></div><div><small>Resultado</small><b class="${ti-to<0?'neg':'pos'}">${money(ti-to)}</b></div></div>
 <div class="home"><div>${sec('Saídas')}<div class="list">${block(o,to,'neg')||'<div class="empty">Sem saídas.</div>'}</div></div><div>${sec('Entradas')}<div class="list">${block(i,ti,'pos')||'<div class="empty">Sem entradas.</div>'}</div></div></div>`};
V['rel-comparar']=()=>{const a=ui.month,b=ui.cmp||addMonths(a,-1);const A=byCat(monthExp(a)),B=byCat(monthExp(b));const ids=[...new Set([...A,...B].map(x=>x.id))];const rows=ids.map(id=>{const x=A.find(g=>g.id===id),y=B.find(g=>g.id===id);return{cat:(x||y).cat,a:x?.total||0,b:y?.total||0}}).sort((p,q)=>Math.abs(q.a-q.b)-Math.abs(p.a-p.b));const sa=monthSummary(a),sb=monthSummary(b);
 const opts=range(addMonths(ymOf(today()),3),27).reverse().map(m=>`<option value="${m}" ${m===b?'selected':''}>${monthLabel(m)}</option>`).join('');
 return relHd('Comparar períodos')+`<div class="filters"><span class="muted" style="align-self:center">${monthLabel(a)} comparado com</span><select data-chg="cmp">${opts}</select></div>
 <div class="card scroll-x mb"><table class="tb"><tr><th></th><th>${monYr(a)}</th><th>${monYr(b)}</th><th>Diferença</th></tr><tr><td>Receitas</td><td class="pos">${money(sa.inc)}</td><td class="pos">${money(sb.inc)}</td><td>${money(sa.inc-sb.inc)}</td></tr><tr><td>Despesas</td><td class="neg">${money(sa.exp)}</td><td class="neg">${money(sb.exp)}</td><td class="${sa.exp>sb.exp?'neg':'pos'}">${sa.exp>sb.exp?'+':''}${money(sa.exp-sb.exp)}</td></tr><tr class="tot"><td>Balanço</td><td>${money(sa.bal)}</td><td>${money(sb.bal)}</td><td>${money(sa.bal-sb.bal)}</td></tr></table></div>
 ${sec('Despesas por categoria')}<div class="card scroll-x"><table class="tb"><tr><th>Categoria</th><th>${monYr(a)}</th><th>${monYr(b)}</th><th>Diferença</th></tr>${rows.map(r=>`<tr><td>${esc(r.cat.emoji)} ${esc(r.cat.name)}</td><td>${money(r.a)}</td><td>${money(r.b)}</td><td class="${r.a>r.b?'neg':r.a<r.b?'pos':'mut'}">${r.a>r.b?'+':''}${money(r.a-r.b)}</td></tr>`).join('')}</table></div>`};
V['rel-semana']=()=>{const ms=range(ui.month,ui.range);const items=S.tx.filter(t=>t.kind==='out'&&ms.includes(ymOf(t.purchaseDate||t.date))&&(!t.inst||t.inst.n===1)&&!t.recurId&&!t.loanId);const d=[0,0,0,0,0,0,0],n=[0,0,0,0,0,0,0];for(const t of items){const w=dowOf(t.purchaseDate||t.date);d[w]+=t.inst?(+t.total||t.amount):t.amount;n[w]++}const mx=Math.max(1,...d);const order=[1,2,3,4,5,6,0];
 return relHd('Despesas por dia da semana')+`<div class="filters">${rangeSel()}</div><div class="banner info">Considera compras avulsas (sem contas fixas e financiamentos), pela data da compra.</div><div class="list">${order.map(w=>`<div class="row"><div style="width:80px;font-weight:700;text-transform:capitalize">${DOW[w]}</div><div class="t"><div class="bar" style="height:12px;--c:${d[w]===mx&&mx>1?'var(--out)':'var(--accent)'}"><i style="width:${d[w]/mx*100}%"></i></div><small>${n[w]} compras</small></div><div class="amt"><b>${money(d[w])}</b></div></div>`).join('')}</div>`};
V['rel-fixas']=()=>{const ms=range(ui.month,Math.max(ui.range,3));const rows=ms.map(m=>{const e=monthExp(m);const fix=sum(e.filter(t=>t.recurId||t.loanId),t=>t.amount);const tot=sum(e,t=>t.amount);return{m,fix,vari:r2(tot-fix),tot}});
 return relHd('Fixas × variáveis')+`<div class="filters">${rangeSel()}</div><div class="card mb"><div class="legend"><span><i style="background:#9b8cff"></i>Fixas (recorrências e financiamentos)</span><span><i style="background:#efb34d"></i>Variáveis</span></div>${barChart(rows.map(r=>({label:monShort(r.m),f:r.fix,v:r.vari})),[['f','#9b8cff'],['v','#efb34d']])}</div>
 <div class="card scroll-x"><table class="tb"><tr><th>Mês</th><th>Fixas</th><th>Variáveis</th><th>Total</th><th>% fixas</th></tr>${rows.map(r=>`<tr><td>${monYr(r.m)}</td><td>${money(r.fix)}</td><td>${money(r.vari)}</td><td><b>${money(r.tot)}</b></td><td>${r.tot?Math.round(r.fix/r.tot*100):0}%</td></tr>`).join('')}</table></div>`};
V['rel-previsto']=()=>{if(!S.budgets.length)return relHd('Previsto × realizado')+`<div class="list"><div class="empty">Cadastre limites em Orçamento para usar este relatório.<br><button class="btn primary sm mt" data-act="go" data-go="orcamento">Ir para Orçamento</button></div></div>`;
 const ms=range(ui.month,Math.max(ui.range,3));const ids=S.budgets.map(b=>b.categoryId);const totB=sum(S.budgets,b=>b.amount);const rows=ms.map(m=>{const sp=sum(monthExp(m).filter(t=>ids.includes(t.categoryId)),t=>t.amount);return{m,b:totB,sp}});const exp=byCat(monthExp(ui.month));
 return relHd('Previsto × realizado')+`<div class="filters">${rangeSel()}</div><div class="card mb"><div class="legend"><span><i style="background:#5cc4d9"></i>Orçado</span><span><i style="background:#f37a72"></i>Gasto</span></div>${barChart(rows.map(r=>({label:monShort(r.m),b:r.b,s:r.sp})),[['b','#5cc4d9'],['s','#f37a72']])}</div>
 ${sec('Detalhe de '+monthLabel(ui.month))}<div class="card scroll-x"><table class="tb"><tr><th>Categoria</th><th>Orçado</th><th>Gasto</th><th>Diferença</th></tr>${S.budgets.map(b=>{const c=byId('categories',b.categoryId);if(!c)return '';const sp=exp.find(e=>e.id===b.categoryId)?.total||0;return `<tr><td>${esc(c.emoji)} ${esc(c.name)}</td><td>${money(b.amount)}</td><td>${money(sp)}</td><td class="${sp>b.amount?'neg':'pos'}">${money(b.amount-sp)}</td></tr>`}).join('')}</table></div>`};
V['rel-exportar']=()=>relHd('Exportar para planilha',{month:false})+`<div class="card"><p class="muted mb">Gera um arquivo CSV que abre no Excel ou no Google Planilhas.</p><div class="grid2"><button class="btn primary" data-act="exportcsv" data-scope="month">Transações de ${monthLabel(ui.month)}</button><button class="btn" data-act="exportcsv" data-scope="all">Todas as transações</button></div><div id="exportout"></div></div>`;

V.relatorio=()=>{const rp=ui.rp;const ms=rp.range==='ano'?range(ui.month.slice(0,4)+'-12',12):range(ui.month,+rp.range);
 let items=S.tx.filter(t=>t.kind===rp.kind&&ms.includes(ymOf(t.date)));if(rp.src){const[st,id]=rp.src.split(':');items=items.filter(t=>st==='c'?t.cardId===id:t.accountId===id&&!t.cardId)}if(rp.cat)items=items.filter(t=>t.categoryId===rp.cat);if(rp.tag)items=items.filter(t=>(t.tags||[]).includes(rp.tag));
 const tot=sum(items,t=>t.amount);const cats=byCat(items);items.sort((a,b)=>b.date.localeCompare(a.date));ui.rpItems=items;
 const sel=(k,opts)=>`<select data-chg="rp" data-k="${k}">${opts.map(([v,l])=>`<option value="${esc(v)}" ${rp[k]==v?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
 return header('Relatório personalizado',{back:'mais',month:true})+`<div class="filters">${sel('range',[['1','Mês selecionado'],['3','Últimos 3 meses'],['6','Últimos 6 meses'],['12','Últimos 12 meses'],['ano','Ano de '+ui.month.slice(0,4)]])}${sel('kind',[['out','Despesas'],['in','Receitas']])}${sel('src',[['','Todas as contas'],...S.accounts.map(a=>['a:'+a.id,a.name]),...S.cards.map(c=>['c:'+c.id,'💳 '+c.name])])}${sel('cat',[['','Todas as categorias'],...S.categories.filter(c=>c.kind===rp.kind).map(c=>[c.id,c.name])])}${sel('tag',[['','Todas as tags'],...S.tags.map(g=>[g.id,g.name])])}</div>
 <div class="card mb"><div class="sw"><div><small class="muted">Total · ${items.length} lançamentos</small><div class="big ${rp.kind==='in'?'pos':'neg'}" style="font-size:28px">${money(tot)}</div><small class="muted">${monYr(ms[0])} a ${monYr(ms[ms.length-1])} · média ${money(tot/ms.length)}/mês</small></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" data-act="pdfreport">${I.pdf} Gerar PDF</button><button class="btn" data-act="exportcsv" data-scope="report">Exportar CSV</button></div></div><div id="exportout"></div></div>
 <div class="home"><div>${sec('Por categoria')}<div class="list">${cats.map(g=>`<div class="row">${ib(g.cat.emoji,g.cat.color,'sm')}<div class="t"><b>${esc(g.cat.name)}</b><div class="bar" style="--c:${g.cat.color}"><i style="width:${tot?g.total/tot*100:0}%"></i></div></div><div class="amt"><b>${money(g.total)}</b><small>${tot?(g.total/tot*100).toFixed(1).replace('.',','):0}%</small></div></div>`).join('')||'<div class="empty">Nada encontrado.</div>'}</div></div>
 <div>${sec('Lançamentos')}<div class="list">${items.slice(0,300).map(t=>txRow(t,{date:true,check:false})).join('')||'<div class="empty">Nada encontrado.</div>'}</div>${items.length>300?'<div class="muted mt">Mostrando 300 de '+items.length+'. Exporte para ver todos.</div>':''}</div></div>`};

V.assistente=()=>{const ok=!!SAMPLE&&!ui.aiOff;return header('Assistente IA',{back:'mais',actions:ui.chat.length?`<button class="btn sm" data-act="chatclear">Limpar</button>`:''})+
 (ok?`<div class="banner info">Pergunte sobre suas finanças: "onde gastei mais este mês?", "quanto sobra até o fim do mês?", "minhas assinaturas somam quanto?". Usa o seu plano do Claude.</div>`:`<div class="banner">${ui.aiOff||'O assistente só funciona abrindo o app pelo Claude.'}</div>`)+
 `<div class="msgs" id="msgs">${ui.chat.map(m=>`<div class="msg ${m.role==='user'?'u':'a'}">${esc(m.content)}</div>`).join('')}${ui.chatBusy?`<div class="msg a" id="streaming">${esc(ui.chatStream||'Pensando…')}</div>`:''}</div>
 ${!ui.chat.length&&ok?`<div class="chips mb">${['Onde gastei mais este mês?','Quanto vou ter no fim do mês?','Como reduzir meus gastos?','Resumo do mês'].map(q=>`<button class="chip" data-act="chatq" data-q="${esc(q)}">${q}</button>`).join('')}</div>`:''}
 <form class="chatbox" data-form="chat"><input id="chatin" placeholder="Escreva sua pergunta" ${ok?'':'disabled'} autocomplete="off"><button class="btn primary" ${ok&&!ui.chatBusy?'':'disabled'} aria-label="Enviar">${I.send}</button></form>`};

V.comprovante=()=>header('Importar comprovante',{back:'mais'})+`<div class="card"><p class="muted mb">Envie a foto ou print de um comprovante (Pix, recibo, nota). O Claude lê o valor, a data e a descrição e já abre o lançamento preenchido para você conferir.</p>
 ${SAMPLE&&!ui.imgOff?`<label class="btn primary" style="position:relative;overflow:hidden;justify-content:center;width:100%">📷 Escolher imagem<input type="file" class="fileov" accept="image/*" data-chg="receipt"></label><div id="rcpt" class="mt">${ui.rcptMsg||''}</div>`:`<div class="banner">${ui.imgOff||'Disponível apenas abrindo o app pelo Claude.'}</div>`}</div>`;

V['importar-exportar']=()=>header('Importar e exportar',{back:'mais'})+`<div class="home"><div>${sec('Exportar')}<div class="card"><div class="grid2"><button class="btn primary" data-act="exportcsv" data-scope="all">Planilha CSV</button><button class="btn" data-act="backup">Backup completo</button></div><p class="muted mt" style="font-size:13px">O backup (JSON) guarda tudo: contas, cartões, categorias, lançamentos, metas… e pode ser restaurado aqui.</p><div id="exportout"></div></div></div>
 <div>${sec('Importar extrato ou fatura')}<div class="card"><p class="muted mb" style="font-size:14px"><b>PDF</b> da fatura do cartão ou do extrato, <b>OFX</b> do banco ou planilha <b>CSV</b> (colunas <b>data; descrição; valor</b> e, opcionalmente, <b>categoria</b>). Você confere tudo antes de importar.</p>
 <label class="fl"><span>Conta ou cartão de destino</span><select id="impacc">${S.accounts.filter(a=>!a.archived).map(a=>`<option value="a:${a.id}">${esc(a.name)}</option>`).join('')}${S.cards.map(c=>`<option value="c:${c.id}">💳 ${esc(c.name)}</option>`).join('')}</select></label>
 <label class="btn mt" style="position:relative;overflow:hidden;justify-content:center;width:100%">📄 Escolher arquivo (PDF, OFX ou CSV)<input type="file" class="fileov" accept=".pdf,.csv,.ofx,.qfx,application/pdf,text/csv,text/plain,application/x-ofx" data-chg="impcsv"></label><div id="impout" class="mt"></div></div>
 ${sec('Restaurar backup')}<div class="card"><label class="btn" style="position:relative;overflow:hidden;justify-content:center;width:100%">Escolher arquivo de backup (.json)<input type="file" class="fileov" accept=".json,application/json" data-chg="restore"></label></div></div></div>`;

V.ajustes=()=>header('Ajustes',{back:'mais'})+`<div class="list mb"><label class="row sw" style="cursor:pointer"><span>Ocultar valores na tela</span><input type="checkbox" data-chg="hide" ${hideVals?'checked':''}><i></i></label><button class="row" data-act="seedcats"><div class="t"><b>Recriar categorias padrão</b><small>Adiciona só as que estiverem faltando</small></div></button></div>
 <div class="card" style="line-height:1.6"><b>Onde ficam os dados</b><p class="muted" style="font-size:14px">${mode==='db'?'Na nuvem do Claude, ligados a este app. Abra o mesmo link no computador e no celular e as informações aparecem iguais nos dois, atualizando sozinhas.':'Neste navegador (modo local).'}</p>
 <b class="mt" style="display:block">Usar no celular</b><p class="muted" style="font-size:14px">Abra o link do app no navegador do celular (logado no Claude) e use "Adicionar à tela inicial" para ter um ícone.</p>
 <b class="mt" style="display:block">Compartilhar com a Thaís</b><p class="muted" style="font-size:14px">Na página do app no Claude, use "Compartilhar" e convide-a como <b>Colaborador</b>. Assim ela vê e lança na mesma base.</p></div>`;

/* ================= render ================= */
let rq=0;function scheduleRender(){if(rq)return;rq=requestAnimationFrame(()=>{rq=0;render()})}
function render(){if(document.body.classList.contains('authmode'))return;const ae=document.activeElement;let keep=null;if(ae&&ae.id&&$('#app').contains(ae)&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'))keep={id:ae.id,v:ae.value,s:ae.selectionStart};
 let body;if(mode==='loading')body=V.loading();else{try{body=(V[ui.view]||V.inicio)()}catch(err){console.error(err);body=`<div class="banner">Erro ao abrir esta tela: ${esc(err.message)}</div>`}}
 $('#app').innerHTML=shell(body);
 if(keep){const el=document.getElementById(keep.id);if(el){el.value=keep.v;el.focus();try{el.setSelectionRange(keep.s,keep.s)}catch(e){}}}
 const m=$('#msgs');if(m&&ui.view==='assistente')m.lastElementChild?.scrollIntoView({block:'nearest'});
 if(typeof afterRender==='function')afterRender()}
function onHash(){const h=decodeURIComponent(location.hash.slice(1));ui.view=V[h]&&h!=='loading'?h:'inicio';render();window.scrollTo(0,0)}
function go(v){if(location.hash.slice(1)===v){render();window.scrollTo(0,0)}else location.hash=v}

/* ================= modais ================= */
function showModal(html){$('#modal').innerHTML=`<div class="ov" data-ov="modal"><div class="sheet" role="dialog">${html}</div></div>`;document.body.style.overflow='hidden';setTimeout(()=>{const f=$('#modal [autofocus]');const ae=document.activeElement;if(f&&window.innerWidth>700&&!(ae&&$('#modal').contains(ae)&&ae.tagName!=='BUTTON'))f.focus()},30)}
function closeModal(){$('#modal').innerHTML='';document.body.style.overflow='';curForm=null;draft=null}
let dlgRes=null;
function choiceBox(title,msg,choices){return new Promise(res=>{dlgRes=res;$('#dlg').innerHTML=`<div class="ov" data-ov="dlg" style="z-index:70;align-items:center;padding:20px"><div class="sheet" style="max-width:420px;border-radius:20px"><div class="sheet-hd"><h2>${esc(title)}</h2></div><div class="sheet-bd"><p class="muted">${esc(msg)}</p>${choices.map(([k,l,cls])=>`<button class="btn ${cls||''}" style="justify-content:center" data-act="dlg" data-k="${k}">${esc(l)}</button>`).join('')}<button class="btn ghost" style="justify-content:center" data-act="dlg" data-k="">Cancelar</button></div></div></div>`})}
const confirmBox=(msg,ok='Confirmar')=>choiceBox('Confirmar',msg,[['ok',ok,'primary']]).then(k=>k==='ok');
let toastT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),3200)}

let curForm=null;
function logoFromFile(f,id){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const N=96,cv=document.createElement('canvas');cv.width=cv.height=N;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,N,N);const k=Math.min(N/im.width,N/im.height),w=im.width*k,h=im.height*k;x.drawImage(im,(N-w)/2,(N-h)/2,w,h);let u=cv.toDataURL('image/webp',.85);if(!u.startsWith('data:image/webp'))u=cv.toDataURL('image/png');document.getElementById(id).value=u;document.getElementById(id+'_pv').innerHTML=av('',null,u)};im.onerror=()=>toast('Não consegui ler essa imagem');im.src=String(r.result)};r.readAsDataURL(f);}

function fieldHtml(f,v){const id='f_'+f.k;const hint=f.hint?`<em>${esc(f.hint)}</em>`:'';
 switch(f.type){
  case 'money':return `<label class="fl"><span>${esc(f.label)}</span><input id="${id}" inputmode="decimal" value="${v!=null&&v!==''?fmtNum(v):''}" placeholder="0,00" ${f.focus?'autofocus':''}>${hint}</label>`;
  case 'number':return `<label class="fl"><span>${esc(f.label)}</span><input id="${id}" type="number" inputmode="numeric" min="${f.min??''}" max="${f.max??''}" value="${esc(v??'')}">${hint}</label>`;
  case 'date':return `<label class="fl"><span>${esc(f.label)}</span><input id="${id}" type="date" value="${esc(v||'')}">${hint}</label>`;
  case 'month':return `<label class="fl"><span>${esc(f.label)}</span><input id="${id}" type="month" value="${esc(v||'')}">${hint}</label>`;
  case 'pct':return `<label class="fl"><span>${esc(f.label)}</span><input id="${id}" inputmode="decimal" value="${v!=null&&v!==''?String(v).replace('.',','):''}" placeholder="${esc(f.ph||'0,00')}">${hint}</label>`;
  case 'select':{const opts=typeof f.options==='function'?f.options():f.options;return `<label class="fl"><span>${esc(f.label)}</span><select id="${id}" ${f.chg?`data-chg="${f.chg}"`:''}>${opts.map(o=>`<option value="${esc(o.v)}" ${String(o.v)===String(v??'')?'selected':''}>${esc(o.l)}</option>`).join('')}</select>${hint}</label>`}
  case 'toggle':return `<label class="sw"><span>${esc(f.label)}</span><input type="checkbox" id="${id}" ${v?'checked':''}><i></i></label>`;
  case 'color':return `<div class="fl"><span>${esc(f.label)}</span><div class="swatches">${PALETTE.map(c=>`<label><input type="radio" name="${id}" value="${c}" ${c===v?'checked':''}><span style="background:${c}"></span></label>`).join('')}</div></div>`;
  case 'emoji':return `<div class="fl"><span>${esc(f.label)}</span><div class="emojis">${EMOJIS.map(e=>`<label><input type="radio" name="${id}" value="${e}" ${e===v?'checked':''}><span>${e}</span></label>`).join('')}</div></div>`;
  case 'logo':return `<div class="fl"><span>${esc(f.label)}</span><div class="logo-f"><span id="${id}_pv">${v?av('',null,v):'<span class="av" style="background:var(--line)">—</span>'}</span><input type="hidden" id="${id}" value="${esc(v||'')}"><label class="btn sm" style="position:relative;overflow:hidden;">Escolher imagem<input type="file" class="fileov" accept="image/*" data-chg="logo" data-id="${id}"></label><input class="pastelogo" data-pastelogo="${id}" placeholder="ou toque e segure aqui → Colar" inputmode="none"><button type="button" class="btn sm ghost" data-act="logodel" data-id="${id}">Remover</button></div>${hint}</div>`;
  case 'textarea':return `<label class="fl"><span>${esc(f.label)}</span><textarea id="${id}">${esc(v||'')}</textarea></label>`;
  case 'html':return f.html;
  default:return `<label class="fl"><span>${esc(f.label)}</span><input id="${id}" value="${esc(v??'')}" placeholder="${esc(f.ph||'')}" ${f.focus?'autofocus':''}>${hint}</label>`}}
function readField(f){const id='f_'+f.k;
 switch(f.type){case 'money':return r2(parseMoney($('#'+id)?.value));case 'pct':{const s=String($('#'+id)?.value||'').trim().replace('%','').replace(/\s/g,'').replace(',','.');if(s==='')return '';const n=parseFloat(s);return isNaN(n)?'':n}case 'number':{const v=$('#'+id)?.value;return v===''?'':+v}case 'toggle':return !!$('#'+id)?.checked;case 'color':case 'emoji':return document.querySelector(`input[name="${id}"]:checked`)?.value||'';case 'html':return undefined;default:return ($('#'+id)?.value||'').trim()}}
function openForm(cfg){curForm=cfg;const v=cfg.values||{};
 showModal(`<div class="sheet-hd"><h2>${esc(cfg.title)}</h2><button class="icon-btn" data-act="close" aria-label="Fechar">${I.x}</button></div><div class="sheet-bd">${cfg.intro||''}${cfg.fields.map(f=>fieldHtml(f,v[f.k])).join('')}</div>
 <div class="sheet-ft">${cfg.onDelete?`<button class="btn ghost danger" data-act="fdel">${I.trash}</button>`:''}${cfg.extra||''}<span class="sp"></span><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="fsave">${esc(cfg.saveLabel||'Salvar')}</button></div>`)}

/* ---- lançamento ---- */
let draft=null;
function openTx(t,preset={}){
 if(t&&t.kind==='invpay'){const c=byId('cards',t.cardId);return openForm({title:'Pagamento de fatura',values:t,fields:[{k:'amount',label:'Valor',type:'money',req:1},{k:'date',label:'Data',type:'date',req:1},{k:'accountId',label:'Pago com a conta',type:'select',options:()=>S.accounts.map(a=>({v:a.id,l:a.name}))}],intro:`<div class="muted">${esc(c?.name||'Cartão')} · fatura de ${monthLabel(t.inv)}</div>`,onSave:v=>put('tx',{...t,...v}),onDelete:()=>del('tx',t.id)})}
 if(t)draft={id:t.id,kind:t.kind,amount:fmtNum(t.cur&&t.cur!=='BRL'?t.curAmt:t.amount),cur:t.cur||'BRL',rate:t.rate?String(t.rate).replace('.',','):'',iof:!!t.iof,desc:t.desc||'',date:t.date,src:t.cardId?'c:'+t.cardId:'a:'+(t.accountId||''),to:t.toAccountId||'',cat:t.categoryId||'',tags:[...(t.tags||[])],paid:!!t.paid,repeat:'none',n:2,note:t.note||'',split:!!t.split,payer:t.payer||'',attach:[...(t.attach||[])],orig:t};
 else{const a=activeAccs()[0];draft={kind:'out',amount:'',cur:'BRL',rate:'',iof:false,desc:'',date:today(),src:a?'a:'+a.id:'',to:'',cat:'',tags:[],paid:true,repeat:'none',n:2,pmode:'total',paidN:0,note:'',split:!!myPrefs().splitDefault,payer:ME?.email||'',attach:[],...preset}}
 renderTx()}
// Parcelamento: valor digitado = total ou parcela; parcelas já pagas antes de lançar
function parcPlan(d){const v=parseMoney(d.amount);const n=Math.max(2,Math.min(120,parseInt(d.n)||2));const k=Math.max(0,Math.min(n-1,parseInt(d.paidN)||0));
 const total=d.pmode==='parcela'?r2(v*n):r2(v);const per=Math.floor(total/n*100)/100;const last=r2(total-per*(n-1));const rest=r2(per*(n-k-1)+last);return{n,k,total,per,last,rest,ok:v>0}}
function parcHint(d){const p=parcPlan(d);if(!p.ok)return d.pmode==='parcela'?'Digite o valor de cada parcela':'Digite o valor total da compra';
 return `${p.n}× de ${moneyRaw(p.per)} · total ${moneyRaw(p.total)}`+(p.k?` · ${p.k} já paga${p.k>1?'s':''}, faltam ${p.n-p.k} (${moneyRaw(p.rest)})`:'')}
function syncDraft(){const d=draft;if(!d)return;const g=id=>document.getElementById(id);if(g('tx_amt'))d.amount=g('tx_amt').value;if(g('tx_desc'))d.desc=g('tx_desc').value;if(g('tx_date'))d.date=g('tx_date').value||today();if(g('tx_src'))d.src=g('tx_src').value;if(g('tx_to'))d.to=g('tx_to').value;if(g('tx_paid'))d.paid=g('tx_paid').checked;if(g('tx_n'))d.n=g('tx_n').value;if(g('tx_paidn'))d.paidN=g('tx_paidn').value;if(g('tx_note'))d.note=g('tx_note').value;if(g('tx_split'))d.split=g('tx_split').checked;if(g('tx_payer'))d.payer=g('tx_payer').value;if(g('tx_rate'))d.rate=g('tx_rate').value;if(g('tx_iof'))d.iof=g('tx_iof').checked}
function renderTx(){const d=draft,isNew=!d.id;const isCard=d.src.startsWith('c:');const cards=d.kind==='out'?S.cards:[];
 if(isCard&&d.kind!=='out')d.src=activeAccs()[0]?'a:'+activeAccs()[0].id:'';
 const cats=S.categories.filter(c=>c.kind===(d.kind==='in'?'in':'out')).sort((a,b)=>a.name.localeCompare(b.name));
 const accOpts=S.accounts.filter(a=>!a.archived||d.src==='a:'+a.id).map(a=>`<option value="a:${a.id}" ${d.src==='a:'+a.id?'selected':''}>${esc(a.name)}</option>`).join('');
 const cardOpts=cards.map(c=>`<option value="c:${c.id}" ${d.src==='c:'+c.id?'selected':''}>💳 ${esc(c.name)}</option>`).join('');
 const amt=parseMoney(d.amount);const n=Math.max(2,Math.min(120,parseInt(d.n)||2));
 let invHint='';if(d.src.startsWith('c:')){const c=byId('cards',d.src.slice(2));if(c)invHint=`<em id="tx_invhint">Entra na fatura de ${monthLabel(invoiceMonthFor(c,d.date||today()))}${d.repeat==='parcel'?' (1ª parcela)':''}</em>`}
 const title=isNew?{out:'Nova despesa',in:'Nova receita',transfer:'Nova transferência'}[d.kind]:'Editar lançamento';
 const keepId=(document.activeElement&&$('#modal').contains(document.activeElement)&&document.activeElement.id)||'';const keepSc=$('#modal .sheet-bd')?.scrollTop||0;
 showModal(`<div class="sheet-hd"><h2>${title}</h2><button class="icon-btn" data-act="close" aria-label="Fechar">${I.x}</button></div><div class="sheet-bd">
 <div class="seg">${[['out','Despesa'],['in','Receita'],['transfer','Transferência']].map(([k,l])=>`<button class="${d.kind===k?'on '+k:''}" data-act="txkind" data-k="${k}">${l}</button>`).join('')}</div>
 <div class="amtrow">${curSelect(d)}<input id="tx_amt" class="amount-in ${d.kind==='in'?'pos':d.kind==='out'?'neg':''}" inputmode="decimal" placeholder="${curPh(d.cur)}" value="${esc(d.amount)}" autofocus aria-label="Valor" data-inp="txamt"></div>${fxBox(d)}
 ${d.kind!=='transfer'?`<label class="fl"><span>Descrição</span><input id="tx_desc" value="${esc(d.desc)}" placeholder="${d.kind==='in'?'Ex.: Salário':'Ex.: Mercado do mês'}"></label>`:''}
 <div class="grid2"><label class="fl"><span>${isNew&&d.repeat==='parcel'&&+d.paidN>0?'Próxima parcela':'Data'}</span><input id="tx_date" type="date" value="${esc(d.date)}" data-chg="txdate"></label>
 <label class="fl"><span>${d.kind==='transfer'?'De':d.kind==='out'?'Conta ou cartão':'Conta'}</span><select id="tx_src" data-chg="txsrc2">${accOpts}${cardOpts?`<optgroup label="Cartões">${cardOpts}</optgroup>`:''}</select>${invHint}</label></div>
 ${d.kind==='transfer'?`<label class="fl"><span>Para</span><select id="tx_to"><option value="">Escolha a conta</option>${S.accounts.filter(a=>'a:'+a.id!==d.src&&(!a.archived||a.id===d.to)).map(a=>`<option value="${a.id}" ${d.to===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label>`:
 `<div class="fl"><span>Categoria</span><div class="catgrid">${cats.map(c=>`<button class="catbtn ${d.cat===c.id?'on':''}" data-act="txcat" data-id="${c.id}">${ib(c.emoji,c.color,'sm')}<span>${esc(c.name)}</span></button>`).join('')}</div>${cats.length?'':'<em>Nenhuma categoria. Crie em Mais › Categorias.</em>'}</div>`}
 ${S.tags.length&&d.kind!=='transfer'?`<div class="fl"><span>Tags</span><div class="chips">${S.tags.map(g=>`<button class="chip ${d.tags.includes(g.id)?'on':''}" data-act="txtag" data-id="${g.id}">#${esc(g.name)}</button>`).join('')}</div></div>`:''}
 ${!d.src.startsWith('c:')?`<label class="sw"><span>${d.kind==='in'?'Já recebi':d.kind==='transfer'?'Já transferi':'Já paguei'}</span><input type="checkbox" id="tx_paid" ${d.paid?'checked':''}><i></i></label>`:''}
 ${isNew&&d.kind!=='transfer'?`<div class="fl"><span>Repetir</span><div class="seg">${[['none','Não repetir'],['parcel','Parcelado'],['fixed','Fixo mensal']].map(([k,l])=>`<button class="${d.repeat===k?'on':''}" data-act="txrep" data-k="${k}">${l}</button>`).join('')}</div></div>
 ${d.repeat==='parcel'?`<div class="fl"><span>O valor digitado é</span><div class="seg">${[['total','Total da compra'],['parcela','Valor da parcela']].map(([k,l])=>`<button class="${(d.pmode||'total')===k?'on':''}" data-act="txpmode" data-k="${k}">${l}</button>`).join('')}</div></div>
 <div class="grid2"><label class="fl"><span>Total de parcelas</span><input id="tx_n" type="number" min="2" max="120" value="${n}" data-inp="txn"></label><label class="fl"><span>Já pagas</span><input id="tx_paidn" type="number" min="0" max="119" value="${+d.paidN||0}" data-inp="txn"></label></div>
 <em id="parchint" class="muted" style="font-size:13px;margin-top:-6px">${parcHint(d)}</em>
 ${+d.paidN>0?`<em class="muted" style="font-size:12.5px">Só as parcelas que faltam são lançadas, a partir da data acima (a da próxima parcela${isCard?', na fatura indicada':''}).</em>`:''}`:''}
 ${d.repeat==='fixed'?`<em id="tx_fixhint" class="muted" style="font-size:13px">Vai se repetir todo dia ${+String(d.date).slice(8,10)} e aparece em Recorrências.</em>`:''}`:''}
 ${!isNew&&d.orig.inst?`<div class="banner info" style="margin:0">Parcela ${d.orig.inst.n} de ${d.orig.inst.of}. A edição vale só para esta parcela.</div>`:''}
 ${!isNew&&d.orig.recurId?`<div class="banner info" style="margin:0">Lançamento de uma recorrência. Para mudar todos os meses, edite em Recorrências.</div>`:''}
 ${d.kind!=='transfer'?txCoupleHtml(d):''}
 <label class="fl"><span>Observação</span><textarea id="tx_note" placeholder="Opcional">${esc(d.note)}</textarea></label>
 ${txAttachHtml(d)}
 </div><div class="sheet-ft">${!isNew?`<button class="btn ghost danger" data-act="txdel" aria-label="Excluir">${I.trash}</button>`:''}<span class="sp"></span><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="txsave">Salvar</button></div>`);
 if(keepSc){const b=$('#modal .sheet-bd');if(b)b.scrollTop=keepSc}if(keepId){const el=document.getElementById(keepId);if(el)try{el.focus({preventScroll:true})}catch(e){}}}
async function saveTx(){syncDraft();const d=draft;const amt=txBRL(d);if(d.repeat==='parcel'&&d.kind!=='transfer'&&+d.paidN>=Math.max(2,parseInt(d.n)||2))return toast('As parcelas já pagas precisam ser menos que o total');if(!(amt>0))return toast(d.cur&&d.cur!=='BRL'&&!(parseMoney(d.rate)>0)?'Aguarde a cotação ou informe-a':'Informe o valor');if(!d.src)return toast('Cadastre uma conta primeiro');
 const[st,sid]=d.src.split(':');if(d.kind==='transfer'){if(st!=='a')return toast('Transferência é entre contas');if(!d.to||d.to===sid)return toast('Escolha a conta de destino')}
 if(d.kind!=='transfer'&&!d.cat){const rc=ruleCat(d.desc,d.kind);if(rc)d.cat=rc}
 if(d.kind!=='transfer'&&!d.cat&&S.categories.length&&!(await confirmBox('Salvar sem categoria?','Salvar assim')))return;
 const base={kind:d.kind,desc:d.kind==='transfer'?'Transferência':d.desc.trim(),categoryId:d.kind==='transfer'?null:(d.cat||null),tags:d.kind==='transfer'?[]:d.tags,note:d.note.trim(),split:d.kind==='transfer'?false:!!d.split,payer:d.payer||ME?.email||'',attach:d.attach||[],...fxFields(d)};
 const setSrc=(t,date)=>{if(st==='c'){const c=byId('cards',sid);t.cardId=sid;t.accountId=null;t.inv=invoiceMonthFor(c,date);t.paid=true}else{t.accountId=sid;t.cardId=null;t.inv=null}t.toAccountId=d.kind==='transfer'?d.to:null;return t};
 if(d.id){const o=d.orig;put('tx',setSrc({...o,...base,amount:amt,date:d.date,purchaseDate:o.inst?o.purchaseDate:d.date,paid:d.paid},d.date));closeModal();return toast('Lançamento atualizado')}
 if(d.repeat==='parcel'&&d.kind!=='transfer'){const p=parcPlan({...d,amount:fmtNum(amt)});const{n,k,total,per}=p;const g=uid();
  // com parcelas já pagas, a data do formulário é a da próxima; a compra foi k meses antes
  const purchase=k?addMonthsDate(d.date,-k):d.date;
  for(let i=k;i<n;i++){const date=addMonthsDate(d.date,i-k);put('tx',setSrc({id:g+'_'+(i+1),...base,amount:i===n-1?p.last:per,date,purchaseDate:purchase,group:g,inst:{n:i+1,of:n},total,paidBefore:k,paid:i===k?(d.paid&&(k===0||date<=today())):false},date))}
  closeModal();return toast(k?`Parcelamento salvo: faltam ${n-k} de ${n} parcelas`:`Compra parcelada em ${n}x salva`)}
 if(d.repeat==='fixed'&&d.kind!=='transfer'){const r={id:uid(),desc:base.desc,kind:d.kind,amount:amt,categoryId:base.categoryId,tags:base.tags,split:base.split,payer:base.payer,day:+d.date.slice(8,10),start:d.date,end:'',active:true,skip:[]};if(st==='c')r.cardId=sid;else r.accountId=sid;await put('recurrences',r);genRecurrence(r,horizon()).forEach((t,i)=>{if(i===0&&!t.cardId)t.paid=d.paid;put('tx',t)});closeModal();return toast('Lançamento fixo criado para os próximos meses')}
 put('tx',setSrc({id:uid(),...base,amount:amt,date:d.date,purchaseDate:d.date,paid:d.paid},d.date));closeModal();toast('Lançamento salvo')}
async function deleteTx(){const t=draft.orig;
 if(t.group){const k=await choiceBox('Excluir parcelamento',`Compra em ${t.inst.of} parcelas. O que deseja excluir?`,[['one','Só esta parcela'],['next','Esta e as próximas'],['all','Todas as parcelas','danger']]);if(!k)return;const sib=S.tx.filter(x=>x.group===t.group);(k==='one'?[t]:k==='next'?sib.filter(x=>x.inst.n>=t.inst.n):sib).forEach(x=>del('tx',x.id))}
 else if(t.recurId){const r=byId('recurrences',t.recurId);const k=await choiceBox('Excluir lançamento fixo','Este lançamento se repete todo mês.',[['one','Só este mês'],['next','Este e os próximos meses','danger']]);if(!k)return;
  if(k==='one'){if(r)put('recurrences',{...r,skip:[...(r.skip||[]),ymOf(t.date)]});del('tx',t.id)}else{if(r)put('recurrences',{...r,end:addMonths(ymOf(t.date),-1)});S.tx.filter(x=>x.recurId===t.recurId&&x.date>=t.date&&(!x.paid||x.id===t.id||x.cardId)).forEach(x=>del('tx',x.id))}}
 else{if(!(await confirmBox('Excluir este lançamento?','Excluir')))return;if(t.loanId){const l=byId('loans',t.loanId);if(l)put('loans',{...l,skip:[...(l.skip||[]),t.loanN]})}del('tx',t.id)}
 closeModal();toast('Excluído')}

/* ---- formulários de cadastro ---- */
const accOptions=(empty)=>[...(empty?[{v:'',l:empty}]:[]),...S.accounts.filter(a=>!a.archived).map(a=>({v:a.id,l:a.name}))];
const catOptions=(kind,empty='Sem categoria')=>[{v:'',l:empty},...S.categories.filter(c=>c.kind===kind).sort((a,b)=>a.name.localeCompare(b.name)).map(c=>({v:c.id,l:c.emoji+' '+c.name}))];
function formAccount(a){openForm({title:a?'Editar conta':'Nova conta',values:a||{type:'corrente',color:PALETTE[S.accounts.length%PALETTE.length],initial:0},
 fields:[{k:'name',label:'Nome',req:1,ph:'Ex.: Caixa, Nubank, Carteira',focus:1},{k:'type',label:'Tipo',type:'select',options:ACC_TYPES},{k:'initial',label:'Saldo inicial',type:'money',hint:'Quanto tinha na conta antes do primeiro lançamento. Pode ser negativo (use o sinal −).'},{k:'odLimit',label:'Limite do cheque especial',type:'money',hint:'Deixe em branco se a conta não tiver'},{k:'odRate',label:'Juros do cheque especial (% ao mês)',type:'pct',ph:'Ex.: 7,9',hint:'Está no app ou no extrato do banco. Usado para estimar quanto você paga quando a conta fica negativa'},{k:'color',label:'Cor',type:'color'},{k:'logo',label:'Logo (opcional)',type:'logo',hint:'Use um print ou imagem do logo do banco. Fica no lugar da letra com a cor.'},...(a?[{k:'archived',label:'Arquivar (esconder das listas)',type:'toggle'}]:[])],
 onSave:v=>{put('accounts',{...(a||{id:uid(),since:ymOf(today())}),...v});toast('Conta salva')},
 onDelete:a?async()=>{if(S.tx.some(t=>t.accountId===a.id||t.toAccountId===a.id)){toast('Essa conta tem lançamentos. Use "Arquivar".');return false}await del('accounts',a.id)}:null})}
function formCard(c){openForm({title:c?'Editar cartão':'Novo cartão',values:c||{closing:1,due:10,color:PALETTE[(S.cards.length+12)%PALETTE.length],payAccount:activeAccs()[0]?.id||''},
 fields:[{k:'name',label:'Nome',req:1,ph:'Ex.: Nubank, Santander',focus:1},{k:'limit',label:'Limite',type:'money'},{k:'closing',label:'Dia do fechamento',type:'number',min:1,max:31,req:1},{k:'due',label:'Dia do vencimento',type:'number',min:1,max:31,req:1},{k:'payAccount',label:'Conta que paga a fatura',type:'select',options:()=>accOptions('Nenhuma')},{k:'color',label:'Cor',type:'color'},{k:'logo',label:'Logo (opcional)',type:'logo',hint:'Use um print ou imagem do logo do banco. Fica no lugar da letra com a cor.'}],
 onSave:v=>{if(!(v.closing>=1&&v.closing<=31&&v.due>=1&&v.due<=31)){toast('Dias devem ser de 1 a 31');return false}put('cards',{...(c||{id:uid()}),...v});toast('Cartão salvo')},
 onDelete:c?async()=>{if(S.tx.some(t=>t.cardId===c.id)){toast('Esse cartão tem lançamentos e não pode ser excluído.');return false}await del('cards',c.id);go('cartoes')}:null})}
function formCat(c){openForm({title:c?'Editar categoria':'Nova categoria',values:c||{kind:ui.catTab,emoji:'🛒',color:PALETTE[S.categories.length%PALETTE.length]},
 fields:[{k:'name',label:'Nome',req:1,focus:1},{k:'kind',label:'Tipo',type:'select',options:[{v:'out',l:'Despesa'},{v:'in',l:'Receita'}]},{k:'emoji',label:'Ícone',type:'emoji'},{k:'color',label:'Cor',type:'color'},{k:'deduct',label:'Dedutível no Imposto de Renda (saúde, educação…)',type:'toggle'}],
 onSave:v=>put('categories',{...(c||{id:uid()}),...v}),
 onDelete:c?async()=>{const n=S.tx.filter(t=>t.categoryId===c.id).length;if(n&&!(await confirmBox(`${n} lançamentos usam esta categoria e ficarão "Sem categoria". Excluir mesmo assim?`,'Excluir')))return false;await del('categories',c.id)}:null})}
function formTag(g){openForm({title:g?'Editar tag':'Nova tag',values:g||{},fields:[{k:'name',label:'Nome',req:1,focus:1,ph:'Ex.: Viagem Natal'}],onSave:v=>put('tags',{...(g||{id:uid()}),...v}),onDelete:g?async()=>{S.tx.filter(t=>(t.tags||[]).includes(g.id)).forEach(t=>put('tx',{...t,tags:t.tags.filter(x=>x!==g.id)}));await del('tags',g.id)}:null})}
function formBudget(b){openForm({title:b?'Editar limite':'Novo limite mensal',values:b||{},fields:[{k:'categoryId',label:'Categoria',type:'select',req:1,options:()=>catOptions('out','Escolha').filter(o=>!o.v||o.v===b?.categoryId||!S.budgets.some(x=>x.categoryId===o.v))},{k:'amount',label:'Limite por mês',type:'money',req:1}],
 onSave:v=>put('budgets',{...(b||{id:uid()}),...v}),onDelete:b?()=>del('budgets',b.id):null})}
function formGoal(g){const saved=g?sum(g.moves||[],m=>m.amount):0;openForm({title:g?g.name:'Nova meta ou caixinha',values:g||{emoji:'🎯',color:'#3ccf91'},
 intro:g?`<div class="card center"><small class="muted">Guardado</small><div class="big" style="font-size:26px">${money(saved)}</div><div class="grid2 mt"><button class="btn" data-act="goalmove" data-id="${g.id}" data-k="out">Retirar</button><button class="btn primary" data-act="goalmove" data-id="${g.id}" data-k="in">Guardar</button></div>${(g.moves||[]).length?`<div class="mt" style="text-align:left;max-height:150px;overflow:auto">${g.moves.slice().reverse().map(m=>`<div class="sw" style="padding:6px 0;font-size:14px;border-top:1px solid var(--line)"><span class="muted">${brDate(m.date)}${m.note?' · '+esc(m.note):''}</span><b class="${m.amount<0?'neg':'pos'}">${money(m.amount)}</b></div>`).join('')}</div>`:''}</div>`:'',
 fields:[{k:'name',label:'Nome',req:1,ph:'Ex.: Reserva de emergência'},{k:'target',label:'Meta (opcional)',type:'money'},{k:'deadline',label:'Prazo (opcional)',type:'date'},{k:'emoji',label:'Ícone',type:'emoji'},{k:'color',label:'Cor',type:'color'}],
 onSave:v=>put('goals',{moves:[],...(g||{id:uid()}),...v}),onDelete:g?()=>del('goals',g.id):null})}
function formRec(r){const src=r?(r.cardId?'c:'+r.cardId:'a:'+r.accountId):(activeAccs()[0]?'a:'+activeAccs()[0].id:'');
 openForm({title:r?'Editar recorrência':'Nova recorrência',values:r?{...r,src,start:r.start}:{kind:'out',src,start:today(),active:true},
 fields:[{k:'desc',label:'Descrição',req:1,ph:'Ex.: Aluguel, Internet, Salário'},{k:'kind',label:'Tipo',type:'select',options:[{v:'out',l:'Despesa'},{v:'in',l:'Receita'}]},{k:'amount',label:'Valor',type:'money',req:1},{k:'src',label:'Conta ou cartão',type:'select',options:()=>[...S.accounts.filter(a=>!a.archived).map(a=>({v:'a:'+a.id,l:a.name})),...S.cards.map(c=>({v:'c:'+c.id,l:'💳 '+c.name}))]},{k:'categoryId',label:'Categoria',type:'select',options:()=>[...catOptions('out'),...catOptions('in','—').slice(1)]},{k:'start',label:'Primeiro lançamento',type:'date',req:1,hint:'O dia desta data se repete todo mês'},{k:'end',label:'Último mês (opcional)',type:'month'},{k:'active',label:'Ativa',type:'toggle'}],
 onSave:async v=>{const[st,sid]=(v.src||'').split(':');if(!sid){toast('Escolha a conta');return false}if(st==='c'&&v.kind==='in'){toast('Receita não pode ir para cartão');return false}
  const nr={skip:[],...(r||{id:uid()}),desc:v.desc,kind:v.kind,amount:v.amount,categoryId:v.categoryId||null,start:v.start,day:+v.start.slice(8,10),end:v.end||'',active:v.active,accountId:st==='a'?sid:null,cardId:st==='c'?sid:null};
  await put('recurrences',nr);const td=today();
  if(r){for(const t of S.tx.filter(x=>x.recurId===r.id&&x.date>=td&&(!x.paid||x.cardId))){const keep=nr.active&&(!nr.end||ymOf(t.date)<=nr.end);if(!keep){del('tx',t.id);continue}const date=dateIn(ymOf(t.date),nr.day);const u={...t,amount:nr.amount,desc:nr.desc,kind:nr.kind,categoryId:nr.categoryId,date,purchaseDate:date};if(nr.cardId){u.cardId=nr.cardId;u.accountId=null;u.inv=invoiceMonthFor(byId('cards',nr.cardId),date);u.paid=true}else{u.accountId=nr.accountId;u.cardId=null;u.inv=null;u.paid=false}put('tx',u)}}
  if(nr.active)genRecurrence(nr,horizon()).forEach(t=>put('tx',t));toast('Recorrência salva')},
 onDelete:r?async()=>{const k=await choiceBox('Excluir recorrência','O que fazer com os lançamentos futuros ainda não pagos?',[['del','Excluir os futuros pendentes','danger'],['keep','Manter os lançamentos']]);if(!k)return false;if(k==='del')S.tx.filter(x=>x.recurId===r.id&&x.date>=today()&&(!x.paid||x.cardId)).forEach(x=>del('tx',x.id));await del('recurrences',r.id)}:null})}
function formLoan(l,kind){kind=l?.kind||kind;openForm({title:l?'Editar':(kind==='financiamento'?'Novo financiamento':'Novo empréstimo'),values:l||{kind,first:today(),paidBefore:0,accountId:activeAccs()[0]?.id,categoryId:S.categories.find(c=>norm(c.name)===(kind==='financiamento'?'divida':'emprestimo'))?.id||''},
 intro:l?(()=>{const s=loanStats(l);return `<div class="card"><div class="kpis" style="margin:0;border:0;padding:0"><div><small>Pagas</small><b>${s.paidN}/${s.n}</b></div><div><small>Saldo devedor</small><b class="neg">${money(s.saldo)}</b></div><div><small>Próxima</small><b>${s.next?brDate(s.next.date):'—'}</b></div></div>${loanIntroExtra(l,s)}</div>`})():'<div class="muted" style="font-size:13.5px">Informe o valor da parcela, ou ligue “Calcular pelas taxas do contrato” e preencha os dados do extrato do banco para o Fort calcular cada parcela sozinho.</div>',
 fields:loanFields(kind),
 onSave:v=>{const n=parseInt(v.n)||0;if(n<1){toast('Informe o número de parcelas');return false}const nl={skip:[],...(l||{id:uid(),kind}),...v,n,paidBefore:Math.max(0,parseInt(v.paidBefore)||0)};
  if(nl.calc){if(!(+nl.saldo>0)&&!(+nl.total>0)){toast('Informe o saldo devedor ou o valor contratado');return false}if(!(loanRate(nl)>0)){toast('Informe os juros do contrato');return false}seriesCacheLoan={};nl.parcel=loanAmt({...nl},Math.min(n,nl.paidBefore+1))}else if(!(+nl.parcel>0)){toast('Informe o valor da parcela');return false}
  put('loans',nl);
  if(l)S.tx.filter(t=>t.loanId===l.id&&!t.paid).forEach(t=>{if(t.loanN>n||t.loanN<=nl.paidBefore){del('tx',t.id);return}const date=addMonthsDate(nl.first,t.loanN-1);put('tx',{...t,amount:loanAmt(nl,t.loanN),accountId:nl.accountId,categoryId:nl.categoryId||null,date,purchaseDate:date,desc:nl.name+' '+t.loanN+'/'+n})});
  genLoan(nl,horizon()).forEach(t=>put('tx',t));toast('Salvo. Parcelas lançadas como pendentes.')},
 onDelete:l?async()=>{S.tx.filter(t=>t.loanId===l.id&&!t.paid).forEach(t=>del('tx',t.id));await del('loans',l.id)}:null,delMsg:'Excluir? As parcelas futuras pendentes também serão removidas.'})}
function formDebt(d){const rec=d?sum(d.payments||[],p=>p.amount):0;openForm({title:d?'Quem me deve':'Novo valor a receber',values:d||{date:today()},
 intro:d?`<div class="card center"><small class="muted">Falta receber</small><div class="big pos" style="font-size:26px">${money(d.amount-rec)}</div>${d.amount-rec>0.004?`<button class="btn primary mt" data-act="debtpay" data-id="${d.id}">Registrar recebimento</button>`:''}${(d.payments||[]).map(p=>`<div class="sw" style="padding:6px 0;font-size:14px;border-top:1px solid var(--line);margin-top:6px"><span class="muted">${brDate(p.date)}</span><b class="pos">${money(p.amount)}</b></div>`).join('')}</div>`:'',
 fields:[{k:'person',label:'Pessoa',req:1,ph:'Ex.: João'},{k:'desc',label:'Descrição',ph:'Ex.: Emprestei para o conserto do carro'},{k:'amount',label:'Valor',type:'money',req:1},{k:'date',label:'Data',type:'date'}],
 onSave:v=>put('debts',{payments:[],...(d||{id:uid()}),...v}),onDelete:d?()=>del('debts',d.id):null})}

/* ================= importar / exportar / IA ================= */
function csvCell(v){v=String(v??'');return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function txCSV(list){const kinds={out:'Despesa',in:'Receita',transfer:'Transferência',invpay:'Pagamento de fatura'};const h=['Data','Tipo','Descrição','Valor','Categoria','Conta/Cartão','Fatura','Situação','Parcela','Tags','Observação'];
 const rows=list.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(t=>[brDate(t.date),kinds[t.kind]||t.kind,txTitle(t),(t.kind==='out'||t.kind==='invpay'?'-':'')+fmtNum(t.amount).replace(/\./g,''),catOf(t).name,srcName(t),t.inv?monYr(t.inv):'',t.cardId?'Cartão':t.paid?'Pago':'Pendente',t.inst?t.inst.n+'/'+t.inst.of:'',(t.tags||[]).map(id=>byId('tags',id)?.name).filter(Boolean).join(', '),t.note||'']);
 return '﻿'+[h,...rows].map(r=>r.map(csvCell).join(';')).join('\r\n')}
async function offerFile(filename,data){if(!DL){try{const b=new Blob([typeof data==='string'&&/\.csv$/.test(filename)?'\ufeff'+data:data],{type:/\.json$/.test(filename)?'application/json':'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);toast('Arquivo baixado');return}catch(e){}}if(DL){try{await DL.save({filename,data});toast('Arquivo pronto');return}catch(e){if(e&&e.code==='declined')return;if(e&&e.code==='rate_limited'){toast('Aguarde um instante e tente de novo');return}}}
 const out=$('#exportout');if(out){out.innerHTML=`<p class="muted mt" style="font-size:13px">Não foi possível baixar aqui. Copie o conteúdo abaixo e cole num arquivo:</p><textarea id="exptxt" style="min-height:140px;font-size:12px" readonly>${esc(typeof data==='string'?data:'')}</textarea><button class="btn mt" data-act="copyexp">Copiar</button>`}}
function parseCSV(text){text=text.replace(/^﻿/,'');const first=text.split(/\r?\n/)[0]||'';const sep=(first.match(/;/g)||[]).length>=(first.match(/,/g)||[]).length?';':',';const rows=[];let row=[],cell='',q=false;
 for(let i=0;i<text.length;i++){const ch=text[i];if(q){if(ch==='"'){if(text[i+1]==='"'){cell+='"';i++}else q=false}else cell+=ch}else if(ch==='"')q=true;else if(ch===sep){row.push(cell);cell=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell=''}else cell+=ch}
 if(cell||row.length){row.push(cell);rows.push(row)}return rows.filter(r=>r.some(c=>c.trim()))}
function parseDate(s){s=String(s).trim();let m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return m[1]+'-'+m[2]+'-'+m[3];m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);if(m){const y=m[3].length===2?'20'+m[3]:m[3];return y+'-'+pad(m[2])+'-'+pad(m[1])}return null}
let importRows=null;
function handleImport(text){const rows=parseCSV(text);if(!rows.length){$('#impout').innerHTML='<div class="banner">Arquivo vazio.</div>';return}
 let hdr=rows[0].map(norm);let ci={d:0,ds:1,v:2,c:-1,k:-1};let start=0;
 if(hdr.some(h=>h.includes('data'))){start=1;ci={d:hdr.findIndex(h=>h.includes('data')),ds:hdr.findIndex(h=>h.includes('descri')||h.includes('historico')||h.includes('lancamento')),v:hdr.findIndex(h=>h.includes('valor')),c:hdr.findIndex(h=>h.includes('categoria')),k:hdr.findIndex(h=>h==='tipo')};if(ci.ds<0)ci.ds=1;if(ci.v<0)ci.v=2}
 const out=[];let bad=0;for(const r of rows.slice(start)){const date=parseDate(r[ci.d]);let v=parseMoney(r[ci.v]);if(!date||!v){bad++;continue}let kind=v<0?'out':'in';if(ci.k>=0){const k=norm(r[ci.k]);if(k.startsWith('desp')||k.startsWith('sai')||k.startsWith('deb'))kind='out';else if(k.startsWith('rec')||k.startsWith('ent')||k.startsWith('cred'))kind='in'}
  const cn=ci.c>=0?norm(r[ci.c]):'';const cat=cn?S.categories.find(c=>norm(c.name)===cn&&c.kind===kind):null;out.push({date,desc:String(r[ci.ds]||'').trim(),amount:r2(Math.abs(v)),kind,categoryId:cat?.id||null})}
 importPreview(out,bad)}
function aiContext(){const cur=ymOf(today()),end=endOf(cur);const L=[];
 L.push('Data de hoje: '+brDate(today()));
 L.push('\nCONTAS (saldo atual | previsto fim do mês):');S.accounts.filter(a=>!a.archived).forEach(a=>L.push(`- ${a.name}: ${moneyRaw(accBalance(a,today(),false))} | ${moneyRaw(accBalance(a,end,true))}`));
 if(S.cards.length){L.push('\nCARTÕES:');S.cards.forEach(c=>{const iv=invoice(c,cur);const ci=invoice(c,currentInvOf(c));L.push(`- ${c.name}: fatura que vence em ${monthLabel(cur)} ${moneyRaw(iv.total)} (${iv.status}, falta ${moneyRaw(iv.remaining)}); fatura em aberto (${monthLabel(ci.inv)}) ${moneyRaw(ci.total)}; limite ${moneyRaw(c.limit||0)}, usado ${moneyRaw(cardUsed(c))}`)})}
 L.push('\nÚLTIMOS 6 MESES (receitas | despesas):');range(cur,6).forEach(m=>{const s=monthSummary(m);L.push(`- ${monthLabel(m)}: ${moneyRaw(s.inc)} | ${moneyRaw(s.exp)}`)});
 [cur,addMonths(cur,-1)].forEach(m=>{L.push(`\nDESPESAS POR CATEGORIA em ${monthLabel(m)}:`);byCat(monthExp(m)).forEach(g=>L.push(`- ${g.cat.name}: ${moneyRaw(g.total)}`))});
 if(S.budgets.length){L.push('\nORÇAMENTO do mês (limite | gasto):');const e=byCat(monthExp(cur));S.budgets.forEach(b=>{const c=byId('categories',b.categoryId);if(c)L.push(`- ${c.name}: ${moneyRaw(b.amount)} | ${moneyRaw(e.find(x=>x.id===b.categoryId)?.total||0)}`)})}
 if(S.recurrences.length){L.push('\nRECORRÊNCIAS:');S.recurrences.filter(r=>r.active!==false).forEach(r=>L.push(`- ${r.desc}: ${moneyRaw(r.amount)} (${r.kind==='in'?'receita':'despesa'}) dia ${r.day}`))}
 if(S.loans.length){L.push('\nFINANCIAMENTOS/EMPRÉSTIMOS:');S.loans.forEach(l=>{const s=loanStats(l);L.push(`- ${l.name}: parcela ${moneyRaw(l.parcel)}, ${s.paidN}/${s.n} pagas, saldo devedor ${moneyRaw(s.saldo)}`)})}
 if(S.goals.length){L.push('\nMETAS:');S.goals.forEach(g=>L.push(`- ${g.name}: guardado ${moneyRaw(sum(g.moves||[],m=>m.amount))}${g.target?' de '+moneyRaw(g.target):''}`))}
 if(S.debts.length){L.push('\nQUEM ME DEVE:');S.debts.forEach(d=>L.push(`- ${d.person}: falta ${moneyRaw(d.amount-sum(d.payments||[],p=>p.amount))}`))}
 L.push(`\nLANÇAMENTOS DE ${monthLabel(cur)} (data; tipo; valor; categoria; conta; descrição; situação):`);S.tx.filter(t=>ymOf(t.date)===cur).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,180).forEach(t=>L.push(`${brDate(t.date)}; ${t.kind}; ${moneyRaw(t.amount)}; ${catOf(t).name}; ${srcName(t)}; ${t.desc||''}; ${t.cardId?'cartão':t.paid?'pago':'pendente'}`));
 return L.join('\n').slice(0,60000)}
async function sendChat(q){q=String(q||'').trim();if(!q||ui.chatBusy||!SAMPLE)return;ui.chat.push({role:'user',content:q});ui.chatBusy=true;ui.chatStream='';render();
 const rules='Você é o assistente do Bolso, um app pessoal de controle financeiro. Responda em português do Brasil, de forma curta e prática (no máximo uns 8 parágrafos curtos ou uma lista), usando APENAS os dados abaixo. Se faltar informação, diga o que falta. Valores em R$. Não faça recomendações de investimento específicas; você não é consultor financeiro. Não use tabelas markdown nem asteriscos de negrito.\n\nDADOS DO USUÁRIO:\n'+aiContext();
 try{const{text}=await SAMPLE([{role:'user',content:rules},...ui.chat.slice(-12)],{cache:false,onText:({text})=>{ui.chatStream=text;const el=$('#streaming');if(el)el.textContent=text}});ui.chat.push({role:'assistant',content:text})}
 catch(e){const c=e&&e.code;if(c==='not_granted'||c==='sampling_disabled'||c==='capability_disabled'||c==='capability_removed'||c==='not_declared')ui.aiOff='O assistente não está liberado para este app. Ao perguntar, permita o uso do Claude quando aparecer o aviso.';ui.chat.push({role:'assistant',content:e&&e.text?e.text+'\n\n(resposta interrompida)':c==='rate_limited'?'Muitas perguntas seguidas. Tente de novo em alguns minutos.':c==='cancelled'?'Cancelado.':'Não consegui responder agora. Tente novamente.'})}
 ui.chatBusy=false;ui.chatStream='';render()}
async function readReceipt(file){if(!file)return;ui.rcptMsg='<div class="loading" style="min-height:120px"><div class="spin"></div>Lendo o comprovante…</div>';render();
 try{const lim=await SAMPLE.limits().catch(()=>null);if(!lim||!lim.images){ui.imgOff='Leitura de imagens indisponível nesta visualização.';ui.rcptMsg='';render();return}
  const cats=S.categories.map(c=>`${c.name} (${c.kind==='in'?'receita':'despesa'})`).join(', ');
  const r=await SAMPLE.json(`Esta imagem é um comprovante financeiro brasileiro (Pix, transferência, recibo, nota fiscal ou boleto pago). Extraia os dados e responda só com JSON no formato {"tipo":"despesa"|"receita","valor":123.45,"data":"AAAA-MM-DD","descricao":"texto curto, ex.: nome do recebedor ou loja","categoria":"uma destas ou vazio: ${cats}"}. Se o usuário pagou ou enviou, é despesa; se recebeu, é receita. Se não achar a data, use "".`,{images:[file],modelTier:'default'});
  const kind=String(r?.tipo||'').startsWith('rec')?'in':'out';const cat=S.categories.find(c=>c.kind===kind&&norm(r?.categoria||'').startsWith(norm(c.name)));const date=parseDate(r?.data||'')||today();
  ui.rcptMsg='';render();openTx(null,{kind,amount:r?.valor?fmtNum(+r.valor):'',desc:String(r?.descricao||'').slice(0,80),date,cat:cat?.id||'',paid:date<=today()})}
 catch(e){const c=e&&e.code;if(c==='not_granted'||c==='images_unavailable'||c==='sampling_disabled')ui.imgOff='A leitura por IA não está liberada. Permita o uso do Claude quando aparecer o aviso.';ui.rcptMsg=`<div class="banner">${c==='invalid_json'?'Não consegui entender o comprovante. Tente uma imagem mais nítida.':c==='image_rejected'?'Imagem não aceita. Tente outra foto ou print.':c==='rate_limited'?'Muitas leituras seguidas. Tente em alguns minutos.':'Não foi possível ler agora.'}</div>`;render()}}

/* ================= ações ================= */
function fabMenu(open){const m=$('#fabm');if(!m)return;if(!open){m.innerHTML='';return}
 const f=document.querySelector('.bottom .fab');if(!f)return A.newtx({});const r=f.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
 const o=[['transfer','Transferir',I.swap,'#4fb3bf',-124,-80],['in','Receita',I.arrUp,'#3ccf91',-80,-168],['quick','Rápido<br>ou voz',ICQ,'#9b8cff',0,-212],['card','Despesa<br>cartão',I.card,'#ec937c',80,-168],['out','Despesa',I.arrDn,'#f37a72',124,-80]];
 m.innerHTML='<div class="ov2" data-act="fabclose"></div>'+o.map(([k,l,ic,c,dx,dy],i)=>`<button class="fo" data-act="fabgo" data-k="${k}" style="left:${cx+dx}px;top:${cy+dy}px;animation-delay:${i*30}ms"><i style="background:${c}">${ic}</i><span>${l}</span></button>`).join('')+`<button class="fx" data-act="fabclose" aria-label="Fechar" style="left:${cx}px;top:${cy}px">${I.x}</button>`}
const A={
 fabmenu:()=>fabMenu(true),fabclose:()=>fabMenu(false),
 fabgo:d=>{fabMenu(false);if(d.k==='quick')return openQuick();if(d.k==='card'){if(!S.cards.length){toast('Cadastre um cartão primeiro');return formCard()}return A.newtx({card:S.cards[0].id})}A.newtx({kind:d.k})},
 go:d=>go(d.go),
 logodel:d=>{const i=document.getElementById(d.id);if(i)i.value='';const p=document.getElementById(d.id+'_pv');if(p)p.innerHTML='<span class="av" style="background:var(--line)">—</span>'},
 gotx:d=>{ui.txf=d.k;ui.txq='';ui.txsrc='';go('transacoes')},
 mprev:()=>{ui.month=addMonths(ui.month,-1);ui.exp='';render()},mnext:()=>{ui.month=addMonths(ui.month,1);ui.exp='';render()},
 hide:()=>{hideVals=!hideVals;try{localStorage.setItem('fort.hide',hideVals?'1':'0')}catch(e){}render()},
 newtx:async d=>{if(!S.accounts.length&&!S.cards.length){fabMenu(false);const k=await choiceBox('Antes do primeiro lançamento','Para lançar uma despesa ou receita, o Fort precisa saber de onde sai (ou para onde vai) o dinheiro. Traga seus dados do Bolso ou cadastre uma conta.',[['bkp','Restaurar backup do Bolso','primary'],['acc','Cadastrar uma conta'],['card','Cadastrar um cartão de crédito']]);if(k==='bkp')go('importar-exportar');else if(k==='acc')formAccount();else if(k==='card')formCard();return}const p={};if(d.kind)p.kind=d.kind;if(d.card){p.src='c:'+d.card;p.kind='out'}openTx(null,p)},
 tx:d=>{const t=byId('tx',d.id);if(t)openTx(t)},
 paid:d=>{const t=byId('tx',d.id);if(t)put('tx',{...t,paid:!t.paid})},
 close:()=>closeModal(),
 txkind:d=>{syncDraft();draft.kind=d.k;draft.cat='';if(d.k==='transfer')draft.repeat='none';renderTx()},
 txcat:d=>{syncDraft();draft.cat=draft.cat===d.id?'':d.id;renderTx()},
 txtag:d=>{syncDraft();const i=draft.tags.indexOf(d.id);if(i>=0)draft.tags.splice(i,1);else draft.tags.push(d.id);renderTx()},
 txrep:d=>{syncDraft();draft.repeat=d.k;renderTx()},
 txpmode:d=>{syncDraft();draft.pmode=d.k;renderTx()},
 txsave:()=>saveTx(),txdel:()=>deleteTx(),
 fsave:async()=>{const f=curForm;if(!f)return;const vals={};for(const fd of f.fields){if(fd.type==='html')continue;vals[fd.k]=readField(fd);if(fd.req&&(vals[fd.k]===''||vals[fd.k]==null||(fd.type==='money'&&!(vals[fd.k]>0)))){toast('Preencha: '+fd.label);document.getElementById('f_'+fd.k)?.focus();return}}
  const r=await f.onSave(vals);if(r!==false)closeModal()},
 fdel:async()=>{const f=curForm;if(!f)return;if(!(await confirmBox(f.delMsg||'Excluir este item?','Excluir')))return;const r=await f.onDelete();if(r!==false)closeModal()},
 dlg:d=>{$('#dlg').innerHTML='';const r=dlgRes;dlgRes=null;r&&r(d.k||null)},
 newacc:()=>formAccount(),acc:d=>formAccount(byId('accounts',d.id)),
 newcard:()=>formCard(),editcard:d=>formCard(byId('cards',d.id)),
 card:d=>{ui.cardId=d.id;ui.cardInv='';go('cartao')},
 invprev:()=>{const c=byId('cards',ui.cardId);ui.cardInv=addMonths(ui.cardInv||currentInvOf(c),-1);render()},invnext:()=>{const c=byId('cards',ui.cardId);ui.cardInv=addMonths(ui.cardInv||currentInvOf(c),1);render()},
 payinv:()=>{const c=byId('cards',ui.cardId);const inv=ui.cardInv||currentInvOf(c);const iv=invoice(c,inv);openForm({title:'Pagar fatura de '+monthLabel(inv),values:{amount:iv.remaining,date:today(),accountId:c.payAccount||activeAccs()[0]?.id},fields:[{k:'amount',label:'Valor pago',type:'money',req:1,hint:'Pode ser parcial'},{k:'date',label:'Data do pagamento',type:'date',req:1},{k:'accountId',label:'Pago com a conta',type:'select',options:()=>accOptions()}],saveLabel:'Confirmar pagamento',
  onSave:v=>{if(!v.accountId){toast('Escolha a conta');return false}put('tx',{id:uid(),kind:'invpay',cardId:c.id,inv,accountId:v.accountId,amount:v.amount,date:v.date,purchaseDate:v.date,paid:true,desc:'Fatura '+c.name+' ('+monYr(inv)+')',tags:[]});toast('Pagamento registrado')}})},
 cattab:d=>{ui.catTab=d.k;render()},newcat:()=>formCat(),cat:d=>formCat(byId('categories',d.id)),
 seedcats:()=>{let n=0;for(const[kind,name,emoji,color]of DEF_CATS){if(S.categories.some(c=>c.kind===kind&&norm(c.name)===norm(name)))continue;put('categories',{id:uid(),kind,name,emoji,color});n++}toast(n?n+' categorias criadas':'Todas as categorias padrão já existem')},
 newtag:()=>formTag(),tag:d=>formTag(byId('tags',d.id)),
 newbud:()=>formBudget(),bud:d=>formBudget(byId('budgets',d.id)),
 newgoal:()=>formGoal(),goal:d=>formGoal(byId('goals',d.id)),
 goalmove:d=>{const g=byId('goals',d.id);const out=d.k==='out';openForm({title:out?'Retirar da '+g.name:'Guardar em '+g.name,values:{date:today()},fields:[{k:'amount',label:'Valor',type:'money',req:1,focus:1},{k:'date',label:'Data',type:'date'},{k:'note',label:'Observação',ph:'Opcional'}],onSave:v=>{put('goals',{...g,moves:[...(g.moves||[]),{amount:out?-v.amount:v.amount,date:v.date||today(),note:v.note}]});toast(out?'Retirada registrada':'Valor guardado')}})},
 newrec:()=>formRec(),rec:d=>formRec(byId('recurrences',d.id)),
 parctab:d=>{ui.parcTab=d.k;render()},
 newloan:d=>formLoan(null,d.k),loan:d=>formLoan(byId('loans',d.id)),
 newdebt:()=>formDebt(),debt:d=>formDebt(byId('debts',d.id)),
 debtpay:d=>{const db=byId('debts',d.id);const rem=r2(db.amount-sum(db.payments||[],p=>p.amount));openForm({title:'Recebimento de '+db.person,values:{amount:rem,date:today(),accountId:''},fields:[{k:'amount',label:'Valor recebido',type:'money',req:1},{k:'date',label:'Data',type:'date'},{k:'accountId',label:'Lançar como receita na conta',type:'select',options:()=>accOptions('Não lançar')}],
  onSave:v=>{put('debts',{...db,payments:[...(db.payments||[]),{amount:v.amount,date:v.date||today()}]});if(v.accountId){const cat=S.categories.find(c=>c.kind==='in'&&norm(c.name)==='reembolso');put('tx',{id:uid(),kind:'in',amount:v.amount,date:v.date||today(),purchaseDate:v.date||today(),accountId:v.accountId,categoryId:cat?.id||null,desc:'Recebido de '+db.person,tags:[],paid:true})}toast('Recebimento registrado')}})},
 exp:d=>{ui.exp=ui.exp===d.id?'':d.id;render()},
 ana:d=>{ui.ana=d.k;ui.exp='';render()},anak:d=>{ui.anaKind=d.k;ui.exp='';render()},
 txf:d=>{ui.txf=d.k;render()},
 adjust:()=>{openForm({title:'Ajustar saldo',intro:'<div class="muted" style="font-size:14px">Informe o saldo real da conta hoje. O app cria um lançamento de ajuste com a diferença.</div>',values:{accountId:activeAccs()[0]?.id},fields:[{k:'accountId',label:'Conta',type:'select',options:()=>accOptions()},{k:'real',label:'Saldo real hoje',type:'money',hint:'Use − para negativo'}],
  onSave:v=>{const a=byId('accounts',v.accountId);if(!a)return false;const diff=r2(v.real-accBalance(a,today(),false));if(Math.abs(diff)<0.005){toast('O saldo já está correto');return}put('tx',{id:uid(),kind:diff>0?'in':'out',amount:Math.abs(diff),date:today(),purchaseDate:today(),accountId:a.id,categoryId:null,desc:'Ajuste de saldo',tags:[],paid:true});toast('Saldo ajustado')}})},
 exportcsv:d=>{const list=d.scope==='month'?S.tx.filter(t=>ymOf(t.date)===ui.month):d.scope==='report'?(ui.rpItems||[]):S.tx;if(!list.length)return toast('Nada para exportar');offerFile(d.scope==='month'?`fort-${ui.month}.csv`:d.scope==='report'?'fort-relatorio.csv':'fort-transacoes.csv',txCSV(list))},
 backup:()=>{const o={app:'fort',version:1,exported:new Date().toISOString()};COLS.forEach(c=>o[c]=S[c]);offerFile(`fort-backup-${today()}.json`,JSON.stringify(o))},
 copyexp:async()=>{try{await navigator.clipboard.writeText($('#exptxt').value);toast('Copiado')}catch(e){$('#exptxt').select();toast('Selecione e copie (Ctrl+C)')}},
 doimport:()=>doImportRows(),
 chatq:d=>sendChat(d.q),chatclear:()=>{ui.chat=[];render()}
};
const CHG={
 txsrc:el=>{ui.txsrc=el.value;render()},
 txsrc2:()=>{syncDraft();renderTx()},
 txdate:el=>{syncDraft();if(!/^\d{4}-\d{2}-\d{2}$/.test(el.value)||el.value<'1990')return;draft.paid=el.value<=today();const p=$('#tx_paid');if(p)p.checked=draft.paid;
  const h=$('#tx_invhint');if(h&&draft.src.startsWith('c:')){const c=byId('cards',draft.src.slice(2));if(c)h.textContent='Entra na fatura de '+monthLabel(invoiceMonthFor(c,el.value))+(draft.repeat==='parcel'?' (1ª parcela)':'')}
  const fx=$('#tx_fixhint');if(fx)fx.textContent='Vai se repetir todo dia '+(+el.value.slice(8,10))+' e aparece em Recorrências.'},
 range:el=>{ui.range=+el.value;render()},
 rp:el=>{ui.rp[el.dataset.k]=el.value;if(el.dataset.k==='kind')ui.rp.cat='';render()},
 cmp:el=>{ui.cmp=el.value;render()},
 projvar:el=>{ui.projVar=el.checked;render()},
 hide:el=>{hideVals=el.checked;try{localStorage.setItem('fort.hide',hideVals?'1':'0')}catch(e){}render()},
 receipt:el=>readReceipt(el.files[0]),
 logo:el=>{const f=el.files[0];if(f)logoFromFile(f,el.dataset.id);el.value=''},
 impcsv:el=>{const f=el.files[0];if(!f)return;ui.impPdf=null;ui.impRaw=null;if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){el.value='';return handlePDF(f)}const r=new FileReader();r.onload=()=>{const buf=new Uint8Array(r.result);let s=new TextDecoder('utf-8').decode(buf);if(s.includes('\ufffd'))s=new TextDecoder('windows-1252').decode(buf);if(/<OFX>|OFXHEADER/i.test(s))handleOFX(s);else handleImport(s)};r.readAsArrayBuffer(f);el.value=''},
 restore:el=>{const f=el.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const o=JSON.parse(String(r.result));if(o.app!=='bolso'&&o.app!=='fort')throw 0;const n=COLS.reduce((s,c)=>s+(Array.isArray(o[c])?o[c].length:0),0);if(!(await confirmBox(`Restaurar ${n} itens do backup? Itens com o mesmo código serão substituídos.`,'Restaurar')))return;COLS.forEach(c=>(o[c]||[]).forEach(x=>x&&x.id&&put(c,x)));toast('Backup restaurado')}catch(e){toast('Arquivo de backup inválido')}};r.readAsText(f)}
};
const INP={
 txq:el=>{ui.txq=el.value;const l=$('#txlist');if(l)l.innerHTML=txListHtml()},
 txn:()=>{const before=+draft.paidN>0;syncDraft();if((+draft.paidN>0)!==before)return renderTx();const h=$('#parchint');if(h)h.textContent=parcHint(draft)}
};
document.addEventListener('click',e=>{const ov=e.target.closest('[data-ov]');if(ov&&e.target===ov){if(ov.dataset.ov==='modal')closeModal();else A.dlg({k:''});return}
 const el=e.target.closest('[data-act]');if(!el)return;if(el.dataset.act==='paid')e.stopPropagation();e.preventDefault();const f=A[el.dataset.act];if(f)f(el.dataset,el,e)});
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.chg;if(k&&CHG[k])CHG[k](e.target)});
document.addEventListener('paste',e=>{const id=e.target.dataset&&e.target.dataset.pastelogo;if(!id)return;e.preventDefault();const it=[...(e.clipboardData?.items||[])].find(i=>i.type.startsWith('image/'));if(it){logoFromFile(it.getAsFile(),id);e.target.value=''}else toast('Copie uma imagem antes de colar')});
document.addEventListener('input',e=>{if(e.target.dataset&&e.target.dataset.pastelogo){e.target.value='';return}const k=e.target.dataset&&e.target.dataset.inp;if(k&&INP[k])INP[k](e.target)});
document.addEventListener('submit',e=>{const f=e.target.dataset&&e.target.dataset.form;if(f==='chat'){e.preventDefault();const i=$('#chatin');const q=i.value;i.value='';sendChat(q)}else e.preventDefault()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('#dlg').innerHTML)A.dlg({k:''});else if($('#modal').innerHTML)closeModal()}
 if(e.key==='Enter'&&e.target.closest&&e.target.closest('.sheet')&&e.target.tagName==='INPUT'&&!$('#dlg').innerHTML){e.preventDefault();if(draft)saveTx();else if(curForm)A.fsave()}});
window.addEventListener('hashchange',onHash);
