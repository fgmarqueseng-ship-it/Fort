"use strict";
/* =====================================================================
   Fort — pacote 6: compartilhar relatórios em PDF
   Gera o PDF no próprio aparelho e abre a tela de compartilhar do
   sistema (WhatsApp, Telegram, Outlook, Gmail, Drive…). No computador,
   ou onde não houver compartilhamento, o PDF é baixado.
   ===================================================================== */

let shareMode=null;      // quando preenchido, printDoc gera o arquivo em vez de imprimir
let shareReady=null;     // PDF pronto aguardando um toque (quando o celular pede)

function loadH2P(){if(window.html2pdf)return Promise.resolve();
 return new Promise((ok,fail)=>{const s=document.createElement('script');s.src='vendor/html2pdf/html2pdf.bundle.min.js?v=1';s.onload=()=>ok();s.onerror=()=>fail(new Error('Não consegui carregar o gerador de PDF. Verifique a internet.'));document.head.appendChild(s)})}

const fileSafe=s=>String(s||'relatorio').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase();

// mesmo layout do PDF impresso, montado fora da tela
function shareHtml(title,subtitle,body){const now=new Date();
 return `<div class="pr" style="background:#fff;color:#151a1e;width:720px;padding:4px"><header class="pr-h"><div class="pr-b">${FORT_SVG}<div><b>${esc(APP.name)}</b><small>${esc(APP.slogan)}</small></div></div><div class="pr-m"><b>${esc(title)}</b><small>${esc(subtitle)}</small><small>Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} por ${esc(myName())}</small></div></header>${body}<footer class="pr-f">${esc(APP.name)} · ${esc(APP.slogan)} · relatório pessoal</footer></div>`}

async function buildPdfFile(title,subtitle,body){await loadH2P();
 const box=document.createElement('div');box.innerHTML=shareHtml(title,subtitle,body);const el=box.firstElementChild;
 const blob=await html2pdf().set({margin:[12,10,12,10],filename:'x.pdf',image:{type:'jpeg',quality:0.88},
  html2canvas:{scale:1.6,backgroundColor:'#ffffff',useCORS:true,logging:false},
  jsPDF:{unit:'mm',format:'a4',orientation:'portrait',compress:true},
  pagebreak:{mode:['css','legacy'],avoid:['tr','.pk>div','h3','h4']}}).from(el).outputPdf('blob');
 const name=`fort-${fileSafe(title)}-${today()}.pdf`;
 return new File([blob],name,{type:'application/pdf'})}

function downloadFile(file){const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=file.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}

const canShareFile=f=>!!(navigator.share&&navigator.canShare&&navigator.canShare({files:[f]}));

async function shareFile(file,title){
 if(!canShareFile(file)){downloadFile(file);toast('PDF baixado: '+file.name);return}
 try{await navigator.share({files:[file],title:APP.name+' · '+title,text:APP.name+' · '+title});shareReady=null}
 catch(e){if(e&&e.name==='AbortError')return;   // a pessoa fechou a tela de compartilhar
  // o celular às vezes exige um novo toque depois de gerar o arquivo
  shareReady={file,title};shareDialog()}}

function shareDialog(){const r=shareReady;if(!r)return;
 $('#dlg').innerHTML=`<div class="ov" data-ov="dlg" style="z-index:70;align-items:center;padding:20px"><div class="sheet" style="max-width:420px;border-radius:20px"><div class="sheet-hd"><h2>PDF pronto</h2></div><div class="sheet-bd">
 <p class="muted" style="margin:0 0 6px">${esc(r.file.name)}</p>
 <button class="btn primary" style="justify-content:center" data-act="shareagain">📤 Compartilhar</button>
 <button class="btn" style="justify-content:center" data-act="sharedl">⬇️ Baixar o arquivo</button>
 <button class="btn ghost" style="justify-content:center" data-act="dlg" data-k="">Fechar</button></div></div></div>`}

// printDoc passa a servir também para gerar o arquivo de compartilhamento
const _printDocShare=printDoc;
printDoc=function(title,subtitle,body){if(!shareMode)return _printDocShare(title,subtitle,body);
 const job=shareMode;shareMode=null;job.resolve({title,subtitle,body})};

const SHARE_FNS={report:()=>pdfReport(),month:()=>pdfMonth(),inv:()=>pdfInv(),proj:()=>pdfProj(),
 year:()=>pdfAnnual(ui.month.slice(0,4)),yearprev:()=>pdfAnnual(+ui.month.slice(0,4)-1)};

let sharing=false;
async function sharePdf(kind){if(sharing)return;const fn=SHARE_FNS[kind];if(!fn)return;sharing=true;
 try{toast('Preparando o PDF…');
  const doc=await new Promise((resolve,reject)=>{shareMode={resolve};try{fn()}catch(e){shareMode=null;reject(e)}setTimeout(()=>{if(shareMode){shareMode=null;reject(new Error('Nada para compartilhar'))}},3000)});
  const file=await buildPdfFile(doc.title,doc.subtitle,doc.body);
  await shareFile(file,doc.title)}
 catch(e){toast('Não consegui gerar o PDF: '+(e.message||e))}
 finally{sharing=false;shareMode=null}}

Object.assign(A,{
 sharepdf:d=>sharePdf(d.k),
 shareagain:async()=>{const r=shareReady;if(!r)return;$('#dlg').innerHTML='';try{await navigator.share({files:[r.file],title:APP.name+' · '+r.title,text:APP.name+' · '+r.title});shareReady=null}catch(e){if(e&&e.name!=='AbortError'){downloadFile(r.file);toast('Não deu para compartilhar; o PDF foi baixado')}}},
 sharedl:()=>{const r=shareReady;if(!r)return;$('#dlg').innerHTML='';downloadFile(r.file);toast('PDF baixado: '+r.file.name)}
});

/* ---------- botões de compartilhar nas telas ---------- */
const SHARE_ICON='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
const shareBtn=(k,label='Compartilhar',cls='')=>`<button class="btn ${cls}" data-act="sharepdf" data-k="${k}">${SHARE_ICON} ${label}</button>`;

// relatório personalizado: botão ao lado de "Gerar PDF"
{const _rel=V.relatorio;V.relatorio=()=>_rel().replace(/(<button class="btn primary" data-act="pdfreport">[\s\S]*?<\/button>)/g,'$1'+shareBtn('report'))}

// relatórios avançados: linha "Compartilhar PDF"
{const _av=V.avancados;V.avancados=()=>{const h=_av();const card=`<div class="card mb"><b>Compartilhar PDF</b><p class="muted" style="font-size:14px;margin:4px 0 12px">Gera o PDF e abre a lista de apps do celular: WhatsApp, Telegram, Outlook, Gmail, Drive… No computador, o arquivo é baixado.</p><div class="chips">${shareBtn('month','Resumo de '+monthLabel(ui.month),'primary sm')}${shareBtn('inv','Investimentos','sm')}${shareBtn('proj','Projeção','sm')}${shareBtn('year','Anual e IR '+ui.month.slice(0,4),'sm')}${shareBtn('yearprev','Anual e IR '+(+ui.month.slice(0,4)-1),'sm')}${shareBtn('report','Relatório personalizado','sm')}</div></div>`;
 const i=h.indexOf('<div class="list">');return i<0?h+card:h.slice(0,i)+card+h.slice(i)}}

// investimentos e projeção: botão no topo
{const _inv=V.investimentos;if(_inv)V.investimentos=()=>_inv().replace('<button class="btn" data-act="pdfinv">',`<button class="btn" data-act="sharepdf" data-k="inv" aria-label="Compartilhar PDF">${SHARE_ICON}</button><button class="btn" data-act="pdfinv">`)}
{const _pj=V.projecoes;if(_pj)V.projecoes=()=>_pj().replace('<button class="btn" data-act="pdfproj">',`<button class="btn" data-act="sharepdf" data-k="proj" aria-label="Compartilhar PDF">${SHARE_ICON}</button><button class="btn" data-act="pdfproj">`)}
