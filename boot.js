"use strict";
/* =====================================================================
   Fort — login, sincronização com o Supabase e inicialização.
   ===================================================================== */
const CFG=window.FORT_CONFIG||{};

/* ---------- camada de dados: imita a API usada pelo app (collection/doc/onSnapshot) ---------- */
function makeDB(){
 const T='fort_docs';const K=(c,i)=>c+'\u0001'+i;
 const cache={};COLS.forEach(c=>cache[c]=new Map());
 const subs={};let loaded=false,loading=null;
 const pending=new Map();        // gravações em andamento: chave -> dados (ou null = exclusão)
 let outbox={};try{outbox=JSON.parse(localStorage.getItem('fort.outbox')||'{}')}catch(e){}
 const saveOutbox=()=>{try{localStorage.setItem('fort.outbox',JSON.stringify(outbox))}catch(e){}};
 for(const [k,o] of Object.entries(outbox)){const[c,i]=k.split('\u0001');if(!cache[c])continue;pending.set(k,o.op==='del'?null:o.data);if(o.op==='del')cache[c].delete(i);else cache[c].set(i,o.data)}
 const emit=col=>{const l=subs[col];if(!l)return;const docs=[...cache[col].entries()].map(([id,data])=>({id,data:()=>data}));l.forEach(([cb])=>{try{cb({docs,metadata:{fromCache:!loaded}})}catch(e){console.error(e)}})};
 const emitAll=()=>COLS.forEach(emit);
 const errAll=e=>Object.values(subs).forEach(l=>l.forEach(([,er])=>er&&er(e)));
 const mapErr=e=>{const m=String(e?.message||e||'');if(e?.code==='42501'||/row-level security|permission/i.test(m))return{code:'invalid_argument',message:m};if(/fetch|network|Failed|timeout|Load failed/i.test(m)||e instanceof TypeError)return{code:'unavailable',message:m};return{code:'unknown',message:m}};
 async function rawWrite(col,id,op,data){const q=op==='del'?SB.from(T).delete().match({col,id}):SB.from(T).upsert({col,id,data,updated_by:ME?.email||null,updated_at:new Date().toISOString()});const{error}=await q;if(error)throw mapErr(error)}
 async function write(col,id,op,data){const k=K(col,id);if(op==='del'){cache[col].delete(id);pending.set(k,null)}else{cache[col].set(id,data);pending.set(k,data)}
  try{await rawWrite(col,id,op,data);if(outbox[k]){delete outbox[k];saveOutbox()}}
  catch(e){if(e.code==='unavailable'){outbox[k]={op,data};saveOutbox();stale=true;scheduleRender();return}throw e}
  finally{if(!outbox[k]&&pending.get(k)===(op==='del'?null:data))pending.delete(k)}}
 async function flush(){const ks=Object.keys(outbox);if(!ks.length)return;for(const k of ks){const[c,i]=k.split('\u0001');const o=outbox[k];try{await rawWrite(c,i,o.op,o.data);delete outbox[k];pending.delete(k)}catch(e){if(e.code==='unavailable')break;delete outbox[k];pending.delete(k)}}saveOutbox()}
 async function loadAll(){if(loading)return loading;loading=(async()=>{
  await flush();
  const fresh={};COLS.forEach(c=>fresh[c]=new Map());let from=0;const P=1000;
  for(;;){const{data,error}=await SB.from(T).select('col,id,data').order('col').order('id').range(from,from+P-1);if(error)throw mapErr(error);for(const r of data)if(fresh[r.col])fresh[r.col].set(r.id,r.data);if(data.length<P)break;from+=P}
  for(const[k,d]of pending){const[c,i]=k.split('\u0001');if(!fresh[c])continue;if(d===null)fresh[c].delete(i);else fresh[c].set(i,d)}
  COLS.forEach(c=>cache[c]=fresh[c]);loaded=true;stale=false;emitAll()})().catch(e=>{console.warn('load',e);errAll(e);stale=true;scheduleRender()}).finally(()=>{loading=null});return loading}
 function realtime(){SB.channel('fort-docs').on('postgres_changes',{event:'*',schema:'public',table:T},p=>{
   const row=p.eventType==='DELETE'?p.old:p.new;if(!row||!row.col||!cache[row.col])return;const k=K(row.col,row.id);if(pending.has(k))return;
   if(p.eventType==='DELETE')cache[row.col].delete(row.id);else if(row.data!==undefined)cache[row.col].set(row.id,row.data);else{loadAll();return}
   emit(row.col)}).subscribe(st=>{if(st==='SUBSCRIBED'&&loaded)loadAll()})}
 let hiddenAt=0;
 document.addEventListener('visibilitychange',()=>{if(document.hidden)hiddenAt=Date.now();else if(Date.now()-hiddenAt>20000)loadAll()});
 window.addEventListener('online',()=>loadAll());
 return{
  start(){realtime();loadAll()},reload:loadAll,
  collection(col){return{
   doc(id){return{set:body=>write(col,id,'set',body),delete:()=>write(col,id,'del')}},
   onSnapshot(cb,err){(subs[col]=subs[col]||[]).push([cb,err]);if(loaded)emit(col)}}}}}

// grava na hora (a fila original segurava gravações e elas sumiam numa recarga da nuvem)
function enqueue(fn){return fn()}

/* ---------- telas de acesso ---------- */
function authShell(inner){document.body.classList.add('authmode');$('#app').innerHTML=`<div class="auth"><div class="auth-card"><div class="auth-brand">${FORT_SVG}<div><b>${esc(APP.name)}</b><small>${esc(APP.slogan)}</small></div></div>${inner}</div></div>`}
let authTab='in';
function showLogin(msg){const t=authTab;authShell(`<div class="seg mb"><button class="${t==='in'?'on':''}" data-auth="tab" data-k="in">Entrar</button><button class="${t==='up'?'on':''}" data-auth="tab" data-k="up">Criar acesso</button></div>
 ${msg?`<div class="banner ${/enviamos|pronto|criado/i.test(msg)?'info':''}">${esc(msg)}</div>`:''}
 <form data-auth-form="${t}" class="auth-f"><label class="fl"><span>E-mail</span><input id="au_email" type="email" autocomplete="email" required value="${esc(localStorage.getItem('fort.lastEmail')||'')}"></label>
 <label class="fl"><span>Senha</span><input id="au_pass" type="password" autocomplete="${t==='in'?'current-password':'new-password'}" minlength="6" required></label>
 ${t==='up'?'<label class="fl"><span>Repita a senha</span><input id="au_pass2" type="password" autocomplete="new-password" minlength="6" required></label>':''}
 <button class="btn primary" style="justify-content:center;width:100%;padding:13px">${t==='in'?'Entrar':'Criar acesso'}</button></form>
 ${t==='in'?'<button class="link mt" data-auth="forgot" style="display:block;margin:14px auto 0">Esqueci minha senha</button>':'<p class="muted mt" style="font-size:13px;text-align:center">Use o e-mail que foi liberado nos Ajustes do Fort.</p>'}`)}
function showNewPassword(){authShell(`<form data-auth-form="newpass" class="auth-f"><p class="muted">Escolha uma nova senha.</p><label class="fl"><span>Nova senha</span><input id="au_pass" type="password" minlength="6" required autocomplete="new-password"></label><button class="btn primary" style="justify-content:center;width:100%;padding:13px">Salvar senha</button></form>`)}
function showNotMember(email){authShell(`<div class="banner">O e-mail <b>${esc(email)}</b> ainda não tem acesso a este Fort.</div><p class="muted" style="font-size:14px;line-height:1.5">Peça para quem já usa o Fort abrir <b>Ajustes e perfil → Pessoas com acesso</b> e adicionar este e-mail. Depois, toque em “Tentar de novo”.</p><button class="btn primary mt" style="width:100%;justify-content:center" data-auth="retry">Tentar de novo</button><button class="btn ghost mt" style="width:100%;justify-content:center" data-auth="out">Sair</button>`)}
function showConfigMissing(){authShell(`<div class="banner">Falta ligar o Fort ao banco de dados.</div><p class="muted" style="font-size:14px;line-height:1.5">Preencha o endereço e a chave pública (anon) do projeto Supabase no arquivo <b>config.js</b>.</p>`)}
const redirectUrl=()=>location.origin+location.pathname;
document.addEventListener('click',async e=>{const b=e.target.closest('[data-auth]');if(!b)return;e.preventDefault();const k=b.dataset.auth;
 if(k==='tab'){authTab=b.dataset.k;showLogin()}
 else if(k==='forgot'){const em=($('#au_email')?.value||'').trim();if(!em)return toast('Digite seu e-mail primeiro');const{error}=await SB.auth.resetPasswordForEmail(em,{redirectTo:redirectUrl()});showLogin(error?'Não foi possível enviar: '+error.message:'Enviamos um link para redefinir a senha. Confira seu e-mail (e a caixa de spam).')}
 else if(k==='retry')location.reload();else if(k==='out'){await SB.auth.signOut();location.reload()}});
document.addEventListener('submit',async e=>{const f=e.target.dataset&&e.target.dataset.authForm;if(!f)return;e.preventDefault();const btn=e.target.querySelector('button.primary');if(btn){btn.disabled=true;btn.textContent='Aguarde…'}
 const em=($('#au_email')?.value||'').trim().toLowerCase(),pw=$('#au_pass')?.value||'';
 try{
  if(f==='in'){localStorage.setItem('fort.lastEmail',em);const{data,error}=await SB.auth.signInWithPassword({email:em,password:pw});if(error)return showLogin(/confirm/i.test(error.message)?'Confirme seu e-mail pelo link que enviamos antes de entrar.':/invalid/i.test(error.message)?'E-mail ou senha incorretos.':error.message);await enter(data.session)}
  else if(f==='up'){if(pw!==($('#au_pass2')?.value||''))return showLogin('As senhas não são iguais.');localStorage.setItem('fort.lastEmail',em);const{data,error}=await SB.auth.signUp({email:em,password:pw,options:{emailRedirectTo:redirectUrl()}});if(error)return showLogin(error.message);if(data.session)return enter(data.session);authTab='in';showLogin('Acesso criado! Enviamos um e-mail de confirmação. Toque no link do e-mail e depois entre aqui.')}
  else if(f==='newpass'){const{error}=await SB.auth.updateUser({password:pw});if(error)return showNewPassword();toast('Senha alterada');const{data}=await SB.auth.getSession();if(data.session)enter(data.session)}
 }finally{if(btn)btn.disabled=false}});

/* ---------- entrada no app ---------- */
let entered=false;
async function enter(session){if(entered)return;ME={id:session.user.id,email:(session.user.email||'').toLowerCase()};
 const{data:ok,error}=await SB.rpc('fort_is_member');if(error){console.warn(error);authShell(`<div class="banner">Não foi possível conectar ao banco de dados agora.</div><p class="muted">${esc(error.message)}</p><button class="btn primary mt" style="width:100%;justify-content:center" data-auth="retry">Tentar de novo</button>`);return}
 if(!ok)return showNotMember(ME.email);
 entered=true;document.body.classList.remove('authmode');
 const h=decodeURIComponent(location.hash.slice(1));if(V[h]&&h!=='loading')ui.view=h;
 mode='loading';render();DB=makeDB();subscribe();DB.start();
 const wait=setInterval(()=>{if(mode==='db'&&confirmed.size===COLS.length){clearInterval(wait);maybeRefreshRates();if(ui.view==='ajustes')loadMembers()}},500);
 if(ui.view==='ajustes')loadMembers()}

(async()=>{
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
 if(!CFG.url||!CFG.anonKey||/COLE_AQUI/.test(CFG.url+CFG.anonKey)||!window.supabase)return showConfigMissing();
 SB=window.supabase.createClient(CFG.url,CFG.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 SB.auth.onAuthStateChange((ev,s)=>{if(ev==='PASSWORD_RECOVERY')showNewPassword();else if(ev==='SIGNED_OUT'&&entered)location.reload();else if(ev==='SIGNED_IN'&&s&&!entered&&!/type=recovery/.test(location.hash))enter(s)});
 const{data}=await SB.auth.getSession();
 if(/type=recovery/.test(location.hash))return showNewPassword();
 if(data.session)enter(data.session);else showLogin();
})();
