import {index,demoIndex,norm,resolveEntries} from './dictionaryStore.js';
import {isExcludedEntry} from './vocabularyPolicy.js';
// La sélection approuvée est une liste autorisée : « baiser » reste ainsi
// accessible pour son sens limité. Aucun mot absent ne déclenche d'image.
const blocked=new Set(['con','conne','connard','connasse','salope','salaud','pute','putain','merde','bite','couille','couilles','cul','sexe','sexuel','sexuelle','porno','pornographie','penis','vagin','masturbation','enculer','encule','enculee','encules','fuck','shit']);
const isBlocked=s=>!resolveEntries(s).length&&(isExcludedEntry(s,'nom commun')||s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z]+/).some(x=>blocked.has(x))||blocked.has(norm(s)));
const phon=s=>norm(s).replace(/ph/g,'f').replace(/eau/g,'o').replace(/au/g,'o').replace(/qu/g,'k').replace(/(.)\1/g,'$1').replace(/[dtsx]$/,'');
function distance(a,b){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next}return row[b.length];}
const vocabulary=[...new Set([...index,...demoIndex].filter(r=>!isExcludedEntry(r.w,r.p)).map(r=>r.w))].map(w=>({w,n:norm(w),p:phon(w)}));
function suggestions(input){
 const n=norm(input);if(!n||isBlocked(input))return [];
 const p=phon(input),threshold=Math.min(2,Math.max(1,Math.floor(n.length/3)));
 const candidates=[];
 for(const w of vocabulary){if(Math.min(Math.abs(w.n.length-n.length),Math.abs(w.p.length-p.length))>threshold)continue;
 const exact=w.n===n?0:w.p===p?.15:Math.min(distance(n,w.n),distance(p,w.p)+.2);
 if(exact<=threshold)candidates.push({w:w.w,score:exact});}
 return candidates.sort((a,b)=>a.score-b.score||a.w.localeCompare(b.w,'fr')).slice(0,4).map(x=>x.w);
}
export {isBlocked,norm,suggestions};
