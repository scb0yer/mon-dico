import data from './data/definitionIndex.json' with {type:'json'};
export const definitionKey = value => value.normalize('NFC').toLocaleLowerCase('fr').replaceAll('œ','oe').replace(/[’‘]/g,"'").replace(/[‐‑]/g,'-').replace(/\s+/g,' ').trim();
export function createDefinitionTokenizer(index){
 const entries=new Map(index.entries.map(([id,word,category])=>[id,{id,word,category}]));
 const forms=new Map(index.forms);const maxWords=Math.max(1,...index.forms.map(([s])=>(s.match(/[\p{L}\p{M}]+(?:-[\p{L}\p{M}]+)*/gu)||[]).length));
 return (text,currentId)=>{
  const atoms=[...text.matchAll(/[\p{L}\p{M}]+(?:[-‐‑][\p{L}\p{M}]+)*/gu)];const output=[];let cursor=0;
  for(let i=0;i<atoms.length;i++){
   let match=null;
   for(let n=Math.min(maxWords,atoms.length-i);n>=1;n--){
    const start=atoms[i].index,end=atoms[i+n-1].index+atoms[i+n-1][0].length;const label=text.slice(start,end);
    if(n>1&&!/^[\p{L}\p{M}\s'’‘‐‑-]+$/u.test(label))continue;
    const targets=(forms.get(definitionKey(label))||[]).filter(id=>id!==currentId).map(id=>entries.get(id)).filter(Boolean);
    if(targets.length){match={start,end,label,targets,n};break}
   }
   if(!match)continue;
   if(match.start>cursor)output.push({text:text.slice(cursor,match.start)});
   output.push({text:match.label,targets:match.targets});cursor=match.end;i+=match.n-1;
  }
  if(cursor<text.length)output.push({text:text.slice(cursor)});
  return output;
 };
}
export const tokenizeDefinition=createDefinitionTokenizer(data);
