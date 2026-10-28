import {isExcludedEntry} from './vocabularyPolicy.js';
export const ALPHABET=Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
const collator=new Intl.Collator('fr',{sensitivity:'base',numeric:true});
export function initialLetter(word){return word.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[œŒ]/g,'o').replace(/^[^a-zA-Z]+/,'')[0]?.toUpperCase()||'#';}
export function buildAlphabeticalIndex(rows, readyIds){
 const ready=new Set(readyIds),unique=new Map();
 for(const row of rows){
  if(isExcludedEntry(row.w,row.p))continue;
  const key=row.w+'\0'+row.p,previous=unique.get(key),available=ready.has(row.id);
  if(!previous || (!previous.available&&available))unique.set(key,{id:row.id,word:row.w,nature:row.p,available,letter:initialLetter(row.w)});
 }
 return [...unique.values()].sort((a,b)=>collator.compare(a.word,b.word)||collator.compare(a.nature,b.nature)||a.id.localeCompare(b.id));
}
export function indexPage(rows,letter,page=0,pageSize=80){
 const filtered=rows.filter(r=>r.letter===letter),pages=Math.max(1,Math.ceil(filtered.length/pageSize));
 const currentPage=Math.max(0,Math.min(page,pages-1));
 return {items:filtered.slice(currentPage*pageSize,(currentPage+1)*pageSize),total:filtered.length,pages,page:currentPage};
}

export function summarizeVocabulary(rows){
 const total=rows.length,available=rows.filter(row=>row.available).length;
 return {total,available,pending:total-available};
}

export const NATURES=[
 {value:'nom commun',label:'Noms communs',className:'nature-noun'},
 {value:'adjectif',label:'Adjectifs',className:'nature-adjective'},
 {value:'verbe',label:'Verbes',className:'nature-verb'},
 {value:'adverbe',label:'Adverbes',className:'nature-adverb'}
];
export const natureClass=nature=>NATURES.find(n=>n.value===nature)?.className||'';
export const filterByNature=(rows,nature='')=>nature?rows.filter(row=>row.nature===nature):rows;
