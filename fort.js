"use strict";
/* =====================================================================
   Fort — recursos novos: marca, perfil e aparência, investimentos,
   taxas do Banco Central, calendário e projeção de longo prazo, PDFs.
   ===================================================================== */
const APP={name:'Fort',slogan:'Finances on the right track'};
let ME=null;          // {id,email} preenchido no login
let SB=null;          // cliente Supabase

const FORT_SVG_T=`<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="__ID__" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4ade80"/><stop offset="1" stop-color="#15803d"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="#0a0a0a"/><path d="M19 15h5v4h4v-4h5v4h4v-4h5v11H29v6h11v7H29v12h-10z" fill="url(#__ID__)"/></svg>`;
let svgN=0;const fortSvg=()=>FORT_SVG_T.replace(/__ID__/g,'fg'+(++svgN));
Object.defineProperty(window,'FORT_SVG',{get:fortSvg});
const brandMark=()=>`<span class="logo fortlogo">${fortSvg()}</span>`;

/* ---------------- preferências e perfil ---------------- */
const myKey=()=>'u_'+(ME?.id||'local');
const myPrefs=()=>byId('settings',myKey())||{};
const appCfg=()=>byId('settings','app')||{};
function savePrefs(patch){return put('settings',{...myPrefs(),...patch,email:ME?.email||'',id:myKey()})}
function saveApp(patch){return put('settings',{...appCfg(),...patch,id:'app'})}
const myName=()=>myPrefs().name||(ME?.email||'').split('@')[0]||'Você';
function meAvatar(px=38){const p=myPrefs();return p.photo?`<span class="me-av" style="width:${px}px;height:${px}px"><img src="${esc(p.photo)}" alt=""></span>`:`<span class="me-av" style="width:${px}px;height:${px}px;font-size:${Math.round(px*.38)}px">${esc(initials(myName()))}</span>`}
function sideProfile(){return `<div class="sideprof"><button class="sp-me" data-act="go" data-go="ajustes">${meAvatar(36)}<span class="t"><b>${esc(myName())}</b><small>${esc(ME?.email||'')}</small></span></button><button class="icon-btn plain" data-act="logout" title="Sair" aria-label="Sair">${I.out}</button></div>`}
function homeGreeting(){const h=new Date().getHours();const s=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';return `<div class="greet">${s}, <b>${esc(myName().split(' ')[0])}</b></div>`}

let themeSig='';
function afterRender(){applyTheme();const p=myPrefs();const sig=[p.bg?p.bg.length+p.bg.slice(-40):'',p.bgDim,p.accent,p.noMark].join('|');if(sig===themeSig)return;themeSig=sig;
 const b=document.body;const root=document.documentElement;
 if(p.bg){b.classList.add('hasbg');b.style.setProperty('--bgimg',`url("${p.bg}")`);b.style.setProperty('--bgdim',String((p.bgDim??70)/100))}else{b.classList.remove('hasbg');b.style.removeProperty('--bgimg')}
 const ac=ACCENTS.find(a=>a.v===p.accent)||ACCENTS[0];root.style.setProperty('--accent',ac.v);root.style.setProperty('--accent-ink',ac.ink);
 b.classList.toggle('nomark',!!p.noMark||!!p.bg)}
const ACCENTS=[{v:'#9b8cff',ink:'#17132f',l:'Lilás'},{v:'#3ccf91',ink:'#06261a',l:'Verde'},{v:'#5aa9ff',ink:'#06203d',l:'Azul'},{v:'#efb34d',ink:'#2e1f04',l:'Dourado'},{v:'#f37a72',ink:'#3a0c08',l:'Coral'},{v:'#e07ad0',ink:'#330a2c',l:'Rosa'}];

function imgToDataUrl(file,maxW,maxH,q,square){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{let w=im.width,h=im.height,sx=0,sy=0,sw=w,sh=h;
 if(square){const m=Math.min(w,h);sx=(w-m)/2;sy=(h-m)/2;sw=sh=m;w=h=Math.min(maxW,m)}else{const k=Math.min(1,maxW/w,maxH/h);w=Math.round(w*k);h=Math.round(h*k)}
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(im,sx,sy,sw,sh,0,0,w,h);
 let qq=q,u=cv.toDataURL('image/webp',qq);if(!u.startsWith('data:image/webp'))u=cv.toDataURL('image/jpeg',qq);while(u.length>450000&&qq>.35){qq-=.1;u=cv.toDataURL(u.startsWith('data:image/webp')?'image/webp':'image/jpeg',qq)}res(u)};im.onerror=rej;im.src=String(r.result)};r.onerror=rej;r.readAsDataURL(file)})}

/* ---------------- instalar como app ---------------- */
let installEvt=null;
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;scheduleRender()});
window.addEventListener('appinstalled',()=>{installEvt=null;toast('Fort instalado!');scheduleRender()});
const canOfferInstall=()=>!isStandalone();
function installBtn(cls=''){return canOfferInstall()?`<button class="btn installbtn ${cls}" data-act="install">⬇️ Instalar o Fort</button>`:''}
function installBanner(){if(!canOfferInstall())return '';try{if(localStorage.getItem('fort.noInstall')==='1')return ''}catch(e){}
 return `<div class="card instb mob mb"><span class="fortlogo">${fortSvg()}</span><div class="t"><b>Instale o Fort no celular</b><small>Abre em tela cheia, com ícone próprio</small></div><button class="btn primary sm" data-act="install">Instalar</button><button class="icon-btn plain" style="width:30px;height:30px" data-act="installhide" aria-label="Dispensar">${I.x}</button></div>`}
async function doInstall(){if(installEvt){installEvt.prompt();try{const r=await installEvt.userChoice;if(r.outcome==='accepted')toast('Instalando…')}catch(e){}installEvt=null;render();return}
 const ios=isIOS(),android=/android/i.test(navigator.userAgent);
 const steps=ios?'<ol class="inst"><li>Abra este endereço no <b>Safari</b>.</li><li>Toque no botão <b>Compartilhar</b> (quadrado com seta para cima).</li><li>Escolha <b>Adicionar à Tela de Início</b> e toque em <b>Adicionar</b>.</li></ol>'
  :android?'<ol class="inst"><li>Abra este endereço no <b>Chrome</b>.</li><li>Toque no menu <b>⋮</b> (canto superior direito).</li><li>Escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li></ol>'
  :'<ol class="inst"><li>Use o <b>Chrome</b> ou o <b>Edge</b>.</li><li>Clique no ícone de instalar <b>⊕</b> no fim da barra de endereço (ou menu <b>⋮</b> → <b>Transmitir, salvar e compartilhar → Instalar página como app</b>).</li><li>Confirme em <b>Instalar</b>. O Fort ganha atalho na área de trabalho e abre em janela própria.</li></ol>';
 openForm({title:'Instalar o Fort',intro:`<div class="prof" style="margin-bottom:6px"><span class="fortlogo" style="width:52px;height:52px">${fortSvg()}</span><div class="t"><b>Fort como aplicativo</b><small class="muted">Ícone próprio, tela cheia e acesso rápido, no computador e no celular.</small></div></div>${steps}`,fields:[],saveLabel:'Entendi',onSave:()=>{}})}

/* ---------------- vencimentos: destaque no app ---------------- */
const dDiff=(a,b)=>Math.round((Date.parse(b+'T12:00:00')-Date.parse(a+'T12:00:00'))/864e5);
function dueSoon(win=7){const td=today(),lim=addMonthsDate(td,0);const out=[];
 for(const t of S.tx){if(t.paid||t.cardId||t.kind!=='out')continue;const d=dDiff(td,t.date);if(d<=win)out.push({d,t,name:txTitle(t),v:t.amount,kind:'tx'})}
 const cur=curYm();for(const c of S.cards)for(const ym of [addMonths(cur,-1),cur,addMonths(cur,1)]){const iv=invoice(c,ym);if(!(iv.remaining>0.004))continue;const d=dDiff(td,iv.due);if(d<=win&&d>=-31)out.push({d,c,ym,name:'Fatura '+c.name,v:iv.remaining,kind:'fatura'})}
 return out.sort((a,b)=>a.d-b.d||b.v-a.v)}
const dueLabel=d=>d<0?(d===-1?'venceu ontem':`venceu há ${-d} dias`):d===0?'vence hoje':d===1?'vence amanhã':`em ${d} dias`;
function dueCard(){const it=dueSoon(7);if(!it.length)return '';const over=it.filter(x=>x.d<0),tot=sum(it,x=>x.v);
 return `<div class="card duec mb ${over.length?'late':''}"><div class="dh"><b>🔔 ${over.length?`${over.length} conta${over.length>1?'s':''} vencida${over.length>1?'s':''}`:'Vencimentos dos próximos 7 dias'}</b><a class="link" data-act="gotx" data-k="pagar">Ver tudo ›</a></div>
 <div class="dlist">${it.slice(0,5).map(x=>`<button class="drow" ${x.kind==='fatura'?`data-act="card" data-id="${x.c.id}"`:`data-act="tx" data-id="${x.t.id}"`}><span class="pill ${x.d<0?'bad':x.d<=1?'w':''}">${dueLabel(x.d)}</span><span class="dn">${x.kind==='fatura'?'💳 ':''}${esc(x.name)}</span><b>${money(x.v)}</b></button>`).join('')}</div>
 ${it.length>5?`<div class="muted" style="font-size:12.5px;margin-top:6px">+ ${it.length-5} outros · total ${money(tot)}</div>`:`<div class="muted" style="font-size:12.5px;margin-top:6px">Total ${money(tot)}</div>`}</div>`}

/* ---------------- vencimentos: notificações no celular ---------------- */
const b64u8=s=>{const p='='.repeat((4-s.length%4)%4);const b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...b].map(c=>c.charCodeAt(0)))};
const ALERT_DAYS=[[0,'No dia'],[1,'1 dia antes'],[3,'3 dias antes'],[7,'7 dias antes']];
const alertDays=()=>myPrefs().alertDays||[0,1,3];
async function pushState(){try{if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))return isIOS()&&!isStandalone()?'ios':'unsupported';if(Notification.permission==='denied')return 'denied';const reg=await Promise.race([navigator.serviceWorker.ready,new Promise((_,rj)=>setTimeout(()=>rj(new Error('sw')),6000))]);const s=await reg.pushManager.getSubscription();return s?'on':'off'}catch(e){return 'unsupported'}}
async function refreshPushState(){ui.push=await pushState();if(ui.view==='ajustes')render()}
async function pushSave(sub){const j=sub.toJSON();const row={endpoint:j.endpoint,sub:j,email:ME.email,days:alertDays(),budget:myPrefs().alertBudget!==false,updated_at:new Date().toISOString()};let{error}=await SB.from('fort_push').upsert(row);if(error&&/budget/.test(error.message)){delete row.budget;({error}=await SB.from('fort_push').upsert(row))}if(error)throw error}
async function pushEnable(){if(!(window.FORT_CONFIG||{}).vapidPublic)return toast('Notificações ainda não configuradas');
 try{const perm=await Notification.requestPermission();if(perm!=='granted'){toast('Permissão negada. Libere as notificações do site nas configurações do navegador.');return refreshPushState()}
  const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u8(window.FORT_CONFIG.vapidPublic)});
  await pushSave(sub);toast('Alertas ligados neste aparelho');}catch(e){console.warn(e);toast('Não foi possível ligar: '+(e.message||e))}refreshPushState()}
async function pushDisable(){try{const reg=await navigator.serviceWorker.ready;const s=await reg.pushManager.getSubscription();if(s){await SB.from('fort_push').delete().eq('endpoint',s.endpoint);await s.unsubscribe()}toast('Alertas desligados neste aparelho')}catch(e){toast('Não foi possível desligar')}refreshPushState()}
async function pushDays(k){let d=[...alertDays()];const n=+k;d=d.includes(n)?d.filter(x=>x!==n):[...d,n].sort((a,b)=>a-b);if(!d.length)d=[0];await savePrefs({alertDays:d});
 try{const reg=await navigator.serviceWorker.ready;const s=await reg.pushManager.getSubscription();if(s)await SB.from('fort_push').update({days:d}).eq('endpoint',s.endpoint)}catch(e){}}
async function pushTest(){toast('Enviando um alerta de teste…');const{data:id,error}=await SB.rpc('fort_test_alert');if(error){toast('Falhou: '+error.message);return}
 setTimeout(async()=>{const{data,error:e2}=await SB.rpc('fort_alert_result',{rid:id});if(e2||!data){toast('Enviado. Se não chegar em 1 minuto, me avise.');return}
  let j={};try{j=JSON.parse(data.content||'{}')}catch(x){}if(data.status_code===200&&j.sent>0)toast('Alerta enviado! Confira as notificações.');else if(data.status_code===200&&!j.sent)toast('Nenhum aparelho com alertas ligados.');else toast('Erro no envio ('+(data.status_code||'?')+'): '+(j.error||(j.errors||[]).join(' ')||data.error_msg||'').slice(0,140))},5000)}
function alertsSection(){const st=ui.push;const d=alertDays();
 const head=st==='on'?'<div class="pill ok mb">✓ Alertas ligados neste aparelho</div>':st==='denied'?'<div class="banner mb">As notificações deste site estão bloqueadas no navegador. Libere em Configurações do site → Notificações e volte aqui.</div>':st==='ios'?'<div class="banner info mb">No iPhone, os alertas só funcionam com o Fort instalado na tela de início. Instale e abra o Fort pelo ícone para ligar.</div>':st==='unsupported'?'<div class="banner mb">Este navegador não aceita notificações. Use o Chrome (Android/computador) ou o Fort instalado no iPhone.</div>':'';
 return `${sec('Alertas de vencimento')}<div class="card" style="font-size:14px;line-height:1.5">${head}
 <p class="muted" style="margin-bottom:10px">Todo dia às 8h o Fort avisa no celular as contas, faturas e receitas que vencem. Também aparece um destaque no Início.</p>
 <div class="fl"><span>Avisar</span><div class="chips">${ALERT_DAYS.map(([k,l])=>`<button class="chip ${d.includes(k)?'on':''}" data-act="pushday" data-k="${k}">${l}</button>`).join('')}</div></div>
 <label class="sw mt"><span>Avisar quando um orçamento passar de 80% e de 100%</span><input type="checkbox" data-chg="pushbudget" ${myPrefs().alertBudget===false?'':'checked'}><i></i></label>
 <div class="prof-b mt">${st==='on'?'<button class="btn sm" data-act="pushtest">Enviar alerta de teste</button><button class="btn sm ghost danger" data-act="pushoff">Desligar neste aparelho</button>':st==='off'?'<button class="btn primary" data-act="pushon">🔔 Ligar alertas neste aparelho</button>':st==null?'<span class="muted">Verificando…</span>':''}</div>
 <div class="muted mt" style="font-size:12.5px">Ligue em cada aparelho onde quiser receber (celular e computador).</div></div>`}

/* ---------------- taxas (Banco Central) ---------------- */
const RATE_DEF={selic:15,cdi:14.9,ipca:4.5,tr:0.15};
const RATE_L={selic:'Selic (% a.a.)',cdi:'CDI (% a.a.)',ipca:'IPCA (% em 12 meses)',tr:'TR (% ao mês)'};
const curRates=()=>({...RATE_DEF,...(appCfg().rates||{})});
const longRates=()=>{const l=appCfg().long;return l&&l.on?{...curRates(),...l}:null};
const pctf=(v,d=2)=>(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})+'%';
const BCB={selic:[432,1],cdi:[4389,1],ipca:[13522,1],tr:[226,1],ipcam:[433,240]};
async function bcbSerie(code,n){const url=`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/${n}?formato=json`;
 try{const c=new AbortController();const tm=setTimeout(()=>c.abort(),8000);const r=await fetch(url,{signal:c.signal});clearTimeout(tm);if(r.ok){const j=await r.json();if(Array.isArray(j))return j}}catch(e){}
 if(SB){const{data,error}=await SB.rpc('fort_bcb',{code,n});if(!error&&data)return typeof data==='string'?JSON.parse(data):data}
 throw new Error('Banco Central indisponível')}
const bcbVal=s=>parseFloat(String(s.valor).replace(',','.'));
let ratesBusy=false;
async function refreshRates(manual){if(ratesBusy)return;ratesBusy=true;if(manual){toast('Buscando taxas no Banco Central…')}
 try{const out={};const hist={};
  const [se,cd,ip,tr,im]=await Promise.all([bcbSerie(...BCB.selic),bcbSerie(...BCB.cdi),bcbSerie(...BCB.ipca),bcbSerie(...BCB.tr).catch(()=>null),bcbSerie(...BCB.ipcam).catch(()=>null)]);
  if(se&&se.length)out.selic=bcbVal(se[se.length-1]);if(cd&&cd.length)out.cdi=bcbVal(cd[cd.length-1]);if(ip&&ip.length)out.ipca=bcbVal(ip[ip.length-1]);if(tr&&tr.length)out.tr=bcbVal(tr[tr.length-1]);
  if(im)for(const x of im){const[d,m,y]=String(x.data).split('/');hist[y+'-'+m]=bcbVal(x)}
  if(!Object.keys(out).length)throw new Error('vazio');
  const ref={selic:se?.[se.length-1]?.data,ipca:ip?.[ip.length-1]?.data};
  await saveApp({rates:{...curRates(),...out},ratesAt:new Date().toISOString(),ratesRef:ref,ipcaHist:{...(appCfg().ipcaHist||{}),...hist}});
  if(manual)toast('Taxas atualizadas');
 }catch(e){console.warn('bcb',e);if(manual)toast('Não consegui falar com o Banco Central agora. Tente mais tarde ou edite as taxas.')}finally{ratesBusy=false}}
function maybeRefreshRates(){const a=appCfg();if(a.ratesAuto===false)return;const at=a.ratesAt?Date.parse(a.ratesAt):0;if(Date.now()-at>6*3600e3)refreshRates(false)}
function ratesStrip(){const r=curRates(),a=appCfg();const when=a.ratesAt?new Date(a.ratesAt).toLocaleDateString('pt-BR'):null;
 return `<div class="rates"><div class="rt"><small>Selic</small><b>${pctf(r.selic)}</b></div><div class="rt"><small>CDI</small><b>${pctf(r.cdi)}</b></div><div class="rt"><small>IPCA 12m</small><b>${pctf(r.ipca)}</b></div><div class="rt rtx"><small>${a.ratesAuto===false?'Taxas manuais':when?'Banco Central · '+when:'Valores de referência'}</small><span><button class="btn sm" data-act="rates">Taxas</button>${a.ratesAuto===false?'':`<button class="icon-btn plain" style="width:32px;height:32px" data-act="ratesnow" title="Atualizar agora" aria-label="Atualizar agora">↻</button>`}</span></div></div>`}
function formRates(){const a=appCfg(),r=curRates(),l=a.long||{};
 openForm({title:'Taxas e indicadores',intro:`<div class="muted" style="font-size:14px">Usadas nas projeções dos investimentos. Com a atualização automática ligada, o Fort busca a Selic, o CDI, o IPCA e a TR no Banco Central (consulta pública e gratuita).</div>`,
  values:{auto:a.ratesAuto!==false,selic:r.selic,cdi:r.cdi,ipca:r.ipca,tr:r.tr,lon:!!l.on,lselic:l.selic??r.selic,lcdi:l.cdi??r.cdi,lipca:l.ipca??r.ipca},
  fields:[{k:'auto',label:'Atualizar automaticamente pelo Banco Central',type:'toggle'},
   {k:'selic',label:RATE_L.selic,type:'pct'},{k:'cdi',label:RATE_L.cdi,type:'pct'},{k:'ipca',label:RATE_L.ipca,type:'pct',hint:'Também é usado para mostrar os valores “em dinheiro de hoje”.'},{k:'tr',label:RATE_L.tr,type:'pct',hint:'Usada na regra da poupança.'},
   {k:'h1',type:'html',html:'<div class="fl"><span style="font-size:15px;color:var(--text)">Cenário de longo prazo</span><em>Se ligado, a partir do 13º mês a projeção usa as taxas abaixo no lugar das atuais (ex.: juros caindo com o tempo).</em></div>'},
   {k:'lon',label:'Usar taxas diferentes depois de 12 meses',type:'toggle'},{k:'lselic',label:'Selic no longo prazo (% a.a.)',type:'pct'},{k:'lcdi',label:'CDI no longo prazo (% a.a.)',type:'pct'},{k:'lipca',label:'IPCA no longo prazo (% a.a.)',type:'pct'}],
  onSave:v=>{const num=(x,d)=>x===''||x==null?d:+x;saveApp({ratesAuto:!!v.auto,rates:{selic:num(v.selic,r.selic),cdi:num(v.cdi,r.cdi),ipca:num(v.ipca,r.ipca),tr:num(v.tr,r.tr)},long:{on:!!v.lon,selic:num(v.lselic,r.selic),cdi:num(v.lcdi,r.cdi),ipca:num(v.lipca,r.ipca)}});toast('Taxas salvas');if(v.auto&&a.ratesAuto===false)setTimeout(()=>refreshRates(true),200)}})}

/* ---------------- investimentos: modelo ---------------- */
const INV_TYPES=[
 {v:'tesouro_selic',l:'Tesouro Selic',e:'🏛️',ix:'selic',rate:0.1,tax:'regressivo'},
 {v:'tesouro_ipca',l:'Tesouro IPCA+',e:'🏛️',ix:'ipca',rate:7,tax:'regressivo'},
 {v:'tesouro_pre',l:'Tesouro Prefixado',e:'🏛️',ix:'pre',rate:13,tax:'regressivo'},
 {v:'cdb',l:'CDB',e:'🏦',ix:'cdi',rate:100,tax:'regressivo'},
 {v:'lci',l:'LCI',e:'🏠',ix:'cdi',rate:90,tax:'isento'},
 {v:'lca',l:'LCA',e:'🌾',ix:'cdi',rate:90,tax:'isento'},
 {v:'caixinha',l:'Caixinha / conta remunerada',e:'🐷',ix:'cdi',rate:100,tax:'regressivo'},
 {v:'poupanca',l:'Poupança',e:'💰',ix:'poupanca',rate:0,tax:'isento'},
 {v:'fundo',l:'Fundo de investimento',e:'📊',ix:'cdi',rate:100,tax:'regressivo'},
 {v:'previdencia',l:'Previdência (PGBL/VGBL)',e:'🧓',ix:'cdi',rate:100,tax:'nenhum'},
 {v:'acoes',l:'Ações',e:'📈',ix:'livre',rate:10,tax:'nenhum'},
 {v:'fii',l:'Fundos imobiliários (FII)',e:'🏢',ix:'livre',rate:10,tax:'isento'},
 {v:'cripto',l:'Criptomoedas',e:'🪙',ix:'livre',rate:10,tax:'nenhum'},
 {v:'outro',l:'Outro',e:'💼',ix:'livre',rate:10,tax:'nenhum'}];
const IXS=[{v:'cdi',l:'% do CDI'},{v:'selic',l:'Selic + taxa fixa'},{v:'ipca',l:'IPCA + taxa fixa'},{v:'pre',l:'Prefixado (% ao ano)'},{v:'poupanca',l:'Regra da poupança'},{v:'livre',l:'Rentabilidade esperada (% ao ano)'}];
const TAXES=[{v:'regressivo',l:'IR regressivo (22,5% até 15%)'},{v:'isento',l:'Isento de IR'},{v:'15',l:'15% sobre o ganho'},{v:'nenhum',l:'Não descontar IR'}];
const invType=v=>INV_TYPES.find(x=>x.v===v)||INV_TYPES[INV_TYPES.length-1];
const ixLabel=i=>{const r=+i.rate||0;switch(i.ix){case 'cdi':return pctf(r,r%1?1:0)+' do CDI';case 'selic':return 'Selic + '+pctf(r);case 'ipca':return 'IPCA + '+pctf(r);case 'pre':return pctf(r)+' a.a. prefixado';case 'poupanca':return 'Regra da poupança';default:return pctf(r)+' a.a. esperado'}};
const activeInvs=()=>S.investments.filter(i=>!i.archived).sort((a,b)=>String(a.name).localeCompare(b.name));
const curYm=()=>ymOf(today());
const mdiff=(a,b)=>{const[ya,ma]=a.split('-').map(Number),[yb,mb]=b.split('-').map(Number);return (yb-ya)*12+(mb-ma)};
const HZ=360; // meses projetados (30 anos)
function annualFor(i,set){const r=+i.rate||0;switch(i.ix){
 case 'cdi':return set.cdi/100*r/100;
 case 'selic':return set.selic/100+r/100;
 case 'ipca':return (1+set.ipca/100)*(1+r/100)-1;
 case 'pre':case 'livre':return r/100;
 case 'poupanca':return set.selic>8.5?Math.pow(1.005*(1+set.tr/100),12)-1:Math.pow(1+0.7*set.selic/100,1)*Math.pow(1+set.tr/100,12)-1;
 default:return 0}}
function monthlyRate(i,ym){const idx=mdiff(curYm(),ym);const L=longRates();const set=(L&&idx>12)?L:curRates();let m=Math.pow(1+annualFor(i,set),1/12)-1;const fee=+i.fee||0;if(fee)m=(1+m)/Math.pow(1+fee/100,1/12)-1;return m}
function ipcaMonthly(ym){const idx=mdiff(curYm(),ym);const L=longRates();const set=(L&&idx>12)?L:curRates();return Math.pow(1+set.ipca/100,1/12)-1}
function plannedAporte(i,ym){const m=+i.monthly||0;if(!m)return 0;const st=ymOf(i.start||today());if(ym<=st)return 0;if(i.aporteEnd&&ym>i.aporteEnd)return 0;return m}
let seriesCache={k:''};
const ratesKey=()=>JSON.stringify([appCfg().rates,appCfg().long]);
function invSeries(i){const k=ver+'|'+ratesKey();if(seriesCache.k!==k)seriesCache={k,m:new Map()};const c=seriesCache.m.get(i.id);if(c)return c;
 const start=ymOf(i.start||today());const endYm=addMonths(curYm(),HZ);const snaps=new Map((i.snaps||[]).map(s=>[s.ym,s]));
 let bal=+i.initial||0,contrib=bal,pbal=bal,pc=bal;const act=new Map(),plan=new Map();
 const s0=snaps.get(start);if(s0){bal=+s0.balance||0;if(s0.aporte!=null&&s0.aporte!=='')contrib+= +s0.aporte}
 act.set(start,{bal:r2(bal),contrib:r2(contrib),real:!!s0});plan.set(start,{bal:r2(pbal),contrib:r2(pc)});
 let lastReal=s0?start:null;
 for(let ym=start,g=0;ym<endYm&&g<1200;g++){const nx=addMonths(ym,1);const r=monthlyRate(i,nx),ap=plannedAporte(i,nx);
  pbal=pbal*(1+r)+ap;pc+=ap;plan.set(nx,{bal:r2(pbal),contrib:r2(pc)});
  const s=snaps.get(nx);if(s){const a=(s.aporte!=null&&s.aporte!=='')?+s.aporte:ap;contrib+=a;bal=+s.balance||0;lastReal=nx}else{bal=bal*(1+r)+ap;contrib+=ap}
  act.set(nx,{bal:r2(bal),contrib:r2(contrib),real:!!s});ym=nx}
 const o={act,plan,start,lastReal};seriesCache.m.set(i.id,o);return o}
const invAt=(i,ym)=>{const s=invSeries(i);if(ym<s.start)return{bal:0,contrib:0};return s.act.get(ym)||s.act.get(addMonths(curYm(),HZ))||{bal:0,contrib:0}};
function irRate(i,ym){switch(i.tax){case 'isento':case 'nenhum':return 0;case '15':return .15;default:{const days=mdiff(ymOf(i.start||today()),ym)*30.4;return days<=180?.225:days<=360?.2:days<=720?.175:.15}}}
const netOf=(i,ym,p)=>{const g=Math.max(0,p.bal-p.contrib);return r2(p.bal-g*irRate(i,ym))};
function deflator(ym){let d=1;const c=curYm();if(ym<=c)return 1;for(let m=addMonths(c,1);m<=ym;m=addMonths(m,1))d*=1+ipcaMonthly(m);return d}
function portfolioAt(ym){let bal=0,contrib=0,net=0;for(const i of activeInvs()){const p=invAt(i,ym);bal+=p.bal;contrib+=p.contrib;net+=netOf(i,ym,p)}return{bal:r2(bal),contrib:r2(contrib),net:r2(net)}}

/* ---------------- gráfico de várias linhas ---------------- */
function multiLine(series,labels,opt={}){const W=opt.W||680,H=opt.H||270,pl=opt.pl||98,pb=30,pt=16,ih=H-pb-pt,iw=W-pl-18;const all=series.flatMap(s=>s.v);let mn=Math.min(0,...all),mx=Math.max(1,...all);const span=mx-mn||1;mx+=span*.06;
 const n=labels.length;const x=k=>pl+(n<=1?iw/2:iw*k/(n-1)),y=v=>pt+ih*(mx-v)/(mx-mn);let g='';
 for(let k=0;k<=4;k++){const val=mn+(mx-mn)*k/4,yy=y(val);g+=`<line x1="${pl}" x2="${W-6}" y1="${yy}" y2="${yy}" stroke="#232a2f"/><text x="${pl-10}" y="${yy+4}" text-anchor="end">${compact(val)}</text>`}
 const step=Math.max(1,Math.ceil(n/(opt.maxLabels||8)));labels.forEach((l,k)=>{const lastGap=(n-1)%step;if((k%step===0&&!(lastGap&&lastGap<step*.6&&k===n-1-lastGap))||k===n-1)g+=`<text x="${x(k)}" y="${H-9}" text-anchor="middle">${esc(l)}</text>`});
 series.forEach(s=>{const d=s.v.map((v,k)=>(k?'L':'M')+x(k).toFixed(1)+' '+y(v).toFixed(1)).join(' ');if(s.fill)g+=`<path d="${d} L${x(n-1)} ${y(mn)} L${x(0)} ${y(mn)} Z" fill="${s.color}" opacity=".12"/>`;g+=`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.w||3}" ${s.dash?'stroke-dasharray="6 6"':''} stroke-linejoin="round"/>`;
  if(n<=40)s.v.forEach((v,k)=>{g+=`<circle cx="${x(k)}" cy="${y(v)}" r="3" fill="${s.color}"><title>${esc(s.name)} · ${esc(labels[k])}: ${esc(moneyRaw(v))}</title></circle>`})});
 return `<div class="legend">${series.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div><svg viewBox="0 0 ${W} ${H}" class="chart">${g}</svg>`}

/* ---------------- tela: investimentos ---------------- */
const HOR=[[1,'1 ano'],[5,'5 anos'],[10,'10 anos'],[20,'20 anos'],[30,'30 anos']];
if(!ui.invH)ui.invH=10;if(ui.invReal==null)ui.invReal=false;
V.investimentos=()=>{const cur=curYm();const invs=activeInvs();const now=portfolioAt(cur);const H=ui.invH;const end=addMonths(cur,H*12);const fut=portfolioAt(end);const df=deflator(end);
 const rows=invs.map(i=>{const p=invAt(i,cur),f=invAt(i,end);const t=invType(i.type);const started=ymOf(i.start||today())<=cur;
  return `<button class="row" data-act="inv" data-id="${i.id}">${i.logo?av(i.name,i.color,i.logo):ib(t.e,i.color||'#3ccf91')}<div class="t"><b>${esc(i.name)}</b><small>${esc(t.l)} · ${esc(ixLabel(i))}${i.institution?' · '+esc(i.institution):''}</small></div><div class="amt"><b>${started?money(p.bal):'<span class="mut">a partir de '+monYr(ymOf(i.start))+'</span>'}</b><small>em ${H} ${H>1?'anos':'ano'}: ${money(ui.invReal?f.bal/df:f.bal)}</small></div></button>`}).join('');
 const years=[];for(let k=0;k<=H;k++)years.push(addMonths(cur,k*12));
 const ser=years.map(m=>portfolioAt(m));const dfs=years.map(m=>ui.invReal?deflator(m):1);
 const chart=invs.length?multiLine([{name:'Patrimônio projetado',color:'#3ccf91',v:ser.map((p,k)=>p.bal/dfs[k]),fill:true},{name:'Total aportado',color:'#9b8cff',v:ser.map((p,k)=>p.contrib/dfs[k]),w:2,dash:true}],years.map(m=>m===cur?'hoje':m.slice(0,4))):'';
 return header('Investimentos',{actions:`<button class="btn" data-act="pdfinv">${I.pdf}<span class="desk">PDF</span></button><button class="btn primary" data-act="newinv">${I.plus} <span>Novo</span></button>`})+ratesStrip()+
 `<div class="card mb kcard"><div class="kgrid"><div><small>Investido hoje</small><b class="big2">${money(now.bal)}</b><small>líquido de IR: ${money(now.net)}</small></div><div><small>Total aportado</small><b>${money(now.contrib)}</b></div><div><small>Rendimento acumulado</small><b class="${now.bal-now.contrib<0?'neg':'pos'}">${money(now.bal-now.contrib)}</b></div><div><small>Em ${H} ${H>1?'anos':'ano'} (${monYr(end)})</small><b class="pos">${money(ui.invReal?fut.bal/df:fut.bal)}</b><small>${ui.invReal?'em dinheiro de hoje':'valor nominal'}</small></div></div></div>
 <div class="filters" style="align-items:center"><div class="chips">${HOR.map(([v,l])=>`<button class="chip ${H===v?'on':''}" data-act="invh" data-k="${v}">${l}</button>`).join('')}</div><label class="sw" style="margin-left:auto;gap:10px;font-size:14px"><span>Descontar inflação</span><input type="checkbox" data-chg="invreal" ${ui.invReal?'checked':''}><i></i></label></div>
 ${invs.length?`<div class="card mb">${chart}<div class="muted" style="font-size:12.5px;margin-top:6px">${ui.invReal?'Valores corrigidos pela inflação projetada (poder de compra de hoje).':'Valores nominais.'} Projeção com as taxas atuais${longRates()?' e o cenário de longo prazo':''}; rentabilidade passada ou estimada não garante resultado futuro.</div></div>`:''}
 ${sec('Meus investimentos')}<div class="list">${rows||`<div class="empty">Cadastre seus investimentos (Tesouro, CDB, LCI, poupança, ações…) para acompanhar o rendimento real e ver a projeção para os próximos anos.<br><button class="btn primary sm mt" data-act="newinv">${I.plus} Novo investimento</button></div>`}</div>
 ${S.investments.some(i=>i.archived)?`<div class="muted mt" style="font-size:13px">${S.investments.filter(i=>i.archived).length} investimento(s) encerrado(s) não aparecem aqui. <a class="link" data-act="invarch">Ver encerrados</a></div>`:''}
 ${ui.invArch?`<div class="list mt">${S.investments.filter(i=>i.archived).map(i=>`<button class="row" data-act="inv" data-id="${i.id}">${ib(invType(i.type).e,'#8e99a3','sm')}<div class="t"><b>${esc(i.name)}</b><small>Encerrado</small></div></button>`).join('')}</div>`:''}`};

V.investimento=()=>{const i=byId('investments',ui.invId);if(!i)return header('Investimento',{back:'investimentos'})+'<div class="empty">Investimento não encontrado.</div>';
 const cur=curYm(),t=invType(i.type),s=invSeries(i);const p=invAt(i,cur);const H=ui.invH;const end=addMonths(cur,H*12);
 const snaps=[...(i.snaps||[])].sort((a,b)=>a.ym<b.ym?-1:1);const hist=appCfg().ipcaHist||{};
 // realizado
 const realRows=snaps.map((x,k)=>{const prev=k?snaps[k-1]:null;const prevBal=prev?+prev.balance:(+i.initial||0);const prevYm=prev?prev.ym:ymOf(i.start||x.ym);let ap=(x.aporte!=null&&x.aporte!=='')?+x.aporte:plannedAporte(i,x.ym);for(let m=addMonths(prevYm,1);m<x.ym;m=addMonths(m,1))ap+=plannedAporte(i,m);ap=r2(ap);
  const rend=r2(+x.balance-prevBal-ap);const base=prevBal+ap/2;const pct=base>0?rend/base:0;let ip=1,has=true;for(let m=addMonths(prevYm,1);m<=x.ym;m=addMonths(m,1)){if(hist[m]==null){has=false;break}ip*=1+hist[m]/100}
  const realPct=has&&prevYm<x.ym?(1+pct)/ip-1:null;const pl=s.plan.get(x.ym);return{x,ap,rend,pct,ipc:has&&prevYm<x.ym?ip-1:null,realPct,plan:pl?pl.bal:null}});
 const totAp=sum(realRows,r=>r.ap),totR=sum(realRows,r=>r.rend);
 // projeção anual
 const yrs=[];for(let k=0;k<=H;k++)yrs.push(addMonths(cur,k*12));
 const open=ui.invYear;
 const projRows=yrs.map((m,k)=>{const q=invAt(i,m);const df=deflator(m);const yr=m.slice(0,4);
  let months='';if(open===m){const ms=[];for(let j=1;j<=12;j++){const mm=addMonths(yrs[k-1]||addMonths(cur,-12),j);if(k===0)break;ms.push(mm)}
   months=ms.map(mm=>{const qq=invAt(i,mm);return `<tr class="sub"><td>${monYr(mm)}</td><td>${money(qq.contrib)}</td><td>${money(qq.bal)}</td><td>${money(netOf(i,mm,qq))}</td><td class="mut">${money(qq.bal/deflator(mm))}</td></tr>`}).join('')}
  return `<tr class="${k?'click':''}" ${k?`data-act="invyear" data-k="${m}"`:''}><td>${k===0?'Hoje':monYr(m)} ${k?`<span class="mut">${open===m?'▾':'▸'}</span>`:''}</td><td>${money(q.contrib)}</td><td><b>${money(q.bal)}</b></td><td>${money(netOf(i,m,q))}</td><td class="mut">${money(q.bal/df)}</td></tr>${months}`}).join('');
 const chartYm=[];const step=H<=2?1:H<=10?6:12;for(let k=0;k<=H*12;k+=step)chartYm.push(addMonths(cur,k));
 const past=[];if(snaps.length){for(let m=snaps[0].ym;m<cur;m=addMonths(m,1))past.push(m)}
 const allYm=[...past,...chartYm];
 const chart=multiLine([{name:'Saldo (real até hoje, depois projetado)',color:i.color||'#3ccf91',v:allYm.map(m=>invAt(i,m).bal),fill:true},{name:'Planejado desde o início',color:'#efb34d',v:allYm.map(m=>m<s.start?0:(s.plan.get(m)?.bal||0)),w:2,dash:true},{name:'Aportado',color:'#9b8cff',v:allYm.map(m=>invAt(i,m).contrib),w:2}],allYm.map(m=>m===cur?'hoje':step>=12?m.slice(0,4):monYr(m)));
 return header(i.name,{back:'investimentos',actions:`<button class="btn" data-act="editinv" data-id="${i.id}">Editar</button><button class="btn primary" data-act="snap" data-id="${i.id}">Atualizar saldo</button>`})+
 `<div class="card mb kcard"><div class="kgrid"><div><small>Saldo hoje</small><b class="big2">${money(p.bal)}</b><small>${s.lastReal?'último saldo informado: '+monYr(s.lastReal):'estimado pela taxa'}</small></div><div><small>Aportado</small><b>${money(p.contrib)}</b></div><div><small>Rendimento</small><b class="${p.bal-p.contrib<0?'neg':'pos'}">${money(p.bal-p.contrib)}</b><small>líquido de IR: ${money(netOf(i,cur,p)-p.contrib)}</small></div><div><small>Em ${H} ${H>1?'anos':'ano'}</small><b class="pos">${money(invAt(i,end).bal)}</b><small>hoje: ${money(invAt(i,end).bal/deflator(end))}</small></div></div>
 <div class="tags mt">${[t.l,ixLabel(i),i.institution,i.tax?TAXES.find(x=>x.v===i.tax)?.l:'',+i.monthly?'Aporte mensal '+money(i.monthly):'',i.maturity?'Vence em '+brDate(i.maturity):'',+i.fee?'Taxa de adm. '+pctf(i.fee)+' a.a.':''].filter(Boolean).map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div></div>
 <div class="filters"><div class="chips">${HOR.map(([v,l])=>`<button class="chip ${H===v?'on':''}" data-act="invh" data-k="${v}">${l}</button>`).join('')}</div></div>
 <div class="card mb">${chart}</div>
 ${sec('Projeção ano a ano')}<div class="card scroll-x mb"><table class="tb"><tr><th>Quando</th><th>Aportado</th><th>Saldo bruto</th><th>Líquido de IR</th><th>Em dinheiro de hoje</th></tr>${projRows}</table><div class="muted" style="font-size:12.5px;margin-top:8px">Toque num ano para ver mês a mês. ${i.maturity?'Depois do vencimento, a projeção considera o valor reaplicado nas mesmas condições.':''}</div></div>
 ${sec('Rendimento real (o que aconteceu)','',`<button class="btn sm" data-act="snap" data-id="${i.id}">${I.plus} Informar saldo</button>`)}
 ${snaps.length?`<div class="card scroll-x"><table class="tb"><tr><th>Mês</th><th>Saldo</th><th>Aporte</th><th>Rendimento</th><th>%</th><th>IPCA</th><th>Real</th><th>Planejado</th><th></th></tr>${realRows.map(r=>`<tr><td>${monYr(r.x.ym)}</td><td><b>${money(r.x.balance)}</b></td><td>${money(r.ap)}</td><td class="${r.rend<0?'neg':'pos'}">${money(r.rend)}</td><td>${pctf(r.pct*100)}</td><td class="mut">${r.ipc==null?'—':pctf(r.ipc*100)}</td><td class="${r.realPct==null?'mut':r.realPct<0?'neg':'pos'}">${r.realPct==null?'—':pctf(r.realPct*100)}</td><td class="mut">${r.plan==null?'—':money(r.plan)}</td><td><button class="link" data-act="snapedit" data-id="${i.id}" data-k="${r.x.ym}">editar</button></td></tr>`).join('')}<tr class="tot"><td>Total</td><td></td><td>${money(totAp)}</td><td class="${totR<0?'neg':'pos'}">${money(totR)}</td><td colspan="5"></td></tr></table><div class="muted" style="font-size:12.5px;margin-top:8px">“Real” é o rendimento descontada a inflação (IPCA do Banco Central) no período.</div></div>`:`<div class="card empty">Todo mês (ou quando quiser), informe o saldo que aparece no banco ou na corretora. O Fort calcula quanto rendeu de verdade, compara com o planejado e desconta a inflação.</div>`}`};

function formInv(i,preset={}){const isNew=!i;const t0=invType(i?.type||preset.type||'cdb');
 const v=i||{type:t0.v,ix:t0.ix,rate:t0.rate,tax:t0.tax,start:today(),initial:'',monthly:'',color:'#3ccf91'};
 openForm({title:isNew?'Novo investimento':'Editar investimento',values:v,
  fields:[{k:'name',label:'Nome',req:1,ph:'Ex.: Tesouro IPCA+ 2035, CDB Nubank',focus:isNew},
   {k:'type',label:'Tipo',type:'select',options:INV_TYPES.map(x=>({v:x.v,l:x.e+' '+x.l})),chg:'invtype'},
   {k:'institution',label:'Instituição',ph:'Banco ou corretora (opcional)'},
   {k:'ix',label:'Como rende',type:'select',options:IXS},
   {k:'rate',label:'Taxa',type:'pct',hint:'% do CDI: ex. 110 · Selic/IPCA + taxa: ex. 6,5 · Prefixado ou esperada: % ao ano'},
   {k:'start',label:'Data da primeira aplicação',type:'date',req:1},
   {k:'initial',label:'Valor aplicado no início',type:'money'},
   {k:'monthly',label:'Aporte mensal planejado',type:'money',hint:'Deixe em branco se não for aportar todo mês'},
   {k:'aporteEnd',label:'Aportar até (opcional)',type:'month'},
   {k:'aporteAccountId',label:'Lançar o aporte mensal como despesa na conta',type:'select',options:()=>[{v:'',l:'Não lançar'},...activeAccs().map(a=>({v:a.id,l:a.name}))],hint:'Cria uma recorrência “Aporte” para o dinheiro sair da conta todo mês'},
   {k:'maturity',label:'Vencimento (opcional)',type:'date'},
   {k:'tax',label:'Imposto de renda na projeção',type:'select',options:TAXES},
   {k:'fee',label:'Taxa de administração (% a.a., opcional)',type:'pct'},
   {k:'color',label:'Cor',type:'color'},{k:'logo',label:'Ícone (imagem do banco ou corretora)',type:'logo'},
   {k:'note',label:'Observações',type:'textarea'},
   ...(isNew?[]:[{k:'archived',label:'Investimento encerrado (resgatado)',type:'toggle'}])],
  onSave:val=>{const o={...(i||{}),...val,id:i?.id||uid(),rate:val.rate===''?0:+val.rate,fee:val.fee===''?0:+val.fee,snaps:i?.snaps||[]};
   if(o.aporteAccountId&&+o.monthly>0)syncAporteRec(o);else if(o.recId){const r=byId('recurrences',o.recId);if(r)put('recurrences',{...r,active:false,end:curYm()});o.recId=''}
   put('investments',o);toast(isNew?'Investimento criado':'Investimento salvo');if(isNew){ui.invId=o.id;go('investimento')}},
  onDelete:i?()=>{if(i.recId){const r=byId('recurrences',i.recId);if(r)put('recurrences',{...r,active:false,end:curYm()})}del('investments',i.id);go('investimentos')}:null,delMsg:'Excluir este investimento e todo o histórico de saldos?'})}
function syncAporteRec(o){let cat=S.categories.find(c=>c.kind==='out'&&norm(c.name)==='investimentos');if(!cat){cat={id:uid(),kind:'out',name:'Investimentos',emoji:'📈',color:'#3ccf91'};put('categories',cat)}
 const st=ymOf(o.start||today());const first=addMonths(st,1)>curYm()?addMonths(st,1):curYm();const day=+String(o.start||today()).slice(8,10)||5;
 const r=(o.recId&&byId('recurrences',o.recId))||{id:uid(),start:dateIn(first,day),skip:[],tags:[]};
 const rec={...r,kind:'out',amount:+o.monthly,desc:'Aporte: '+o.name,day,accountId:o.aporteAccountId,categoryId:cat.id,end:o.aporteEnd||'',active:true,invId:o.id};
 put('recurrences',rec);o.recId=rec.id;maintained=false;setTimeout(maintain,300)}
function formSnap(i,ym){const ex=(i.snaps||[]).find(s=>s.ym===ym);const m=ym||curYm();const est=invAt(i,m);
 openForm({title:(ex?'Editar saldo · ':'Informar saldo · ')+i.name,intro:`<div class="muted" style="font-size:14px">Informe o saldo que aparece no banco/corretora no fim do mês. Estimado pela taxa para ${monYr(m)}: <b>${money(est.bal)}</b>.</div>`,
  values:{ym:m,balance:ex?ex.balance:'',aporte:ex?ex.aporte:plannedAporte(i,m)||''},
  fields:[{k:'ym',label:'Mês',type:'month',req:1},{k:'balance',label:'Saldo no fim do mês',type:'money',req:1,focus:1},{k:'aporte',label:'Aportes no mês (use − para resgate)',type:'money',hint:'Quanto você colocou (ou tirou) neste mês'}],
  onSave:v=>{if(!/^\d{4}-\d{2}$/.test(v.ym)){toast('Escolha o mês');return false}const sn=(i.snaps||[]).filter(s=>s.ym!==v.ym&&s.ym!==ym);sn.push({ym:v.ym,balance:v.balance,aporte:v.aporte});put('investments',{...i,snaps:sn});toast('Saldo registrado')},
  onDelete:ex?()=>put('investments',{...i,snaps:(i.snaps||[]).filter(s=>s.ym!==ym)}):null,delMsg:'Apagar o saldo deste mês?'})}
function homeInvest(){const invs=activeInvs();const cur=curYm();
 if(!invs.length)return sec('Investimentos','investimentos')+`<div class="card"><div class="muted" style="font-size:14px">Acompanhe Tesouro, CDB, poupança e outros, com projeção de até 30 anos.</div><button class="btn primary sm mt" data-act="newinv">${I.plus} Novo investimento</button></div>`;
 const p=portfolioAt(cur),f=portfolioAt(addMonths(cur,120));
 return sec('Investimentos','investimentos')+`<div class="list"><button class="row" data-act="go" data-go="investimentos"><span class="ib" style="--c:#3ccf91">📈</span><div class="t"><b>${money(p.bal)}</b><small>Rendeu ${money(p.bal-p.contrib)} · ${invs.length} investimento${invs.length>1?'s':''}</small></div><div class="amt"><b class="pos">${money(f.bal)}</b><small>em 10 anos</small></div></button></div><div class="rates mini">${['selic','cdi','ipca'].map(k=>`<span><small>${k==='ipca'?'IPCA 12m':k.toUpperCase()==='SELIC'?'Selic':'CDI'}</small> <b>${pctf(curRates()[k])}</b></span>`).join('')}</div>`}

/* ---------------- painel de gráficos do Início ---------------- */
function miniBar(data){const W=380,H=210,pl=76,pb=26,pt=10,ih=H-pb-pt,iw=W-pl-6;const mx=niceMax(Math.max(1,...data.flatMap(d=>[d.inc||0,d.exp||0])));const gw=iw/data.length,bw=Math.min(18,gw/2.8);let g='';
 for(let k=0;k<=3;k++){const y=pt+ih*(1-k/3);g+=`<line x1="${pl}" x2="${W-4}" y1="${y}" y2="${y}" stroke="#232a2f"/><text x="${pl-8}" y="${y+4}" text-anchor="end">${compact(mx*k/3)}</text>`}
 data.forEach((d,k)=>{const cx=pl+gw*k+gw/2;[['inc','#3ccf91',-1],['exp','#f37a72',1]].forEach(([key,c,s])=>{const v=Math.max(0,d[key]||0),h=v/mx*ih;if(h>0)g+=`<rect x="${s<0?cx-bw-1.5:cx+1.5}" y="${pt+ih-h}" width="${bw}" height="${h}" rx="4" fill="${c}"><title>${esc(d.label)}: ${esc(moneyRaw(v))}</title></rect>`});g+=`<text x="${cx}" y="${H-7}" text-anchor="middle">${esc(d.label)}</text>`});
 return `<svg viewBox="0 0 ${W} ${H}" class="chart">${g}</svg>`}
function homeCharts(ym,cls){const cur=curYm();
 const months=range(ym,6).map(m=>({label:monShort(m),...monthSummary(m)}));
 const groups=byCat(monthExp(ym));const tot=sum(groups,g=>g.total);
 const segs=groups.slice(0,6).map(g=>({v:g.total,color:g.cat.color})).concat(groups.length>6?[{v:sum(groups.slice(6),g=>g.total),color:'#8e99a3'}]:[]);
 const pm=projMap();const pms=[];for(let k=-5;k<=6;k++)pms.push(addMonths(cur,k));
 const patV=pms.map(m=>m<=cur?r2(totalBalance(m,false)+portfolioAt(m).bal):(pm.get(m)?.pat||0));
 const invV=pms.map(m=>portfolioAt(m).bal);
 return `<div class="dash ${cls}">
 <div class="card"><div class="dh"><b>Receitas × despesas</b><small>6 meses</small></div><div class="legend"><span><i style="background:var(--in)"></i>Receitas</span><span><i style="background:var(--out)"></i>Despesas</span></div>${miniBar(months)}</div>
 <div class="card click" data-act="go" data-go="analise"><div class="dh"><b>Despesas por categoria</b><small>${monthLabel(ym)}</small></div><div class="donutrow">${donut(segs,'GASTO',compact(tot))}<div class="dleg">${groups.slice(0,5).map(g=>`<div><i style="background:${esc(g.cat.color)}"></i><span>${esc(g.cat.name)}</span><b>${tot?Math.round(g.total/tot*100):0}%</b></div>`).join('')||'<span class="muted">Sem despesas neste mês</span>'}</div></div></div>
 <div class="card click" data-act="go" data-go="projecoes"><div class="dh"><b>Patrimônio</b><small>6 meses atrás → 6 à frente</small></div>${multiLine([{name:'Patrimônio',color:'#3ccf91',v:patV,fill:true},{name:'Investimentos',color:'#9b8cff',v:invV,w:2}],pms.map(m=>m===cur?'hoje':monShort(m)),{maxLabels:5,W:380,H:210,pl:84})}</div>
 </div>`}

/* ---------------- projeção de longo prazo ---------------- */
function avgVariable(){const cur=curYm();const past=range(addMonths(cur,-1),3);return r2(sum(past,m=>sum(monthExp(m).filter(t=>!t.recurId&&!t.loanId&&!t.inst),t=>t.amount))/3)}
function virtualItems(ym){const out=[];
 for(const r of S.recurrences){if(r.active===false||!r.start)continue;if(ym<ymOf(r.start))continue;if(r.end&&ym>r.end)continue;if((r.skip||[]).includes(ym))continue;const date=dateIn(ym,r.day);
  const t={id:'v_'+r.id+'_'+ym,kind:r.kind,amount:+r.amount||0,desc:r.desc||'',date,purchaseDate:date,categoryId:r.categoryId||null,recurId:r.id,virtual:true,paid:false,tags:[]};const c=byId('cards',r.cardId);if(c){t.cardId=c.id;t.inv=invoiceMonthFor(c,date)}else t.accountId=r.accountId;out.push(t)}
 for(const l of S.loans){const n=+l.n||0;if(!l.first)continue;const k=mdiff(ymOf(l.first),ym);if(k<(+l.paidBefore||0)||k>=n||k<0)continue;if((l.skip||[]).includes(k+1))continue;const date=addMonthsDate(l.first,k);
  out.push({id:'v_l_'+l.id+'_'+(k+1),kind:'out',amount:+l.parcel||0,desc:l.name+' '+(k+1)+'/'+n,date,purchaseDate:date,accountId:l.accountId,categoryId:l.categoryId||null,loanId:l.id,virtual:true,tags:[]})}
 return out}
let projCache={k:''};
function projMap(){const k=ver+'|'+ratesKey()+'|'+ui.projVar+'|'+today();if(projCache.k===k)return projCache.m;
 const cur=curYm(),h=horizon(),va=ui.projVar?avgVariable():0;const m=new Map();let raw=0,accVar=0;
 for(let j=0;j<=HZ;j++){const ym=addMonths(cur,j);let inc,exp;
  if(ym<=h){const ms=monthSummary(ym);inc=ms.inc;exp=ms.exp;raw=totalBalance(ym,true)}
  else{const it=virtualItems(ym);inc=sum(it.filter(t=>t.kind==='in'&&!isVR(t.accountId)),t=>t.amount);exp=sum(it.filter(t=>t.kind==='out'),t=>t.amount);raw=r2(raw+sum(it,t=>t.kind==='in'?t.amount:t.kind==='out'?-t.amount:0))}
  if(j>0)accVar+=va;const pf=portfolioAt(ym);const bal=r2(raw-accVar);m.set(ym,{ym,inc,exp,var:j>0?va:0,bal,inv:pf.bal,pat:r2(bal+pf.bal)})}
 projCache={k,m};return m}
if(!ui.projH)ui.projH=10;
V.projecoes=()=>{const cur=curYm();const H=ui.projH;const pm=projMap();const real=!!ui.projReal;const dv=m=>real?deflator(m):1;const va=avgVariable();
 const pts=[];const step=H<=2?1:H<=5?3:12;for(let k=0;k<=H*12;k+=step)pts.push(addMonths(cur,k));
 const chart=multiLine([{name:'Patrimônio total',color:'#3ccf91',v:pts.map(m=>pm.get(m).pat/dv(m)),fill:true},{name:'Investimentos',color:'#9b8cff',v:pts.map(m=>pm.get(m).inv/dv(m)),w:2},{name:'Saldo em contas',color:'#5aa9ff',v:pts.map(m=>pm.get(m).bal/dv(m)),w:2}],pts.map(m=>m===cur?'hoje':step>=12?m.slice(0,4):monYr(m)));
 const yrs=[];for(let y=0;y<H;y++)yrs.push(y);
 const rowsY=yrs.map(y=>{const ms=[];for(let j=1;j<=12;j++)ms.push(addMonths(cur,y*12+j));const last=ms[11];const L=pm.get(last);const inc=sum(ms,m=>pm.get(m).inc),exp=sum(ms,m=>pm.get(m).exp)+sum(ms,m=>pm.get(m).var);const key=String(y);const op=ui.projOpen===key;
  const sub=op?ms.map(m=>{const r=pm.get(m);return `<tr class="sub"><td>${monYr(m)}</td><td class="pos">${money(r.inc)}</td><td class="neg">${money(r.exp+r.var)}</td><td class="${r.bal<0?'neg':''}">${money(r.bal/dv(m))}</td><td>${money(r.inv/dv(m))}</td><td><b>${money(r.pat/dv(m))}</b></td></tr>`}).join(''):'';
  return `<tr class="click" data-act="projopen" data-k="${key}"><td>${monYr(ms[0])} – ${monYr(last)} <span class="mut">${op?'▾':'▸'}</span></td><td class="pos">${money(inc)}</td><td class="neg">${money(exp)}</td><td class="${L.bal<0?'neg':''}">${money(L.bal/dv(last))}</td><td>${money(L.inv/dv(last))}</td><td><b>${money(L.pat/dv(last))}</b></td></tr>${sub}`}).join('');
 const endM=addMonths(cur,H*12);const E=pm.get(endM);
 return header('Projeção de longo prazo',{back:'mais',actions:`<button class="btn" data-act="pdfproj">${I.pdf}<span class="desk">PDF</span></button>`})+`<div class="banner info">Soma o que já está agendado (recorrências, parcelas, financiamentos) e, depois de 12 meses, repete as recorrências ativas. Os investimentos seguem as taxas da tela Investimentos.</div>
 <div class="filters" style="align-items:center"><div class="chips">${[[1,'1 ano'],[2,'2 anos'],[5,'5 anos'],[10,'10 anos'],[20,'20 anos'],[30,'30 anos']].map(([v,l])=>`<button class="chip ${H===v?'on':''}" data-act="projh" data-k="${v}">${l}</button>`).join('')}</div></div>
 <div class="list mb"><label class="row sw" style="cursor:pointer"><span>Descontar gasto variável médio (${money(va)}/mês)</span><input type="checkbox" data-chg="projvar" ${ui.projVar?'checked':''}><i></i></label><label class="row sw" style="cursor:pointer"><span>Mostrar em dinheiro de hoje (descontar inflação)</span><input type="checkbox" data-chg="projreal" ${real?'checked':''}><i></i></label></div>
 <div class="card mb kcard"><div class="kgrid"><div><small>Patrimônio em ${monYr(endM)}</small><b class="big2 ${E.pat<0?'neg':'pos'}">${money(E.pat/dv(endM))}</b></div><div><small>Saldo em contas</small><b class="${E.bal<0?'neg':''}">${money(E.bal/dv(endM))}</b></div><div><small>Investimentos</small><b>${money(E.inv/dv(endM))}</b></div></div></div>
 <div class="card mb">${chart}</div>
 <div class="card scroll-x"><table class="tb"><tr><th>Período</th><th>Receitas</th><th>Despesas</th><th>Saldo em contas</th><th>Investimentos</th><th>Patrimônio</th></tr>${rowsY}</table><div class="muted" style="font-size:12.5px;margin-top:8px">Toque num período para abrir mês a mês. Saldos e patrimônio são do fim de cada período.</div></div>`};

/* ---------------- calendário ---------------- */
if(!ui.cal)ui.cal=curYm();
function calItems(ym){const h=horizon();let items;
 if(ym<=h){items=S.tx.filter(t=>ymOf(t.cardId?(t.purchaseDate||t.date):t.date)===ym&&t.kind!=='invpay').map(t=>({...t,date:t.cardId?(t.purchaseDate||t.date):t.date}));
  for(const c of S.cards){const iv=invoice(c,ym);if(iv.total>0)items.push({id:'inv_'+c.id+ym,kind:'fatura',amount:iv.total,desc:'Fatura '+c.name,date:dueDate(c,ym),cardRef:c.id,paid:iv.status==='paga'})}}
 else items=virtualItems(ym).map(t=>t.cardId?{...t}:t);
 for(const i of activeInvs()){if(i.recId)continue;const a=plannedAporte(i,ym);if(a>0)items.push({id:'ap_'+i.id+ym,kind:'aporte',amount:a,desc:'Aporte: '+i.name,date:dateIn(ym,+String(i.start).slice(8,10)||5),invRef:i.id,virtual:true})}
 return items.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0)}
const calColor=t=>t.kind==='in'?'var(--in)':t.kind==='out'?'var(--out)':t.kind==='fatura'?'var(--warn)':t.kind==='aporte'?'var(--accent)':'#8e99a3';
V.calendario=()=>{const ym=ui.cal,cur=curYm();const items=calItems(ym);const byDay=new Map();for(const t of items){const d=+t.date.slice(8,10);if(!byDay.has(d))byDay.set(d,[]);byDay.get(d).push(t)}
 const [y,m]=ym.split('-').map(Number);const first=new Date(y,m-1,1).getDay();const nd=lastDay(ym);const td=today();const sel=ui.calDay&&ymOf(ui.calDay)===ym?ui.calDay:null;
 let cells='';for(let k=0;k<first;k++)cells+='<div class="cd e"></div>';
 for(let d=1;d<=nd;d++){const ds=ym+'-'+pad(d);const its=byDay.get(d)||[];const net=sum(its,t=>t.kind==='in'?t.amount:t.kind==='transfer'?0:-t.amount);
  cells+=`<button class="cd ${ds===td?'today':''} ${ds===sel?'sel':''}" data-act="calday" data-k="${ds}"><span class="dn">${d}</span><span class="dots">${its.slice(0,4).map(t=>`<i style="background:${calColor(t)}"></i>`).join('')}</span>${its.length?`<span class="dv ${net<0?'neg':'pos'}">${compact(Math.abs(net)).replace('R$ ','')}</span>`:''}</button>`}
 const pm=projMap();const P=pm.get(ym);const ms=ym<=horizon()?monthSummary(ym):{inc:sum(items.filter(t=>t.kind==='in'&&!isVR(t.accountId)),t=>t.amount),exp:sum(items.filter(t=>t.kind==='out'),t=>t.amount)};
 const pf=portfolioAt(ym);const bal=P?P.bal:totalBalance(ym,true);const dayList=sel?(byDay.get(+sel.slice(8,10))||[]):items;
 const yearOpts=[];for(let k=y0(cur)-5;k<=y0(cur)+30;k++)yearOpts.push(k);
 return header('Calendário',{back:'mais',actions:`<button class="btn sm" data-act="caltoday">Hoje</button>`})+
 `<div class="calnav card mb"><button class="icon-btn plain" data-act="calprev" aria-label="Mês anterior">${I.left}</button><select data-chg="calm">${MES.map((n,k)=>`<option value="${pad(k+1)}" ${k+1===m?'selected':''}>${cap(n)}</option>`).join('')}</select><select data-chg="caly">${yearOpts.map(k=>`<option ${k===y?'selected':''}>${k}</option>`).join('')}</select><button class="icon-btn plain" data-act="calnext" aria-label="Próximo mês">${I.right}</button></div>
 <div class="home"><div><div class="card calg"><div class="cw">${['dom','seg','ter','qua','qui','sex','sáb'].map(d=>`<span>${d}</span>`).join('')}</div><div class="cgrid">${cells}</div>
 <div class="legend mt" style="font-size:12.5px"><span><i style="background:var(--in)"></i>Receita</span><span><i style="background:var(--out)"></i>Despesa</span><span><i style="background:var(--warn)"></i>Fatura</span><span><i style="background:var(--accent)"></i>Aporte</span></div></div>
 <div class="card mt kcard"><div class="kgrid"><div><small>Receitas</small><b class="pos">${money(ms.inc)}</b></div><div><small>Despesas</small><b class="neg">${money(ms.exp)}</b></div><div><small>Saldo em contas (fim do mês)</small><b class="${bal<0?'neg':''}">${money(bal)}</b></div><div><small>Investimentos (fim do mês)</small><b>${money(pf.bal)}</b><small>aportado ${money(pf.contrib)}</small></div><div><small>Patrimônio total</small><b class="pos">${money(r2(bal+pf.bal))}</b>${ym>cur?`<small>em dinheiro de hoje: ${money((bal+pf.bal)/deflator(ym))}</small>`:''}</div></div></div></div>
 <div>${sec(sel?fmtDay(sel)+' · '+DOW[dowOf(sel)]:'Lançamentos de '+monthLabel(ym).toLowerCase(),'',sel?`<a data-act="calday" data-k="">Ver o mês todo</a>`:'')}
 <div class="list">${dayList.length?dayList.map(t=>calRow(t)).join(''):'<div class="empty">Nada agendado.</div>'}</div>
 ${ym>horizon()?'<div class="muted mt" style="font-size:12.5px">Mês além dos próximos 12: mostra as recorrências e parcelas que continuam valendo.</div>':''}</div></div>`};
const y0=ym=>+ym.slice(0,4);
function calRow(t){if(t.kind==='fatura')return `<button class="row" data-act="card" data-id="${t.cardRef}">${ib('💳','#efb34d')}<div class="t"><b>${esc(t.desc)}</b><small>${fmtDay(t.date)} · vencimento</small></div><div class="amt"><b class="warn">− ${money(t.amount)}</b>${t.paid?'<small class="pos">paga</small>':''}</div></button>`;
 if(t.kind==='aporte')return `<button class="row" data-act="inv" data-id="${t.invRef}">${ib('📈','#9b8cff')}<div class="t"><b>${esc(t.desc)}</b><small>${fmtDay(t.date)} · planejado</small></div><div class="amt"><b>${money(t.amount)}</b></div></button>`;
 if(t.virtual){const c=catOf(t);return `<div class="row">${ib(c.emoji,c.color)}<div class="t"><b>${esc(txTitle(t))}</b><small>${fmtDay(t.date)} · ${esc(srcName(t))} · previsto</small></div><div class="amt"><b class="${amtCls(t)}">${signed(t)}</b></div></div>`}
 return txRow(t,{date:true})}

/* ---------------- relatórios em PDF ---------------- */
function printDoc(title,subtitle,body){const p=$('#print');const now=new Date();
 p.innerHTML=`<div class="pr"><header class="pr-h"><div class="pr-b">${FORT_SVG}<div><b>${esc(APP.name)}</b><small>${esc(APP.slogan)}</small></div></div><div class="pr-m"><b>${esc(title)}</b><small>${esc(subtitle)}</small><small>Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} por ${esc(myName())}</small></div></header>${body}<footer class="pr-f">${esc(APP.name)} · ${esc(APP.slogan)} · relatório pessoal</footer></div>`;
 document.body.classList.add('printing');const done=()=>{document.body.classList.remove('printing');p.innerHTML='';window.removeEventListener('afterprint',done)};window.addEventListener('afterprint',done);
 setTimeout(()=>{try{window.print()}catch(e){done()}},120)}
const pm$=v=>moneyRaw(v);
const ptable=(head,rows,foot)=>`<table class="pt"><thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody>${foot?`<tfoot>${foot}</tfoot>`:''}</table>`;
const pkpis=k=>`<div class="pk">${k.map(([l,v,c])=>`<div><small>${esc(l)}</small><b class="${c||''}">${v}</b></div>`).join('')}</div>`;
const txLine=t=>{const c=catOf(t);return `<tr><td>${brDate(t.date)}</td><td>${esc(txTitle(t))}${t.inst?` <span class="mut">${t.inst.n}/${t.inst.of}</span>`:''}</td><td>${esc(c.name)}</td><td>${esc(srcName(t))}</td><td>${t.cardId||t.kind==='invpay'?'—':t.paid?'Pago':'Pendente'}</td><td class="r ${t.kind==='in'?'pos':t.kind==='out'?'neg':''}">${t.kind==='in'?'':t.kind==='transfer'?'':'− '}${pm$(t.amount)}</td></tr>`};
function pdfReport(){const rp=ui.rp;const ms=rp.range==='ano'?range(ui.month.slice(0,4)+'-12',12):range(ui.month,+rp.range);const items=[...(ui.rpItems||[])].sort((a,b)=>a.date.localeCompare(b.date));const tot=sum(items,t=>t.amount);const cats=byCat(items);
 const f=[rp.kind==='in'?'Receitas':'Despesas',rp.src?(rp.src.startsWith('c:')?byId('cards',rp.src.slice(2))?.name:byId('accounts',rp.src.slice(2))?.name):'Todas as contas',rp.cat?byId('categories',rp.cat)?.name:'Todas as categorias',rp.tag?'Tag: '+(byId('tags',rp.tag)?.name||''):''].filter(Boolean).join(' · ');
 printDoc('Relatório personalizado',`${monthLabel(ms[0])} a ${monthLabel(ms[ms.length-1])} · ${f}`,
  pkpis([['Total',pm$(tot),rp.kind==='in'?'pos':'neg'],['Lançamentos',String(items.length)],['Média por mês',pm$(tot/ms.length)],['Maior categoria',cats[0]?esc(cats[0].cat.name):'—']])+
  `<h3>Por categoria</h3>`+ptable(['Categoria','Lançamentos','Valor','%'],cats.map(g=>`<tr><td>${esc(g.cat.name)}</td><td>${g.items.length}</td><td class="r">${pm$(g.total)}</td><td class="r">${tot?(g.total/tot*100).toFixed(1).replace('.',','):0}%</td></tr>`),`<tr><td>Total</td><td>${items.length}</td><td class="r">${pm$(tot)}</td><td class="r">100%</td></tr>`)+
  `<h3>Por mês</h3>`+ptable(['Mês','Valor'],ms.map(m=>`<tr><td>${monthLabel(m)}</td><td class="r">${pm$(sum(items.filter(t=>ymOf(t.date)===m),t=>t.amount))}</td></tr>`))+
  `<h3>Todos os lançamentos</h3>`+ptable(['Data','Descrição','Categoria','Conta/cartão','Situação','Valor'],items.map(txLine),`<tr><td colspan="5">Total</td><td class="r">${pm$(tot)}</td></tr>`))}
function pdfMonth(){const ym=ui.month,end=endOf(ym);const ms=monthSummary(ym);const txs=S.tx.filter(t=>ymOf(t.date)===ym||(t.cardId&&t.inv===ym&&ymOf(t.date)!==ym)).sort((a,b)=>a.date.localeCompare(b.date));
 const accs=activeAccs();const ex=byCat(monthExp(ym)),inc=byCat(monthInc(ym));const cur=curYm();const pf=portfolioAt(ym<=cur?ym:ym);
 printDoc('Resumo do mês',monthLabel(ym),
  pkpis([['Receitas',pm$(ms.inc),'pos'],['Despesas',pm$(ms.exp),'neg'],['Resultado',pm$(ms.bal),ms.bal<0?'neg':'pos'],['Saldo em contas',pm$(totalBalance(ym,false))],['Investimentos',pm$(pf.bal)],['Patrimônio',pm$(r2(totalBalance(ym,false)+pf.bal))]])+
  `<h3>Contas</h3>`+ptable(['Conta','Tipo','Saldo realizado','Saldo previsto'],accs.map(a=>`<tr><td>${esc(a.name)}</td><td>${esc(ACC_TYPES.find(x=>x.v===a.type)?.l||'')}</td><td class="r">${pm$(accBalance(a,end,false))}</td><td class="r">${pm$(accBalance(a,end,true))}</td></tr>`),`<tr><td colspan="2">Total</td><td class="r">${pm$(totalBalance(ym,false))}</td><td class="r">${pm$(totalBalance(ym,true))}</td></tr>`)+
  (S.cards.length?`<h3>Cartões</h3>`+ptable(['Cartão','Fatura','Pago','Vencimento','Situação'],S.cards.map(c=>{const iv=invoice(c,ym);return `<tr><td>${esc(c.name)}</td><td class="r">${pm$(iv.total)}</td><td class="r">${pm$(iv.paid)}</td><td>${brDate(iv.due)}</td><td>${esc(iv.status)}</td></tr>`})):'')+
  `<h3>Despesas por categoria</h3>`+ptable(['Categoria','Valor','%'],ex.map(g=>`<tr><td>${esc(g.cat.name)}</td><td class="r">${pm$(g.total)}</td><td class="r">${ms.exp?(g.total/ms.exp*100).toFixed(1).replace('.',','):0}%</td></tr>`))+
  `<h3>Receitas por categoria</h3>`+ptable(['Categoria','Valor'],inc.map(g=>`<tr><td>${esc(g.cat.name)}</td><td class="r">${pm$(g.total)}</td></tr>`))+
  (activeInvs().length?`<h3>Investimentos</h3>`+invTable(ym):'')+
  `<h3>Todos os lançamentos do mês</h3>`+ptable(['Data','Descrição','Categoria','Conta/cartão','Situação','Valor'],txs.map(txLine)))}
function invTable(ym){const invs=activeInvs();return ptable(['Investimento','Tipo','Rentabilidade','Aportado','Saldo','Rendimento','Líquido de IR'],invs.map(i=>{const p=invAt(i,ym);return `<tr><td>${esc(i.name)}</td><td>${esc(invType(i.type).l)}</td><td>${esc(ixLabel(i))}</td><td class="r">${pm$(p.contrib)}</td><td class="r">${pm$(p.bal)}</td><td class="r">${pm$(p.bal-p.contrib)}</td><td class="r">${pm$(netOf(i,ym,p))}</td></tr>`}),(()=>{const t=portfolioAt(ym);return `<tr><td colspan="3">Total</td><td class="r">${pm$(t.contrib)}</td><td class="r">${pm$(t.bal)}</td><td class="r">${pm$(t.bal-t.contrib)}</td><td class="r">${pm$(t.net)}</td></tr>`})())}
function pdfInv(){const cur=curYm(),H=ui.invH,r=curRates(),L=longRates();const yrs=[];for(let k=0;k<=H;k++)yrs.push(addMonths(cur,k*12));
 let realSec='';for(const i of activeInvs()){const sn=[...(i.snaps||[])].sort((a,b)=>a.ym<b.ym?-1:1);if(!sn.length)continue;realSec+=`<h4>${esc(i.name)}</h4>`+ptable(['Mês','Saldo informado','Aporte'],sn.map(s=>`<tr><td>${monthLabel(s.ym)}</td><td class="r">${pm$(s.balance)}</td><td class="r">${pm$(s.aporte||0)}</td></tr>`))}
 printDoc('Investimentos',`Posição em ${monthLabel(cur)} e projeção de ${H} ${H>1?'anos':'ano'}`,
  pkpis([['Selic',pctf(r.selic)],['CDI',pctf(r.cdi)],['IPCA 12m',pctf(r.ipca)],['Fonte',appCfg().ratesAuto===false?'Taxas manuais':'Banco Central']])+(L?`<p class="mut">Cenário de longo prazo após 12 meses: Selic ${pctf(L.selic)}, CDI ${pctf(L.cdi)}, IPCA ${pctf(L.ipca)}.</p>`:'')+
  `<h3>Posição atual</h3>`+invTable(cur)+
  `<h3>Projeção da carteira</h3>`+ptable(['Quando','Aportado','Saldo bruto','Líquido de IR','Em dinheiro de hoje'],yrs.map((m,k)=>{const p=portfolioAt(m);return `<tr><td>${k?monthLabel(m):'Hoje'}</td><td class="r">${pm$(p.contrib)}</td><td class="r">${pm$(p.bal)}</td><td class="r">${pm$(p.net)}</td><td class="r">${pm$(p.bal/deflator(m))}</td></tr>`}))+
  (realSec?`<h3>Saldos informados</h3>${realSec}`:'')+`<p class="mut">Projeções são estimativas com as taxas informadas; não são garantia de rentabilidade.</p>`)}
function pdfProj(){const cur=curYm(),H=ui.projH,pm=projMap();const rows=[];for(let k=1;k<=H*12;k++){const m=addMonths(cur,k);const r=pm.get(m);rows.push(`<tr><td>${monthLabel(m)}</td><td class="r pos">${pm$(r.inc)}</td><td class="r neg">${pm$(r.exp+r.var)}</td><td class="r">${pm$(r.bal)}</td><td class="r">${pm$(r.inv)}</td><td class="r"><b>${pm$(r.pat)}</b></td><td class="r mut">${pm$(r.pat/deflator(m))}</td></tr>`)}
 printDoc('Projeção de longo prazo',`${monthLabel(addMonths(cur,1))} a ${monthLabel(addMonths(cur,H*12))}${ui.projVar?' · com gasto variável médio':''}`,ptable(['Mês','Receitas','Despesas','Saldo em contas','Investimentos','Patrimônio','Em dinheiro de hoje'],rows))}

/* ---------------- ajustes e perfil ---------------- */
V.ajustes=()=>{const p=myPrefs();const mem=ui.members;
 return header('Ajustes e perfil',{back:'mais'})+`<div class="home"><div>
 ${sec('Perfil')}<div class="card"><div class="prof">${meAvatar(72)}<div class="t"><b style="font-size:18px">${esc(myName())}</b><small class="muted">${esc(ME?.email||'')}</small><div class="prof-b"><label class="btn sm">Trocar foto<input type="file" class="fileov" accept="image/*" data-chg="photo"></label>${p.photo?'<button class="btn sm ghost" data-act="photodel">Remover</button>':''}</div></div></div>
 <form class="fl mt" data-form="pname"><span>Seu nome</span><div style="display:flex;gap:8px"><input id="pname" value="${esc(p.name||'')}" placeholder="Como quer ser chamado"><button class="btn primary">Salvar</button></div></form></div>
 ${sec('Aparência')}<div class="card"><div class="bgprev" style="${p.bg?`background-image:url('${p.bg}')`:''}">${p.bg?'':'<span class="muted">Sem imagem de fundo</span>'}</div><div class="prof-b mt"><label class="btn sm primary">Escolher imagem de fundo<input type="file" class="fileov" accept="image/*" data-chg="bgimg"></label>${p.bg?'<button class="btn sm ghost" data-act="bgdel">Remover</button>':''}</div>
 ${p.bg?`<label class="fl mt"><span>Escurecer a imagem (${p.bgDim??70}%)</span><input type="range" min="20" max="92" value="${p.bgDim??70}" data-chg="bgdim" style="padding:0"></label>`:''}
 <div class="fl mt"><span>Cor de destaque</span><div class="swatches">${ACCENTS.map(a=>`<label title="${a.l}"><input type="radio" name="accent" value="${a.v}" data-chg="accent" ${(p.accent||ACCENTS[0].v)===a.v?'checked':''}><span style="background:${a.v}"></span></label>`).join('')}</div></div>
 <div class="muted mt" style="font-size:13px">Foto, fundo e cor valem só para você; cada pessoa escolhe os seus. Os ícones das contas e cartões se trocam no cadastro de cada um.</div></div>
 ${sec('Preferências')}<div class="list"><label class="row sw" style="cursor:pointer"><span>Ocultar valores na tela</span><input type="checkbox" data-chg="hide" ${hideVals?'checked':''}><i></i></label><label class="row sw" style="cursor:pointer"><span>Marca d'água “$” no fundo</span><input type="checkbox" data-chg="mark" ${p.noMark?'':'checked'}><i></i></label><button class="row" data-act="rates"><div class="t"><b>Taxas e indicadores</b><small>Selic, CDI, IPCA e TR das projeções</small></div><span class="mut">${I.right}</span></button><button class="row" data-act="seedcats"><div class="t"><b>Recriar categorias padrão</b><small>Adiciona só as que estiverem faltando</small></div></button></div>
 </div><div>
 ${alertsSection()}
 ${extraSettings()}
 ${sec('Pessoas com acesso')}<div class="list">${mem?mem.map(m=>`<div class="row"><span class="me-av" style="width:34px;height:34px;font-size:13px">${esc(initials(m.email))}</span><div class="t"><b>${esc(m.email)}</b><small>${m.email.toLowerCase()===(ME?.email||'').toLowerCase()?'Você':'Vê e edita tudo'}</small></div>${m.email.toLowerCase()===(ME?.email||'').toLowerCase()?'':`<button class="btn sm ghost danger" data-act="memdel" data-k="${esc(m.email)}">Remover</button>`}</div>`).join(''):'<div class="empty">Carregando…</div>'}
 <form class="row" data-form="memadd" style="gap:8px"><input id="memmail" type="email" placeholder="E-mail da pessoa (ex.: da Thaís)" autocomplete="off"><button class="btn primary sm">Adicionar</button></form></div>
 <div class="muted mt" style="font-size:13px;line-height:1.5">Depois de adicionada, a pessoa abre o mesmo endereço do Fort, toca em “Criar acesso” com esse e-mail e passa a ver e lançar na mesma base.</div>
 ${sec('Instalar como aplicativo')}<div class="card" style="line-height:1.6;font-size:14px">${isStandalone()?'<div class="pill ok mb">✓ Você está usando o Fort instalado</div>':`<button class="btn primary mb" style="display:flex;width:100%;justify-content:center" data-act="install">⬇️ Instalar o Fort neste aparelho</button>`}<b>Android (Chrome):</b> <span class="muted">menu ⋮ → “Adicionar à tela inicial” ou “Instalar app”.</span><br><b>iPhone (Safari):</b> <span class="muted">botão Compartilhar → “Adicionar à Tela de Início”.</span><br><span class="muted">O Fort abre em tela cheia com o ícone próprio, como um aplicativo.</span></div>
 ${sec('Conta')}<div class="list"><button class="row" data-act="go" data-go="importar-exportar"><div class="t"><b>Backup e planilhas</b><small>Exportar, importar e restaurar</small></div><span class="mut">${I.right}</span></button><button class="row" data-act="logout"><div class="t"><b class="neg">Sair</b><small>Desconectar este aparelho</small></div></button></div>
 <div class="muted mt center" style="font-size:12px">${esc(APP.name)} · ${esc(APP.slogan)}</div></div></div>`};
async function loadMembers(){if(!SB)return;const{data,error}=await SB.from('fort_members').select('email').order('email');if(!error){ui.members=data||[];if(ui.view==='ajustes')render()}}

/* ---------------- ações novas ---------------- */
Object.assign(A,{
 logout:async()=>{if(!(await confirmBox('Sair do Fort neste aparelho?','Sair')))return;try{await SB.auth.signOut()}catch(e){}location.reload()},
 newinv:()=>formInv(),inv:d=>{ui.invId=d.id;ui.invYear='';go('investimento')},editinv:d=>formInv(byId('investments',d.id)),
 snap:d=>formSnap(byId('investments',d.id)),snapedit:d=>formSnap(byId('investments',d.id),d.k),
 invh:d=>{ui.invH=+d.k;ui.invYear='';render()},invyear:d=>{ui.invYear=ui.invYear===d.k?'':d.k;render()},invarch:()=>{ui.invArch=!ui.invArch;render()},
 rates:()=>formRates(),ratesnow:()=>refreshRates(true),
 projh:d=>{ui.projH=+d.k;ui.projOpen='';render()},projopen:d=>{ui.projOpen=ui.projOpen===d.k?'':d.k;render()},
 calprev:()=>{ui.cal=addMonths(ui.cal,-1);ui.calDay='';render()},calnext:()=>{ui.cal=addMonths(ui.cal,1);ui.calDay='';render()},caltoday:()=>{ui.cal=curYm();ui.calDay=today();render()},
 calday:d=>{ui.calDay=d.k&&ui.calDay!==d.k?d.k:'';render()},
 pdfreport:()=>pdfReport(),pdfmonth:()=>pdfMonth(),pdfinv:()=>pdfInv(),pdfproj:()=>pdfProj(),
 install:()=>doInstall(),pushon:()=>pushEnable(),pushoff:()=>pushDisable(),pushtest:()=>pushTest(),pushday:d=>pushDays(d.k),installhide:()=>{try{localStorage.setItem('fort.noInstall','1')}catch(e){}render()},
 photodel:()=>savePrefs({photo:''}),bgdel:()=>savePrefs({bg:''}),
 memdel:async d=>{if(!(await confirmBox(`Remover o acesso de ${d.k}?`,'Remover')))return;const{error}=await SB.from('fort_members').delete().eq('email',d.k);if(error)toast('Não foi possível remover');else{toast('Acesso removido');loadMembers()}}
});
Object.assign(CHG,{
 invtype:el=>{const t=invType(el.value);const set=(k,v)=>{const e=document.getElementById('f_'+k);if(e)e.value=v};set('ix',t.ix);set('rate',String(t.rate).replace('.',','));set('tax',t.tax);const n=$('#f_name');if(n&&!n.value)n.placeholder=t.l},
 invreal:el=>{ui.invReal=el.checked;render()},
 pushbudget:async el=>{await savePrefs({alertBudget:el.checked});try{const reg=await navigator.serviceWorker.ready;const s=await reg.pushManager.getSubscription();if(s)await SB.from('fort_push').update({budget:el.checked}).eq('endpoint',s.endpoint)}catch(e){}},projreal:el=>{ui.projReal=el.checked;render()},
 calm:el=>{ui.cal=ui.cal.slice(0,4)+'-'+el.value;ui.calDay='';render()},caly:el=>{ui.cal=el.value+'-'+ui.cal.slice(5,7);ui.calDay='';render()},
 photo:async el=>{const f=el.files[0];el.value='';if(!f)return;try{const u=await imgToDataUrl(f,256,256,.85,true);savePrefs({photo:u});toast('Foto atualizada')}catch(e){toast('Não consegui ler essa imagem')}},
 bgimg:async el=>{const f=el.files[0];el.value='';if(!f)return;toast('Preparando a imagem…');try{const u=await imgToDataUrl(f,1600,1600,.72,false);savePrefs({bg:u});toast('Fundo atualizado')}catch(e){toast('Não consegui ler essa imagem')}},
 bgdim:el=>savePrefs({bgDim:+el.value}),accent:el=>savePrefs({accent:el.value}),mark:el=>savePrefs({noMark:!el.checked})
});
document.addEventListener('submit',async e=>{const f=e.target.dataset&&e.target.dataset.form;
 if(f==='pname'){e.preventDefault();savePrefs({name:($('#pname').value||'').trim()});toast('Nome salvo')}
 if(f==='memadd'){e.preventDefault();const em=($('#memmail').value||'').trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return toast('Digite um e-mail válido');const{error}=await SB.from('fort_members').insert({email:em});if(error&&!/duplicate/i.test(error.message))toast('Não foi possível adicionar');else{toast('Acesso liberado para '+em);loadMembers()}}});
// abrir Ajustes carrega a lista de membros
window.addEventListener('hashchange',()=>{if(location.hash==='#ajustes')openAjustesExtras()});
async function openAjustesExtras(){loadMembers();refreshPushState();loadBackups();ui.bioOk=await bioAvailable();if(ui.view==='ajustes')render()}
