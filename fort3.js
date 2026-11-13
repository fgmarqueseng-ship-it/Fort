"use strict";
/* =====================================================================
   Fort — pacote 3: lançamento rápido (frase ou voz), busca global,
   atalhos do ícone, avisos de gasto fora do normal, assinaturas,
   importação de fatura em PDF e resumo semanal.
   ===================================================================== */

const ICQ=ic('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>');

/* ---------------- lançamento rápido: entende uma frase ---------------- */
const QK_NUM={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,quinze:15,dezoito:18,vinte:20,vinte_e_quatro:24};
const QK_FILL=new Set(['gastei','gasto','gastamos','paguei','pagamos','pagar','paga','comprei','compramos','compra','comprar','despesa','recebi','recebemos','ganhei','ganhamos','entrou','entraram','caiu','receita','transferi','transferencia','passei','foi','foram','de','do','da','dos','das','no','na','nos','nas','num','numa','em','com','o','a','os','as','um','uma','pelo','pela','por','para','pra','pro','reais','real','r$','conto','contos','pila','cartao','credito','debito','conta','pix','via','e','hoje','ontem','anteontem','amanha','lancar','lanca','lance','anota','anotar','coloca','colocar','agora']);
const QK_KW={
 out:[['Alimentação','ifood|restaurante|lanche|lanchonete|almoco|almocei|jantar|jantei|janta|pizza|hamburguer|burger|padaria|cafe|acai|sorvete|comida|marmita|delivery|rappi|churrasco|sushi|bar'],
  ['Mercado','mercado|supermercado|feira|hortifruti|sacolao|atacadao|assai|carrefour|acougue|mercearia'],
  ['Transporte','uber|99|taxi|gasolina|combustivel|posto|etanol|alcool|estacionamento|pedagio|onibus|metro|passagem|mecanico|oficina|lavagem|lava jato'],
  ['Saúde','farmacia|remedio|medico|consulta|exame|dentista|hospital|drogaria|drogasil|raia|psicologo|terapia'],
  ['Moradia','aluguel|condominio|luz|energia|agua|gas|internet|iptu|faxina|diarista|reforma'],
  ['Lazer','cinema|show|viagem|passeio|teatro|ingresso|festa|parque|balada'],
  ['Assinaturas','netflix|spotify|prime|disney|hbo|max|youtube|assinatura|icloud|globoplay|deezer|chatgpt|claude|paramount'],
  ['Compras','roupa|sapato|tenis|loja|shopping|amazon|shopee|mercado livre|magalu|presente|shein'],
  ['Educação','curso|escola|faculdade|livro|mensalidade|apostila'],
  ['Pets','pet|racao|veterinario|petshop|cachorro|gato'],
  ['Serviços','barbeiro|cabelo|salao|manicure|lavanderia|conserto|celular|telefone'],
  ['Impostos e taxas','imposto|taxa|tarifa|iof|multa|ipva|darf']],
 in:[['Salário','salario|pagamento do mes|holerite|adiantamento'],['Freelance','freela|freelance|servico|projeto|bico'],['Rendimentos','rendimento|juros|dividendo|dividendos'],['Reembolso','reembolso|devolucao|estorno|ressarcimento']]};
const QK_IN=/\b(recebi|recebemos|ganhei|ganhamos|entrou|entraram|caiu|salario|receita|reembolso|vendi|rendimento|recebimento|freela)\b/;
const QK_TR=/\b(transferi|transferencia|transferir|passei)\b/;
const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function qkMoney(s){s=s.replace(/r\$/,'').trim();if(/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s))return parseFloat(s.replace(/\./g,'').replace(',','.'));if(/^\d+,\d{1,2}$/.test(s))return parseFloat(s.replace(',','.'));if(/^\d+\.\d{1,2}$/.test(s))return parseFloat(s);if(/^\d{1,3}(,\d{3})+$/.test(s))return parseFloat(s.replace(/,/g,''));return parseFloat(s)}
function parseQuick(text){
 const toks=String(text||'').trim().split(/\s+/).filter(Boolean);const nt=toks.map(t=>norm(t).replace(/^[,.;:!?()"']+|[,.;:!?()"']+$/g,''));
 const joined=nt.join(' ');const starts=[];let p=0;for(const t of nt){starts.push(p);p+=t.length+1}
 const used=new Array(toks.length).fill(false);
 const tokAt=i=>{let k=0;for(let j=0;j<starts.length;j++)if(starts[j]<=i)k=j;return k};
 function take(re,fn){const g=new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g');let m,hit=false;
  while((m=g.exec(joined))){if(!m[0].trim()){g.lastIndex++;continue}const a=tokAt(m.index),b=tokAt(m.index+m[0].length-1);let free=true;for(let k=a;k<=b;k++)if(used[k])free=false;if(!free)continue;
   if(fn(m)===false)continue;for(let k=a;k<=b;k++)used[k]=true;hit=true;if(!re.flags.includes('g'))break}return hit}
 const r={kind:'out',amount:0,desc:'',date:today(),src:'',to:'',cat:'',repeat:'none',n:2,hints:[]};
 // parcelas
 take(/\b(?:em|parcelad[oa] em)\s+(\d{1,3}|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|quinze|dezoito|vinte)\s*(?:x|vezes|parcelas)\b|\b(\d{1,3})\s*x\b/,m=>{const n=+(m[1]&&QK_NUM[m[1]]||m[1]||m[2]);if(!(n>=2&&n<=120))return false;r.repeat='parcel';r.n=n});
 // data
 const td=today();const shift=n=>{const d=new Date(td+'T12:00:00');d.setDate(d.getDate()+n);return ymd(d)};
 take(/\banteontem\b/,()=>{r.date=shift(-2)})||take(/\bontem\b/,()=>{r.date=shift(-1)})||take(/\bamanha\b/,()=>{r.date=shift(1)})||
 take(/\b(?:dia\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/,m=>{const d=+m[1],mo=+m[2];if(!(d>=1&&d<=31&&mo>=1&&mo<=12))return false;let y=m[3]?+m[3]:+td.slice(0,4);if(y<100)y+=2000;r.date=y+'-'+pad(mo)+'-'+pad(Math.min(d,lastDay(y+'-'+pad(mo))))})||
 take(/\bdia\s+(\d{1,2})\b/,m=>{const d=+m[1];if(!(d>=1&&d<=31))return false;r.date=dateIn(ymOf(td),d)})||
 take(/\b(?:na |no )?(segunda|terca|quarta|quinta|sexta|sabado|domingo)(?:[- ]feira)?\b/,m=>{const w=['domingo','segunda','terca','quarta','quinta','sexta','sabado'].indexOf(m[1]);const cur=dowOf(td);let back=(cur-w+7)%7;r.date=shift(-back)});
 take(/\bhoje\b/,()=>{});
 // valor
 const AM=/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(mil\b)?\s*(?:(reais|real|conto|contos|pila)\b)?(?:\s*e\s*(\d{1,2})\s*(?:centavos)?)?/;
 let best=null;{const g=new RegExp(AM.source,'g');let m;while((m=g.exec(joined))){if(!m[0].trim()){g.lastIndex++;continue}if(m.index>0&&/[a-z0-9]/.test(joined[m.index-1]))continue;const a=tokAt(m.index),b=tokAt(m.index+m[0].length-1);let free=true;for(let k=a;k<=b;k++)if(used[k])free=false;if(!free)continue;
  const score=(/r\$/.test(m[0])?2:0)+(m[3]?2:0)+(m[2]?1:0)+(/,\d/.test(m[1])?1:0);if(!best||score>best.score)best={m,a,b,score}}}
 if(!best&&/\bmil\s+reais\b/.test(joined))take(/\bmil\s+reais\b/,()=>{r.amount=1000});
 if(best){let v=qkMoney(best.m[1]);if(best.m[2])v*=1000;if(best.m[4]&&!/[.,]/.test(best.m[1]))v+=(+best.m[4])/100;if(v>0){r.amount=r2(v);for(let k=best.a;k<=best.b;k++)used[k]=true}}
 // tipo
 if(QK_IN.test(joined))r.kind='in';
 // conta ou cartão (pelo nome)
 const srcs=[...S.accounts.filter(a=>!a.archived).map(a=>({k:'a:'+a.id,name:a.name,acc:a})),...S.cards.map(c=>({k:'c:'+c.id,name:c.name,card:c}))];
 const found=[];
 for(const s of srcs.sort((a,b)=>norm(b.name).length-norm(a.name).length)){const n=norm(s.name).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();if(n.length<2)continue;
  take(new RegExp('\\b'+reEsc(n)+'\\b'),m=>{found.push({...s,at:m.index})})}
 found.sort((a,b)=>a.at-b.at);
 const wantsCard=/\b(cartao|credito)\b/.test(joined)&&!/\bdebito\b/.test(joined);
 if(QK_TR.test(joined)&&found.filter(f=>f.acc).length>=2){const accs=found.filter(f=>f.acc);r.kind='transfer';const toM=joined.match(/\b(?:para|pra|pro)\s+(?:a\s+|o\s+)?(\S+)/);
  let to=accs[1],from=accs[0];if(toM){const t2=accs.find(f=>norm(f.name).startsWith(toM[1]));if(t2){to=t2;from=accs.find(f=>f!==t2)}}r.src=from.k;r.to=to.k.slice(2)}
 else{let pick=null;if(r.kind==='out'&&wantsCard)pick=found.find(f=>f.card)||null;if(!pick)pick=found.find(f=>r.kind==='out'||f.acc)||null;
  if(pick)r.src=pick.k;else if(r.kind==='out'&&wantsCard&&S.cards.length){const last=[...S.tx].filter(t=>t.cardId&&t.kind==='out').sort((a,b)=>(b.purchaseDate||b.date).localeCompare(a.purchaseDate||a.date))[0];r.src='c:'+(last?.cardId||S.cards[0].id)}
  else{const a=S.accounts.find(a=>!a.archived&&a.type==='dinheiro');if(a)take(/\b(?:em |no )?dinheiro\b/,()=>{r.src='a:'+a.id})}}
 // descrição: o que sobrou, sem as palavras de ligação nas pontas
 let rest=toks.map((t,i)=>used[i]?null:{t:t.replace(/^[,.;:!?()"']+|[,.;:!?()"']+$/g,''),n:nt[i]});
 const seg=[];for(const x of rest){if(x){seg.push(x)}else if(seg.length&&seg[seg.length-1])seg.push(null)}
 const words=seg.filter(Boolean);while(words.length&&QK_FILL.has(words[0].n))words.shift();while(words.length&&QK_FILL.has(words[words.length-1].n))words.pop();
 let desc=words.filter(w=>w.n!=='r$').map(w=>w.t).join(' ').replace(/\s+/g,' ').trim();desc=desc?desc.charAt(0).toUpperCase()+desc.slice(1):'';r.desc=desc.slice(0,80);
 // categoria: regras > histórico > nome da categoria > palavras conhecidas
 const kind=r.kind;if(kind!=='transfer'){const kc=kind==='in'?'in':'out';const cats=S.categories.filter(c=>c.kind===kc);
  const hist=desc?histTx(desc,kind):null;
  r.cat=guessCat(desc,kind,joined,hist)||'';
  if(!r.src&&hist)r.src=srcKeyOf(hist,kind);
  if(!r.src)r.src=srcGuess(kind,r.cat)}
 if(!r.src){const a=activeAccs()[0];if(a)r.src='a:'+a.id}
 if(r.src.startsWith('c:')&&r.kind!=='out'){const a=activeAccs()[0];r.src=a?'a:'+a.id:''}
 return r}

// lançamento anterior com a mesma descrição (para repetir categoria e conta)
function histTx(desc,kind){const nd=norm(desc),sk=subKey(desc);if(!nd)return null;return [...S.tx].filter(t=>t.kind===kind&&t.desc&&(norm(t.desc)===nd||norm(t.desc).startsWith(nd+' ')||nd.startsWith(norm(t.desc)+' ')||(sk&&subKey(t.desc)===sk))).sort((a,b)=>(b.purchaseDate||b.date).localeCompare(a.purchaseDate||a.date))[0]||null}
// categoria provável: regras > lançamentos anteriores > nome da categoria no texto > palavras conhecidas
function guessCat(desc,kind,text,hist){if(kind==='transfer')return '';const kc=kind==='in'?'in':'out';const cats=S.categories.filter(c=>c.kind===kc);const t=' '+norm(text||desc||'')+' ';
 let cat=desc?ruleCat(desc,kind):'';if(cat)return cat;
 if(hist===undefined)hist=desc?histTx(desc,kind):null;if(hist?.categoryId&&byId('categories',hist.categoryId))return hist.categoryId;
 const c=cats.find(c=>{const n=norm(c.name);return n.length>2&&new RegExp('\\b'+reEsc(n)+'\\b').test(t)});if(c)return c.id;
 for(const[name,kw]of QK_KW[kc]){if(new RegExp('\\b('+kw+')\\b').test(t)){const c2=cats.find(c=>norm(c.name)===norm(name));if(c2)return c2.id}}
 return ''}
const srcKeyOf=(t,kind)=>t.cardId&&kind==='out'&&byId('cards',t.cardId)?'c:'+t.cardId:t.accountId&&byId('accounts',t.accountId)&&!byId('accounts',t.accountId).archived?'a:'+t.accountId:'';
// conta ou cartão mais usado nos últimos 90 dias (da mesma categoria, se houver)
function srcGuess(kind,cat){const td=today(),from=addMonthsDate(td,-3);const cnt=new Map();
 for(const t of S.tx){if(t.kind!==kind)continue;const d=t.purchaseDate||t.date;if(d<from||d>td)continue;if(cat&&t.categoryId!==cat)continue;const k=srcKeyOf(t,kind);if(k)cnt.set(k,(cnt.get(k)||0)+1)}
 const top=[...cnt.entries()].sort((a,b)=>b[1]-a[1])[0];if(top)return top[0];return cat?srcGuess(kind,''):''}

/* ---------------- lançamento rápido: tela ---------------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let qkRec=null;
const QK_EX=['gastei 45 no mercado','almoço 32,90 no cartão','uber 18 ontem','recebi 3500 de salário','tênis 600 em 3x no cartão','paguei a luz 231,77 dia 10'];
function openQuick(text=''){fabMenu(false);if(!S.accounts.length&&!S.cards.length)return A.newtx({});
 showModal(`<div class="sheet-hd"><h2>⚡ Lançamento rápido</h2><button class="icon-btn" data-act="close" aria-label="Fechar">${I.x}</button></div><div class="sheet-bd">
 <p class="muted" style="font-size:14px;margin:0">Escreva ou fale do jeito que você diria a alguém. O Fort entende o valor, a data, a conta ou cartão e a categoria.</p>
 <div class="qkbox"><input id="qk_in" data-inp="qk" autocomplete="off" placeholder="Ex.: gastei 45 no mercado no Nubank" value="${esc(text)}" autofocus>${SR?`<button class="qkmic" data-act="qkmic" aria-label="Falar">🎙️</button>`:''}</div>
 <div id="qk_pv" class="qkpv"></div>
 <div class="fl"><span>Exemplos</span><div class="chips">${QK_EX.map(e=>`<button class="chip" data-act="qkex" data-k="${esc(e)}">${esc(e)}</button>`).join('')}</div></div>
 ${SR?'':'<em class="muted" style="font-size:12.5px">Dica: no celular, use o microfone do teclado para ditar.</em>'}
 </div><div class="sheet-ft"><button class="btn" data-act="qkedit">Ajustar detalhes</button><span class="sp"></span><button class="btn primary" data-act="qksave">Salvar</button></div>`);
 qkUpdate()}
function qkPreset(r){return{kind:r.kind,amount:r.amount?fmtNum(r.amount):'',desc:r.desc,date:r.date,src:r.src,to:r.to,cat:r.cat,repeat:r.repeat,n:r.n,paid:r.date<=today()}}
function qkUpdate(){const el=$('#qk_pv');if(!el)return;const s=$('#qk_in')?.value||'';if(!s.trim()){el.innerHTML='';return}const r=parseQuick(s);ui.qk=r;
 const kl={out:['Despesa','neg'],in:['Receita','pos'],transfer:['Transferência','']}[r.kind];const c=byId('categories',r.cat);
 const src=r.src?(r.src.startsWith('c:')?'💳 '+(byId('cards',r.src.slice(2))?.name||''):(byId('accounts',r.src.slice(2))?.name||'')):'sem conta';
 const dl=r.date===today()?'hoje':brDate(r.date);
 el.innerHTML=`<span class="qkc ${kl[1]}">${kl[0]}</span><span class="qkc ${r.amount?'':'miss'}">${r.amount?moneyRaw(r.amount):'falta o valor'}</span>${r.repeat==='parcel'?`<span class="qkc">${r.n}× de ${moneyRaw(r.amount/r.n)}</span>`:''}${r.desc&&(!c||norm(r.desc)!==norm(c.name))?`<span class="qkc">“${esc(r.desc)}”</span>`:''}${r.kind!=='transfer'?`<span class="qkc ${c?'':'miss'}">${c?esc(c.emoji+' '+c.name):'sem categoria'}</span>`:''}<span class="qkc">${esc(src)}${r.kind==='transfer'?' → '+esc(byId('accounts',r.to)?.name||''):''}</span><span class="qkc">📅 ${dl}</span>`}
function qkMic(){if(!SR)return toast('Este navegador não aceita ditado. Use o microfone do teclado.');
 if(qkRec){try{qkRec.stop()}catch(e){}return}
 const rec=new SR();rec.lang='pt-BR';rec.interimResults=true;rec.maxAlternatives=1;rec.continuous=false;qkRec=rec;
 const b=$('.qkmic');if(b)b.classList.add('on');
 rec.onresult=e=>{let s='';for(const x of e.results)s+=x[0].transcript;const i=$('#qk_in');if(i){i.value=s;qkUpdate()}};
 rec.onerror=e=>{toast(e.error==='not-allowed'||e.error==='service-not-allowed'?'Permita o uso do microfone para este site':e.error==='no-speech'?'Não ouvi nada. Toque no microfone e fale.':'Não foi possível usar o microfone agora')};
 rec.onend=()=>{qkRec=null;const b=$('.qkmic');if(b)b.classList.remove('on')};
 try{rec.start()}catch(e){qkRec=null;toast('Não foi possível usar o microfone agora')}}
function qkGo(save){const s=$('#qk_in')?.value||'';if(!s.trim())return toast('Escreva o lançamento');const r=parseQuick(s);
 if(save&&!(r.amount>0))return toast('Não encontrei o valor. Ex.: "mercado 45,90"');if(qkRec)try{qkRec.stop()}catch(e){}
 openTx(null,qkPreset(r));if(save)saveTx()}

/* ---------------- busca global ---------------- */
function openSearch(q=''){fabMenu(false);showModal(`<div class="sheet-hd"><h2>🔍 Buscar</h2><button class="icon-btn" data-act="close" aria-label="Fechar">${I.x}</button></div><div class="sheet-bd">
 <div class="search" style="margin:0"><span>${I.search}</span><input id="gs_in" data-inp="gs" autocomplete="off" placeholder="Descrição, categoria, conta, valor ou data" value="${esc(q)}" autofocus></div>
 <div id="gs_out"></div></div>`);gsUpdate()}
function gsHay(t){const tags=(t.tags||[]).map(id=>byId('tags',id)?.name||'').join(' ');return norm([t.desc,t.note,catOf(t).name,srcName(t),tags,brDate(t.date),fmtNum(t.amount),String(t.amount)].join(' '))}
function gsUpdate(){const box=$('#gs_out');if(!box)return;const q=norm($('#gs_in')?.value||'');if(!q){box.innerHTML='<div class="muted" style="font-size:14px;padding:10px 2px">Procura em todos os meses: lançamentos, categorias, contas e telas do app.</div>';return}
 const terms=q.split(/\s+/).filter(Boolean);
 const pages=[['inicio','Início','🏠'],['transacoes','Transações','⇄'],['mais','Mais','•••'],...MORE.flatMap(([,it])=>it)].filter(([k,l])=>terms.every(w=>norm(l).includes(w))).slice(0,5);
 const td=today();const hits=S.tx.filter(t=>{const h=gsHay(t);return terms.every(w=>h.includes(w))});
 hits.sort((a,b)=>{const pa=a.date<=td,pb=b.date<=td;if(pa!==pb)return pa?-1:1;return pa?b.date.localeCompare(a.date):a.date.localeCompare(b.date)});
 const out=sum(hits.filter(t=>t.kind==='out'),t=>t.amount),inc=sum(hits.filter(t=>t.kind==='in'),t=>t.amount);
 box.innerHTML=(pages.length?`<div class="sec"><h2>Telas</h2></div><div class="list">${pages.map(([k,l,e])=>`<button class="row" data-act="gsgo" data-go="${k}">${ib(e,'#4fb3a9','sm')}<div class="t"><b>${esc(l)}</b></div><span class="mut">${I.right}</span></button>`).join('')}</div>`:'')+
  `<div class="sec"><h2>Lançamentos</h2><span class="muted" style="font-size:12.5px">${hits.length} encontrado${hits.length===1?'':'s'}${out?` · despesas ${money(out)}`:''}${inc?` · receitas ${money(inc)}`:''}</span></div>`+
  (hits.length?`<div class="list">${hits.slice(0,60).map(t=>txRow(t,{date:true,check:false}).replace('data-act="tx"','data-act="gstx"').replace(/<small>/,`<small>${t.date.slice(0,4)!==td.slice(0,4)?t.date.slice(0,4)+' · ':''}`)).join('')}</div>${hits.length>60?`<div class="muted" style="font-size:12.5px;margin-top:8px">Mostrando os 60 primeiros. Refine a busca para ver outros.</div>`:''}`:'<div class="empty">Nada encontrado.</div>')}

/* ---------------- atalhos do ícone (segurar o ícone do app) ---------------- */
function runLaunchAction(){const q=new URLSearchParams(location.search);const a=q.get('acao');if(!a)return;
 const clear=()=>{try{history.replaceState(null,'',location.pathname+location.hash)}catch(e){}};
 let tries=0;const t=setInterval(()=>{tries++;if(tries>80){clearInterval(t);clear();return}if(mode!=='db'||locked)return;clearInterval(t);clear();
  if(a==='despesa')A.newtx({kind:'out'});else if(a==='receita')A.newtx({kind:'in'});else if(a==='cartao')A.fabgo({k:'card'});else if(a==='rapido')openQuick();else if(a==='voz'){openQuick();setTimeout(qkMic,350)}else if(a==='buscar')openSearch();else if(a==='saldo')go('inicio')},250)}

/* ---------------- assinaturas e cobranças que se repetem ---------------- */
const SUB_SVC=/netflix|spotify|prime|amazon|disney|hbo|\bmax\b|globoplay|youtube|deezer|apple|icloud|google|microsoft|office|xbox|playstation|psn|chatgpt|openai|claude|anthropic|adobe|canva|academia|smart ?fit|gympass|wellhub|totalpass|uber one|clube|meli|paramount|crunchyroll|tidal|kindle|audible|dropbox|notion|vivo|claro|\btim\b|\boi\b|\bnet\b|sky|starlink|assinatura|streaming|tinder|duolingo|linkedin|strava/;
function subKey(desc){let s=norm(desc).replace(/\b\d{1,3}\s*\/\s*\d{1,3}\b/g,' ').replace(/\bparc(ela)?\b.*$/,'').replace(/[^a-z ]/g,' ').replace(/\b(pagamento|pagto|pag|compra|debito|credito|pix|ltda|me|sa|br|com|www|http|https|mensal|mensalidade|recorrente|deb|aut|automatico|parcela)\b/g,' ').replace(/\s+/g,' ').trim();return s.split(' ').filter(w=>w.length>1).slice(0,3).join(' ')}
let subCache={k:''};
function detectSubs(){const k=ver+'|'+today();if(subCache.k===k)return subCache.v;const td=today(),from=addMonths(ymOf(td),-12);const g=new Map();
 for(const t of S.tx){if(t.kind!=='out'||t.inst||t.loanId||!(t.amount>0))continue;const d=t.purchaseDate||t.date;if(d>td||ymOf(d)<from)continue;const key=subKey(t.desc||'');if(!key)continue;let o=g.get(key);if(!o){o={key,items:[]};g.set(key,o)}o.items.push({t,d})}
 const out=[];
 for(const o of g.values()){const byM=new Map();for(const x of o.items){const m=ymOf(x.d);const p=byM.get(m);if(!p||x.d>p.d)byM.set(m,x)}
  const ms=[...byM.keys()].sort();if(ms.length<3)continue;const recent=ms.filter(m=>m>=addMonths(ymOf(td),-6));if(recent.length<3)continue;
  const vals=ms.map(m=>byM.get(m).t.amount);const sorted=[...vals].sort((a,b)=>a-b);const med=sorted[Math.floor(sorted.length/2)];
  const near=vals.filter(v=>Math.abs(v-med)<=Math.max(1,med*.1)).length;if(near/vals.length<.75)continue;
  const perMonth=o.items.filter(x=>byM.has(ymOf(x.d))).length/ms.length;if(perMonth>1.3)continue;
  const lastM=ms[ms.length-1];const last=byM.get(lastM);if(dDiff(last.d,td)>62)continue;
  const prevM=ms[ms.length-2];const prev=byM.get(prevM);const t=last.t;const c=catOf(t);
  const svc=SUB_SVC.test(o.key)||/assinat|stream/.test(norm(c.name));
  out.push({key:o.key,name:t.desc||c.name,t,cat:c,src:srcName(t),value:t.amount,prev:prev.t.amount,prevDate:prev.d,last:last.d,months:ms.length,svc,up:t.amount>prev.t.amount*1.02&&t.amount-prev.t.amount>=1,down:t.amount<prev.t.amount*.98})}
 out.sort((a,b)=>b.value-a.value);subCache={k,v:out};return out}
V.assinaturas=()=>{const all=detectSubs();const ign=new Set(appCfg().subsIgnore||[]);const list=all.filter(s=>!ign.has(s.key));const hidden=all.filter(s=>ign.has(s.key));
 const svc=list.filter(s=>s.svc),oth=list.filter(s=>!s.svc);const tot=sum(list,s=>s.value),totS=sum(svc,s=>s.value);
 const row=s=>`<div class="row">${ib(s.cat.emoji,s.cat.color)}<div class="t"><b>${esc(s.name)}</b><small>${esc(s.cat.name)} · ${esc(s.src)} · última em ${fmtDay(s.last)}${s.up?` · <span class="neg">subiu de ${money(s.prev)}</span>`:s.down?` · <span class="pos">caiu de ${money(s.prev)}</span>`:''}</small></div><div class="amt"><b>${money(s.value)}</b><small>${money(s.value*12)}/ano</small></div><button class="icon-btn plain" style="width:32px;height:32px" data-act="subhide" data-k="${esc(s.key)}" title="Não é cobrança fixa" aria-label="Ignorar">${I.x}</button></div>`;
 return header('Assinaturas',{back:'mais'})+`<div class="banner info">O Fort encontra sozinho as cobranças que se repetem todo mês nos seus lançamentos (pelo menos 3 meses, com valor parecido) e avisa quando alguma sobe de preço.</div>
 <div class="grid2 mb"><div class="card center"><div class="lbl">Assinaturas e serviços</div><div style="font-size:22px;font-weight:800;margin-top:6px">${money(totS)}<small class="muted" style="font-size:13px"> /mês</small></div><div class="muted" style="font-size:13px">${money(totS*12)} por ano</div></div><div class="card center"><div class="lbl">Todas as cobranças fixas</div><div style="font-size:22px;font-weight:800;margin-top:6px">${money(tot)}<small class="muted" style="font-size:13px"> /mês</small></div><div class="muted" style="font-size:13px">${money(tot*12)} por ano</div></div></div>
 ${sec('Assinaturas e serviços')}<div class="list mb">${svc.map(row).join('')||'<div class="empty">Nenhuma assinatura encontrada ainda. Elas aparecem depois de 3 meses de lançamentos.</div>'}</div>
 ${oth.length?sec('Outras cobranças que se repetem')+`<div class="list mb">${oth.map(row).join('')}</div>`:''}
 ${hidden.length?sec('Ignoradas')+`<div class="list">${hidden.map(s=>`<div class="row" style="opacity:.6"><div class="t"><b>${esc(s.name)}</b><small>${money(s.value)}/mês</small></div><button class="btn sm" data-act="subshow" data-k="${esc(s.key)}">Voltar a mostrar</button></div>`).join('')}</div>`:''}`};

/* ---------------- avisos de gasto fora do normal ---------------- */
let insCache={k:''};
function insights(){const k=ver+'|'+today();if(insCache.k===k)return insCache.v;const cur=curYm(),td=today();const out=[];
 // 1) categoria acima da média dos últimos 3 meses
 const prevMs=range(addMonths(cur,-1),3).filter(m=>monthExp(m).length);
 if(prevMs.length>=2){const avg=new Map();for(const m of prevMs)for(const g of byCat(monthExp(m)))avg.set(g.id,(avg.get(g.id)||0)+g.total/prevMs.length);
  const now=byCat(monthExp(cur).filter(t=>t.cardId||t.date<=td));
  for(const g of now){const a=avg.get(g.id)||0;if(g.id==='_'||a<30)continue;const diff=g.total-a;if(g.total>a*1.25&&diff>=50)out.push({k:'cat:'+g.id,score:diff,ic:g.cat.emoji,txt:`<b>${esc(g.cat.name)}</b>: ${money(g.total)} este mês, ${Math.round((g.total/a-1)*100)}% acima da sua média (${money(a)})`,act:`data-act="inscat" data-id="${g.id}"`})}}
 // 2) conta que veio maior que o normal
 const seen=new Set();
 for(const t of S.tx){if(t.kind!=='out'||t.inst||t.cardId||!t.desc||ymOf(t.date)!==cur||t.date>td&&!t.paid)continue;const key=subKey(t.desc);if(!key||seen.has(key))continue;
  const prev=[];for(let i=1;i<=4;i++){const m=addMonths(cur,-i);const x=S.tx.find(o=>o.kind==='out'&&!o.cardId&&o.desc&&ymOf(o.date)===m&&subKey(o.desc)===key);if(x)prev.push(x.amount)}
  if(prev.length<2)continue;const a=sum(prev,v=>v)/prev.length;if(t.amount>a*1.2&&t.amount-a>=15){seen.add(key);out.push({k:'bill:'+key+':'+t.id,score:t.amount-a,ic:catOf(t).emoji,txt:`<b>${esc(t.desc)}</b> veio ${money(t.amount)}, ${Math.round((t.amount/a-1)*100)}% acima do normal (${money(a)})`,act:`data-act="tx" data-id="${t.id}"`})}}
 // 3) assinatura que subiu de preço (última cobrança nos últimos 40 dias)
 for(const s of detectSubs()){if(!s.up||dDiff(s.last,td)>40||seen.has(s.key))continue;if((appCfg().subsIgnore||[]).includes(s.key))continue;out.push({k:'sub:'+s.key+':'+s.last,score:(s.value-s.prev)*12,ic:s.cat.emoji||'📺',txt:`<b>${esc(s.name)}</b> subiu de ${money(s.prev)} para ${money(s.value)} (${money((s.value-s.prev)*12)} a mais por ano)`,act:'data-act="go" data-go="assinaturas"'})}
 out.sort((a,b)=>b.score-a.score);insCache={k,v:out};return out}
const insHidden=()=>{try{return JSON.parse(localStorage.getItem('fort.insHide')||'{}')}catch(e){return{}}};
function insightsCard(){if(ui.month!==curYm()||myPrefs().insights===false)return '';const h=insHidden();const list=insights().filter(x=>!h[x.k]).slice(0,4);if(!list.length)return '';
 return `<div class="card insc mb"><div class="dh"><b>💡 Fique de olho</b><a class="link" data-act="go" data-go="analise">Análise ›</a></div><div class="dlist">${list.map(x=>`<div class="irow"><button class="drow" ${x.act}><span class="iic">${x.ic}</span><span class="it">${x.txt}</span></button><button class="icon-btn plain ix" data-act="inshide" data-k="${esc(x.k)}" aria-label="Dispensar">${I.x}</button></div>`).join('')}</div></div>`}

/* ---------------- importar fatura ou extrato em PDF ---------------- */
let pdfLib=null;
function loadPdfLib(){if(pdfLib)return pdfLib;pdfLib=new Promise((res,rej)=>{if(window.pdfjsLib)return res(window.pdfjsLib);const s=document.createElement('script');s.src='vendor/pdfjs/pdf.min.js';s.onload=()=>{const L=window.pdfjsLib;if(!L)return rej(new Error('pdf.js'));L.GlobalWorkerOptions.workerSrc='vendor/pdfjs/pdf.worker.min.js';res(L)};s.onerror=()=>{pdfLib=null;rej(new Error('Não consegui carregar o leitor de PDF. Verifique a internet.'))};document.head.appendChild(s)});return pdfLib}
function askPdfPassword(wrong){return new Promise(res=>{dlgRes=k=>res(k==='ok'?($('#pdfpw')?.value||''):null);$('#dlg').innerHTML=`<div class="ov" data-ov="dlg" style="z-index:70;align-items:center;padding:20px"><div class="sheet" style="max-width:420px;border-radius:20px"><div class="sheet-hd"><h2>PDF protegido</h2></div><div class="sheet-bd"><p class="muted">${wrong?'Senha incorreta. Tente de novo.':'Este arquivo tem senha. Muitos bancos usam os primeiros dígitos do CPF.'}</p><label class="fl"><span>Senha do PDF</span><input id="pdfpw" type="password" autocomplete="off"></label><button class="btn primary" style="justify-content:center" data-act="dlg" data-k="ok">Abrir</button><button class="btn ghost" style="justify-content:center" data-act="dlg" data-k="">Cancelar</button></div></div></div>`;setTimeout(()=>$('#pdfpw')?.focus(),50)})}
async function handlePDF(file){const box=$('#impout');if(box)box.innerHTML='<div class="loading" style="min-height:90px"><div class="spin"></div>Lendo o PDF…</div>';
 try{const L=await loadPdfLib();const data=new Uint8Array(await file.arrayBuffer());
  const task=L.getDocument({data,isEvalSupported:false});
  task.onPassword=async(cb,reason)=>{const pw=await askPdfPassword(reason===2);if(pw==null){task.destroy();if(box)box.innerHTML='';return}cb(pw)};
  const doc=await task.promise;let lines=[];
  for(let i=1;i<=doc.numPages;i++){const pg=await doc.getPage(i);const tc=await pg.getTextContent();lines=lines.concat(PDFP.groupItems(tc.items))}
  const text=lines.join('\n');const due=PDFP.findDue(text);const r=PDFP.parseLines(lines,due||today());
  if(!r.rows.length){if(box)box.innerHTML=`<div class="banner">Não encontrei lançamentos neste PDF.${lines.length<3?' Ele parece ser uma imagem escaneada; nesse caso, peça ao banco o arquivo OFX ou o PDF original.':' Se puder, use o arquivo OFX do banco.'}</div>`;return}
  ui.impPdf={due,hasNeg:r.rows.some(x=>x.neg)};const out=r.rows.map(x=>({...x,categoryId:null,pdf:true}));importPreview(out,r.bad)}
 catch(e){if(e&&e.name==='PasswordException')return;console.warn(e);if(box)box.innerHTML=`<div class="banner">Não foi possível ler este PDF: ${esc(e.message||e)}</div>`}}
// fatura em que os lançamentos do PDF entram (cartão): a do vencimento encontrado no arquivo
function pdfInvFor(c){const p=ui.impPdf;if(p&&p.due)return ymOf(p.due);return currentInvOf(c)}

/* ---------------- resumo semanal (ajustes) ---------------- */
async function weeklyTest(){toast('Enviando o resumo da semana…');const{data:id,error}=await SB.rpc('fort_test_weekly');if(error){toast(/fort_test_weekly|function/.test(error.message)?'Falta rodar o código do resumo semanal no Supabase.':'Falhou: '+error.message);return}
 setTimeout(async()=>{const{data,error:e2}=await SB.rpc('fort_alert_result',{rid:id});if(e2||!data){toast('Enviado. Se não chegar em 1 minuto, me avise.');return}
  let j={};try{j=JSON.parse(data.content||'{}')}catch(x){}if(data.status_code===200&&j.sent>0)toast('Resumo enviado! Confira as notificações.');else if(data.status_code===200&&!j.sent)toast('Nenhum aparelho com o resumo ligado.');else if(data.status_code===404)toast('Falta criar a função fort-weekly no Supabase.');else toast('Erro no envio ('+(data.status_code||'?')+'): '+(j.error||(j.errors||[]).join(' ')||data.error_msg||'').slice(0,140))},6000)}
async function weeklySet(on){await savePrefs({alertWeekly:on});try{const reg=await navigator.serviceWorker.ready;const s=await reg.pushManager.getSubscription();if(s){const{error}=await SB.from('fort_push').update({weekly:on}).eq('endpoint',s.endpoint);if(error&&/weekly/.test(error.message))toast('Falta rodar o código do resumo semanal no Supabase.')}}catch(e){}}

/* ---------------- ações ---------------- */
Object.assign(A,{
 quick:()=>openQuick(),qkmic:()=>qkMic(),qkex:d=>{const i=$('#qk_in');if(i){i.value=d.k;qkUpdate();i.focus()}},qksave:()=>qkGo(true),qkedit:()=>qkGo(false),
 search:()=>openSearch(),gstx:d=>{const t=byId('tx',d.id);if(t)openTx(t)},gsgo:d=>{closeModal();go(d.go)},
 subhide:d=>{const l=new Set(appCfg().subsIgnore||[]);l.add(d.k);saveApp({subsIgnore:[...l]});toast('Não aparece mais aqui')},
 subshow:d=>{saveApp({subsIgnore:(appCfg().subsIgnore||[]).filter(k=>k!==d.k)})},
 inshide:d=>{const h=insHidden();h[d.k]=today();const keep={};for(const[k,v]of Object.entries(h))if(dDiff(v,today())<=70)keep[k]=v;try{localStorage.setItem('fort.insHide',JSON.stringify(keep))}catch(e){}render()},
 inscat:d=>{ui.ana='mes';ui.anaKind='out';ui.exp=d.id;go('analise')},
 impskip:d=>{const x=(ui.impRaw||[])[+d.i];if(x){x.skip=!x.skip;renderImport()}},
 impflip:d=>{const x=(ui.impRaw||[])[+d.i];if(x){x.kind=x.kind==='in'?'out':'in';x.kindSet=true;x.categoryId=null;renderImport()}},
 weeklytest:()=>weeklyTest()
});
Object.assign(INP,{qk:()=>qkUpdate(),gs:()=>gsUpdate()});
Object.assign(CHG,{pushweekly:el=>weeklySet(el.checked),insights:el=>savePrefs({insights:el.checked})});
document.addEventListener('keydown',e=>{
 if(e.key==='Enter'&&e.target&&e.target.id==='qk_in'){e.preventDefault();e.stopPropagation();qkGo(true);return}
 const typing=e.target&&(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable);
 if(!entered||locked)return;
 if((e.ctrlKey||e.metaKey)&&(e.key==='k'||e.key==='K')){e.preventDefault();openSearch();return}
 if(!typing&&!$('#modal').innerHTML&&e.key==='/'){e.preventDefault();openSearch()}},true);
runLaunchAction();
