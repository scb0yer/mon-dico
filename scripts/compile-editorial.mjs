import fs from 'node:fs';
// Source éditoriale unique : les relations sont stockées séparément.
export function readEditorial(){
 const directory=new URL('../editorial/',import.meta.url);
 const files=fs.readdirSync(directory).filter(n=>/^noms-lot-\d+\.json$/.test(n)).sort();
 const records=[...files.flatMap(n=>JSON.parse(fs.readFileSync(new URL(n,directory),'utf8'))),...JSON.parse(fs.readFileSync(new URL('synonymes-complements.json',directory),'utf8'))];
 if(new Set(records.map(r=>r.word)).size!==records.length)throw Error('Fiche éditoriale dupliquée');
 for(const record of records){
  if(!record.word||!record.gender||!record.senses.length)throw Error('Fiche éditoriale incomplète');
  for(const sense of record.senses){
   if(!sense.id||!sense.definition||!sense.example||((!record.relationSupplement||sense.groups.length>0) && (sense.groups.length!==4||sense.groups.some(g=>g[2].length!==5))))throw Error('Sens incomplet : '+record.word);
   Object.assign(sense,{syn:[],ant:[],synLinks:[],antLinks:[]});
  }
 }
 return records;
}
export function applyRelations(records,relations){
 const nodes=new Map();for(const entry of records)for(const sense of entry.senses)nodes.set(entry.word+'#'+sense.id,{entry,sense});
 const used=new Set();
 for(const relation of relations){
  const {a,b,type,note=''}=relation;if(!['synonym','antonym'].includes(type))throw Error('Type de relation inconnu');
  if(a===b)throw Error('Relation réflexive interdite');const from=nodes.get(a),to=nodes.get(b);if(!from||!to)throw Error('Cible de relation absente : '+a+' / '+b);
  const key=type+':'+[a,b].sort().join('|');if(used.has(key))throw Error('Relation dupliquée : '+key);used.add(key);
  const field=type==='synonym'?'syn':'ant',links=type==='synonym'?'synLinks':'antLinks';
  for(const [source,target] of [[from,to],[to,from]]){source.sense[field].push(target.entry.word);source.sense[links].push({word:target.entry.word,entryId:target.entry.id,senseId:target.sense.id,nature:target.entry.category||'nom commun',note})}
 }
 return records;
}
