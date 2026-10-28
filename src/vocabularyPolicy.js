import { entryAliases, excludedEntries } from "./editorialReview.js";
// Exclusions éditoriales demandées pour le dictionnaire des élèves.
// Les exceptions (sens limités et mots réintroduits) restent consultables.
// Les accents distinguent des mots : châsse ≠ chasse, cote ≠ côte, invite ≠ invité.
const key = (s) =>
  s
    .toLocaleLowerCase("fr")
    .normalize("NFC")
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑]/g, "-");
const excluded = new Set(
  `putain mec cul pute connerie chier con emmerder pisser race piger nana déconner couille nègre enfoiré dégueulasse gueuler enculé connard boche bite garce führer défoncer pognon capote piper branler nazi came chialer enculer gay crétin nudité fantasme flinguer pédal coke bled pervers fasciste hosto foutaise pourriture porno pénis foutre orgasme prostitution défoncé pisse dope lesbien cochonnerie cinglé jésus négro pétasse niquer pif bonnir peloter fascisme ghetto crack mamelon homo minou néné couillon emmerdeur ducon cash maton pope cinoche homosexualité chaste adultère connasse foireux gazer orgie piaf merdeux poivrot biblique gonze loufiat larbin cocaïne plumard indic culbuter jésuite branleur junkie protestant dandy mémère naze chasteté corniaud mitard plumer fessée mirette mouflet dégueuler micheton flirt pouf patriarche clébard cocu bignole mauviette plouc préservatif pénétration prolétaire rabbi bouffe calife emmerdement noiraud black métèque glander gynécologue obscénité prêcheur chourer accoupler homone pissou caca chiper hitlérien puceau clebs bobard guibolle lubrique préliminaire gnôle loubard prolétariat bibine binoclard hétéro gratos macchabée marmaille hétérosexuel mamelle libertin partouze camer frichti fion coran moufter dégueu pédé sexe sexuel sexuelle vagin masturbation pornographie salope salaud merde fuck shit
ne pas mme ben quant par go pars baby boss pédal mark kid cote ci nan by cuiller chanoine cm peso minus ais dure jenny break châsse bingo plain lord min crac pa coté fifi out der max plombe group bu papy los jeep khan chiche aga magot occase bécane franco ici-bas e-mail invite chichi janissaire about bé primo jargon cagibi ave casbah pradelle calot maquisard blinder fuyard quarante biler isba daller jaffer guetteur môle caïque magnum lorgnon clean matou je galeux implant logeur duce mm patelin hic cake bouffi piazza bath house branle imper mouron bey pernod guenille pacotille boyard christ parlé ledit land gammée para jeunot gratos moignon chrono carrée franque must papet plaza gadget mercier brocart rafle gag kleenex non`
    .split(/\s+/)
    .map(key),
);
const excludedNouns = new Set(
  `juif américain italien arabe chinois espagnol portugais belge algérien hollandais israélien barbu brésilien hébreu danois marocain antillais protestant`
    .split(/\s+/)
    .map(key),
);
// Mots réintroduits avec des fiches descriptives, sans jugement sur les croyances.
const neutralReligionNouns = new Set([
  "dieu",
  "église",
  "mosquée",
  "synagogue",
  "temple",
  "bible",
  "torah",
  "coran",
  "veda",
  "tripitaka",
  "christianisme",
  "judaïsme",
  "islam",
  "hindouisme",
  "bouddhisme",
  "religion",
]);
const approvedVerbs = new Set(["bâcler", "bagarrer", "berner", "bougonner", "brailler", "défouler", "embêter", "fignoler", "flirter", "manigancer", "minauder", "piailler", "pleurnicher", "radoter", "rafistoler", "rafler", "ratatiner", "narguer", "cabosser", "chahuter", "jaser", "chiner"]);
const reviewed = new Set(
  [...entryAliases, ...excludedEntries].map(
    (e) => key(e.word) + "|" + e.nature,
  ),
);
export function isExcludedEntry(word, nature) {
  const normalized = key(word);
  if (nature === "nom commun" && neutralReligionNouns.has(normalized))
    return false;
  if (normalized === "zone de basse pression") return true;
  return (
    reviewed.has(normalized + "|" + nature) ||
    excluded.has(normalized) ||
    (nature === "nom commun" && excludedNouns.has(normalized))
  );
}
