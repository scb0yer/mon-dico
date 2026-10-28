import fs from 'node:fs';
import crypto from 'node:crypto';
import {trustedUrl} from '../src/illustrationRules.js';
import {fileURLToPath} from 'node:url';
import {collectArticle} from './illustration-tools.mjs';
import {isExcludedEntry} from '../src/vocabularyPolicy.js';
import {createReviewPage} from './review-illustrations.mjs';
const root=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const selection=read('editorial/illustrations-selection.json'),registry=read('src/data/illustrations.json');
const index=process.argv.indexOf('--limit');
const limit=index<0?3:Number(process.argv[index+1]);
if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('--limit doit être un entier de 1 à 100.');
const entries=fs.readdirSync(new URL('public/data/',root)).filter(f=>f.endsWith('.json')).flatMap(f=>read('public/data/'+f));
const candidates=[];
for(const request of selection.requests.slice(0,limit)){
  if(selection.blockedWords.includes(request.word) || isExcludedEntry(request.word,'nom commun'))continue;
  const entry=entries.find(e=>e.word===request.word&&e.nature==='nom commun');
  const sense=request.senseId?entry?.senses.find(s=>s.id===request.senseId):entry?.senses[0];
  if(!entry||!sense?.definition)throw Error('Fiche ou sens absent : '+request.word);
  const record={...request,entryId:entry.id,senseId:sense.id,definition:sense.definition};
  try{const row=await collectArticle(record);
    // The reviewer sees these exact local bytes; no unreviewed image goes into public/.
    for(const image of row.images){
      const response=await fetch(image.src,{signal:AbortSignal.timeout(20000)});
      const extension={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[(response.headers.get('content-type')||'').split(';')[0].trim()];
      if(!response.ok||!trustedUrl(response.url,'image')||!extension)throw Error('Miniature inaccessible ou format inattendu.');
      const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>10000000)throw Error('Miniature trop volumineuse.');
      image.sourceDigest=crypto.createHash('sha256').update(bytes).digest('hex');
      image.previewPath='editorial/illustrations-cache/'+image.sourceDigest+'.'+extension;
      fs.mkdirSync(new URL('editorial/illustrations-cache/',root),{recursive:true});fs.writeFileSync(new URL(image.previewPath,root),bytes);
    }
    candidates.push(row);console.log(request.word+` : ${row.images.length} proposition(s), aucune publiée automatiquement.`);}
  catch(error){candidates.push({...record,images:[],error:error.message});console.error(request.word+' : '+error.message);}
}
const report={schemaVersion:1,createdAt:new Date().toISOString(),blockedWords:selection.blockedWords,candidates};
fs.writeFileSync(new URL('editorial/illustrations-candidates.json',root),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(new URL('relecture-illustrations.html',root),createReviewPage(report,registry));
console.log('Ouvrir '+fileURLToPath(new URL('relecture-illustrations.html',root)));
if(candidates.every(row=>!row.images.length)){console.error('Aucune image exploitable collectée. Le catalogue publié reste inchangé.');process.exitCode=1;}
