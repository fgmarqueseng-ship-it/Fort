"use strict";
/* =====================================================================
   Fort — leitura de fatura de cartão ou extrato em PDF.
   Recebe as linhas de texto do PDF e devolve os lançamentos encontrados.
   Funciona com os formatos mais comuns dos bancos brasileiros:
   "12/11 MERCADO 45,90", "12 NOV Mercado R$ 45,90", "12 de nov. 2026 ... - R$ 45,90".
   ===================================================================== */
const PDFP=(()=>{
 const MON={jan:1,fev:2,mar:3,abr:4,mai:5,jun:6,jul:7,ago:8,set:9,out:10,nov:11,dez:12};
 const low=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
 const pad=n=>String(n).padStart(2,'0');
 const DATE=/^(\d{1,2})\s*(?:\/|-|\.|\s+de\s+|\s+)(\d{1,2}|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*\.?(?:(?:\/|-|\.)(\d{4}|\d{2})\b|\s+(?:de\s+)?(\d{4})\b)?/;
 const AMT=/(?:^|\s)([-+])?\s*(?:r\$|us\$|u\$)?\s*([-+])?\s*(\d{1,3}(?:\.\d{3})+,\d{2}|\d+,\d{2})\s*([-+]|d\b|c\b)?\s*$/;
 const SKIP=/^(total|subtotal|saldo|sdo|pagamento(s)?\b|pgto|pag fatura|limite|encargos|juros (do|de) rotativo|valor (total|minimo|pago)|fatura (anterior|atual)|credito de pagamento|resumo|lancamentos|data\b|descricao|vencimento|melhor dia)/;
 const CREDIT=/estorno|reembolso|devolucao|cashback|credito (em conta|de|por)|ajuste a credito|desconto/;
 const money=s=>parseFloat(s.replace(/\./g,'').replace(',','.'));
 // data de vencimento da fatura (para saber o ano das compras sem ano)
 function findDue(text){const t=low(text);
  const m=t.match(/vencimento[^0-9]{0,40}(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/)||t.match(/vence(?:\s+em)?[^0-9]{0,20}(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if(m){let y=+m[3];if(y<100)y+=2000;return y+'-'+pad(+m[2])+'-'+pad(+m[1])}
  const m2=t.match(/vencimento[^0-9]{0,40}(\d{1,2})\s+(?:de\s+)?(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*\.?\s+(?:de\s+)?(\d{4})/);
  if(m2)return m2[3]+'-'+pad(MON[m2[2]])+'-'+pad(+m2[1]);
  return ''}
 // transforma "12/11" em data completa, escolhendo o ano pela data de referência
 function fullDate(d,mo,y,ref){if(!(d>=1&&d<=31&&mo>=1&&mo<=12))return '';
  if(y){y=+y;if(y<100)y+=2000}else{const ry=+ref.slice(0,4),rm=+ref.slice(5,7);y=mo>rm?ry-1:ry}
  return y+'-'+pad(mo)+'-'+pad(d)}
 function parseLines(lines,refDate){const out=[];let bad=0;const ref=refDate||new Date().toISOString().slice(0,10);
  for(const raw of lines){const line=String(raw||'').replace(/\s+/g,' ').trim();if(line.length<8)continue;const l=low(line);
   const dm=l.match(DATE);if(!dm)continue;
   const am=l.slice(dm[0].length).match(AMT);if(!am){bad++;continue}
   const mo=/^\d+$/.test(dm[2])?+dm[2]:MON[dm[2]];const date=fullDate(+dm[1],mo,dm[3]||dm[4],ref);if(!date){bad++;continue}
   const aStart=dm[0].length+am.index;let desc=line.slice(dm[0].length,aStart).replace(/\s*(r\$|us\$|-|\+)\s*$/i,'').replace(/^[\s\-–·|:]+/,'').trim();
   const ld=low(desc);if(!desc||SKIP.test(ld)){continue}
   const v=money(am[3]);if(!(v>0)){bad++;continue}
   const neg=am[1]==='-'||am[2]==='-'||am[4]==='-'||am[4]==='d';const pos=am[1]==='+'||am[2]==='+'||am[4]==='+'||am[4]==='c';
   out.push({date,desc:desc.slice(0,90),amount:Math.round(v*100)/100,neg,pos,credit:CREDIT.test(ld)})}
  return{rows:out,bad}}
 // agrupa os pedaços de texto de uma página em linhas (pela altura na página)
 function groupItems(items){const rows=[];
  for(const it of items){if(!it.str||!it.str.trim())continue;const x=it.transform[4],y=it.transform[5];let r=rows.find(r=>Math.abs(r.y-y)<=2.5);if(!r){r={y,parts:[]};rows.push(r)}r.parts.push({x,s:it.str,w:it.width||0})}
  rows.sort((a,b)=>b.y-a.y);
  return rows.map(r=>{r.parts.sort((a,b)=>a.x-b.x);let s='',end=null;for(const p of r.parts){if(end!==null&&p.x-end>1.5)s+=' ';else if(end!==null&&s&&!/\s$/.test(s)&&p.x-end>0.4)s+=' ';s+=p.s;end=p.x+p.w}return s.replace(/\s+/g,' ').trim()})}
 // despesa ou receita: no cartão, valor com "-" (ou estorno) é crédito; no extrato, "-" é saída
 // e, se o arquivo usa "-" nas saídas, os valores sem sinal são entradas
 function kindFor(x,dest,hasNeg){if(dest==='c')return (x.neg||x.credit)?'in':'out';if(x.neg)return 'out';if(x.pos||x.credit)return 'in';return hasNeg?'in':'out'}
 return{parseLines,groupItems,findDue,kindFor,low}
})();
if(typeof module!=='undefined')module.exports=PDFP;
