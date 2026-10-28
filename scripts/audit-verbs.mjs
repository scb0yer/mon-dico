import fs from 'node:fs';
import {missingVerbFields,verbCoverage} from './verb-completeness.mjs';
const entries=fs.readdirSync(new URL('../public/data/',import.meta.url)).filter(n=>n.endsWith('.json')).flatMap(n=>JSON.parse(fs.readFileSync(new URL('../public/data/'+n,import.meta.url),'utf8')));
const verbs=entries.filter(e=>e.nature==='verbe').sort((a,b)=>a.word.localeCompare(b.word,'fr'));
const quote=value=>'"'+String(value).replaceAll('"','""')+'"';
const rows=[['mot','origine','état','à compléter','synonymes renseignés','contraires renseignés','associations','lot']];
for(const e of verbs){const missing=missingVerbFields(e);rows.push([e.word,e.supplement?'renvoi ajouté':'sélection initiale',missing.length?'à compléter':'complète',missing.join(' ; '),e.syn.length,e.ant.length,e.groups.reduce((n,g)=>n+g[2].length,0),e.batch||'']);}
fs.writeFileSync(new URL('../audit-verbes.csv',import.meta.url),'\uFEFF'+rows.map(row=>row.map(quote).join(';')).join('\r\n')+'\r\n');
const coverage=verbCoverage(entries);console.log({total:coverage.total,complete:coverage.complete,pending:coverage.pending,selection:coverage.selection,supplements:coverage.supplements});
for(const word of ['abréger','aboutir','accélérer']){
 const e=verbs.find(e=>e.word===word);console.log(word,e?{etat:missingVerbFields(e).length?'à compléter':'complète',lot:e.batch,associations:e.groups.reduce((n,g)=>n+g[2].length,0)}:'entrée absente');
}
