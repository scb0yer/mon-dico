import Illustrations from './Illustrations.jsx';
import Conjugations from './Conjugations.jsx';
import AlphabeticalIndex from './AlphabeticalIndex.jsx';
import React, {useState, useRef, useEffect} from 'react';
import {resolveEntries, loadEntries} from './dictionaryStore.js';
import {vocabularyStats} from './dictionaryVocabulary.js';
import {isBlocked, norm, suggestions} from './search.js';
import useAudio from './useAudio.js';
import {orderCooccurrenceGroups} from './cooccurrenceGroups.js';
import {tokenizeDefinition} from './definitionLinks.js';

// Icônes SVG intégrées : aucune bibliothèque supplémentaire à installer.
function Icon({name, className = ''}) {
  const shapes = {
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    book: <><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z"/><path d="M12 6v14M6 9h3m-3 4h3m6-4h3m-3 4h3"/></>,
    link: <><path d="M5 9h14M5 15h14"/></>,
    opposite: <><path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-5 4 4 3-3 6 7"/></>,
    pieces: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 4v5c3-2 5 0 5 2s-2 4-5 2v7"/></>,
    mic: <><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/></>,
    volume: <><path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6"/></>,
    back: <><path d="M20 12H4m6-6-6 6 6 6"/></>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    stop: <rect x="5" y="5" width="14" height="14" rx="2"/>,
    quote: <><path d="M10 5H4v8h6V5Zm10 0h-6v8h6V5ZM10 13c0 4-2 6-5 6m15-6c0 4-2 6-5 6"/></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/></>
  };
  return <svg className={`icon ${className}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shapes[name] || shapes.book}</svg>;
}

function WordLink({word, children, onSelect, senseId, category, entryId}) {
  if(!resolveEntries(word).some(e=>!category||e.p===category)) return <span className="chip">{children || word}</span>;
  return <button type="button" className="chip" onClick={() => onSelect(word, {senseId, category, entryId})}>{children || word}</button>;
}

function LinkedDefinition({text, currentId, onSelect}) {
  const [choice, setChoice] = useState(null);
  const go = target => {setChoice(null);onSelect(target.word,{entryId:target.id,category:target.category});};
  useEffect(() => {
    if(choice===null)return;
    const closeOutside = event => {if(!event.target.closest?.('.definition-word'))setChoice(null);};
    const closeOnMove = event => {if(!event.target.closest?.('.definition-choices'))setChoice(null);};
    document.addEventListener('pointerdown',closeOutside);
    window.addEventListener('scroll',closeOnMove,true);
    window.addEventListener('resize',closeOnMove);
    return () => {document.removeEventListener('pointerdown',closeOutside);window.removeEventListener('scroll',closeOnMove,true);window.removeEventListener('resize',closeOnMove);};
  },[choice]);
  const choose = (event,i,targets) => {
    if(targets.length===1){go(targets[0]);return;}
    if(choice?.index===i){setChoice(null);return;}
    const rect=event.currentTarget.getBoundingClientRect(),width=Math.min(260,window.innerWidth-24),height=Math.min(220,window.innerHeight-24);
    setChoice({index:i,style:{position:'fixed',left:Math.max(12,Math.min(rect.left,window.innerWidth-width-12)),top:Math.max(12,Math.min(rect.bottom+6,window.innerHeight-height-12)),width,maxHeight:height,overflowY:'auto'}});
  };
  return <p className="definition">{tokenizeDefinition(text,currentId).map((part,i) => !part.targets ? <React.Fragment key={i}>{part.text}</React.Fragment> :
    <span className="definition-word" key={i}>
      <button type="button" className="definition-link" aria-label={part.targets.length===1 ? `Voir la fiche de ${part.targets[0].word}` : `Choisir la fiche pour ${part.text}`} title={part.targets.map(t=>`${t.word} (${t.category})`).join(' ou ')} aria-expanded={part.targets.length>1 ? choice?.index===i : undefined} onClick={event => choose(event,i,part.targets)} onKeyDown={e=>{if(e.key==='Escape')setChoice(null)}}>{part.text}</button>
      {choice?.index===i && part.targets.length>1 && <span className="definition-choices" style={choice.style} role="group" aria-label="Choisir le mot"><span>Quel mot cherches-tu ?</span>{part.targets.map(target=><button type="button" key={target.id} onClick={()=>go(target)} onKeyDown={e=>{if(e.key==='Escape')setChoice(null)}}>{target.word} <small>{target.category}</small></button>)}</span>}
    </span>
  )}</p>;
}

function SectionHeading({icon, children, subtitle}) {
  return <div className="section-heading"><span className="icon-badge"><Icon name={icon}/></span><div><h3>{children}</h3>{subtitle && <p className="small">{subtitle}</p>}</div></div>;
}

function WordCard({entry, onSelect, read, speaking}) {
  const d = entry;
  const isNoun = d.nature.startsWith('nom commun');
  const displayedWord = d.nature.startsWith('adjectif') ? (d.nature.split(' · ')[1] || d.word) : (d.displayWord || d.word);
  return <div className="word-sheet">
    <article className="card definition-card">
      <div className="word-topline"><span className="eyebrow">LE MOT QUE TU CHERCHES</span><span className="nature">{d.nature.split(' · ')[0]}</span></div>
      <div className="wordline"><h2>{displayedWord}</h2><button type="button" className={`listen ${speaking ? 'active' : ''}`} aria-label={`Écouter le mot ${d.word}`} onClick={() => read(d.word)}><Icon name="volume"/><span>Écouter</span></button></div>
      <section className="definition-block">
        <SectionHeading icon="book">Définition</SectionHeading>
        {d.definition ? <LinkedDefinition text={d.definition} currentId={d.id} onSelect={onSelect}/> : <p className="pending-definition">Ce mot fait partie de monDico. Sa définition et ses associations sont en cours de préparation.</p>}
        {d.example && <div className="example"><Icon name="quote"/><p><strong className="example-label">Exemple</strong>{d.example}</p></div>}
      </section>
      {isNoun && <Illustrations key={`${d.id}#${d.imageSenseId}`} entry={d}/>}
    </article>

    {d.conjugations && <Conjugations key={d.id} conjugations={d.conjugations} options={d.conjugationOptions} note={d.conjugationNote}/>}
    <div className="relations">
      {[{title:'Synonymes', words:d.synLinks?.length ? d.synLinks : d.syn, icon:'link', color:'teal', help:'Des mots de sens proche', empty:d.definition ? 'Aucun synonyme renseigné pour ce sens.' : 'Synonymes à compléter.'}, {title:'Contraires', words:d.antLinks?.length ? d.antLinks : d.ant, icon:'opposite', color:'orange', help:'Des mots de sens opposé', empty:d.definition ? 'Aucun contraire renseigné pour ce sens.' : 'Contraires à compléter.'}].map(({title, words, icon, color, help, empty}) =>
        <section className={`card relation-card ${color}`} key={title}>
          <SectionHeading icon={icon} subtitle={help}>{title}</SectionHeading>
          <div className="word-list">{words.length ? words.map(w => typeof w === 'string' ? <WordLink key={w} word={w} onSelect={onSelect}/> : <div className="related-word" key={w.entryId + w.senseId}><WordLink word={w.word} onSelect={onSelect} entryId={w.entryId} senseId={w.senseId} category={w.nature}/>{w.note && <details className="relation-note"><summary>Nuance d’usage</summary><p>{w.note}</p></details>}</div>) : <p className="empty-text">{empty}</p>}</div>
        </section>
      )}
    </div>

    <section className="card co">
      <div className="co-heading"><SectionHeading icon="pieces" subtitle="Des expressions à utiliser dans tes textes">Les mots qui vont ensemble</SectionHeading><span className="co-tip"><Icon name="spark"/>Clique sur les mots soulignés</span></div>
      <div className="groups">{d.groups.length ? orderCooccurrenceGroups(d.groups, d.category).map(([title, description, expressions, targetNature], i) =>
        <section className="group" key={title}>
          <div className="group-heading"><span className="num">{String(i + 1).padStart(2, '0')}</span><h4>{title}</h4></div><p className="small">{description}</p>
          <div className="expressions">{expressions.map(([before, label, target, after], j) => <span className="expression" key={j}>{before}<WordLink word={target || label} category={targetNature || (d.category === 'nom commun' ? (title.includes('adjectifs') ? 'adjectif' : 'verbe') : d.category === 'adjectif' ? 'nom commun' : 'adverbe')} onSelect={onSelect}>{label}</WordLink>{after}</span>)}</div>
        </section>
      ) : <p className="empty-text">Les associations de ce mot ne sont pas encore disponibles dans cette version.</p>}</div>
    </section>
  </div>;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [entries, setEntries] = useState([]);
  const [entryId, setEntryId] = useState(null);
  const [senseId, setSenseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  async function select(input, options = {}) {
    const settings = typeof options === 'boolean' ? {push: options} : options;
    const push = settings.push !== false;
    const text = input.trim().toLowerCase();
    const ticket = ++requestId.current;
    setQuery(text); setShowSuggestions(false);
    if (isBlocked(text)) { setCurrent(null); setEntries([]); setLoading(false); setMessage('Ce mot n’est pas disponible dans ce dictionnaire.'); return; }
    let matches = resolveEntries(text);
    if (settings.entryId) matches = matches.filter(e => e.id === settings.entryId);
    else if (settings.category && matches.some(e => e.p === settings.category)) matches = matches.filter(e => e.p === settings.category);
    if (!matches.length) { setCurrent(null); setEntries([]); setLoading(false); setShowSuggestions(true); setMessage('Ce mot n’est pas dans la sélection. Essaie une proposition ou une autre orthographe.'); return; }
    setLoading(true); setMessage('Chargement du mot…');
    try {
      const loaded = await loadEntries(matches);
      if (ticket !== requestId.current) return;
      if (!loaded.length) throw Error('Fiche absente');
      const initialEntry = loaded.find(e => e.definition) || loaded[0];
      const word = initialEntry.word;
      if (push && current && word !== current) setHistory(h => [...h, current]);
      setEntries(loaded); setEntryId(initialEntry.id); setSenseId(settings.senseId || initialEntry.senses?.[0]?.id || null); setCurrent(word); setQuery(word); setMessage('');
      if(settings.fromIndex)window.scrollTo({top:0,behavior:'auto'});
    } catch {
      if (ticket !== requestId.current) return;
      setCurrent(null); setEntries([]); setMessage('Le mot n’a pas pu être chargé. Vérifie la connexion puis réessaie.');
    } finally { if (ticket === requestId.current) setLoading(false); }
  }
  function home() {
    requestId.current++; setLoading(false); setQuery(''); setCurrent(null); setEntries([]);
    setHistory([]); setMessage(''); setShowSuggestions(false);
  }
  const entry = entries.find(e => e.id === entryId);
  const sense = entry?.senses?.find(s => s.id === senseId) || entry?.senses?.[0];
  const view = entry ? {...entry, ...sense, id:entry.id, imageSenseId:sense?.id || null} : null;

  const audio = useAudio(select, setMessage);
  const choices = showSuggestions ? suggestions(query) : [];

  return <>
    <header className="site-header">
      <a href="#" className="brand" aria-label="monDico — accueil" onClick={e => { e.preventDefault(); home(); }}><img className="brand-image" src={`${(import.meta.env?.BASE_URL || '/')}mon-dico-logo.png`} alt="monDico" width="120" height="120"/></a>
      <span className="header-caption">Des mots pour écrire.</span>
      <button className="back-button" disabled={!history.length} onClick={() => { const prev = history.at(-1); setHistory(h => h.slice(0, -1)); select(prev, false); }}><Icon name="back"/><span>Mot précédent</span></button>
    </header>
    <main className={current ? 'has-result' : 'is-home'}>
      <section className="intro">
        
        <h1>Quel mot <span>cherches-tu ?</span></h1>
        <p className="intro-copy">Écris un mot ou utilise le micro.</p>
        <form className="search-form" onSubmit={e => { e.preventDefault(); select(query); }}>
          <label htmlFor="query">Quel mot cherches-tu ?</label>
          <div className="search-controls"><Icon name="search" className="search-icon"/><input id="query" autoComplete="off" value={query} onChange={e => { setQuery(e.target.value); setMessage(''); setShowSuggestions(true); }} placeholder="Écris le mot, même comme tu l’entends…"/>
            <button type="button" id="mic" aria-pressed={audio.listening} onClick={audio.dictate}><Icon name={audio.listening ? 'stop' : 'mic'}/><span>{audio.listening ? 'Arrêter' : 'Dicter'}</span></button>
            <button className="primary">Chercher<Icon name="arrow"/></button>
          </div>
        </form>
        <div id="suggest" aria-live="polite">{choices.length > 0 && <><span>Tu cherches peut-être :</span><div>{choices.map(w => <WordLink key={w} word={w} onSelect={select}/>)}</div></>}</div>

        <details className="audio-help"><summary>À propos de la dictée vocale</summary><p>Selon ton navigateur, la dictée peut traiter l’audio en ligne. Si elle n’est pas disponible, écris le mot comme tu l’entends.</p></details>
        <p id="status" role="status" className={message ? 'has-message' : ''}>{message}</p>
      </section>
      <div hidden={Boolean(current)||loading}>
        <section className="site-presentation" aria-labelledby="presentation-title">
          <h2 id="presentation-title">Des mots pour comprendre et mieux écrire</h2>
          <p>monDico est un dictionnaire en ligne pour vérifier l’orthographe d’un mot, comprendre sa définition, trouver des synonymes et des antonymes, ou consulter la conjugaison d’un verbe.</p>
          <p>Découvre aussi les <strong>cooccurrences</strong> : des mots qui s’utilisent souvent ensemble, pour enrichir tes phrases et choisir le mot juste.</p>
        </section>
        <AlphabeticalIndex onSelect={select}/>
      </div>
      {current && entry && !loading && <>
        <button type="button" className="back-button index-return" onClick={home}>← Retour à l’index des mots</button>
        {entries.length > 1 && <nav className="nature-picker" aria-label="Choisir la nature du mot"><span>Ce mot peut être :</span>{entries.map(e => <button key={e.id} type="button" aria-pressed={entryId === e.id} onClick={() => {setEntryId(e.id); setSenseId(e.senses?.[0]?.id || null);}}>{e.category}</button>)}</nav>}
        {entry.senses?.length > 1 && <nav className="sense-picker" aria-label="Choisir le sens du mot"><span>Quel sens cherches-tu ?</span>{entry.senses.map((item, i) => <button key={item.id} type="button" aria-pressed={sense?.id === item.id} onClick={() => setSenseId(item.id)}>{i + 1}. {item.label}</button>)}</nav>}
        <WordCard key={entry.id + (sense?.id || '')} entry={view} onSelect={select} read={audio.read} speaking={audio.speaking}/>
      </>}
      <footer><p>{vocabularyStats.total.toLocaleString('fr-FR')} entrées dans l’index · {vocabularyStats.available.toLocaleString('fr-FR')} fiches disponibles. Aucun compte ni historique enregistré.</p></footer>
    </main>
  </>;
}

export {LinkedDefinition};
