// Shared by the React display, the offline collector and its review page.
export const illustrationKey = (word, senseId) => `${word.normalize('NFC')}#${senseId}`;
export function trustedUrl(value, kind = 'source') {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return false;
    if (kind === 'license') return u.hostname === 'creativecommons.org';
    if (kind === 'article') return u.hostname === 'fr.vikidia.org' && u.pathname.startsWith('/wiki/');
    if (kind === 'image') return u.hostname === 'upload.wikimedia.org' || u.hostname === 'vikidia.org' || u.hostname.endsWith('.vikidia.org');
    return u.hostname === 'commons.wikimedia.org' || u.hostname === 'vikidia.org' || u.hostname.endsWith('.vikidia.org');
  } catch { return false; }
}
export function supportedLicense(url) {
  if (!trustedUrl(url, 'license')) return false;
  const path = new URL(url).pathname.replace(/\/$/, '');
  return /^\/licenses\/by(?:-sa)?\/(?:2\.0|2\.5|3\.0|4\.0)$/.test(path) || /^\/publicdomain\/(?:zero|mark)\/1\.0$/.test(path);
}
export function validIllustration(image) {
  return Boolean(image && typeof image.id === 'string' && image.id && image.reviewed === true && (!image.localPath || /^illustrations\/[a-f0-9]{64}\.(?:jpg|png|webp)$/.test(image.localPath)) &&
    image.review?.senseMatches === true && image.review?.childSuitable === true && image.review?.creditsChecked === true &&
    typeof image.fileTitle === 'string' && image.fileTitle && typeof image.alt === 'string' && image.alt.trim() &&
    typeof image.caption === 'string' && image.caption.trim() && typeof image.author === 'string' && image.author.trim() &&
    typeof image.licenseName === 'string' && image.licenseName.trim() && supportedLicense(image.licenseUrl) &&
    trustedUrl(image.src, 'image') && trustedUrl(image.fileUrl) && trustedUrl(image.articleUrl, 'article'));
}
export function selectIllustrations(entry, registry) {
  if (!entry || registry?.schemaVersion !== 1 || !Array.isArray(registry.blockedWords)) return [];
  const nature = entry.category || entry.nature || '';
  if (nature !== 'nom commun' && !nature.startsWith('nom commun ')) return [];
  if (typeof entry.word !== 'string' || registry.blockedWords.includes(entry.word.normalize('NFC'))) return [];
  const senseId = entry.imageSenseId;
  if (!senseId) return [];
  const record = registry.entries?.[illustrationKey(entry.word, senseId)];
  if (!record || record.entryId !== entry.id || record.word !== entry.word || record.senseId !== senseId || record.definition !== entry.definition || !Array.isArray(record.images)) return [];
  const used = new Set();
  return record.images.filter(image => {
    if (!validIllustration(image) || !image.localPath || used.has(image.id)) return false;
    used.add(image.id); return true;
  }).slice(0, 2);
}
