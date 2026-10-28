export const TENSES = [
 ['present', 'Présent'], ['futur', 'Futur simple'],
 ['imparfait', 'Imparfait'], ['passeSimple', 'Passé simple'],
];
export function conjugatedPhrase(form, person, options = {}) {
 if (form == null) return null;
 const elision = /^[aàâeéèêëiîïoôuùûühœ]/i.test(form) && !options.hAspire;
 const subject = options.impersonal && person === 2 ? 'il' : ['je', 'tu', 'il / elle / on', 'nous', 'vous', 'ils / elles'][person];
 if (options.pronominal) {
  const reflexive = ['me', 'te', 'se', 'nous', 'vous', 'se'][person];
  return `${subject} ${elision && person !== 3 && person !== 4 ? reflexive[0] + '’' : reflexive + ' '}${form}`;
 }
 return person === 0 && elision ? `j’${form}` : `${subject} ${form}`;
}
