// L’ordre d’affichage ne change pas l’organisation des fichiers éditoriaux.
export function orderCooccurrenceGroups(groups, category) {
  if (category !== 'nom commun') return groups;
  const rank = group => {
    const title = group[0].toLowerCase();
    if (title.includes('adjectif')) return 0;
    if (group[3] === 'nom commun' || title.includes('compléments du nom')) return 1;
    if (title.includes('sujet')) return 2;
    if (title.includes('cod')) return 3;
    return 4;
  };
  return groups.map((group, index) => ({group, index}))
    .sort((a, b) => rank(a.group) - rank(b.group) || a.index - b.index)
    .map(item => item.group);
}
