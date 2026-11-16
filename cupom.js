"use strict";
/* =====================================================================
   Fort — leitura de cupom fiscal pelo QR Code
   - NFC-e (QR com link da SEFAZ): consulta a nota pelo Supabase
     (função fort_nfce, ver supabase/fort_nfce.sql) e pega loja, data,
     total, forma de pagamento e itens.
   - CF-e SAT (comum em São Paulo): o próprio QR traz data e valor.
   - Se a SEFAZ não responder, usa o que dá para tirar do QR (CNPJ, data,
     às vezes o valor) e o nome da loja pela BrasilAPI.
   A categoria vem das regras, do histórico da loja e do ramo do CNPJ.
   jsQR (vendor/jsqr, Apache-2.0) lê o QR quando o navegador não tem leitor próprio.
   ===================================================================== */

const ICCUPOM=ic('<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2h-2z"/>');
let cpStream=null,cpTimer=null,cpBusy=false,cpDetector=null;

/* ---------------- tela de leitura ---------------- */
function openCupom(){fabMenu(false);if(!S.accounts.length&&!S.cards.length)return A.newtx({});cpBusy=false;
 showModal(`<div class="sheet-hd"><h2>🧾 Ler cupom fiscal</h2><button class="icon-btn" data-act="close" aria-label="Fechar">${I.x}</button></div><div class="sheet-bd">
 <div id="cp_cam" class="cpcam"><video id="cp_video" playsinline muted autoplay></video><div class="cpframe"></div><div id="cp_camtxt" class="cpcamtxt">Abrindo a câmera…</div></div>
 <div id="cp_msg"></div>
 <p class="muted" style="font-size:13.5px;margin:0">Aponte para o QR Code do cupom (fica no fim da nota). O Fort busca a loja, a data, o valor e os itens e já sugere a categoria.</p>
 <label class="btn" style="position:relative;overflow:hidden;justify-content:center">📷 Usar foto do cupom<input type="file" class="fileov" accept="image/*" capture="environment" data-chg="cpfile"></label>
 <details class="cpmore"><summary>Colar o link do QR Code</summary><div class="qkbox" style="margin-top:8px"><input id="cp_url" placeholder="https://www.nfce.fazenda.sp.gov.br/..." autocomplete="off"><button class="btn primary sm" data-act="cpurl">Ler</button></div></details>
 </div>`);
 cpStart()}

async function cpStart(){const v=$('#cp_video'),tx=$('#cp_camtxt');if(!v)return;
 if(!navigator.mediaDevices?.getUserMedia){if(tx)tx.textContent='Câmera indisponível neste navegador. Use a foto do cupom.';return}
 try{cpStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
  if(!$('#cp_video')){cpStop();return}
  v.srcObject=cpStream;await v.play().catch(()=>{});if(tx)tx.textContent='Procurando o QR Code…';cpLoop()}
 catch(e){if(tx)tx.textContent=e&&e.name==='NotAllowedError'?'Permita o uso da câmera (ou use a foto do cupom).':'Não consegui abrir a câmera. Use a foto do cupom.'}}

function cpStop(){clearTimeout(cpTimer);cpTimer=null;if(cpStream){cpStream.getTracks().forEach(t=>t.stop());cpStream=null}}

async function cpDetectorGet(){if(cpDetector!==null)return cpDetector;
 try{if('BarcodeDetector' in window&&(await BarcodeDetector.getSupportedFormats()).includes('qr_code')){cpDetector=new BarcodeDetector({formats:['qr_code']});return cpDetector}}catch(e){}
 cpDetector=false;return false}
let cpJsqrP=null;
function cpJsqr(){if(window.jsQR)return Promise.resolve(window.jsQR);if(!cpJsqrP)cpJsqrP=new Promise((ok,ko)=>{const s=document.createElement('script');s.src='vendor/jsqr/jsQR.min.js';s.onload=()=>ok(window.jsQR);s.onerror=()=>{cpJsqrP=null;ko(new Error('jsQR'))};document.head.appendChild(s)});return cpJsqrP}

// tenta ler um QR de um vídeo, imagem ou canvas
async function cpDecode(src,w,h){const det=await cpDetectorGet();
 if(det){try{const r=await det.detect(src);if(r&&r[0]&&r[0].rawValue)return r[0].rawValue}catch(e){}}
 const jsQR=await cpJsqr().catch(()=>null);if(!jsQR)return '';
 for(const max of [1000,1600,700]){const k=Math.min(1,max/Math.max(w,h));const cw=Math.round(w*k),ch=Math.round(h*k);
  const c=document.createElement('canvas');c.width=cw;c.height=ch;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(src,0,0,cw,ch);
  const r=jsQR(g.getImageData(0,0,cw,ch).data,cw,ch,{inversionAttempts:'attemptBoth'});if(r&&r.data)return r.data;if(k===1)break}
 return ''}

function cpLoop(){cpTimer=setTimeout(async()=>{const v=$('#cp_video');if(!v||!cpStream){cpStop();return}
 if(cpBusy||v.readyState<2||!v.videoWidth){cpLoop();return}
 let txt='';try{txt=await cpDecode(v,v.videoWidth,v.videoHeight)}catch(e){}
 if(txt&&!cpBusy){cpStop();if(navigator.vibrate)try{navigator.vibrate(60)}catch(e){};cpHandle(txt);return}
 cpLoop()},cpDetector?200:350)}

async function cpFromFile(file){if(!file)return;const msg=$('#cp_msg');if(msg)msg.innerHTML=cpLoading('Procurando o QR Code na foto…');
 try{const url=URL.createObjectURL(file);const img=new Image();await new Promise((ok,ko)=>{img.onload=ok;img.onerror=ko;img.src=url});
  const txt=await cpDecode(img,img.naturalWidth,img.naturalHeight);URL.revokeObjectURL(url);
  if(!txt){if(msg)msg.innerHTML='<div class="banner">Não achei o QR Code na foto. Tire de perto, só do QR, com boa luz.</div>';return}
  cpStop();cpHandle(txt)}
 catch(e){if(msg)msg.innerHTML='<div class="banner">Não consegui abrir a foto.</div>'}}

const cpLoading=t=>`<div class="loading" style="min-height:90px"><div class="spin"></div>${esc(t)}</div>`;

/* ---------------- entender o QR ---------------- */
function cpQrInfo(raw){raw=String(raw||'').trim();const out={raw,kind:'',url:'',chave:'',amount:0,date:'',cnpj:'',ym:''};
 // CF-e SAT: chave|AAAAMMDDhhmmss|valor|cpf|assinatura
 let m=raw.match(/^(?:CFe)?(\d{44})\|(\d{14})\|([\d.]+)\|/);
 if(m){out.kind='sat';out.chave=m[1];const d=m[2];out.date=`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;out.amount=parseFloat(m[3])||0}
 else{let u;try{u=new URL(raw)}catch(e){return null}if(!/^https?:$/.test(u.protocol))return null;
  out.kind='nfce';
  // SP: o endereço curto /qrcode redireciona para a consulta pública
  if(/(^|\.)nfce\.fazenda\.sp\.gov\.br$/i.test(u.hostname)&&/\/qrcode\/?$/i.test(u.pathname)){u.protocol='https:';u.pathname='/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx'}
  out.url=u.toString();
  const p=u.searchParams.get('p'),ch=u.searchParams.get('chNFe');
  if(p){const f=p.split('|');out.chave=(f[0]||'').replace(/\D/g,'');
   // QR "em contingência" (offline) traz dia e valor: chave|2|amb|dia|valor|digest|csc|hash
   if(f.length>=8){out.amount=parseFloat(f[4])||0;out.day=String(f[3]||'').replace(/\D/g,'').slice(0,2)}}
  else if(ch){out.chave=ch.replace(/\D/g,'');out.amount=parseFloat(u.searchParams.get('vNF'))||0;const dh=u.searchParams.get('dhEmi');
   if(dh&&/^[0-9a-f]+$/i.test(dh)){const s=(dh.match(/../g)||[]).map(h=>String.fromCharCode(parseInt(h,16))).join('');const d2=s.match(/^(\d{4}-\d{2}-\d{2})/);if(d2)out.date=d2[1]}}}
 if(out.chave.length===44){out.ym='20'+out.chave.slice(2,4)+'-'+out.chave.slice(4,6);out.cnpj=out.chave.slice(6,20);if(!out.date&&out.day)out.date=out.ym+'-'+out.day.padStart(2,'0')}
 if(out.date&&!parseDate(out.date))out.date='';
 return out}

/* ---------------- ler a página da SEFAZ ---------------- */
const cpNum=s=>{s=String(s||'').replace(/[^\d,.-]/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');return parseFloat(s)||0};
function cpParseHtml(html){const doc=new DOMParser().parseFromString(String(html||''),'text/html');
 const tx=s=>String(s||'').replace(/\s+/g,' ').trim();const body=tx(doc.body&&doc.body.textContent);
 const r={store:'',cnpj:'',date:'',total:0,discount:0,pay:'',items:[]};
 r.store=tx(doc.querySelector('#u20')?.textContent)||tx(doc.querySelector('.txtTopo')?.textContent);
 let m=body.match(/CNPJ:?\s*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/);if(m)r.cnpj=m[1].replace(/\D/g,'');
 m=body.match(/Emiss[ãa]o:?\s*(\d{2})\/(\d{2})\/(\d{4})/i);if(m)r.date=`${m[3]}-${m[2]}-${m[1]}`;
 doc.querySelectorAll('#tabResult tr').forEach(tr=>{const name=tx((tr.querySelector('span.txtTit2')||tr.querySelector('span.txtTit'))?.textContent);
  const val=cpNum(tr.querySelector('.valor')?.textContent);if(!name||!(val>0))return;
  const qt=cpNum(String(tr.querySelector('.Rqtd')?.textContent||'').replace(/qtde\.?:?/i,''));const un=tx(String(tr.querySelector('.RUN')?.textContent||'').replace(/^\s*UN:?/i,''));
  r.items.push({name,qt,un,val})});
 // linhas de total e pagamento: um rótulo e um span.totalNumb
 const lines=[...doc.querySelectorAll('span.totalNumb')].map(s=>{const par=s.parentElement;const lab=tx(par?.querySelector('label')?.textContent)||tx(String(par?.textContent||'').replace(s.textContent,''));return{lab,val:cpNum(s.textContent)}});
 const find=re=>lines.find(l=>re.test(l.lab));
 const t=find(/valor a pagar/i)||find(/valor total/i);if(t)r.total=t.val;
 const dsc=find(/desconto/i);if(dsc)r.discount=dsc.val;
 const pay=lines.filter(l=>/cr[eé]dito|d[eé]bito|dinheiro|pix|vale|carteira|transfer/i.test(l.lab)).sort((a,b)=>b.val-a.val)[0];if(pay)r.pay=pay.lab;
 if(!r.total){m=body.match(/Valor a pagar R\$:?\s*([\d.]+,\d{2})/i)||body.match(/Valor total R\$:?\s*([\d.]+,\d{2})/i);if(m)r.total=cpNum(m[1])}
 if(!r.total&&r.items.length)r.total=r2(sum(r.items,i=>i.val)-r.discount);
 if(!r.pay){m=body.match(/Forma de pagamento:?.{0,40}?(Cart[ãa]o de Cr[ée]dito|Cart[ãa]o de D[ée]bito|Dinheiro|Pix|Vale [A-Za-zçã]+)/i);if(m)r.pay=m[1]}
 return r}

async function cpSefaz(url){if(!SB)throw new Error('offline');
 const{data,error}=await SB.rpc('fort_nfce',{p_url:url});
 if(error){const e=new Error(error.message);e.setup=/fort_nfce|function|does not exist|http_header|http\b/i.test(error.message);throw e}
 const r=cpParseHtml(typeof data==='string'?data:String(data||''));if(!(r.total>0))throw new Error('sem total');return r}

/* ---------------- CNPJ: nome e ramo da loja ---------------- */
async function cpCnpj(cnpj){cnpj=String(cnpj||'').replace(/\D/g,'');if(cnpj.length!==14)return null;
 const key='fort.cnpj.'+cnpj;try{const c=JSON.parse(localStorage.getItem(key)||'null');if(c)return c}catch(e){}
 try{const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),8000);
  const res=await fetch('https://brasilapi.com.br/api/cnpj/v1/'+cnpj,{signal:ctl.signal});clearTimeout(to);if(!res.ok)return null;
  const j=await res.json();const out={name:j.nome_fantasia||'',legal:j.razao_social||'',cnae:j.cnae_fiscal_descricao||''};
  try{localStorage.setItem(key,JSON.stringify(out))}catch(e){}return out}catch(e){return null}}

// nome da loja mais legível: sem "LTDA", CNPJ de MEI no começo etc.
function cpStoreName(s){s=String(s||'').replace(/^\s*[\d.\/-]{8,}\s*/,'').replace(/\b(LTDA|EIRELI|EPP|S\.?\/?A\.?|ME|SA)\b\.?/gi,' ').replace(/[-–,.]+\s*$/,'').replace(/\s+/g,' ').trim();
 const small=new Set(['de','da','do','das','dos','e']);
 return s.toLowerCase().split(' ').map((w,i)=>i&&small.has(w)?w:w.charAt(0).toUpperCase()+w.slice(1)).join(' ').slice(0,60)}

// ramo do CNPJ (CNAE) ou itens → nome de categoria
const CP_CNAE=[['Mercado','supermercad|hipermercad|minimercad|mercearia|hortifrut|atacad|acougue|produtos alimenticios'],['Saúde','farmac|drogaria|medicament|otica|hospital|clinica|laboratori'],
 ['Alimentação','restaurante|lanchonete|bares|padaria|confeitaria|sorvet|alimentacao|cafe'],['Transporte','combustive|posto|lubrificante|estacionamento|pecas para veiculo'],
 ['Pets','animais|pet|veterinari|racao'],['Compras','vestuario|calcado|departamento|eletrodomestic|cosmetic|perfumaria|artigos|livraria|papelaria|presentes|brinquedo'],
 ['Moradia','material de construcao|ferragens|moveis|tintas'],['Educação','ensino|escola|cursos']];
function cpCatByText(t){t=' '+norm(t)+' ';const cats=S.categories.filter(c=>c.kind==='out');
 for(const[name,kw]of CP_CNAE){if(new RegExp(kw).test(t)){const c=cats.find(c=>norm(c.name)===norm(name))||cats.find(c=>norm(c.name).startsWith(norm(name).slice(0,5)));if(c)return c.id}}
 return ''}

// conta ou cartão: histórico da loja > forma de pagamento > mais usado
function cpSrc(desc,cat,pay){const hist=desc?histTx(desc,'out'):null;const hk=hist?srcKeyOf(hist,'out'):'';
 const p=norm(pay);const credit=/credito/.test(p),cashlike=/debito|pix|dinheiro/.test(p);
 if(hk&&!(credit&&hk.startsWith('a:'))&&!(cashlike&&hk.startsWith('c:')))return hk;
 if(credit&&S.cards.length){const g=srcGuess('out',cat);if(g.startsWith('c:'))return g;const last=[...S.tx].filter(t=>t.cardId&&t.kind==='out'&&byId('cards',t.cardId)).sort((a,b)=>(b.purchaseDate||b.date).localeCompare(a.purchaseDate||a.date))[0];return 'c:'+(last?.cardId||S.cards[0].id)}
 if(p&&/dinheiro/.test(p)){const a=S.accounts.find(a=>!a.archived&&a.type==='dinheiro');if(a)return 'a:'+a.id}
 const g=srcGuess('out',cat);if(g&&!(cashlike&&g.startsWith('c:')))return g;const a=activeAccs()[0];return a?'a:'+a.id:(g||'')}

/* ---------------- montar o lançamento ---------------- */
async function cpHandle(raw){if(cpBusy)return;cpBusy=true;const msg=$('#cp_msg');const cam=$('#cp_cam');
 const info=cpQrInfo(raw);
 if(!info||!info.kind||(info.kind==='nfce'&&!/\.gov\.br$/i.test(new URL(info.url).hostname))){cpBusy=false;if(msg)msg.innerHTML='<div class="banner">Esse QR Code não é de cupom fiscal. Tente o QR do fim da nota.</div>';if($('#cp_video')&&!cpStream)cpStart();return}
 if(info.chave&&S.tx.some(t=>String(t.note||'').includes(info.chave))){
  if(!(await confirmBox('Este cupom já foi lançado. Lançar de novo?','Lançar de novo'))){cpBusy=false;closeModal();return}}
 if(cam)cam.style.display='none';
 const setMsg=h=>{const el=$('#cp_msg');if(el)el.innerHTML=h};
 setMsg(cpLoading(info.kind==='nfce'?'Consultando a nota na SEFAZ…':'Lendo o cupom…'));
 let nota=null,warn='';
 if(info.kind==='nfce'){try{nota=await cpSefaz(info.url)}catch(e){console.warn('SEFAZ',e);warn=e.setup?'Falta rodar o código do cupom fiscal no Supabase, então só deu para ler parte dos dados.':'A SEFAZ não respondeu agora, então só deu para ler parte dos dados.'}}
 const cnpj=nota?.cnpj||info.cnpj;
 let store=nota?.store||'';let cn=null;
 const items=nota?.items||[];const itemsTxt=items.map(i=>i.name).join(' ');
 let desc=cpStoreName(store);
 let cat='';if(desc)cat=guessCat(desc,'out',desc+' '+itemsTxt);
 if(!desc||!cat){cn=await cpCnpj(cnpj);if(cn){if(!desc)desc=cpStoreName(cn.name||cn.legal);if(!cat&&desc)cat=guessCat(desc,'out',desc+' '+cn.cnae+' '+itemsTxt);if(!cat)cat=cpCatByText(cn.cnae+' '+desc)}}
 if(!cat&&itemsTxt)cat=cpCatByText(itemsTxt);
 if(!desc)desc='Cupom fiscal';
 const amount=nota?.total||info.amount||0;
 const date=parseDate(nota?.date||info.date||'')||today();
 const src=cpSrc(desc,cat,nota?.pay||'');
 if(!amount&&!warn)warn='Não achei o valor no cupom.';
 if(!nota?.date&&!info.date)warn=(warn?warn+' ':'')+'Confira a data.';
 // observação com os itens e a chave (a chave evita lançar o mesmo cupom duas vezes)
 const fmtQ=q=>q&&q!==1?String(q).replace('.',',')+'× ':'';
 const lines=items.slice(0,40).map(i=>`• ${fmtQ(i.qt)}${i.name} · ${moneyRaw(i.val)}`);if(items.length>40)lines.push(`• … mais ${items.length-40} itens`);
 const note=[`🧾 Cupom fiscal${items.length?` · ${items.length} ite${items.length>1?'ns':'m'}`:''}${nota?.pay?` · ${nota.pay}`:''}`,...lines,nota?.discount?`Desconto: ${moneyRaw(nota.discount)}`:'',info.chave?`Chave: ${info.chave}`:''].filter(Boolean).join('\n').slice(0,1800);
 cpBusy=false;
 openTx(null,{kind:'out',amount:amount?fmtNum(amount):'',desc,date,src,cat,paid:date<=today(),note});
 toast(warn||(cat?'Cupom lido. Confira e salve.':'Cupom lido. Escolha a categoria e salve.'));
 cpAttach(info,nota,desc,amount,date,cn)}

// anexa um resumo do cupom (texto com o link da SEFAZ) aos comprovantes do lançamento
async function cpAttach(info,nota,desc,amount,date,cn){if(!SB||!draft)return;const d0=draft;
 try{const L=['CUPOM FISCAL',desc,nota?.cnpj||info.cnpj?'CNPJ: '+String(nota?.cnpj||info.cnpj).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,'$1.$2.$3/$4-$5'):'','Data: '+brDate(date),'Total: '+moneyRaw(amount),nota?.pay?'Pagamento: '+nota.pay:'','',
   ...(nota?.items||[]).map(i=>`${i.name}  ${i.qt?String(i.qt).replace('.',','):''} ${i.un||''}  ${moneyRaw(i.val)}`),'',info.chave?'Chave de acesso: '+info.chave:'',info.url?'Consulta na SEFAZ: '+info.url:''].filter((x,i,a)=>x!==''||a[i-1]!=='');
  const blob=new Blob([L.join('\n')],{type:'text/plain;charset=utf-8'});
  const path=`anexos/${curYm()}/${uid()}-cupom-fiscal.txt`;
  const{error}=await SB.storage.from('fort-files').upload(path,blob,{contentType:'text/plain;charset=utf-8',upsert:false});if(error)throw error;
  if(draft!==d0){SB.storage.from('fort-files').remove([path]).catch(()=>{});return}
  syncDraft();draft.attach=[...(draft.attach||[]),{path,name:'cupom-fiscal.txt',type:'text/plain',size:blob.size}];renderTx()}
 catch(e){console.warn('anexo do cupom',e)}}

/* ---------------- página em Mais ---------------- */
V.cupom=()=>header('Ler cupom fiscal',{back:'mais'})+`<div class="card"><p class="muted mb">Leia o QR Code de um cupom fiscal (NFC-e ou SAT) e o Fort cria a despesa com a loja, a data, o valor e a categoria. Os itens da compra ficam na observação.</p>
 <button class="btn primary" style="width:100%;justify-content:center" data-act="cupom">📷 Ler QR Code do cupom</button>
 <p class="muted" style="font-size:12.5px;margin-top:12px">Também pelo botão + (Ler cupom) e pelo atalho do ícone do app.</p></div>`;

Object.assign(A,{cupom:()=>openCupom(),cpurl:()=>{const v=$('#cp_url')?.value||'';if(!v.trim())return toast('Cole o link do QR Code');cpStop();cpHandle(v)}});
Object.assign(CHG,{cpfile:el=>cpFromFile(el.files[0])});
