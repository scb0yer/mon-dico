import {entryAliases} from '../src/editorialReview.js';
import {isExcludedEntry} from '../src/vocabularyPolicy.js';
import fs from 'node:fs';
import {db,aliases} from '../src/dictionary.js';
import {readEditorial,applyRelations} from './compile-editorial.mjs';
import {buildDefinitionIndex} from './definition-index.mjs';
import {isCompleteVerb,verbCoverage} from './verb-completeness.mjs';
import {buildAlphabeticalIndex,summarizeVocabulary} from '../src/alphabeticalIndex.js';
const selected=JSON.parse(fs.readFileSync(new URL('./selection-8802.json',import.meta.url),'utf8'));
const clean=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'oe').toLowerCase().replace(/[^a-z]/g,'');
const category=d=>d.nature.split(' · ')[0].startsWith('nom commun')?'nom commun':d.nature.split(' · ')[0];
const images={gland:'gland fruit du chêne',maîtresse:'maîtresse enseignante école',baiser:'baiser sur la joue',queue:'queue animal',maquereau:'poisson maquereau',bourse:'bourse porte monnaie',poulet:'poulet animal',canard:'canard animal',souris:'souris animal',poule:'poule animal',cruche:'cruche récipient',buse:'buse rapace',cochon:'cochon animal',blé:'blé céréale',rat:'rat animal',crème:'crème alimentaire',poitrine:null,sein:null};
const entries=selected.map(r=>({id:'r'+r.rank,word:r.word,nature:r.pos,forms:r.forms||[],senseRestriction:r.status==='sens limité'?r.reason:null,definition:null,syn:[],ant:[],synLinks:[],antLinks:[],groups:[],example:'',senses:[],illustrationQuery:r.pos==='nom commun'?(r.status==='sens limité'?(images[r.word]??null):r.word):null,sourceRank:r.added?null:r.rank,source:'Lexique 3.83 ; sélection éditoriale de S. Boyer'}));
const extra=[];
const all=()=>[...entries,...extra];
function getEntry(word,pos){return all().find(e=>e.word===word&&e.nature===pos)}
function ensureEntry(word,pos){let e=getEntry(word,pos);if(!e){e={id:'supplement-'+pos.replaceAll(' ','-')+'-'+clean(word),word,nature:pos,forms:[],definition:null,syn:[],ant:[],synLinks:[],antLinks:[],groups:[],example:'',senses:[],illustrationQuery:pos==='nom commun'?word:null,supplement:true};const stem=e.id;let suffix=2;while(all().some(other=>other.id===e.id))e.id=stem+'-'+suffix++;extra.push(e)}return e}
for(const demo of Object.values(db)){
 const lemma=demo.word==='fine'?'fin':demo.word;
 const e=ensureEntry(lemma,category(demo));
 e.displayNature=demo.nature;
 if(demo.word==='fine')e.forms.push('fine');
 e.senses=[{id:'prototype',label:'Sens du prototype',definition:demo.definition,syn:[],ant:[],synLinks:[],antLinks:[],groups:demo.groups.map(g=>[g[0],g[1],g[2].map(exp=>{const a=[...exp];if((a[2]||a[1])==='fine')a[2]='fin';return a})]),example:demo.example}];
}
const additional=JSON.parse(fs.readFileSync(new URL('../editorial/autres-natures.json',import.meta.url),'utf8'));
const adverbRecords=fs.readdirSync(new URL('../editorial/',import.meta.url)).filter(n=>/^adverbes-lot-\d+\.json$/.test(n)).sort().flatMap(n=>JSON.parse(fs.readFileSync(new URL('../editorial/'+n,import.meta.url),'utf8')));
const adverbWords=new Set();
for(const r of adverbRecords){
 if(r.nature!=='adverbe'||adverbWords.has(r.word)||additional.some(e=>e.word===r.word&&e.nature==='adverbe'))throw Error('Adverbe en doublon ou nature incorrecte : '+r.word);
 adverbWords.add(r.word);
 if(!r.definition||!r.example||r.groups.length!==1||r.groups[0][3]!=='verbe'||r.groups[0][2].length!==5||new Set(r.groups[0][2].map(x=>x[2])).size!==5)throw Error('Fiche d’adverbe incomplète : '+r.word);
}
const adjectiveRecords=fs.readdirSync(new URL('../editorial/',import.meta.url)).filter(n=>/^adjectifs-lot-\d+\.json$/.test(n)).sort().flatMap(n=>JSON.parse(fs.readFileSync(new URL('../editorial/'+n,import.meta.url),'utf8')));
const adjectiveWords=new Set();
for(const r of adjectiveRecords){
 if(r.nature!=='adjectif'||adjectiveWords.has(r.word)||additional.some(e=>e.word===r.word&&e.nature==='adjectif'))throw Error('Adjectif en doublon ou nature incorrecte : '+r.word);adjectiveWords.add(r.word);
 if(!r.definition||!r.example||!r.feminine||r.groups.length!==1||r.groups[0][2].length!==5)throw Error('Fiche d’adjectif incomplète : '+r.word);
}
const verbRecords=fs.readdirSync(new URL('../editorial/',import.meta.url)).filter(n=>/^verbes-lot-\d+\.json$/.test(n)).sort().flatMap(n=>JSON.parse(fs.readFileSync(new URL('../editorial/'+n,import.meta.url),'utf8')));
const verbWords=new Set();
for(const r of verbRecords){
 if(verbWords.has(r.word)||r.nature!=='verbe')throw Error('Verbe en doublon ou nature incorrecte : '+r.word);verbWords.add(r.word);
 for(const key of ['present','futur','imparfait','passeSimple'])if(r.conjugations?.[key]?.length!==6||r.conjugations[key].some(f=>f!==null&&(typeof f!=='string'||!f.trim())))throw Error('Conjugaison incomplète : '+r.word+' / '+key);
 if(!Object.values(r.conjugations).flat().some(Boolean))throw Error('Aucune conjugaison disponible : '+r.word);
 if(r.groups.length!==1||r.groups[0][2].length!==5)throw Error('Cinq adverbes attendus : '+r.word);
 if(!isCompleteVerb(r))throw Error('Fiche verbale incomplète : '+r.word);
}
for(const record of [...additional,...verbRecords,...adjectiveRecords,...adverbRecords]){
 const e=ensureEntry(record.word,record.nature);
 if(record.nature==='adverbe'){e.batch=record.batch;e.invariable=true;}
 if(record.nature==='adjectif'&&record.feminine){e.feminine=record.feminine;e.batch=record.batch;if(record.invariable)e.invariable=true;e.displayNature='adjectif · '+record.word+(record.word===record.feminine?'':' / '+record.feminine);}
 if(record.conjugations){e.conjugations=record.conjugations;e.batch=record.batch;e.forms=[...new Set([...e.forms,...Object.values(record.conjugations).flat().filter(Boolean)])];for(const key of ['displayWord','conjugationOptions','conjugationNote'])if(record[key]!==undefined)e[key]=record[key];}
 Object.assign(e,{forms:[...new Set([...e.forms,...(record.forms||[])])],editorialStatus:'draft',authorship:'Rédaction originale pour monDico ; à relire.',senses:[{id:record.sourceSenseId||'courant',label:record.sourceSenseLabel||'Sens courant',definition:record.definition,example:record.example,groups:record.groups,syn:[],ant:[],synLinks:[],antLinks:[]}]});
}
const authored=readEditorial();
for(const record of authored){const e=getEntry(record.word,'nom commun') || (record.relationSupplement||record.supplement ? ensureEntry(record.word,'nom commun') : null);if(!e)throw Error('Nom absent de la sélection : '+record.word);Object.assign(e,{batch:record.batch||'001',displayWord:record.displayWord,forms:[...new Set([...e.forms,...(record.forms||[])])],gender:record.gender,displayNature:'nom commun '+record.gender,senses:record.senses,editorialStatus:record.editorialStatus,authorship:record.authorship});record.id=e.id;record.category='nom commun';}
const relations=JSON.parse(fs.readFileSync(new URL('../editorial/relations.json',import.meta.url),'utf8'));
applyRelations(authored,relations);
// La même relation est copiée dans les deux sens, au niveau des sens lexicaux.
const linked=new Set();
function link(a,sa,b,sb,type,note){const key=type+':'+[a.id+'#'+sa.id,b.id+'#'+sb.id].sort().join('|');if(linked.has(key))return;linked.add(key);const field=type==='synonym'?'syn':'ant',links=type==='synonym'?'synLinks':'antLinks';for(const [from,sense,to,toSense]of [[a,sa,b,sb],[b,sb,a,sa]]){sense[field].push(to.word);sense[links].push({word:to.word,entryId:to.id,senseId:toSense.id,nature:to.nature,note})}}
const authoredSet=new Set(authored.map(e=>e.word));
for(const demo of Object.values(db)){
 const lemma=demo.word==='fine'?'fin':demo.word,pos=category(demo),a=getEntry(lemma,pos);
 if(pos==='nom commun'&&authoredSet.has(lemma))continue;
 for(const [type,list]of [['synonym',demo.syn],['antonym',demo.ant]])for(const word of list){const b=getEntry(word,pos);if(!b?.senses.length)continue;if(pos==='nom commun'&&authoredSet.has(word))continue;link(a,a.senses[0],b,b.senses[0],type,'Pour le sens indiqué dans cette fiche.');}
}
for(const [a,b,pos]of [['ouvrir','fermer','verbe'],['mobile','immobile','adjectif']]){const first=getEntry(a,pos),second=getEntry(b,pos);if(first?.senses.length&&second?.senses.length)link(first,first.senses[0],second,second.senses[0],'antonym','Pour le sens indiqué.')}
const verbRelations=JSON.parse(fs.readFileSync(new URL('../editorial/relations-verbes.json',import.meta.url),'utf8'));
const verbEdges=new Set();
for(const r of verbRelations){
 const a=getEntry(r.a,'verbe'),b=getEntry(r.b,'verbe'),key=r.type+':'+[r.a,r.b].sort().join('|');
 if(!a?.senses.length||!b?.senses.length||r.a===r.b||verbEdges.has(key)||!['synonym','antonym'].includes(r.type))throw Error('Relation verbale incorrecte : '+key);
 verbEdges.add(key);link(a,a.senses[0],b,b.senses[0],r.type,r.note);
}
const adjectiveRelationsPath=new URL('../editorial/relations-adjectifs.json',import.meta.url);
const adjectiveRelations=fs.existsSync(adjectiveRelationsPath)?JSON.parse(fs.readFileSync(adjectiveRelationsPath,'utf8')):[];
const adjectiveEdges=new Set();
for(const r of adjectiveRelations){
 const a=getEntry(r.a,'adjectif'),b=getEntry(r.b,'adjectif'),key=r.type+':'+[r.a,r.b].sort().join('|');
 if(!a?.senses.length||!b?.senses.length||r.a===r.b||adjectiveEdges.has(key)||!['synonym','antonym'].includes(r.type))throw Error('Relation d’adjectifs incorrecte : '+key);
 adjectiveEdges.add(key);link(a,a.senses[0],b,b.senses[0],r.type,r.note);
}
const adverbRelationsPath=new URL('../editorial/relations-adverbes.json',import.meta.url);
const adverbRelations=fs.existsSync(adverbRelationsPath)?JSON.parse(fs.readFileSync(adverbRelationsPath,'utf8')):[];
const adverbEdges=new Set();
for(const r of adverbRelations){
 const a=getEntry(r.a,'adverbe'),b=getEntry(r.b,'adverbe'),pair=[r.a,r.b].sort().join('|'),key=r.type+':'+pair;
 const opposite=(r.type==='synonym'?'antonym':'synonym')+':'+pair;
 if(!a?.senses.length||!b?.senses.length||r.a===r.b||adverbEdges.has(key)||adverbEdges.has(opposite)||!['synonym','antonym'].includes(r.type))throw Error('Relation d’adverbes incorrecte : '+key);
 adverbEdges.add(key);link(a,a.senses[0],b,b.senses[0],r.type,r.note);
}
for(const alias of entryAliases){const target=getEntry(alias.target,alias.targetNature);if(!target?.senses.length)throw Error('Renvoi sans fiche : '+alias.word);target.forms=[...new Set([...target.forms,alias.word])];}
const visible=()=>all().filter(e=>!isExcludedEntry(e.word,e.nature));
// Renvois des expressions : une cible existe dans l’index, même si sa fiche reste à rédiger.
for(const e of all())for(const sense of e.senses)for(const group of sense.groups){
 const pos=group[3] || (e.nature==='nom commun'?(group[0].includes('adjectifs')?'adjectif':'verbe'):e.nature==='adjectif'?'nom commun':'adverbe');
 for(const exp of group[2]){let target=exp[2]||exp[1];let targetEntry=getEntry(target,pos);if(!targetEntry&&aliases[target]){const alias=getEntry(aliases[target],pos);if(alias){target=alias.word;exp[2]=target;targetEntry=alias}}
  if(!targetEntry && isExcludedEntry(target,pos))ensureEntry(target,pos); // Conserver les anciens renvois masqués sans créer de nouvelle attente visible.
 }
}
for(const e of all()){
 if(e.senses.length){const first=e.senses[0];Object.assign(e,{definition:first.definition,example:first.example,groups:first.groups,syn:first.syn,ant:first.ant,synLinks:first.synLinks,antLinks:first.antLinks});}
}
// Vérification globale de la réciprocité, y compris des fiches du prototype.
for(const e of all())for(const sense of e.senses)for(const field of ['synLinks','antLinks'])for(const edge of sense[field]){
 const target=all().find(x=>x.id===edge.entryId);const other=target?.senses.find(s=>s.id===edge.senseId);
 if(!other?.[field].some(back=>back.entryId===e.id&&back.senseId===sense.id))throw Error('Relation non réciproque : '+e.word+' / '+edge.word);
}
const buckets={};for(const e of all()){const b=clean(e.word)[0]||'_';(buckets[b]??=[]).push(e)}
for(const [b,data]of Object.entries(buckets))fs.writeFileSync(new URL('../public/data/'+b+'.json',import.meta.url),JSON.stringify(data));
const codes={'nom commun':'N',adjectif:'A',verbe:'V',adverbe:'D'},makeIndex=e=>[e.id,e.word,codes[e.nature],e.forms];
fs.writeFileSync(new URL('../src/data/wordIndex.json',import.meta.url),JSON.stringify(entries.map(makeIndex)));
fs.writeFileSync(new URL('../src/data/demoIndex.json',import.meta.url),JSON.stringify(extra.map(makeIndex)));
const completedNouns=all().filter(e=>e.nature==='nom commun'&&e.senses.some(s=>s.groups.length));
const completedSenses=completedNouns.flatMap(e=>e.senses).filter(s=>s.groups.length);
const stats={completedVerbEntries:verbRecords.length,conjugatedVerbEntries:all().filter(e=>e.conjugations).length,verbCooccurrences:verbRecords.reduce((n,r)=>n+r.groups[0][2].length,0),verbRelations:verbRelations.length,completedNounEntries:completedNouns.length,completedNounSenses:completedSenses.length,nounCooccurrences:completedSenses.reduce((n,s)=>n+s.groups.reduce((n,g)=>n+g[2].length,0),0),selectedEntries:entries.length,selectedWords:new Set(entries.map(e=>e.word)).size,supplementaryEntries:extra.length,writtenEntries:all().filter(e=>e.definition).length,nounBatchEntries:authored.filter(r=>!r.relationSupplement).length,nounBatchSenses:authored.filter(r=>!r.relationSupplement).reduce((n,r)=>n+r.senses.length,0),synonymComplementEntries:authored.filter(r=>r.relationSupplement).length,nounBatchRelations:relations.length,synonymRelations:relations.filter(r=>r.type==='synonym').length};
// Le total rédigé inclut les compléments éditoriaux ; l’avancement de la sélection
// compte séparément chaque ligne de la liste initiale, par mot et par nature.
stats.completedAdjectiveEntries=all().filter(e=>e.nature==='adjectif'&&e.definition).length;
stats.adjectiveBatchEntries=adjectiveRecords.length;
stats.adjectiveCooccurrences=adjectiveRecords.reduce((n,r)=>n+r.groups[0][2].length,0);
stats.adjectiveRelations=adjectiveRelations.length;
stats.completedAdverbEntries=all().filter(e=>e.nature==='adverbe'&&e.definition).length;
stats.adverbBatchEntries=adverbRecords.length;
stats.adverbCooccurrences=adverbRecords.reduce((n,r)=>n+r.groups[0][2].length,0);
stats.adverbRelations=adverbRelations.length;
stats.verbCoverage=verbCoverage(visible());
stats.completedVerbEntries=stats.verbCoverage.complete;
stats.corpusByNature=Object.fromEntries(['nom commun','verbe','adjectif','adverbe'].map(nature=>{
 const rows=visible().filter(e=>e.nature===nature),written=rows.filter(e=>e.definition).length;
 return [nature,{total:rows.length,withDefinition:written,withoutDefinition:rows.length-written}];
}));
stats.remainingCorpusEntriesWithoutDefinition=Object.values(stats.corpusByNature).reduce((n,r)=>n+r.withoutDefinition,0);
const readyIds=all().filter(e=>e.definition&&(e.nature!=='verbe'||isCompleteVerb(e))).map(e=>e.id);
fs.writeFileSync(new URL('../src/data/entryStatus.json',import.meta.url),JSON.stringify(readyIds));
stats.rawEntries=all().length;
stats.hiddenEntries=all().filter(e=>isExcludedEntry(e.word,e.nature)).length;
stats.rawCorpusByNature=Object.fromEntries(['nom commun','verbe','adjectif','adverbe'].map(nature=>{const rows=all().filter(e=>e.nature===nature);return[nature,{total:rows.length,withDefinition:rows.filter(e=>e.definition).length,withoutDefinition:rows.filter(e=>!e.definition).length}]}));
stats.indexCoverage=summarizeVocabulary(buildAlphabeticalIndex(all().map(e=>({id:e.id,w:e.word,p:e.nature})),readyIds));
stats.totalEntries=stats.indexCoverage.total;
stats.availableEntries=stats.indexCoverage.available;
stats.pendingEntries=stats.indexCoverage.pending;
stats.selectionByNature=Object.fromEntries(['nom commun','verbe','adjectif','adverbe'].map(nature=>{
 const rows=entries.filter(e=>e.nature===nature&&!isExcludedEntry(e.word,e.nature)),written=rows.filter(e=>getEntry(e.word,nature)?.definition).length;
 return [nature,{selected:rows.length,written,remaining:rows.length-written}];
}));
stats.remainingSelectedEntries=Object.values(stats.selectionByNature).reduce((n,r)=>n+r.remaining,0);
fs.writeFileSync(new URL('../src/data/definitionIndex.json',import.meta.url),JSON.stringify(buildDefinitionIndex(visible())));
fs.writeFileSync(new URL('../src/data/stats.json',import.meta.url),JSON.stringify(stats));
console.log(stats);
