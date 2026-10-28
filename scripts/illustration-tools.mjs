import {trustedUrl,supportedLicense} from '../src/illustrationRules.js';
export function plainText(value = '') {
  return String(value).replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const c=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return c>0&&c<=0x10ffff?String.fromCodePoint(c):'';}).replace(/&(amp|lt|gt|quot|apos|nbsp);/g,(_,n)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[n])).replace(/\s+/g,' ').trim();
}
export function candidateFromInfo(fileTitle, info, article) {
  if (!info) return null;
  const raster=['image/jpeg','image/png','image/webp'].includes(info.mime);
  // Only a server-rendered PNG thumbnail may be used for a vector source.
  let renderedVector=false;
  try { renderedVector=info.mime==='image/svg+xml' && typeof info.thumburl==='string' && /[.]png$/i.test(new URL(info.thumburl).pathname); } catch { return null; }
  if (!raster && !renderedVector) return null;
  const metadata = info.extmetadata || {}, value = key => plainText(metadata[key]?.value || '');
  const src=info.thumburl || info.url;
  // Public Domain Mark identifies the public-domain status explicitly supplied by Commons.
  const publicDomain=value('LicenseShortName')==='Public domain' && value('Copyrighted')==='False' && value('License')==='pd';
  const licenseUrl=(value('LicenseUrl') || (publicDomain?'https://creativecommons.org/publicdomain/mark/1.0/':'')).replace(/^http:/,'https:');
  if (!trustedUrl(src,'image') || !trustedUrl(info.descriptionurl) || !trustedUrl(article.url,'article') || !supportedLicense(licenseUrl) || !value('Artist') || !value('LicenseShortName')) return null;
  return {
    id:fileTitle, fileTitle, src, fileUrl:info.descriptionurl,
    articleTitle:article.title, articleUrl:article.url, articleRevision:article.revision,
    alt:value('ImageDescription').slice(0,400) || article.title,
    caption:value('ImageDescription').slice(0,400) || article.title,
    author:value('Artist'), credit:[value('Credit'),value('Attribution')].filter(Boolean).join(' — '),
    licenseName:value('LicenseShortName'),licenseUrl,
    reviewed:false,review:{senseMatches:false,childSuitable:false,creditsChecked:false}
  };
}
export async function requestJson(url, fetcher=fetch) {
  const host=new URL(url).hostname;
  if (!['fr.vikidia.org','commons.wikimedia.org'].includes(host) || new URL(url).protocol!=='https:') throw Error('Adresse API non autorisée.');
  const response=await fetcher(url,{headers:{'User-Agent':'monDico-illustrations/1.0 (offline editorial collection)','Accept':'application/json'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(`Accès à ${host} refusé ou indisponible (HTTP ${response.status}).`);
  const body=await response.json();if(body.error)throw Error(body.error.info || body.error.code);return body;
}
export async function collectArticle(request, fetcher=fetch) {
  const api=(host,params)=>`https://${host}/w/api.php?${new URLSearchParams({format:'json',formatversion:'2',...params})}`;
  const parsed=await requestJson(api('fr.vikidia.org',{action:'parse',page:request.articleTitle,prop:'images|revid',redirects:'1'}),fetcher);
  const page=parsed.parse;
  if(!page || page.title?.normalize('NFC').toLocaleLowerCase('fr')!==request.articleTitle.normalize('NFC').toLocaleLowerCase('fr'))throw Error('La page obtenue ne correspond pas exactement à l’article prévu. Aucun autre article n’est recherché.');
  const properties=await requestJson(api('fr.vikidia.org',{action:'query',titles:page.title,prop:'pageprops'}),fetcher);
  if(properties.query?.pages?.some(p=>p.pageprops && Object.hasOwn(p.pageprops,'disambiguation')))throw Error('Page d’homonymie : choisir explicitement un article correspondant au sens.');
  const article={title:page.title,url:'https://fr.vikidia.org/wiki/'+encodeURIComponent(page.title.replaceAll(' ','_')),revision:page.revid};
  const names=[...new Set(page.images || [])].filter(n=>/\.(?:jpe?g|png|webp|svg)$/i.test(n)&&!/(?:logo|pictogram|bandeau|drapeau|wikimedia|commons-logo|super[_ -]?article|icon)/i.test(n)).slice(0,12);
  const images=[];
  for(const name of names){
    const fileTitle='File:'+name.replace(/^(?:File|Fichier|Image):/i,'');
    const params={action:'query',titles:fileTitle,prop:'imageinfo',iiprop:'url|extmetadata|mime',iiurlwidth:'700'};
    let result=await requestJson(api('fr.vikidia.org',params),fetcher),info=result.query?.pages?.[0]?.imageinfo?.[0];
    const shared=['shared','commonswiki'].includes(result.query?.pages?.[0]?.imagerepository);
    let candidate=candidateFromInfo(fileTitle,info,article);
    if(shared && !candidate){
      const localThumb=info?.thumburl;
      result=await requestJson(api('commons.wikimedia.org',params),fetcher);
      const remoteInfo=result.query?.pages?.[0]?.imageinfo?.[0];
      info=remoteInfo ? {...remoteInfo,thumburl:localThumb || remoteInfo.thumburl} : undefined;
      candidate=candidateFromInfo(fileTitle,info,article);
    }
    if(candidate)images.push(candidate);
    if(images.length===4)break;
  }
  return {...request,article,images,error:null};
}
