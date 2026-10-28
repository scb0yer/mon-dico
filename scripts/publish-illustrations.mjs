// Run locally after reviewing. Netlify only serves the resulting static files.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {validIllustration} from '../src/illustrationRules.js';
const root=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const registry=read('src/data/illustrations.json'),checkOnly=process.argv.includes('--check');
if(registry.schemaVersion!==1||!Array.isArray(registry.blockedWords)||!registry.entries)throw Error('Catalogue non reconnu.');
const entries=fs.readdirSync(new URL('public/data/',root)).filter(f=>f.endsWith('.json')).flatMap(f=>read('public/data/'+f));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
let count=0;
for(const [key,record]of Object.entries(registry.entries)){
 const entry=entries.find(e=>e.id===record.entryId&&e.word===record.word&&e.nature==='nom commun');
 const sense=entry?.senses.find(s=>s.id===record.senseId);
 if(!sense||sense.definition!==record.definition||key!==record.word.normalize('NFC')+'#'+record.senseId)throw Error('Sens modifié ou fiche absente : '+key);
 if(registry.blockedWords.includes(record.word)||!Array.isArray(record.images)||record.images.length>2)throw Error('Sélection non autorisée : '+key);
 for(const image of record.images){
  if(!validIllustration(image))throw Error('Illustration non validée ou métadonnées incomplètes : '+key);
  if(image.localPath){const file=new URL('public/'+image.localPath,root);if(fs.existsSync(file)&&hash(fs.readFileSync(file))===image.localPath.split('/')[1].split('.')[0]){count++;continue;}if(checkOnly)throw Error('Image locale absente ou modifiée : '+image.localPath);}
  if(checkOnly)throw Error('Image non publiée : '+key+' ; lancer ce script sans --check.');
  if(!/^editorial\/illustrations-cache\/[a-f0-9]{64}\.(?:jpg|png|webp)$/.test(image.previewPath||'') || !/^[a-f0-9]{64}$/.test(image.sourceDigest||''))throw Error('Relancer la collecte pour obtenir une miniature locale vérifiable : '+key);
  const bytes=fs.readFileSync(new URL(image.previewPath,root)),extension=image.previewPath.split('.').at(-1);
  if(hash(bytes)!==image.sourceDigest||bytes.length>10000000)throw Error('La miniature relue a été modifiée : '+key);
  const signature=extension==='jpg'?bytes[0]===255&&bytes[1]===216:extension==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
  if(!signature)throw Error('Contenu du fichier image inattendu : '+key);
  image.localPath='illustrations/'+hash(bytes)+'.'+extension;
  fs.mkdirSync(new URL('public/illustrations/',root),{recursive:true});fs.writeFileSync(new URL('public/'+image.localPath,root),bytes);count++;
 }
}
if(!checkOnly){
 fs.copyFileSync(new URL('src/data/illustrations.json',root),new URL('editorial/illustrations-before-publish.json',root));
 const temp=new URL('src/data/illustrations.json.tmp',root);fs.writeFileSync(temp,JSON.stringify(registry,null,2)+'\n');fs.renameSync(temp,new URL('src/data/illustrations.json',root));
}
console.log(count+' image(s) locale(s) vérifiée(s). '+(checkOnly?'Aucune connexion réseau nécessaire.':'Catalogue prêt pour le site statique.'));
