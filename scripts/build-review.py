"""Relecture hors ligne : python3 scripts/build-review.py [001|002|003|004|005|006|007|008|009|010|011|012|013|014]."""
from pathlib import Path
import json,html,sys
base=Path(__file__).resolve().parent.parent
batch=sys.argv[1] if len(sys.argv)>1 else None
files=[base/'editorial'/('noms-lot-'+batch+'.json')] if batch else sorted((base/'editorial').glob('noms-lot-*.json'))+[base/'editorial/synonymes-complements.json']
source=[e for f in files for e in json.loads(f.read_text()) if any(s['groups'] for s in e['senses'])]
wanted={e['word'] for e in source}
data=[e for f in (base/'public/data').glob('*.json') for e in json.loads(f.read_text()) if e['word'] in wanted and e['nature']=='nom commun'];byword={e['word']:e for e in data}
esc=lambda x:html.escape(str(x));cards=[];senses=0;expressions=0
for r in source:
 e=byword[r['word']];body=''
 for s in e['senses']:
  if not s['groups']:continue
  senses+=1;groups=''
  def rank(g):
   t=g[0].lower()
   return 0 if 'adjectif' in t else 1 if (len(g)>3 and g[3]=='nom commun') or 'compléments du nom' in t else 2 if 'sujet' in t else 3 if 'cod' in t else 4
  for g in sorted(s['groups'],key=rank):
   expressions+=len(g[2]);items=''.join('<li>'+esc(x[0])+'<strong>'+esc(x[1])+'</strong>'+esc(x[3] if len(x)>3 else '')+'</li>' for x in g[2])
   groups+='<section class="group"><h3>'+esc(g[0])+'</h3><p class="small">'+esc(g[1])+'</p><ul>'+items+'</ul></section>'
  relations=''
  for label,key in [('Synonymes','synLinks'),('Contraires','antLinks')]:
   edges=s.get(key,[])
   if edges:relations+='<p><strong>'+label+' :</strong> '+esc(' · '.join(x['word'] for x in edges))+'</p>'
  body+='<article class="sense"><h2>'+esc(s['label'])+'</h2><p>'+esc(s['definition'])+'</p><p class="example"><strong>Exemple :</strong> '+esc(s['example'])+'</p>'+relations+'<div class="groups">'+groups+'</div></article>'
 cards.append('<details class="word"><summary>'+esc(e.get('displayWord') or e['word'])+' <small>— nom commun '+esc(e['gender'])+'</small></summary>'+body+'</details>')
title='Cooccurrences — '+('lot '+batch if batch else 'toutes les fiches complétées')
page='''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>monDico — '''+esc(title)+'''</title><style>*{box-sizing:border-box}body{margin:0;background:#dce7ec;color:#444;font:16px/1.6 system-ui}main{max-width:1120px;margin:auto;padding:30px 20px}h1,h2,h3{color:#084a62}h1{margin:0;font-size:30px}h2{font-size:19px}h3{font-size:16px;margin:0}header{margin-bottom:24px}input{font:inherit;padding:12px;border:2px solid #084a62;border-radius:9px;width:100%}button{font:inherit;background:white;border:1px solid #177c8b;padding:7px 13px;border-radius:6px;cursor:pointer}.tools{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:14px 0}.word{border:1px solid #a9c0cb;background:white;border-radius:11px;margin:13px 0;overflow:hidden}summary{cursor:pointer;padding:16px 20px;font-size:22px;font-weight:700;color:#084a62;background:#f7fafc}small,.small{font-size:13px;font-weight:400;color:#586b73}.sense{padding:5px 22px 25px}.sense+.sense{border-top:2px solid #dce7ec}.example{padding:10px 14px;background:#fff8e9;border-left:4px solid #f6b12d}.groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px;margin-top:20px}.group{padding:17px;background:#eef4f7;border:1px solid #ccdce3;border-radius:9px}.group ul{padding-left:20px}.group li{margin:8px 0}.tip{background:white;border-left:5px solid #177c8b;padding:14px 18px}button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #e66137;outline-offset:3px}@media(max-width:680px){.groups{grid-template-columns:1fr}summary small{display:block}}</style><main><header><h1>'''+esc(title)+'''</h1><p>'''+str(len(source))+' fiches · '+str(senses)+' sens · '+format(expressions,',').replace(',',' ')+' expressions'+'''</p><p class="tip">Document de relecture : quatre groupes de cinq expressions pour chaque sens complété. Le mot peut être le nom principal ou appartenir au complément du nom. Les mots en gras sont cliquables dans le site React. La validation pédagogique reste à effectuer.</p><input id="q" type="search" aria-label="Chercher dans les fiches" placeholder="Chercher un mot ou une expression…"><div class="tools"><button id="open">Tout ouvrir</button><button id="close">Tout fermer</button><span id="count" role="status">'''+str(len(source))+''' fiches</span></div></header>'''+''.join(cards)+'''<footer><p class="small">Définitions, exemples et expressions originaux pour monDico. Les fiches de renvoi sans cooccurrences ne figurent pas dans cette relecture.</p></footer></main><script>const rows=[...document.querySelectorAll('.word')];const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('œ','oe');document.getElementById('q').oninput=e=>{let n=0;for(const row of rows){row.hidden=!norm(row.textContent).includes(norm(e.target.value));if(!row.hidden)n++}document.getElementById('count').textContent=n+' fiches affichées'};document.getElementById('open').onclick=()=>rows.forEach(r=>{if(!r.hidden)r.open=true});document.getElementById('close').onclick=()=>rows.forEach(r=>r.open=false);</script></html>'''
path=base/('relecture-noms-lot-'+batch+'.html' if batch else 'relecture-cooccurrences.html');path.write_text(page);print(path.name,len(source),senses,expressions)
