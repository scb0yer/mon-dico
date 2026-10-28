import rawIndex from './data/wordIndex.json' with {type:'json'};
import rawDemoIndex from './data/demoIndex.json' with {type:'json'};
import {aliases} from './dictionary.js';
import {isExcludedEntry} from './vocabularyPolicy.js';
export const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'oe').replace(/[^a-z]/g,'');
const labels={N:'nom commun',A:'adjectif',V:'verbe',D:'adverbe'};
const expand=([id,w,p,f])=>({id,w,p:labels[p],f,b:norm(w)[0]||'_'});
const index=rawIndex.map(expand),demoIndex=rawDemoIndex.map(expand);
const all=[...index,...demoIndex],byForm=new Map();
for(const row of all){if(isExcludedEntry(row.w,row.p))continue;for(const form of new Set([row.w,...row.f])){const key=norm(form);if(!byForm.has(key))byForm.set(key,[]);if(!byForm.get(key).some(r=>r.id===row.id))byForm.get(key).push(row)}}
const spelling=s=>s.toLocaleLowerCase('fr').normalize('NFC').replaceAll('œ','oe').replace(/[’‘]/g,"'").trim();
export function resolveEntries(input){
 const key=norm(input),result=byForm.get(key);
 if(result){const exact=result.filter(row=>[row.w,...row.f].some(form=>spelling(form)===spelling(input)));return exact.length?exact:result;}
 const alias=aliases[input.toLowerCase()];return alias?byForm.get(norm(alias))||[]:[];
}
const cache=new Map();
async function loadBucket(letter){
 if(!cache.has(letter))cache.set(letter,fetch(`${import.meta.env?.BASE_URL || '/'}data/${letter}.json`).then(r=>{if(!r.ok)throw Error('Chargement impossible');return r.json()}).catch(e=>{cache.delete(letter);throw e}));
 return cache.get(letter);
}
export async function loadEntries(rows){
 const buckets=await Promise.all([...new Set(rows.map(r=>r.b))].map(loadBucket));const map=new Map(buckets.flat().map(e=>[e.id,e]));
 return rows.map(r=>map.get(r.id)).filter(Boolean).map(e=>({...e,nature:e.displayNature||e.nature,category:e.nature}));
}
export {index,demoIndex};
