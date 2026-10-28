import React, {useState} from 'react';
import {TENSES, conjugatedPhrase} from './conjugation.js';
export default function Conjugations({conjugations, options = {}, note}) {
 const [tense, setTense] = useState('present');
 return <details className="card conjugation-card">
  <summary><span aria-hidden="true">Aa</span> Conjugaison <small>Indicatif · clique pour afficher</small></summary>
  <div className="tense-buttons" role="group" aria-label="Choisir un temps de l’indicatif">
   {TENSES.map(([key,label])=><button key={key} type="button" aria-pressed={tense===key} onClick={()=>setTense(key)}>{label}</button>)}
  </div>
  <h3>{TENSES.find(([key])=>key===tense)[1]} de l’indicatif</h3>
  {note && <p>{note}</p>}
  {conjugations[tense].some(Boolean) ? <ol className="conjugated-forms">{conjugations[tense].map((form,i)=>form == null ? null : <li key={i}>{conjugatedPhrase(form,i,options)}</li>)}</ol> : <p>Ce temps n’est pas proposé pour ce verbe : utilise une autre tournure.</p>}
 </details>;
}
