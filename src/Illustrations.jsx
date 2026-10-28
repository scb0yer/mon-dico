import React, {useId, useState} from 'react';
import registry from './data/illustrations.json' with {type:'json'};
import {selectIllustrations} from './illustrationRules.js';

export default function Illustrations({entry, catalogue = registry}) {
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState([]);
  const panelId = useId();
  const images = selectIllustrations(entry, catalogue).filter(image => !failed.includes(image.id));
  if (!images.length) return null;
  return <section className={`images curated-images ${visible ? 'is-open' : ''}`}>
    <div className="images-heading">
      <div className="section-heading"><span className="icon-badge" aria-hidden="true"><svg className="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/></svg></span><div><h3>Le mot en images</h3><p className="small">Une illustration du sens de cette fiche</p></div></div>
      <button type="button" className="toggle-images" aria-expanded={visible} aria-controls={panelId} onClick={() => setVisible(value => !value)}>{visible ? 'Masquer les images' : 'Afficher les images'}<span aria-hidden="true">{visible ? '⌃' : '⌄'}</span></button>
    </div>
    {visible && <div id={panelId} className="image-content curated-gallery">
      {images.map(image => <figure key={image.id}>
        <img src={`${import.meta.env?.BASE_URL || '/'}${image.localPath}`} alt={image.alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(previous => [...previous, image.id])}/>
        <figcaption><p>{image.caption}</p><p className="image-credit">{image.author}{image.credit ? ` — ${image.credit}` : ''} · <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer">{image.licenseName}</a> · <a href={image.fileUrl} target="_blank" rel="noopener noreferrer">Fichier et crédits</a></p><p className="image-credit">Choisie dans l’article <a href={image.articleUrl} target="_blank" rel="noopener noreferrer">{image.articleTitle || entry.word} sur Vikidia</a>.</p></figcaption>
      </figure>)}
    </div>}
  </section>;
}
