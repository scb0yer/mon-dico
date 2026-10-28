import {useEffect,useRef,useState} from 'react';
const errors={
 'not-allowed':'Microphone refusé. Dans les réglages du site du navigateur, autorise le microphone, puis réessaie.',
 'service-not-allowed':'Le service de dictée est bloqué par ce navigateur ou ses réglages.',
 'audio-capture':'Aucun microphone utilisable. Vérifie le micro sélectionné et les autorisations du système.',
 'network':'Le service vocal est inaccessible. Vérifie la connexion ; le réseau de l’établissement peut aussi le bloquer.',
 'no-speech':'Je n’ai pas entendu de mot. Rapproche-toi du microphone et réessaie.',
 'language-not-supported':'La dictée en français n’est pas disponible dans ce navigateur.'
};
export default function useAudio(onWord,setMessage){
 const recognition=useRef(null),utterance=useRef(null),watchdog=useRef(null),onWordRef=useRef(onWord);
 const [listening,setListening]=useState(false),[speaking,setSpeaking]=useState(false);
 onWordRef.current=onWord;
 useEffect(()=>()=>{recognition.current?.abort();clearTimeout(watchdog.current);window.speechSynthesis?.cancel();},[]);
 function dictate(){
  if(recognition.current){recognition.current.stop();return;}
  if(!window.isSecureContext){setMessage('Le microphone nécessite une adresse HTTPS ou localhost. Ouvre le site déployé sur Netlify.');return;}
  const API=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!API){setMessage('Ce navigateur ne propose pas la dictée vocale. Tu peux utiliser la dictée du clavier ou écrire le mot comme tu l’entends.');return;}
  window.speechSynthesis?.cancel();
  const r=new API();recognition.current=r;r.lang='fr-FR';r.continuous=false;r.interimResults=false;r.maxAlternatives=3;
  setMessage('Autorise le microphone si le navigateur le demande.');
  r.onstart=()=>{setListening(true);setMessage('Je t’écoute : prononce un seul mot.');};
  r.onresult=e=>{const text=e.results[0][0].transcript.replace(/[.!?]$/,'').trim();onWordRef.current(text);};
  r.onerror=e=>{if(e.error!=='aborted')setMessage(errors[e.error]||`La dictée a échoué (${e.error}). Écris le mot comme tu l’entends.`);};
  r.onend=()=>{recognition.current=null;setListening(false);};
  try{r.start();}catch{recognition.current=null;setListening(false);setMessage('Impossible de démarrer la dictée. Ferme les autres utilisations du micro et réessaie.');}
 }
 function read(word){
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){setMessage('La lecture du mot n’est pas disponible dans ce navigateur.');return;}
  recognition.current?.abort();clearTimeout(watchdog.current);const synth=window.speechSynthesis;synth.cancel();synth.resume();
  const u=new SpeechSynthesisUtterance(word);utterance.current=u;u.lang='fr-FR';u.rate=.85;const voice=synth.getVoices().find(v=>v.lang.toLowerCase().startsWith('fr'));if(voice)u.voice=voice;
  u.onstart=()=>{clearTimeout(watchdog.current);setSpeaking(true);setMessage('Lecture du mot…');};
  u.onend=()=>{setSpeaking(false);setMessage('');};
  u.onerror=e=>{clearTimeout(watchdog.current);setSpeaking(false);if(!['canceled','interrupted'].includes(e.error))setMessage('La voix ne peut pas être lue. Vérifie le volume et la disponibilité d’une voix française dans ton appareil.');};
  watchdog.current=setTimeout(()=>setMessage('La lecture n’a pas démarré. Vérifie le son du navigateur et les voix installées sur l’appareil.'),5000);
  try{synth.speak(u);}catch{clearTimeout(watchdog.current);setMessage('La lecture audio n’a pas pu démarrer.');}
 }
 return {dictate,read,listening,speaking};
}
