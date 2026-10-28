// Index local : seules les entrées disposant d’une définition peuvent être proposées.
export const definitionKey = value => value.normalize('NFC').toLocaleLowerCase('fr').replaceAll('œ','oe').replace(/[’‘]/g,"'").replace(/[‐‑]/g,'-').replace(/\s+/g,' ').trim();
const nounPlurals={ciel:'cieux',bijou:'bijoux',genou:'genoux',caillou:'cailloux',chou:'choux',hibou:'hiboux',joujou:'joujoux',pou:'poux',oeil:'yeux','œil':'yeux',travail:'travaux',bail:'baux',vitrail:'vitraux',corail:'coraux',émail:'émaux','grand-père':'grands-pères','grand-mère':'grands-mères','grand-parent':'grands-parents',monsieur:'messieurs',madame:'mesdames',mademoiselle:'mesdemoiselles','plan d’eau':'plans d’eau','chef-d\'oeuvre':'chefs-d’œuvre'};
const femaleNouns={héros:['héroïne'],poète:['poétesse'],policier:['policière'],ancien:['ancienne'],jeune:['jeune'],ami:['amie'],ennemi:['ennemie'],cousin:['cousine'],client:['cliente'],invité:['invitée'],habitant:['habitante'],passager:['passagère'],lecteur:['lectrice'],adolescent:['adolescente'],aîné:['aînée'],jumeau:['jumelle'],candidat:['candidate'],citoyen:['citoyenne'],fonctionnaire:['fonctionnaire'],instituteur:['institutrice'],enseignant:['enseignante'],professeur:['professeure'],maître:['maîtresse'],directeur:['directrice'],président:['présidente'],avocat:['avocate'],inspecteur:['inspectrice'],acteur:['actrice'],auteur:['autrice','auteure'],musicien:['musicienne'],chanteur:['chanteuse'],danseur:['danseuse'],peintre:['peintre'],photographe:['photographe'],boulanger:['boulangère'],cuisinier:['cuisinière'],infirmier:['infirmière'],coiffeur:['coiffeuse'],jardinier:['jardinière'],ouvrier:['ouvrière'],employé:['employée'],marchand:['marchande'],fermier:['fermière'],boucher:['bouchère'],pharmacien:['pharmacienne'],mécanicien:['mécanicienne'],caissier:['caissière'],fleuriste:['fleuriste'],pâtissier:['pâtissière'],gardien:['gardienne'],propriétaire:['propriétaire'],professionnel:['professionnelle'],travailleur:['travailleuse'],accompagnateur:['accompagnatrice'],acheteur:['acheteuse']};
const plural = w => nounPlurals[w] || (/[sxz]$/.test(w)?w:/(eau|au|eu)$/.test(w)&&!['pneu','bleu','landau'].includes(w)?w+'x':/al$/.test(w)&&!['bal','carnaval','chacal','récital','régal','festival'].includes(w)?w.slice(0,-2)+'aux':w+'s');
const feminine = w => ({beau:'belle',nouveau:'nouvelle',vieux:'vieille',fou:'folle',mou:'molle',blanc:'blanche',sec:'sèche',frais:'fraîche',doux:'douce',long:'longue',épais:'épaisse',gros:'grosse',bas:'basse',roux:'rousse',public:'publique',discret:'discrète',complet:'complète',concret:'concrète',secret:'secrète',inquiet:'inquiète',bref:'brève',neuf:'neuve',vif:'vive',protecteur:'protectrice',destructeur:'destructrice'}[w]||(/e$/.test(w)?w:/eux$/.test(w)?w.slice(0,-3)+'euse':/if$/.test(w)?w.slice(0,-2)+'ive':/el$/.test(w)?w.slice(0,-2)+'elle':/en$/.test(w)?w.slice(0,-2)+'enne':/on$/.test(w)?w.slice(0,-2)+'onne':/er$/.test(w)?w.slice(0,-2)+'ère':w+'e'));
const irregular={
 être:'suis es est sommes êtes sont étais était étions étiez étaient été serai seras sera serons serez seront sois soit soyons soyez soient',
 avoir:'ai as a avons avez ont avais avait avions aviez avaient eu aurai auras aura aurons aurez auront aie aies ait ayons ayez aient',
 faire:'fais fait faisons faites font faisais faisait faisions faisiez faisaient ferai feras fera ferons ferez feront fasse fasses fassions fassiez fassent',
 ouvrir:'ouvre ouvres ouvrons ouvrez ouvrent ouvrais ouvrait ouvrions ouvriez ouvraient ouvert ouverte ouverts ouvertes ouvrira ouvriront',
 couvrir:'couvre couvres couvrons couvrez couvrent couvrais couvrait couvrions couvriez couvraient couvert couverte couverts couvertes couvrira couvriront',
 permettre:'permets permet permettons permettez permettent permettais permettait permettions permettiez permettaient permis permise permises permettra permettront',
 craindre:'crains craint craignons craignez craignent craignais craignait craignions craigniez craignaient craints crainte craintes craindra craindront',
 répondre:'réponds répond répondons répondez répondent répondais répondait répondions répondiez répondaient répondu répondue répondus répondues répondra répondront',
};
function verbForms(w){
 if(irregular[w])return irregular[w].split(' ');
 if(['tarir','barrir','fournir'].includes(w)){const s=w.slice(0,-2);return ['is','it','issons','issez','issent','issais','issait','issions','issiez','issaient','i','ie','is','ies','ira','iront'].map(x=>s+x)}
 if(!w.endsWith('er'))return [];
 const s=w.slice(0,-2),altered=s.endsWith('y')?s.slice(0,-1)+'i':s;
 const participle=s+'é';
 return [...['e','es','ent'].map(x=>altered+x),s+'ons',s+'ez',...['ais','ait','ions','iez','aient'].map(x=>s+x),...['ai','as','a','ons','ez','ont'].map(x=>(s.endsWith('y')?altered+'er':w)+x),participle,participle+'e',participle+'s',participle+'es'];
}
export function buildDefinitionIndex(all){
 const written=all.filter(e=>e.senses?.some(s=>s.definition?.trim()));
 const byId=new Map(written.map(e=>[e.id,e]));const byLemma=new Map(written.map(e=>[e.nature+'|'+definitionKey(e.word),e]));
 const forms=new Map();
 const add=(form,e)=>{const key=definitionKey(form);if(!key||!byId.has(e.id))return;let ids=forms.get(key);if(!ids)forms.set(key,ids=new Set());ids.add(e.id)};
 for(const e of written){
  for(const w of [e.word,e.displayWord,...(e.forms||[])].filter(Boolean))add(w,e);
  if(e.nature==='nom commun'){add(plural(e.word),e);for(const form of femaleNouns[e.word]||[]){add(form,e);add(plural(form),e)}}
  // Les nouveaux lots fournissent des accords relus dans e.forms : ne pas
  // ajouter de variantes devinées (complete, favorie, marrons pour la couleur…).
  if(e.nature==='adjectif'&&!e.feminine)for(const w of [plural(e.word),feminine(e.word),plural(feminine(e.word))])add(w,e);
  if(e.nature==='verbe'&&!e.conjugations)for(const w of verbForms(e.word))add(w,e);
 }
 // Formes réellement employées dans les expressions : accords et conjugaisons explicitement rédigés.
 for(const source of all)for(const sense of source.senses||[])for(const group of sense.groups||[]){
  const pos=group[3]||(source.nature==='nom commun'?(group[0].includes('adjectif')?'adjectif':'verbe'):source.nature==='adjectif'?'nom commun':'adverbe');
  for(const [,label,target]of group[2]){const entry=byLemma.get(pos+'|'+definitionKey(target||label));if(!entry)continue;add(label,entry);
   if(pos==='verbe'){const bare=label.replace(/^(?:se |s[’'])/u,'');if(!bare.includes(' '))add(bare,entry)}
  }
 }
 return {entries:written.map(e=>[e.id,e.word,e.nature]),forms:[...forms].map(([form,ids])=>[form,[...ids]])};
}
