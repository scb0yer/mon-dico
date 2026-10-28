import React,{useMemo,useRef,useState} from 'react';
import {vocabulary} from './dictionaryVocabulary.js';
import {ALPHABET,indexPage,filterByNature,NATURES,natureClass} from './alphabeticalIndex.js';
import illustrations from './data/illustrations.json';
import {validIllustration} from './illustrationRules.js';
const illustratedIds=new Set(Object.values(illustrations.entries).filter(r=>!illustrations.blockedWords.includes(r.word)&&r.images.some(i=>i.localPath&&validIllustration(i))).map(r=>r.entryId));
export default function AlphabeticalIndex({onSelect}){
 const [nature,setNature]=useState(''),[letter,setLetter]=useState('A'),[page,setPage]=useState(0);
 const filtered=useMemo(()=>filterByNature(vocabulary,nature),[nature]);
 const counts=Object.fromEntries(ALPHABET.map(l=>[l,filtered.filter(r=>r.letter===l).length]));
 const chooseNature=next=>{const entries=filterByNature(vocabulary,next);setNature(next);setPage(0);if(!entries.some(r=>r.letter===letter))setLetter(entries[0]?.letter||'A');};
 const heading=useRef(null),result=useMemo(()=>indexPage(filtered,letter,page),[filtered,letter,page]);
 const chooseLetter=next=>{setLetter(next);setPage(0);};
 const changePage=next=>{setPage(next);heading.current?.focus();};
 return <section className="dictionary-index card" aria-labelledby="index-title">
  <div className="index-heading"><div><p className="eyebrow">FEUILLETER MONDICO</p><h2 id="index-title">Les mots de A à Z</h2></div><span className="index-total">{filtered.length.toLocaleString('fr-FR')} entrées</span></div>
  <p>Choisis une lettre, puis clique sur un mot pour ouvrir sa fiche.</p>
  <div className="index-filters" role="group" aria-label="Filtrer par nature">
   <button type="button" aria-pressed={nature===''} onClick={()=>chooseNature('')}>Tous les mots</button>
   {NATURES.map(n=><button key={n.value} type="button" className={n.className} aria-pressed={nature===n.value} onClick={()=>chooseNature(n.value)}><i aria-hidden="true"/>{n.label}</button>)}
  </div>
  <p className="index-image-legend">🏞️ Nom commun illustré</p>
  <nav className="index-alphabet" aria-label="Choisir une lettre de l’index">{ALPHABET.map(l=><button key={l} type="button" disabled={!counts[l]} aria-pressed={letter===l} aria-controls="index-words" onClick={()=>chooseLetter(l)}>{l}</button>)}</nav>
  <h3 ref={heading} tabIndex={-1} className="index-letter" aria-live="polite">{letter} <span>— {result.total.toLocaleString('fr-FR')} entrées · page {result.page+1} sur {result.pages}</span></h3>
  <ul id="index-words" className="index-words">{result.items.map(row=><li key={row.id}>
   <button type="button" className={'index-word '+natureClass(row.nature)} onClick={()=>onSelect(row.word,{entryId:row.id,category:row.nature,fromIndex:true})}><span>{row.word}{row.nature==='nom commun'&&illustratedIds.has(row.id)&&<span className="index-image-marker" role="img" aria-label="illustré" title="Nom commun illustré"> 🏞️</span>}</span><small>{row.nature}</small><span className="sr-only"> — ouvrir la fiche</span></button>
  </li>)}</ul>
  {!result.total&&<p>Aucun mot pour cette lettre et cette nature.</p>}
  {result.pages>1&&<nav className="index-pagination" aria-label="Pages de la lettre"><button type="button" disabled={result.page===0} onClick={()=>changePage(result.page-1)}>← Précédente</button><span>{result.page+1} / {result.pages}</span><button type="button" disabled={result.page===result.pages-1} onClick={()=>changePage(result.page+1)}>Suivante →</button></nav>}
 </section>;
}
