export const VERB_TENSES=['present','futur','imparfait','passeSimple'];
export function missingVerbFields(entry){
 const missing=[];
 if(!entry.definition?.trim())missing.push('définition');
 if(!entry.example?.trim())missing.push('exemple');
 const groups=entry.groups||[],expressions=groups.filter(g=>g[0]?.includes('adverbes')).flatMap(g=>g[2]||[]);
 if(expressions.length<5||expressions.some(e=>!e[1]?.trim()||!(e[2]||e[1])?.trim()))missing.push('cinq associations avec des adverbes');
 let hasForm=false,hasUnavailable=false;
 for(const tense of VERB_TENSES){const forms=entry.conjugations?.[tense];
  if(!Array.isArray(forms)||forms.length!==6||forms.some(f=>f!==null&&(typeof f!=='string'||!f.trim())))missing.push('conjugaison : '+tense);
  else{hasForm ||= forms.some(f=>typeof f==='string'&&Boolean(f.trim()));hasUnavailable ||= forms.some(f=>f===null);}
 }
 if(entry.conjugations&&!hasForm)missing.push('au moins une forme conjuguée usuelle');
 if(hasUnavailable&&!entry.conjugationNote?.trim())missing.push('note sur les formes non proposées');
 return missing;
}
export const isCompleteVerb=entry=>missingVerbFields(entry).length===0;
export function verbCoverage(entries){
 const verbs=entries.filter(e=>e.nature==='verbe'),rows=verbs.map(e=>({id:e.id,word:e.word,supplement:Boolean(e.supplement),complete:isCompleteVerb(e),missing:missingVerbFields(e)}));
 rows.sort((a,b)=>a.word.localeCompare(b.word,'fr')||a.id.localeCompare(b.id));
 const summary=list=>({total:list.length,complete:list.filter(e=>e.complete).length,pending:list.filter(e=>!e.complete).length});
 return {...summary(rows),selection:summary(rows.filter(e=>!e.supplement)),supplements:summary(rows.filter(e=>e.supplement)),pendingEntries:rows.filter(e=>!e.complete)};
}
