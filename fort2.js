"use strict";
/* =====================================================================
   Fort — pacote 2: divisão do casal, regras, importação OFX, anexos,
   patrimônio, reserva, alertas de orçamento, relatório anual/IR,
   PIN/biometria, backups automáticos e tema claro.
   ===================================================================== */

/* ---------------- pessoas (para a divisão do casal) ---------------- */
function people(){const em=new Set();(ui.members||[]).forEach(m=>em.add(String(m.email).toLowerCase()));if(ME?.email)em.add(ME.email);
 S.tx.forEach(t=>{if(t.payer)em.add(String(t.payer).toLowerCase())});
 return [...em].map(e=>({email:e,name:personName(e)})).sort((a,b)=>a.email===ME?.email?-1:b.email===ME?.email?1:a.name.localeCompare(b.name))}
function personName(email){email=String(email||'').toLowerCase();const s=S.settings.find(x=>String(x.email||'').toLowerCase()===email&&x.name);if(s)return s.name.split(' ')[0];if(email===ME?.email&&myPrefs().name)return myPrefs().name.split(' ')[0];return email.split('@')[0]||'—'}

/* ---------------- lançamento: casal + anexos ---------------- */
function txCoupleHtml(d){const ps=people();if(ps.length<2&&!d.split)return `<label class="sw"><span>Despesa dividida com o casal <em style="display:block;font-size:12px;color:var(--faint);font-weight:500">Adicione a outra pessoa em Ajustes para dividir</em></span><input type="checkbox" id="tx_split" ${d.split?'checked':''}><i></i></label>`;
 return `<div class="couple"><label class="sw"><span>${d.kind==='in'?'Receita do casal':'Dividir meio a meio com o casal'}</span><input type="checkbox" id="tx_split" ${d.split?'checked':''}><i></i></label>
 <label class="fl"><span>${d.kind==='in'?'Quem recebeu':'Quem pagou'}</span><select id="tx_payer">${ps.map(p=>`<option value="${esc(p.email)}" ${(d.payer||ME?.email)===p.email?'selected':''}>${esc(p.name)}${p.email===ME?.email?' (você)':''}</option>`).join('')}</select></label></div>`}
function txAttachHtml(d){const a=d.attach||[];return `<div class="fl"><span>Comprovantes</span><div class="atts">${a.map((x,i)=>`<div class="att"><button class="link" data-act="attopen" data-k="${i}">📎 ${esc(x.name)}</button><button class="icon-btn plain" style="width:28px;height:28px" data-act="attdel" data-k="${i}" aria-label="Remover">${I.x}</button></div>`).join('')}
 <label class="btn sm" style="align-self:flex-start">${ui.attBusy?'Enviando…':'📎 Anexar foto ou PDF'}<input type="file" class="fileov" accept="image/*,application/pdf" data-chg="txfile"></label></div></div>`}
async function uploadAttach(file){if(!SB)return;if(file.size>9.5e6)return toast('Arquivo muito grande (máx. 10 MB)');syncDraft();ui.attBusy=true;renderTx();
 try{let blob=file,name=file.name||'comprovante',type=file.type||'application/octet-stream';
  if(/^image\//.test(type)&&!/gif/.test(type)){const u=await imgToDataUrl(file,1800,1800,.8,false);blob=await (await fetch(u)).blob();type=blob.type;name=name.replace(/\.[^.]+$/,'')+(type.includes('webp')?'.webp':'.jpg')}
  const path=`anexos/${curYm()}/${uid()}-${name.normalize('NFD').replace(/[^\w.\-]+/g,'_').slice(-60)}`;
  const{error}=await SB.storage.from('fort-files').upload(path,blob,{contentType:type,upsert:false});if(error)throw error;
  draft.attach=[...(draft.attach||[]),{path,name,type,size:blob.size}];toast('Comprovante anexado')}
 catch(e){console.warn(e);toast('Não foi possível anexar: '+(e.message||e))}finally{ui.attBusy=false;if(draft)renderTx()}}
async function openAttach(x){if(!x)return;const w=window.open('','_blank');const{data,error}=await SB.storage.from('fort-files').createSignedUrl(x.path,600);if(error||!data){if(w)w.close();return toast('Não consegui abrir o arquivo')}if(w)w.location=data.signedUrl;else location.href=data.signedUrl}

/* ---------------- regras automáticas de categoria ---------------- */
function ruleCat(desc,kind){const d=norm(desc);if(!d)return '';const rs=[...S.rules].filter(r=>r.text).sort((a,b)=>b.text.length-a.text.length);
 for(const r of rs){const c=byId('categories',r.categoryId);if(!c)continue;if(kind&&c.kind!==(kind==='in'?'in':'out'))continue;if(d.includes(norm(r.text)))return c.id}return ''}
V.regras=()=>{const rs=[...S.rules].sort((a,b)=>String(a.text).localeCompare(b.text));const semCat=S.tx.filter(t=>!t.categoryId&&(t.kind==='out'||t.kind==='in')&&ruleCat(t.desc,t.kind)).length;
 const sug=ruleSuggestions();
 return header('Regras automáticas',{back:'mais',actions:`<button class="btn primary" data-act="newrule">${I.plus} Nova regra</button>`})+`<div class="banner info">Quando a descrição de um lançamento contém o texto da regra, o Fort escolhe a categoria sozinho: ao salvar sem categoria e ao importar extratos.</div>
 ${semCat?`<div class="card mb sw"><span>${semCat} lançamento${semCat>1?'s':''} sem categoria combina${semCat>1?'m':''} com suas regras</span><button class="btn primary sm" data-act="applyrules">Aplicar agora</button></div>`:''}
 <div class="list mb">${rs.length?rs.map(r=>{const c=byId('categories',r.categoryId);return `<button class="row" data-act="rule" data-id="${r.id}">${ib(c?.emoji||'•',c?.color)}<div class="t"><b>contém “${esc(r.text)}”</b><small>→ ${esc(c?.name||'categoria removida')}</small></div><span class="mut">${I.right}</span></button>`}).join(''):'<div class="empty">Nenhuma regra ainda. Ex.: “ifood” → Alimentação, “uber” → Transporte.</div>'}</div>
 ${sug.length?sec('Sugestões')+`<div class="list">${sug.map(s=>{const c=byId('categories',s.cat);return `<div class="row">${ib(c.emoji,c.color,'sm')}<div class="t"><b>“${esc(s.text)}” → ${esc(c.name)}</b><small>${s.n} lançamentos parecidos</small></div><button class="btn sm" data-act="addsug" data-k="${esc(s.text)}" data-id="${s.cat}">Criar</button></div>`}).join('')}</div>`:''}`};
function ruleSuggestions(){const m=new Map();for(const t of S.tx){if(!t.categoryId||!t.desc||t.recurId||t.loanId)continue;const w=norm(t.desc).split(/[^a-z0-9]+/).filter(x=>x.length>=4)[0];if(!w)continue;const k=w+'|'+t.categoryId;m.set(k,(m.get(k)||0)+1)}
 return [...m.entries()].map(([k,n])=>{const[text,cat]=k.split('|');return{text,cat,n}}).filter(s=>s.n>=2&&byId('categories',s.cat)&&!S.rules.some(r=>norm(r.text)===s.text)).sort((a,b)=>b.n-a.n).slice(0,6)}
function formRule(r,preset={}){openForm({title:r?'Editar regra':'Nova regra',values:r||{kind:'out',...preset},
 fields:[{k:'text',label:'Se a descrição contém',req:1,focus:1,ph:'Ex.: ifood, uber, posto shell'},{k:'categoryId',label:'Usar a categoria',type:'select',req:1,options:()=>[{v:'',l:'Escolha'},...S.categories.slice().sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name)).map(c=>({v:c.id,l:(c.kind==='in'?'Receita · ':'')+c.name}))]}],
 onSave:v=>{if(!v.categoryId){toast('Escolha a categoria');return false}put('rules',{...(r||{id:uid()}),text:v.text.trim(),categoryId:v.categoryId});toast('Regra salva')},onDelete:r?()=>del('rules',r.id):null})}

/* ---------------- importação: OFX, regras e duplicados ---------------- */
function handleOFX(s){const out=[];let bad=0;const blocks=s.split(/<STMTTRN>/i).slice(1);
 for(const b0 of blocks){const b=b0.split(/<\/STMTTRN>/i)[0];const g=tag=>{const m=b.match(new RegExp('<'+tag+'>\\s*([^<\\r\\n]*)','i'));return m?m[1].trim():''};
  const d=g('DTPOSTED');const v=parseFloat(g('TRNAMT').replace(',','.'));if(!/^\d{8}/.test(d)||!v){bad++;continue}
  const date=d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6,8);const desc=(g('MEMO')||g('NAME')||'').replace(/\s+/g,' ').trim();
  out.push({date,desc,amount:r2(Math.abs(v)),kind:v<0?'out':'in',categoryId:null,fitid:g('FITID')})}
 if(!out.length){$('#impout').innerHTML='<div class="banner">Não encontrei lançamentos neste arquivo OFX.</div>';return}
 importPreview(out,bad)}
function isDup(x,src){const[st,id]=src.split(':');return S.tx.some(t=>(x.fitid&&t.fitid===x.fitid)||(t.kind===x.kind&&Math.abs(t.amount-x.amount)<.005&&(t.purchaseDate||t.date)===x.date&&(st==='c'?t.cardId===id:t.accountId===id)&&(!x.desc||!t.desc||norm(t.desc).slice(0,8)===norm(x.desc).slice(0,8))))}
function importPreview(out,bad){const src=$('#impacc')?.value||'';ui.impRaw=out;ui.impBad=bad;renderImport()}
function renderImport(){const out=ui.impRaw||[];const src=$('#impacc')?.value||'';const box=$('#impout');if(!box)return;const st=src.split(':')[0];
 const pdf=ui.impPdf;if(pdf)out.forEach(x=>{if(x.pdf&&!x.kindSet){const k=PDFP.kindFor(x,st,pdf.hasNeg);if(k!==x.kind){x.kind=k;x.categoryId=null}}});
 out.forEach(x=>{if(!x.categoryId)x.categoryId=(typeof guessCat==='function'?guessCat(x.desc,x.kind):ruleCat(x.desc,x.kind))||null;x.dup=src?isDup(x,src):false});
 const fresh=out.filter(x=>!x.dup&&!x.skip);importRows=fresh;const dups=out.filter(x=>x.dup).length;const skipped=out.filter(x=>!x.dup&&x.skip).length;const withCat=fresh.filter(x=>x.categoryId).length;
 const card=st==='c'?byId('cards',src.slice(2)):null;const inv=card&&pdf?($('#impinv')?.value||pdfInvFor(card)):'';
 box.innerHTML=out.length?`<div class="banner info">${out.length} lançamentos no arquivo${ui.impBad?` (${ui.impBad} linhas ignoradas)`:''}. <b>${fresh.length} para importar</b>${dups?`, ${dups} já existiam e serão pulados`:''}${skipped?`, ${skipped} desmarcados`:''}. ${withCat} já com categoria (pelas suas regras e lançamentos anteriores).</div>
 ${card&&pdf?`<label class="fl"><span>Entram na fatura de</span><input type="month" id="impinv" value="${esc(inv)}" data-chg="impinv"><em>Parcelas antigas e compras do mês ficam todas nesta fatura</em></label>`:''}
 <div class="muted" style="font-size:12.5px;margin:4px 0 6px">Toque no valor para trocar entre despesa e receita. Desmarque o que não quiser importar.</div>
 <div class="list mb impl">${out.map((x,i)=>{const c=byId('categories',x.categoryId);return `<div class="row" style="${x.dup||x.skip?'opacity:.45':''}">${x.dup?'<span class="check" style="visibility:hidden"></span>':`<span class="check ${x.skip?'':'on'}" data-act="impskip" data-i="${i}" title="Importar">${I.check}</span>`}<div class="t"><b>${esc(x.desc||'—')}</b><small>${brDate(x.date)} · ${x.dup?'já lançado':c?esc(c.name):'sem categoria'}</small></div><button class="link" style="font-weight:800;color:var(--${x.kind==='in'?'in':'out'})" data-act="impflip" data-i="${i}" ${x.dup?'disabled':''}>${x.kind==='in'?'+ ':'− '}${moneyRaw(x.amount)}</button></div>`}).join('')}</div>
 ${fresh.length?`<button class="btn primary" data-act="doimport">Importar ${fresh.length} lançamentos</button>`:'<div class="muted">Nada novo para importar.</div>'}`:'<div class="banner">Arquivo sem lançamentos válidos.</div>'}
async function doImportRows(){const src=$('#impacc')?.value;if(!src)return toast('Cadastre uma conta primeiro');if(!importRows?.length)return;const[st,id]=src.split(':');const nm=st==='c'?byId('cards',id)?.name:byId('accounts',id)?.name;
 const pinv=st==='c'&&ui.impPdf?($('#impinv')?.value||''):'';
 if(!(await confirmBox(`Importar ${importRows.length} lançamentos em ${nm}${pinv?' (fatura de '+monthLabel(pinv)+')':''}?`,'Importar')))return;
 importRows.forEach(x=>{const t={id:uid(),kind:x.kind,amount:x.amount,desc:x.desc,date:x.date,purchaseDate:x.date,categoryId:x.categoryId||null,tags:[],paid:true,note:'Importado',payer:ME?.email||''};if(x.fitid)t.fitid=x.fitid;
  if(st==='c'){const c=byId('cards',id);t.cardId=id;t.inv=/^\d{4}-\d{2}$/.test(pinv)?pinv:invoiceMonthFor(c,x.date);t.accountId=null}else t.accountId=id;put('tx',t)});
 toast(importRows.length+' lançamentos importados');importRows=null;ui.impRaw=null;ui.impPdf=null;$('#impout').innerHTML=''}

/* ---------------- divisão do casal ---------------- */
if(!ui.casalM)ui.casalM=curYm();
function coupleCalc(months){const ps=people();const N=Math.max(2,ps.length);const paid={},spent={};ps.forEach(p=>{paid[p.email]=0;spent[p.email]=0});
 const shared=S.tx.filter(t=>t.split&&t.kind==='out'&&months.some(m=>expInMonth(t,m)));const tot=sum(shared,t=>t.amount);
 shared.forEach(t=>{const e=(t.payer||ME?.email||'').toLowerCase();paid[e]=(paid[e]||0)+t.amount});
 const bal={};Object.keys(paid).forEach(e=>bal[e]=r2(paid[e]-tot/N));
 const st=S.settles.filter(s=>months.includes(ymOf(s.date)));st.forEach(s=>{const f=String(s.from).toLowerCase(),to=String(s.to).toLowerCase();bal[f]=r2((bal[f]||0)+s.amount);bal[to]=r2((bal[to]||0)-s.amount)});
 S.tx.filter(t=>t.kind==='out'&&months.some(m=>expInMonth(t,m))).forEach(t=>{const e=(t.payer||'').toLowerCase();if(e)spent[e]=(spent[e]||0)+t.amount});
 return{ps,shared,tot,paid,bal,st,spent,N}}
V.casal=()=>{const ym=ui.casalM;const months=ui.casalAll?[...new Set(S.tx.filter(t=>t.split).map(t=>t.cardId&&t.inv?t.inv:ymOf(t.date)).concat(S.settles.map(s=>ymOf(s.date))))]:[ym];const C=coupleCalc(months);
 const debt=Object.entries(C.bal).filter(([,v])=>v< -0.009).sort((a,b)=>a[1]-b[1]);const cred=Object.entries(C.bal).filter(([,v])=>v>0.009).sort((a,b)=>b[1]-a[1]);
 let msg;if(!C.shared.length&&!C.st.length)msg='<div class="muted">Nenhuma despesa dividida neste período.</div>';else if(!debt.length)msg='<div class="big pos" style="font-size:24px">Contas acertadas ✓</div>';
 else{const[de,dv]=debt[0];const[ce]=cred[0]||[];msg=`<div class="big" style="font-size:24px"><span class="neg">${esc(personName(de))}</span> deve <b>${money(-dv)}</b> a <span class="pos">${esc(personName(ce))}</span></div><button class="btn primary mt" data-act="settle" data-k="${esc(de)}" data-id="${esc(ce||'')}" data-v="${-dv}">Registrar acerto</button>`}
 return header('Divisão do casal',{back:'mais',actions:ui.casalAll?'':`<div class="mnav"><button class="icon-btn plain" data-act="casalprev">${I.left}</button><b>${monthLabel(ym)}</b><button class="icon-btn plain" data-act="casalnext">${I.right}</button></div>`})+
 `<div class="seg mb" style="max-width:420px"><button class="${ui.casalAll?'':'on'}" data-act="casalall" data-k="">Mês</button><button class="${ui.casalAll?'on':''}" data-act="casalall" data-k="1">Acumulado</button></div>
 <div class="card mb">${msg}<div class="muted mt" style="font-size:13px">Despesas marcadas como “dividir” são rateadas igualmente entre ${C.N} pessoas. Marque ao lançar, no campo “Dividir meio a meio com o casal”.</div></div>
 <div class="home"><div>${sec('Resumo')}<div class="card kcard"><div class="kgrid"><div><small>Despesas divididas</small><b>${money(C.tot)}</b><small>${C.shared.length} lançamentos</small></div>${C.ps.map(p=>`<div><small>${esc(p.name)} pagou</small><b>${money(C.paid[p.email]||0)}</b><small class="${(C.bal[p.email]||0)<0?'neg':'pos'}">saldo ${money(C.bal[p.email]||0)}</small></div>`).join('')}</div></div>
 ${sec('Gastos por pessoa')}<div class="list">${C.ps.map(p=>`<div class="row"><span class="me-av" style="width:34px;height:34px;font-size:13px">${esc(initials(p.name))}</span><div class="t"><b>${esc(p.name)}</b><small>despesas do mês pagas por ${esc(p.name)}</small></div><b>${money(C.spent[p.email]||0)}</b></div>`).join('')}</div>
 ${sec('Acertos','',`<button class="btn sm" data-act="settle">${I.plus} Novo acerto</button>`)}<div class="list">${C.st.length?C.st.sort((a,b)=>b.date.localeCompare(a.date)).map(s=>`<button class="row" data-act="settleedit" data-id="${s.id}">${ib('🤝','#e07a9b','sm')}<div class="t"><b>${esc(personName(s.from))} → ${esc(personName(s.to))}</b><small>${brDate(s.date)}${s.note?' · '+esc(s.note):''}</small></div><b>${money(s.amount)}</b></button>`).join(''):'<div class="empty">Nenhum acerto registrado.</div>'}</div></div>
 <div>${sec('Despesas divididas')}<div class="list">${C.shared.length?C.shared.sort((a,b)=>b.date.localeCompare(a.date)).map(t=>txRow(t,{date:true,check:false}).replace('</small></div>',` · pagou ${esc(personName(t.payer||ME?.email))}</small></div>`)).join(''):'<div class="empty">Nada por aqui.</div>'}</div></div></div>`};
function formSettle(s,preset={}){const ps=people();const opts=ps.map(p=>({v:p.email,l:p.name}));
 openForm({title:s?'Editar acerto':'Registrar acerto',values:s||{date:today(),from:preset.from||ps[1]?.email||'',to:preset.to||ps[0]?.email||'',amount:preset.amount||''},
  fields:[{k:'from',label:'Quem pagou o acerto',type:'select',options:opts},{k:'to',label:'Para quem',type:'select',options:opts},{k:'amount',label:'Valor',type:'money',req:1},{k:'date',label:'Data',type:'date',req:1},{k:'note',label:'Observação',ph:'Ex.: Pix'}],
  onSave:v=>{if(v.from===v.to){toast('Escolha pessoas diferentes');return false}put('settles',{...(s||{id:uid()}),...v});toast('Acerto registrado')},onDelete:s?()=>del('settles',s.id):null})}

/* ---------------- patrimônio (bens e dívidas) ---------------- */
const ASSET_T=[{v:'imovel',l:'Imóvel',e:'🏠',k:'asset'},{v:'veiculo',l:'Veículo',e:'🚗',k:'asset'},{v:'bem',l:'Outro bem',e:'💎',k:'asset'},{v:'divida',l:'Dívida / financiamento (fora do app)',e:'🧾',k:'debt'},{v:'emprestimo',l:'Empréstimo pessoal',e:'🤝',k:'debt'}];
const assetT=v=>ASSET_T.find(x=>x.v===v)||ASSET_T[2];
function assetValAt(a,ym){const h=[...(a.hist||[])].filter(x=>x.ym<=ym).sort((x,y)=>x.ym<y.ym?-1:1);if(h.length)return +h[h.length-1].value||0;return ymOf(a.date||today())<=ym?(+a.value||0):0}
function loanRemainingAt(l,ym){const n=+l.n||0;if(!l.first)return 0;const k=Math.max(+l.paidBefore||0,Math.min(n,mdiff(ymOf(l.first),ym)+1));const paidTx=S.tx.filter(t=>t.loanId===l.id&&t.paid&&ymOf(t.date)<=ym).length;const done=Math.min(n,Math.max(k,(+l.paidBefore||0)+paidTx));return loanSaldo(l,done)}
function netWorthAt(ym){const accs=totalBalance(ym,false);const inv=portfolioAt(ym).bal;const assets=sum(S.assets.filter(a=>assetT(a.type).k==='asset'),a=>assetValAt(a,ym));
 const debts=sum(S.assets.filter(a=>assetT(a.type).k==='debt'),a=>assetValAt(a,ym));const loans=sum(S.loans,l=>loanRemainingAt(l,ym));const cards=ym===curYm()?sum(S.cards,c=>Math.max(0,invoice(c,ym).remaining)+Math.max(0,invoice(c,addMonths(ym,1)).remaining)):0;
 return{accs,inv,assets,debts,loans,cards,ativo:r2(Math.max(0,accs)+inv+assets),passivo:r2(debts+loans+cards+Math.max(0,-accs)),net:r2(accs+inv+assets-debts-loans-cards)}}
V.patrimonio=()=>{const cur=curYm();const W=netWorthAt(cur);const ms=[];for(let k=-11;k<=0;k++)ms.push(addMonths(cur,k));const hist=ms.map(m=>netWorthAt(m));
 const chart=multiLine([{name:'Patrimônio líquido',color:'#3ccf91',v:hist.map(h=>h.net),fill:true},{name:'Ativos',color:'#5aa9ff',v:hist.map(h=>h.ativo),w:2},{name:'Dívidas',color:'#f37a72',v:hist.map(h=>h.passivo),w:2}],ms.map(m=>monShort(m)),{maxLabels:6});
 const A=S.assets.filter(a=>assetT(a.type).k==='asset'),D=S.assets.filter(a=>assetT(a.type).k==='debt');
 const row=a=>`<button class="row" data-act="asset" data-id="${a.id}">${ib(assetT(a.type).e,assetT(a.type).k==='debt'?'#f37a72':'#5aa9ff')}<div class="t"><b>${esc(a.name)}</b><small>${esc(assetT(a.type).l)}${a.hist?.length?' · atualizado em '+monYr([...a.hist].sort((x,y)=>x.ym<y.ym?1:-1)[0].ym):''}</small></div><b class="${assetT(a.type).k==='debt'?'neg':''}">${money(assetValAt(a,cur))}</b></button>`;
 return header('Patrimônio',{back:'mais',actions:`<button class="btn primary" data-act="newasset">${I.plus} Bem ou dívida</button>`})+
 `<div class="card mb kcard"><div class="kgrid"><div><small>Patrimônio líquido</small><b class="big2 ${W.net<0?'neg':'pos'}">${money(W.net)}</b><small>tudo o que tem − tudo o que deve</small></div><div><small>Ativos</small><b>${money(W.ativo)}</b></div><div><small>Dívidas</small><b class="neg">${money(W.passivo)}</b></div></div></div>
 <div class="card mb">${chart}</div>
 <div class="home"><div>${sec('O que você tem')}<div class="list"><div class="row">${ib('👛','#4fb3a9','sm')}<div class="t"><b>Contas</b><small>${activeAccs().length} contas</small></div><b class="${W.accs<0?'neg':''}">${money(W.accs)}</b></div><button class="row" data-act="go" data-go="investimentos">${ib('📈','#3ccf91','sm')}<div class="t"><b>Investimentos</b><small>${activeInvs().length} investimentos</small></div><b>${money(W.inv)}</b></button>${A.map(row).join('')}</div>
 ${A.length?'':'<div class="muted mt" style="font-size:13px">Cadastre imóvel, carro e outros bens para o patrimônio ficar completo.</div>'}</div>
 <div>${sec('O que você deve')}<div class="list">${S.loans.map(l=>`<button class="row" data-act="loan" data-id="${l.id}">${ib('🏦','#efb34d','sm')}<div class="t"><b>${esc(l.name)}</b><small>financiamento/empréstimo do app</small></div><b class="neg">${money(loanRemainingAt(l,cur))}</b></button>`).join('')}${W.cards>0?`<button class="row" data-act="go" data-go="cartoes">${ib('💳','#efb34d','sm')}<div class="t"><b>Faturas de cartão em aberto</b><small>este mês e o próximo</small></div><b class="neg">${money(W.cards)}</b></button>`:''}${D.map(row).join('')}${!S.loans.length&&!D.length&&!(W.cards>0)?'<div class="empty">Nenhuma dívida 🎉</div>':''}</div></div></div>`};
function formAsset(a){const isNew=!a;openForm({title:isNew?'Novo bem ou dívida':'Editar',values:a||{type:'imovel',date:today()},
 fields:[{k:'name',label:'Nome',req:1,focus:isNew,ph:'Ex.: Apartamento, Carro, Empréstimo do banco'},{k:'type',label:'Tipo',type:'select',options:ASSET_T.map(x=>({v:x.v,l:x.e+' '+x.l}))},{k:'value',label:isNew?'Valor atual (ou saldo devedor)':'Valor inicial',type:'money',req:1},{k:'date',label:'Desde quando',type:'date'},
  ...(isNew?[]:[{k:'newval',label:'Atualizar valor de hoje (opcional)',type:'money',hint:'Guarda o histórico da valorização ou do saldo devedor'}]),{k:'note',label:'Observações',type:'textarea'}],
 onSave:v=>{const o={...(a||{id:uid(),hist:[]}),name:v.name,type:v.type,value:v.value,date:v.date||today(),note:v.note};if(v.newval>0){o.hist=[...(o.hist||[]).filter(h=>h.ym!==curYm()),{ym:curYm(),value:v.newval}]}put('assets',o);toast('Salvo')},onDelete:a?()=>del('assets',a.id):null})}

/* ---------------- reserva de emergência ---------------- */
function avgExpenses(){const cur=curYm();const ms=range(addMonths(cur,-1),6).filter(m=>monthSummary(m).exp>0);if(ms.length)return r2(sum(ms,m=>monthSummary(m).exp)/ms.length);const e=monthSummary(cur).exp;if(e>0)return e;return r2(sum(S.recurrences.filter(r=>r.active!==false&&r.kind==='out'),r=>r.amount))}
const resCfg=()=>({months:6,ids:[],monthly:0,...(appCfg().reserve||{})});
function reserveNow(){const c=resCfg();return r2(sum(c.ids,k=>{const[t,id]=k.split(':');if(t==='a'){const a=byId('accounts',id);return a?accBalance(a,today(),false):0}const i=byId('investments',id);return i?invAt(i,curYm()).bal:0}))}
V.reserva=()=>{const c=resCfg(),avg=avgExpenses(),now=reserveNow(),goal=r2(avg*c.months),cov=avg>0?now/avg:0,miss=Math.max(0,r2(goal-now)),p=goal?Math.min(1,now/goal):0;const mon=+c.monthly||0;const eta=mon>0&&miss>0?Math.ceil(miss/mon):0;
 return header('Reserva de emergência',{back:'mais',actions:`<button class="btn" data-act="rescfg">Configurar</button>`})+
 `<div class="card mb"><div class="sw"><div><small class="muted">Sua reserva hoje</small><div class="big ${p>=1?'pos':''}" style="font-size:30px">${money(now)}</div><small class="muted">cobre <b style="color:var(--text)">${cov.toFixed(1).replace('.',',')} meses</b> dos seus gastos</small></div><div style="text-align:right"><small class="muted">Meta (${c.months} meses)</small><div style="font-size:20px;font-weight:800">${money(goal)}</div></div></div>
 <div class="bar" style="height:12px;margin-top:14px;--c:${p>=1?'var(--in)':p>=.5?'var(--warn)':'var(--out)'}"><i style="width:${p*100}%"></i></div>
 <div class="muted mt" style="font-size:13.5px">${p>=1?'Meta atingida! Parabéns 🎉':`Faltam <b style="color:var(--text)">${money(miss)}</b>.${eta?` Guardando ${money(mon)} por mês, você chega lá em <b style="color:var(--text)">${eta} ${eta>1?'meses':'mês'}</b> (${monthLabel(addMonths(curYm(),eta))}).`:' Defina quanto quer guardar por mês em Configurar.'}`}</div></div>
 <div class="home"><div>${sec('Como o Fort calcula')}<div class="card" style="font-size:14px;line-height:1.6"><div class="sw"><span>Gasto médio mensal</span><b>${money(avg)}</b></div><div class="muted" style="font-size:12.5px">Média dos últimos meses com despesas (até 6).</div><div class="sw mt"><span>Meses de proteção desejados</span><b>${c.months}</b></div><div class="muted" style="font-size:12.5px">O recomendado é de 6 meses (CLT) a 12 meses (autônomo).</div></div></div>
 <div>${sec('O que conta como reserva')}<div class="list">${c.ids.length?c.ids.map(k=>{const[t,id]=k.split(':');const o=t==='a'?byId('accounts',id):byId('investments',id);if(!o)return '';return `<div class="row">${ib(t==='a'?'👛':'📈',o.color||'#3ccf91','sm')}<div class="t"><b>${esc(o.name)}</b><small>${t==='a'?'conta':'investimento'}</small></div><b>${money(t==='a'?accBalance(o,today(),false):invAt(o,curYm()).bal)}</b></div>`}).join(''):`<div class="empty">Escolha as contas e investimentos que formam sua reserva (ex.: Tesouro Selic, caixinha, poupança).<br><button class="btn primary sm mt" data-act="rescfg">Escolher</button></div>`}</div></div></div>`};
function formReserve(){const c=resCfg();const opts=[...activeAccs().map(a=>['a:'+a.id,'👛 '+a.name]),...activeInvs().map(i=>['i:'+i.id,'📈 '+i.name])];
 openForm({title:'Configurar reserva',values:{months:c.months,monthly:c.monthly||''},fields:[{k:'months',label:'Meses de gastos que quer ter guardados',type:'number',min:1,max:36},{k:'monthly',label:'Quanto pretende guardar por mês',type:'money'},
  {k:'h',type:'html',html:`<div class="fl"><span>Contas e investimentos da reserva</span>${opts.map(([v,l])=>`<label class="sw" style="padding:6px 0"><span>${esc(l)}</span><input type="checkbox" class="resid" value="${v}" ${c.ids.includes(v)?'checked':''}><i></i></label>`).join('')||'<em>Cadastre contas ou investimentos primeiro.</em>'}</div>`}],
  onSave:v=>{const ids=[...document.querySelectorAll('.resid:checked')].map(x=>x.value);saveApp({reserve:{months:Math.max(1,+v.months||6),monthly:v.monthly||0,ids}});toast('Reserva configurada')}})}

/* ---------------- orçamento: alertas no app ---------------- */
function budgetAlerts(){const ym=curYm();const ex=byCat(monthExp(ym));return S.budgets.map(b=>{const c=byId('categories',b.categoryId);if(!c||!(+b.amount>0))return null;const sp=ex.find(x=>x.id===b.categoryId)?.total||0;return{c,sp,b,p:sp/b.amount}}).filter(x=>x&&x.p>=.8).sort((a,b)=>b.p-a.p)}
function budgetCard(){const al=budgetAlerts();if(!al.length)return '';return `<div class="card mb budc"><div class="dh"><b>📊 Orçamento ${al.some(a=>a.p>=1)?'estourado':'quase no limite'}</b><a class="link" data-act="go" data-go="orcamento">Ver ›</a></div>${al.slice(0,4).map(a=>`<div class="drow" style="cursor:default"><span class="pill ${a.p>=1?'bad':'w'}">${Math.round(a.p*100)}%</span><span class="dn">${esc(a.c.emoji)} ${esc(a.c.name)}</span><b>${money(a.sp)} <small class="muted">de ${money(a.b.amount)}</small></b></div>`).join('')}</div>`}

/* ---------------- relatório anual e de IR ---------------- */
const isDeduct=c=>c&&(c.deduct===true||(c.deduct==null&&/saude|educa|medic|dentis|escola|faculdade|plano de saude/.test(norm(c.name))));
function pdfAnnual(year){year=String(year||curYm().slice(0,4));const ms=[];for(let m=1;m<=12;m++)ms.push(year+'-'+pad(m));const dec=year+'-12',prevDec=(+year-1)+'-12';
 const sumM=ms.map(m=>({m,...monthSummary(m)}));const inc=sum(sumM,x=>x.inc),exp=sum(sumM,x=>x.exp);
 const exT=ms.flatMap(m=>monthExp(m)),inT=ms.flatMap(m=>monthInc(m));const exC=byCat(exT),inC=byCat(inT);
 const ded=exT.filter(t=>isDeduct(byId('categories',t.categoryId))).sort((a,b)=>a.date.localeCompare(b.date));const dedC=byCat(ded);
 const endD=year+'-12-31',endP=(+year-1)+'-12-31';const invs=S.investments.filter(i=>ymOf(i.start||today())<=dec);
 const invRow=i=>{const a=ymOf(i.start)<=prevDec?invAt(i,prevDec):{bal:0,contrib:0};const b=invAt(i,dec);const ap=r2(b.contrib-a.contrib),gain=r2(b.bal-a.bal-ap);return{i,a,b,ap,gain}};const IR=invs.map(invRow);
 const isent=IR.filter(x=>x.i.tax==='isento'),excl=IR.filter(x=>x.i.tax==='regressivo'||x.i.tax==='15'),other=IR.filter(x=>x.i.tax==='nenhum'||!x.i.tax);
 const sec2=(title,rows)=>rows.length?`<h4>${title}</h4>`+ptable(['Investimento','Instituição','Saldo 31/12/'+(+year-1),'Saldo 31/12/'+year,'Aportes no ano','Rendimento no ano'],rows.map(x=>`<tr><td>${esc(x.i.name)}</td><td>${esc(x.i.institution||'')}</td><td class="r">${pm$(x.a.bal)}</td><td class="r">${pm$(x.b.bal)}</td><td class="r">${pm$(x.ap)}</td><td class="r">${pm$(x.gain)}</td></tr>`),`<tr><td colspan="5">Total</td><td class="r">${pm$(sum(rows,x=>x.gain))}</td></tr>`):'';
 printDoc('Relatório anual e Imposto de Renda',`Ano de ${year}`,
  pkpis([['Receitas no ano',pm$(inc),'pos'],['Despesas no ano',pm$(exp),'neg'],['Resultado',pm$(inc-exp),inc-exp<0?'neg':'pos'],['Despesas dedutíveis',pm$(sum(ded,t=>t.amount))],['Investido em 31/12',pm$(sum(IR,x=>x.b.bal))],['Patrimônio líquido 31/12',pm$(netWorthAt(dec).net)]])+
  `<h3>Mês a mês</h3>`+ptable(['Mês','Receitas','Despesas','Resultado'],sumM.map(x=>`<tr><td>${monthLabel(x.m)}</td><td class="r pos">${pm$(x.inc)}</td><td class="r neg">${pm$(x.exp)}</td><td class="r">${pm$(x.bal)}</td></tr>`),`<tr><td>Total</td><td class="r">${pm$(inc)}</td><td class="r">${pm$(exp)}</td><td class="r">${pm$(inc-exp)}</td></tr>`)+
  `<h3>Receitas por categoria</h3>`+ptable(['Categoria','Valor'],inC.map(g=>`<tr><td>${esc(g.cat.name)}</td><td class="r">${pm$(g.total)}</td></tr>`))+
  `<h3>Despesas por categoria</h3>`+ptable(['Categoria','Valor','%'],exC.map(g=>`<tr><td>${esc(g.cat.name)}</td><td class="r">${pm$(g.total)}</td><td class="r">${exp?(g.total/exp*100).toFixed(1).replace('.',','):0}%</td></tr>`))+
  `<h3>Imposto de Renda · Despesas dedutíveis (saúde, educação…)</h3>`+(ded.length?ptable(['Categoria','Total'],dedC.map(g=>`<tr><td>${esc(g.cat.name)}</td><td class="r">${pm$(g.total)}</td></tr>`))+ptable(['Data','Descrição','Categoria','Valor'],ded.map(t=>`<tr><td>${brDate(t.date)}</td><td>${esc(txTitle(t))}${(t.attach||[]).length?' 📎':''}</td><td>${esc(catOf(t).name)}</td><td class="r">${pm$(t.amount)}</td></tr>`),`<tr><td colspan="3">Total</td><td class="r">${pm$(sum(ded,t=>t.amount))}</td></tr>`):'<p class="mut">Nenhuma despesa em categoria dedutível. Marque “Dedutível no IR” nas categorias de saúde e educação.</p>')+
  `<h3>Imposto de Renda · Bens e direitos (saldos)</h3>`+ptable(['Conta','Tipo','Saldo 31/12/'+(+year-1),'Saldo 31/12/'+year],S.accounts.map(a=>`<tr><td>${esc(a.name)}</td><td>${esc(ACC_TYPES.find(x=>x.v===a.type)?.l||'')}</td><td class="r">${pm$(accBalance(a,endP,false))}</td><td class="r">${pm$(accBalance(a,endD,false))}</td></tr>`))+
  (S.assets.length?ptable(['Bem / dívida','Tipo','31/12/'+(+year-1),'31/12/'+year],S.assets.map(a=>`<tr><td>${esc(a.name)}</td><td>${esc(assetT(a.type).l)}</td><td class="r">${pm$(assetValAt(a,prevDec))}</td><td class="r">${pm$(assetValAt(a,dec))}</td></tr>`)):'')+
  (IR.length?`<h3>Imposto de Renda · Investimentos</h3>`+sec2('Rendimentos isentos (LCI, LCA, poupança, FII…)',isent)+sec2('Tributação exclusiva na fonte (CDB, Tesouro…)',excl)+sec2('Outros (ações, cripto, previdência…)',other):'')+
  `<p class="mut">Documento de apoio gerado pelo Fort a partir dos seus lançamentos. Os saldos de investimentos são os informados ou estimados pelas taxas. Para a declaração, confira com os informes de rendimentos oficiais dos bancos e corretoras.</p>`)}

/* ---------------- bloqueio por PIN / digital ---------------- */
const LOCK_KEY='fort.lock';
const lockCfg=()=>{try{return JSON.parse(localStorage.getItem(LOCK_KEY)||'null')}catch(e){return null}};
async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
let locked=false,lockBuf='',lockHidden=0;
function showLock(){const c=lockCfg();if(!c)return;locked=true;lockBuf='';renderLock();if(c.bio)setTimeout(()=>bioUnlock(true),350)}
function renderLock(msg){let el=$('#lock');if(!el){el=document.createElement('div');el.id='lock';document.body.appendChild(el)}const c=lockCfg()||{};
 el.innerHTML=`<div class="lockbox"><span class="fortlogo" style="width:58px;height:58px">${fortSvg()}</span><b>Fort bloqueado</b><small>${msg?esc(msg):'Digite seu PIN'}</small><div class="pindots">${Array.from({length:c.len||4},(_,i)=>`<i class="${i<lockBuf.length?'on':''}"></i>`).join('')}</div>
 <div class="keypad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-lk="${n}">${n}</button>`).join('')}<button data-lk="bio" ${c.bio?'':'style="visibility:hidden"'} aria-label="Digital">👆</button><button data-lk="0">0</button><button data-lk="del" aria-label="Apagar">⌫</button></div>
 <button class="link" data-lk="forgot" style="margin-top:14px">Esqueci o PIN</button></div>`}
async function lockKey(k){const c=lockCfg();if(!c)return hideLock();if(k==='del'){lockBuf=lockBuf.slice(0,-1);return renderLock()}if(k==='bio')return bioUnlock();
 if(k==='forgot'){if(await confirmBox('Para redefinir o PIN, você precisa sair e entrar de novo com e-mail e senha. Continuar?','Sair')){localStorage.removeItem(LOCK_KEY);try{await SB.auth.signOut()}catch(e){}location.reload()}return}
 if(lockBuf.length>=(c.len||4))return;lockBuf+=k;renderLock();if(lockBuf.length===(c.len||4)){if(await sha(c.salt+lockBuf)===c.hash)hideLock();else{lockBuf='';renderLock('PIN incorreto, tente de novo');navigator.vibrate&&navigator.vibrate(120)}}}
function hideLock(){locked=false;lockBuf='';const el=$('#lock');if(el)el.remove()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-lk]');if(b){e.preventDefault();e.stopPropagation();lockKey(b.dataset.lk)}},true);
document.addEventListener('keydown',e=>{if(!locked)return;if(/^\d$/.test(e.key))lockKey(e.key);else if(e.key==='Backspace')lockKey('del')});
document.addEventListener('visibilitychange',()=>{const c=lockCfg();if(!c||!entered)return;if(document.hidden)lockHidden=Date.now();else if(!locked&&lockHidden&&Date.now()-lockHidden>(c.mins??3)*60000)showLock()});
const b64e=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function bioAvailable(){try{return !!(window.PublicKeyCredential&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())}catch(e){return false}}
async function bioRegister(){try{const cred=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:'Fort',id:location.hostname},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:ME?.email||'fort',displayName:myName()},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000}});
 const c=lockCfg();localStorage.setItem(LOCK_KEY,JSON.stringify({...c,bio:b64e(cred.rawId)}));toast('Digital / rosto ativado');render()}catch(e){toast('Não foi possível ativar: '+(e.message||e))}}
async function bioUnlock(silent){const c=lockCfg();if(!c?.bio)return;try{const id=Uint8Array.from(atob(c.bio.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((c.bio.length+3)%4)),ch=>ch.charCodeAt(0));
 await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:'public-key',id}],userVerification:'required',timeout:60000,rpId:location.hostname}});hideLock()}catch(e){if(!silent)renderLock('Não reconheci. Use o PIN.')}}
function formPin(){const c=lockCfg();openForm({title:c?'Trocar PIN':'Criar PIN de bloqueio',intro:'<div class="muted" style="font-size:14px">O PIN vale só neste aparelho. Ele é pedido ao abrir o Fort e quando você volta ao app depois de alguns minutos.</div>',values:{mins:c?.mins??3},
 fields:[{k:'p1',label:'PIN (4 a 6 números)',ph:'••••'},{k:'p2',label:'Repita o PIN',ph:'••••'},{k:'mins',label:'Bloquear depois de quantos minutos fora do app',type:'select',options:[{v:0,l:'Imediatamente'},{v:1,l:'1 minuto'},{v:3,l:'3 minutos'},{v:10,l:'10 minutos'},{v:30,l:'30 minutos'}]}],
 onSave:async v=>{if(!/^\d{4,6}$/.test(v.p1)){toast('Use de 4 a 6 números');return false}if(v.p1!==v.p2){toast('Os PINs não são iguais');return false}const salt=b64e(crypto.getRandomValues(new Uint8Array(12)));
  localStorage.setItem(LOCK_KEY,JSON.stringify({salt,hash:await sha(salt+v.p1),len:v.p1.length,mins:+v.mins,bio:c?.bio||null}));toast('PIN ativado neste aparelho');setTimeout(render,50)}});
 setTimeout(()=>{['f_p1','f_p2'].forEach(id=>{const e=document.getElementById(id);if(e){e.type='password';e.inputMode='numeric';e.maxLength=6;e.autocomplete='new-password'}})},40)}

/* ---------------- backups automáticos (no servidor) ---------------- */
async function loadBackups(){if(!SB)return;const{data,error}=await SB.from('fort_backups').select('id,created_at,docs').order('created_at',{ascending:false}).limit(12);ui.backups=error?{error:error.message}:data;if(ui.view==='ajustes'||ui.view==='importar-exportar')render()}
async function downloadBackup(id){toast('Preparando o backup…');const{data,error}=await SB.from('fort_backups').select('created_at,data').eq('id',id).single();if(error||!data)return toast('Não consegui baixar');
 const o={app:'fort',version:1,exported:data.created_at};COLS.forEach(c=>o[c]=[]);for(const r of (data.data||[])){if(o[r.col])o[r.col].push({...r.data,id:r.id})}offerFile(`fort-backup-${String(data.created_at).slice(0,10)}.json`,JSON.stringify(o))}
async function backupNow(){const{error}=await SB.rpc('fort_backup_now');if(error)return toast('Não foi possível: '+error.message);toast('Backup criado');loadBackups()}

/* ---------------- ajustes extras: segurança, tema, backups ---------------- */
function extraSettings(){const c=lockCfg(),p=myPrefs();const bk=ui.backups;
 return `${sec('Segurança deste aparelho')}<div class="list">${c?`<div class="row"><div class="t"><b>🔒 PIN ativado</b><small>bloqueia depois de ${c.mins?c.mins+' min':'sair do app'}${c.bio?' · digital/rosto ligado':''}</small></div></div><button class="row" data-act="pinset"><div class="t"><b>Trocar PIN</b></div><span class="mut">${I.right}</span></button>${ui.bioOk&&!c.bio?`<button class="row" data-act="bioon"><div class="t"><b>👆 Usar digital ou rosto</b><small>Destrava sem digitar o PIN</small></div></button>`:''}${c.bio?`<button class="row" data-act="biooff"><div class="t"><b>Desligar digital/rosto</b></div></button>`:''}<button class="row" data-act="pinoff"><div class="t"><b class="neg">Desligar PIN</b></div></button>`:`<button class="row" data-act="pinset"><div class="t"><b>🔒 Bloquear o app com PIN</b><small>Pede um PIN (e digital, se quiser) para abrir o Fort neste aparelho</small></div><span class="mut">${I.right}</span></button>`}</div>
 ${sec('Tema')}<div class="seg">${[['dark','🌙 Escuro'],['light','☀️ Claro'],['auto','Automático']].map(([k,l])=>`<button class="${(p.theme||'dark')===k?'on':''}" data-act="theme" data-k="${k}">${l}</button>`).join('')}</div>
 ${sec('Backups automáticos','',`<button class="btn sm" data-act="bknow">Fazer agora</button>`)}<div class="list">${!bk?'<div class="empty">Carregando…</div>':bk.error?`<div class="empty">Backups ainda não configurados no banco.</div>`:bk.length?bk.map(b=>`<div class="row"><div class="t"><b>${new Date(b.created_at).toLocaleDateString('pt-BR')} às ${new Date(b.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</b><small>${b.docs} itens</small></div><button class="btn sm" data-act="bkdl" data-id="${b.id}">Baixar</button></div>`).join(''):'<div class="empty">O primeiro backup automático sai no próximo domingo.</div>'}</div>
 <div class="muted mt" style="font-size:12.5px">Todo domingo o Fort guarda uma cópia completa no banco e mantém as 8 últimas. Para restaurar, baixe e use “Restaurar backup” em Importar e exportar.</div>`}

/* ---------------- tema claro ---------------- */
function applyTheme(){const t=myPrefs().theme||'dark';const light=t==='light'||(t==='auto'&&window.matchMedia('(prefers-color-scheme: light)').matches);document.body.classList.toggle('light',light);const m=document.querySelector('meta[name=theme-color]');if(m)m.content=light?'#f4f6f8':'#0e1113'}
window.matchMedia('(prefers-color-scheme: light)').addEventListener?.('change',()=>applyTheme());

/* ---------------- ações ---------------- */
Object.assign(A,{
 attopen:d=>openAttach((draft?.attach||[])[+d.k]),attdel:async d=>{syncDraft();const x=draft.attach[+d.k];if(!x)return;if(!(await confirmBox('Remover este comprovante?','Remover')))return;draft.attach=draft.attach.filter((_,i)=>i!==+d.k);SB.storage.from('fort-files').remove([x.path]).catch(()=>{});renderTx()},
 newrule:()=>formRule(),rule:d=>formRule(byId('rules',d.id)),addsug:d=>formRule(null,{text:d.k,categoryId:d.id}),
 applyrules:()=>{let n=0;S.tx.forEach(t=>{if(!t.categoryId&&(t.kind==='out'||t.kind==='in')){const c=ruleCat(t.desc,t.kind);if(c){put('tx',{...t,categoryId:c});n++}}});toast(n+' lançamentos categorizados')},
 casalprev:()=>{ui.casalM=addMonths(ui.casalM,-1);render()},casalnext:()=>{ui.casalM=addMonths(ui.casalM,1);render()},casalall:d=>{ui.casalAll=!!d.k;render()},
 settle:d=>formSettle(null,{from:d.k,to:d.id,amount:d.v?+d.v:''}),settleedit:d=>formSettle(byId('settles',d.id)),
 newasset:()=>formAsset(),asset:d=>formAsset(byId('assets',d.id)),rescfg:()=>formReserve(),
 pdfyear:()=>pdfAnnual(ui.month.slice(0,4)),pdfyearprev:()=>pdfAnnual(+ui.month.slice(0,4)-1),
 pinset:()=>formPin(),pinoff:async()=>{if(await confirmBox('Desligar o PIN neste aparelho?','Desligar')){localStorage.removeItem(LOCK_KEY);render()}},bioon:()=>bioRegister(),biooff:()=>{const c=lockCfg();localStorage.setItem(LOCK_KEY,JSON.stringify({...c,bio:null}));render()},
 theme:d=>{savePrefs({theme:d.k});setTimeout(applyTheme,30)},bknow:()=>backupNow(),bkdl:d=>downloadBackup(+d.id)
});
Object.assign(CHG,{txfile:el=>{const f=el.files[0];el.value='';if(f)uploadAttach(f)},impacc:()=>renderImport(),impinv:()=>renderImport()});
document.addEventListener('change',e=>{if(e.target&&e.target.id==='impacc'&&ui.impRaw)renderImport()});

/* ---------------- empréstimos e financiamentos no Início ---------------- */
function homeLoans(){const list=S.loans.filter(l=>loanStats(l).rem>0);if(!list.length)return '';
 const tot=sum(list,l=>loanStats(l).saldo),mes=sum(list,l=>+l.parcel||0);const go=list.every(l=>l.kind==='emprestimo')?'emprestimos':'financiamentos';
 return sec('Empréstimos e financiamentos',go)+`<div class="list">${list.map(l=>{const s=loanStats(l);const pct=Math.round(s.pct*100);return `<button class="row" data-act="loan" data-id="${l.id}">${ib(l.kind==='financiamento'?'🏦':'🤝','#d9b25c')}<div class="t"><div class="sw" style="font-weight:inherit"><b>${esc(l.name)}</b><span class="pill ${pct>=75?'ok':pct>=40?'w':''}">${pct}% pago</span></div><div class="bar" style="--c:var(--in);height:9px"><i style="width:${s.pct*100}%"></i></div><small>${s.paidN} de ${s.n} parcelas · faltam ${s.rem}${s.next?' · próxima '+brDate(s.next.date):''}</small></div><div class="amt"><b>${money(l.parcel)}</b><small>deve ${money(s.saldo)}</small></div></button>`}).join('')}
 <div class="row"><div class="t"><b>Total</b><small>${money(mes)} por mês</small></div><div class="amt"><b class="neg">${money(tot)}</b><small>saldo devedor</small></div></div></div>`}

/* ---------------- financiamento: cálculo pelas taxas do contrato ---------------- */
let seriesCacheLoan={};
function loanFields(kind){const fin=kind==='financiamento';return [
 {k:'name',label:'Nome',req:1,ph:fin?'Ex.: Apartamento, Carro':'Ex.: Consignado'},{k:'inst',label:'Banco ou credor',ph:'Opcional'},
 {k:'n',label:'Prazo total (número de parcelas)',type:'number',min:1,max:480,req:1},{k:'first',label:'Vencimento da 1ª parcela',type:'date',req:1},
 {k:'paidBefore',label:'Meses amortizados (parcelas já pagas)',type:'number',min:0,hint:'Quantas parcelas já foram pagas até hoje (ou até a data do saldo informado)'},
 {k:'parcel',label:'Valor da parcela',type:'money',hint:'Pode deixar em branco se for calcular pelas taxas'},
 {k:'hc',type:'html',html:'<div class="fl" style="margin-top:6px"><span style="font-size:15px;color:var(--text)">Dados do contrato</span><em>Preencha com o que aparece no extrato do financiamento. O Fort calcula amortização, juros, seguro e taxa de cada parcela.</em></div>'},
 {k:'calc',label:'Calcular a parcela pelas taxas do contrato',type:'toggle'},
 {k:'sys',label:'Sistema de amortização',type:'select',options:[{v:'sac',l:'SAC (parcela diminui com o tempo)'},{v:'price',l:'Price (parcela fixa)'}]},
 {k:'total',label:'Valor contratado (financiado)',type:'money'},
 {k:'saldo',label:'Saldo devedor atual',type:'money',hint:'Do extrato, depois da última parcela paga. Se deixar em branco, o Fort estima a partir do valor contratado'},
 {k:'jn',label:'Juros nominais vigentes (% ao ano)',type:'pct',ph:'Ex.: 10,49'},
 {k:'je',label:'Juros efetivos (% ao ano)',type:'pct',ph:'Ex.: 11,02',hint:'Se deixar em branco, é calculado a partir dos nominais'},
 {k:'jr',label:'Juros efetivos com relacionamento (% ao ano)',type:'pct',ph:'Opcional',hint:'Se preencher, esta é a taxa usada no cálculo'},
 {k:'seguro',label:'Seguros por mês (MIP + DFI)',type:'money'},
 {k:'taxa',label:'Taxa de administração por mês',type:'money'},
 {k:'tr',label:'Corrigir o saldo pela TR todo mês',type:'toggle'},
 {k:'accountId',label:'Conta de débito',type:'select',options:()=>accOptions()},{k:'categoryId',label:'Categoria',type:'select',options:()=>catOptions('out')}]}
function loanRate(l){const ef=+l.jr>0?+l.jr:+l.je>0?+l.je:+l.jn>0?(Math.pow(1+(+l.jn)/1200,12)-1)*100:0;return Math.pow(1+ef/100,1/12)-1}
function loanSchedule(l){const key=ver+'|'+ratesKey()+'|'+JSON.stringify([l.n,l.paidBefore,l.saldo,l.total,l.jn,l.je,l.jr,l.seguro,l.taxa,l.tr,l.sys,l.first]);const c=seriesCacheLoan[l.id||'_'];if(c&&c.key===key)return c;
 const n=+l.n||0,k0=Math.min(n,Math.max(0,+l.paidBefore||0)),i=loanRate(l),tr=l.tr?(+curRates().tr||0)/100:0,seg=+l.seguro||0,tx=+l.taxa||0;
 const step=(S,rem)=>{S=S*(1+tr);const j=S*i;let a;if(l.sys==='price'){const p=i>0?S*i/(1-Math.pow(1+i,-rem)):S/rem;a=p-j}else a=S/rem;return{S,j,a:Math.min(a,S)}};
 let S;if(+l.saldo>0)S=+l.saldo;else{S=+l.total||0;for(let k=0;k<k0;k++){const r=step(S,n-k);S=r.S-r.a}}
 const s0=r2(S);const rows=[];for(let k=k0;k<n;k++){const r=step(S,n-k);S=Math.max(0,r.S-r.a);rows.push({n:k+1,date:l.first?addMonthsDate(l.first,k):'',amort:r2(r.a),juros:r2(r.j),seguro:seg,taxa:tx,parcela:r2(r.a+r.j+seg+tx),saldo:r2(S)})}
 const o={key,k0,s0,rows,i,totJuros:r2(sum(rows,x=>x.juros)),totPago:r2(sum(rows,x=>x.parcela))};seriesCacheLoan[l.id||'_']=o;return o}
function loanAmt(l,N){if(!l.calc)return +l.parcel||0;const s=loanSchedule(l);const r=s.rows.find(x=>x.n===N);return r?r.parcela:(+l.parcel||0)}
function loanSaldo(l,paidN){const n=+l.n||0;if(!l.calc)return r2(Math.max(0,n-paidN)*(+l.parcel||0));const s=loanSchedule(l);if(paidN<=s.k0)return s.s0;const r=s.rows[paidN-s.k0-1];return r?r.saldo:0}
function loanIntroExtra(l,st){if(!l.calc)return '';const s=loanSchedule(l);const nx=s.rows.find(x=>x.n===st.paidN+1);const ef=(Math.pow(1+s.i,12)-1)*100;
 return `<div class="lbrk mt">${nx?`<div class="sw"><span>Próxima parcela (${nx.n}ª)</span><b>${money(nx.parcela)}</b></div><div class="sw mut"><span>Amortização</span><span>${money(nx.amort)}</span></div><div class="sw mut"><span>Juros</span><span>${money(nx.juros)}</span></div><div class="sw mut"><span>Seguros</span><span>${money(nx.seguro)}</span></div><div class="sw mut"><span>Taxa de administração</span><span>${money(nx.taxa)}</span></div>`:'<div class="pos">Financiamento quitado 🎉</div>'}
 <div class="sw mut" style="border-top:1px solid var(--line);margin-top:6px;padding-top:6px"><span>Taxa usada</span><span>${pctf(s.i*100,4)} a.m. · ${pctf(ef)} a.a.</span></div><div class="sw mut"><span>Juros que ainda vai pagar</span><span>${money(s.totJuros)}</span></div><div class="sw mut"><span>Total que ainda vai pagar</span><span>${money(s.totPago)}</span></div>
 <button type="button" class="btn sm mt" data-act="loansched" data-id="${l.id}">📋 Ver tabela de amortização</button></div>`}
function showLoanSchedule(l){const s=loanSchedule(l);const rows=s.rows;const yrs=new Map();rows.forEach(r=>{const y=r.date.slice(0,4);const o=yrs.get(y)||{y,amort:0,juros:0,parc:0,saldo:0,cnt:0};o.amort+=r.amort;o.juros+=r.juros;o.parc+=r.parcela;o.saldo=r.saldo;o.cnt++;yrs.set(y,o)});
 const t=`<div class="scroll-x"><table class="tb" style="font-size:13px"><tr><th>Parcela</th><th>Vencimento</th><th>Amortização</th><th>Juros</th><th>Seguro + taxa</th><th>Parcela</th><th>Saldo após</th></tr>${rows.slice(0,ui.schedAll?rows.length:24).map(r=>`<tr><td>${r.n}</td><td>${brDate(r.date)}</td><td>${money(r.amort)}</td><td>${money(r.juros)}</td><td>${money(r.seguro+r.taxa)}</td><td><b>${money(r.parcela)}</b></td><td>${money(r.saldo)}</td></tr>`).join('')}</table></div>
 ${rows.length>24&&!ui.schedAll?`<button type="button" class="btn sm mt" data-act="schedall" data-id="${l.id}">Mostrar todas as ${rows.length} parcelas</button>`:''}
 <div class="fl mt"><span>Resumo por ano</span></div><div class="scroll-x"><table class="tb" style="font-size:13px"><tr><th>Ano</th><th>Parcelas</th><th>Amortizado</th><th>Juros</th><th>Pago no ano</th><th>Saldo no fim</th></tr>${[...yrs.values()].map(o=>`<tr><td>${o.y}</td><td>${o.cnt}</td><td>${money(o.amort)}</td><td>${money(o.juros)}</td><td>${money(o.parc)}</td><td>${money(o.saldo)}</td></tr>`).join('')}</table></div>`;
 openForm({title:'Tabela de amortização · '+l.name,intro:t,fields:[],saveLabel:'Fechar',onSave:()=>{}})}
Object.assign(A,{loansched:d=>{ui.schedAll=false;showLoanSchedule(byId('loans',d.id))},schedall:d=>{ui.schedAll=true;showLoanSchedule(byId('loans',d.id))}});

/* ---------------- cheque especial ---------------- */
const IOF_DIA=0.000082,IOF_ADIC=0.0038;
function odInfo(a,bal){const L=+a.odLimit||0;if(!L&&bal>=0)return '';if(bal<0)return ` · <span class="neg">no cheque especial${L?` · resta ${money(Math.max(0,L+bal))}`:''}</span>`;return ` · disponível com limite ${money(bal+L)}`}
function odCost(a,ym){const rate=(+a.odRate||0)/100;const td=today();const last=ym===ymOf(td)?td:endOf(ym);let juros=0,iof=0,days=0,maxNeg=0;
 for(let d=1;d<=lastDay(ym);d++){const ds=ym+'-'+pad(d);if(ds>last)break;const b=accBalance(a,ds,false);if(b<0){days++;juros+=-b*rate/30;iof+=-b*IOF_DIA;maxNeg=Math.max(maxNeg,-b)}}
 iof+=maxNeg*IOF_ADIC;return{juros:r2(juros),iof:r2(iof),total:r2(juros+iof),days,maxNeg:r2(maxNeg)}}
function odForecast(a){const cur=curYm();for(let k=0;k<12;k++){const m=addMonths(cur,k);const b=accBalance(a,endOf(m),true);if(b<0)return{m,b}}return null}
function odCard(){const td=today(),cur=curYm();const rows=[];
 for(const a of activeAccs()){if(a.type==='alimentacao')continue;const bal=accBalance(a,td,false);const L=+a.odLimit||0;
  if(bal<0){const c=odCost(a,cur);rows.push(`<div class="drow" style="cursor:default;flex-wrap:wrap"><span class="pill bad">no especial</span><span class="dn">${esc(a.name)} · ${money(bal)}${L?` <small class="muted">de ${money(L)}</small>`:''}</span><b>${c.total>0?`≈ ${money(c.total)}`:''}</b>${c.total>0?`<small class="muted" style="width:100%">${c.days} dia${c.days>1?'s':''} negativa este mês · juros ${money(c.juros)} + IOF ${money(c.iof)} (estimado)${a.odRate?'':' · informe os juros no cadastro da conta'}</small>`:(!a.odRate&&L?'<small class="muted" style="width:100%">Informe os juros do cheque especial no cadastro da conta para ver o custo</small>':'')}</div>`)}
  else if(L||a.odRate){const f=odForecast(a);if(f)rows.push(`<div class="drow" style="cursor:default"><span class="pill w">previsão</span><span class="dn">${esc(a.name)} fica negativa em ${monthLabel(f.m).toLowerCase()}</span><b class="neg">${money(f.b)}</b></div>`)}}
 if(!rows.length)return '';
 const prev=addMonths(cur,-1);const owed=activeAccs().filter(a=>+a.odRate>0).map(a=>({a,c:odCost(a,prev)})).filter(x=>x.c.total>0&&!S.tx.some(t=>t.odFor===x.a.id+'|'+prev));
 return `<div class="card mb duec late"><div class="dh"><b>🏦 Cheque especial</b><a class="link" data-act="go" data-go="contas">Contas ›</a></div><div class="dlist">${rows.join('')}</div>
 ${owed.length?`<div class="muted mt" style="font-size:13px">${owed.map(x=>`Juros estimados de ${monthLabel(prev).toLowerCase()} na ${esc(x.a.name)}: <b>${money(x.c.total)}</b> <button class="link" data-act="odpost" data-id="${x.a.id}" data-k="${prev}">lançar como despesa</button>`).join('<br>')}</div>`:''}</div>`}
Object.assign(A,{odpost:async d=>{const a=byId('accounts',d.id);if(!a)return;const c=odCost(a,d.k);let cat=S.categories.find(x=>x.kind==='out'&&/juros|tarifa/.test(norm(x.name)));if(!cat){cat={id:uid(),kind:'out',name:'Juros e tarifas',emoji:'🧾',color:'#8e99a3'};put('categories',cat)}
 openForm({title:'Lançar juros do cheque especial',intro:`<div class="muted" style="font-size:14px">Estimativa para ${monthLabel(d.k).toLowerCase()}: juros ${money(c.juros)} + IOF ${money(c.iof)}. Ajuste o valor se o extrato do banco mostrar diferente.</div>`,values:{amount:c.total,date:dateIn(addMonths(d.k,1),1)},fields:[{k:'amount',label:'Valor cobrado',type:'money',req:1},{k:'date',label:'Data da cobrança',type:'date',req:1}],
  onSave:v=>{put('tx',{id:uid(),kind:'out',amount:v.amount,date:v.date,purchaseDate:v.date,accountId:a.id,categoryId:cat.id,desc:'Juros cheque especial '+monYr(d.k),tags:[],paid:v.date<=today(),odFor:a.id+'|'+d.k,payer:ME?.email||''});toast('Juros lançados')}})}});

/* ---------------- moeda estrangeira no lançamento ---------------- */
const CURS=[['BRL','Real','R$'],['USD','Dólar americano','US$'],['EUR','Euro','€'],['GBP','Libra esterlina','£'],['ARS','Peso argentino','AR$'],['CLP','Peso chileno','CL$'],['UYU','Peso uruguaio','UY$'],['PYG','Guarani paraguaio','₲'],['CAD','Dólar canadense','C$'],['AUD','Dólar australiano','A$'],['CHF','Franco suíço','CHF'],['JPY','Iene japonês','¥'],['CNY','Yuan chinês','¥'],['MXN','Peso mexicano','MX$']];
const IOF_INTL=3.5;
const curSym=c=>(CURS.find(x=>x[0]===c)||CURS[0])[2];
const curPh=c=>curSym(c||'BRL')+' 0,00';
const curFmt=(v,c)=>curSym(c)+' '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
function curSelect(d){return `<select id="tx_cur" class="cursel" data-chg="txcur" aria-label="Moeda">${CURS.map(([k,n,s])=>`<option value="${k}" ${(d.cur||'BRL')===k?'selected':''}>${s} ${k==='BRL'?'Real':k}</option>`).join('')}</select>`}
function txBRL(d){const v=parseMoney(d.amount);if(!d.cur||d.cur==='BRL')return r2(v);const rate=parseMoney(d.rate);return r2(v*rate*(d.iof?1+IOF_INTL/100:1))}
function fxFields(d){if(!d.cur||d.cur==='BRL')return{cur:null,curAmt:null,rate:null,iof:null};return{cur:d.cur,curAmt:r2(parseMoney(d.amount)),rate:parseMoney(d.rate),iof:!!d.iof}}
function fxBox(d){if(!d.cur||d.cur==='BRL')return '';const isCard=String(d.src||'').startsWith('c:');
 return `<div class="fxbox"><div class="fxrow"><label class="fl" style="flex:1"><span>Cotação ${esc(d.cur)} → R$ <em id="fx_src" style="display:inline">${esc(ui.fxMsg||'')}</em></span><input id="tx_rate" inputmode="decimal" value="${esc(d.rate)}" placeholder="buscando…" data-inp="txrate"></label><button type="button" class="btn sm" data-act="fxrefresh" style="align-self:flex-end">↻ Atualizar</button></div>
 <label class="sw"><span>Somar IOF de compra internacional (${String(IOF_INTL).replace('.',',')}%)${isCard?'':'<em style="display:block;font-size:12px;color:var(--faint);font-weight:500">Comum em compras no cartão ou cartão internacional</em>'}</span><input type="checkbox" id="tx_iof" data-chg="txiof" ${d.iof?'checked':''}><i></i></label>
 <div class="fxtot">Valor em reais: <b id="fx_total">${money(txBRL(d))}</b></div></div>`}
function fxUpdateTotal(){if(!draft)return;syncDraft();const el=$('#fx_total');if(el)el.textContent=money(txBRL(draft))}
const fxCache={};
async function fetchRate(cur,date){const td=today();const key=cur+'|'+(date>=td?'hoje':date);if(fxCache[key])return fxCache[key];
 const tryJ=async u=>{const c=new AbortController();const tm=setTimeout(()=>c.abort(),8000);try{const r=await fetch(u,{signal:c.signal});if(!r.ok)throw 0;return await r.json()}finally{clearTimeout(tm)}};
 let out=null;
 try{if(date>=td){const j=await tryJ(`https://economia.awesomeapi.com.br/json/last/${cur}-BRL`);const o=j[cur+'BRL'];if(o)out={rate:+o.ask||+o.bid,when:new Date(+o.timestamp*1000).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),src:'AwesomeAPI'}}
  else{const d0=addDaysStr(date,-6).replace(/-/g,''),d1=date.replace(/-/g,'');const j=await tryJ(`https://economia.awesomeapi.com.br/json/daily/${cur}-BRL/10?start_date=${d0}&end_date=${d1}`);if(Array.isArray(j)&&j.length){const o=j.sort((a,b)=>+b.timestamp-+a.timestamp)[0];out={rate:+o.ask||+o.bid,when:new Date(+o.timestamp*1000).toLocaleDateString('pt-BR'),src:'AwesomeAPI'}}}}catch(e){}
 if(!out){try{const j=await tryJ(`https://open.er-api.com/v6/latest/${cur}`);if(j&&j.rates&&j.rates.BRL)out={rate:+j.rates.BRL,when:'hoje',src:'ExchangeRate-API'}}catch(e){}}
 if(out){out.rate=Math.round(out.rate*10000)/10000;fxCache[key]=out}return out}
const addDaysStr=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return ymd(x)};
async function fxLoad(force){if(!draft||!draft.cur||draft.cur==='BRL')return;syncDraft();const cur=draft.cur,date=draft.date||today();if(!force&&draft.rate&&draft.rateFor===cur+'|'+date)return;
 ui.fxMsg='buscando…';const s=$('#fx_src');if(s)s.textContent='buscando…';
 const r=await fetchRate(cur,date);if(!draft||draft.cur!==cur)return;
 if(r){draft.rate=String(r.rate).replace('.',',');draft.rateFor=cur+'|'+date;ui.fxMsg=`(${r.when})`;const i=$('#tx_rate');if(i)i.value=draft.rate}else{ui.fxMsg='(sem conexão: digite a cotação)'}
 const s2=$('#fx_src');if(s2)s2.textContent=ui.fxMsg;fxUpdateTotal()}
Object.assign(CHG,{txcur:el=>{syncDraft();draft.cur=el.value;draft.rate='';draft.rateFor='';ui.fxMsg='';if(draft.cur!=='BRL'&&String(draft.src||'').startsWith('c:'))draft.iof=true;renderTx();setTimeout(()=>{const a=$('#tx_amt');if(a)a.focus()},40);fxLoad(true)},txiof:()=>fxUpdateTotal()});
Object.assign(INP,{txamt:()=>fxUpdateTotal(),txrate:()=>{if(draft)draft.rateFor='manual';fxUpdateTotal()}});
Object.assign(A,{fxrefresh:()=>fxLoad(true)});
// quando a data muda, busca a cotação daquele dia
document.addEventListener('change',e=>{if(e.target&&e.target.id==='tx_date'&&draft&&draft.cur&&draft.cur!=='BRL'&&draft.rateFor!=='manual')setTimeout(()=>fxLoad(true),30)});
