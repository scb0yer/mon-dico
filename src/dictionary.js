const db={};
const add=(word,nature,definition,syn=[],ant=[],groups=[],example='')=>db[word]={word,nature,definition,syn,ant,groups,example};
add('pluie','nom commun féminin','Eau qui tombe des nuages sous forme de gouttes.',['averse','précipitation'],[],[['Avec des adjectifs','Pour décrire la pluie',[['une pluie ','fine'],['une pluie ','torrentielle','torrentiel'],['une pluie ','diluvienne','diluvien']]],['Avec des verbes · sujet','Que fait la pluie ?',[['la pluie ','tombe','tomber'],['la pluie ','cesse','cesser'],['la pluie ','redouble','redoubler']]],['Avec des verbes · COD','Que peut-on faire face à la pluie ?',[['','affronter','affronter',' la pluie'],['','craindre','craindre',' la pluie'],['','observer','observer',' la pluie']]]],'Une pluie fine mouille les feuilles du jardin.');
add('répondre','verbe','Dire ou écrire quelque chose à la suite d’une question ou d’une demande.',['répliquer'],[],[['Avec des adverbes','Pour préciser la manière de répondre',[['répondre ','calmement'],['répondre ','rapidement'],['répondre ','sèchement']]]],'Elle prend le temps de répondre calmement.');
add('profond','adjectif · profond / profonde','Qui s’étend loin vers le bas ou vers l’intérieur. Au sens figuré, qui est intense.',[],['superficiel'],[['Avec des noms','Au sens propre',[['un ','lac','',' profond'],['un ','puits','',' profond']]],['Avec des noms','Au sens figuré',[['un ','sommeil','',' profond'],['une ','tristesse','',' profonde']]]],'Le plongeur explore un lac profond.');
add('éléphant','nom commun masculin','Grand mammifère qui possède une trompe, de larges oreilles et souvent des défenses.',[],[],[['Avec des adjectifs','Pour décrire l’éléphant',[['un éléphant ','imposant']]],['Avec des verbes · sujet','Que fait l’éléphant ?',[['l’éléphant ','barrit','barrir']]],['Avec des verbes · COD','Que peut-on faire ?',[['','observer','',' un éléphant']]]],'L’éléphant saisit une branche avec sa trompe.');
add('diluvien','adjectif · diluvien / diluvienne','Qui évoque un déluge par son abondance. Se dit notamment d’une pluie très forte.',['torrentiel'],[],[['Avec des noms','Pour parler d’une pluie abondante',[['une ','pluie','',' diluvienne']]]]);
add('torrentiel','adjectif · torrentiel / torrentielle','Qui tombe avec beaucoup de force et en grande quantité, comme un torrent.',['diluvien'],[],[['Avec des noms','Pour parler d’intempéries',[['une ','pluie','',' torrentielle'],['une ','averse','',' torrentielle']]]]);
const entries=[['fine','adjectif · fin / fine','De faible épaisseur. Pour la pluie : formée de petites gouttes.'],['averse','nom commun féminin','Pluie soudaine qui dure généralement peu de temps.'],['précipitation','nom commun féminin','Eau qui tombe de l’atmosphère, sous forme de pluie, de neige ou de grêle.'],['tomber','verbe','Se déplacer vers le bas sous l’effet de son poids.'],['cesser','verbe','S’arrêter ou prendre fin.'],['redoubler','verbe','Devenir plus fort ou plus intense.'],['affronter','verbe','Faire face à une difficulté ou à un danger.'],['craindre','verbe','Avoir peur de quelque chose ou de quelqu’un.'],['observer','verbe','Regarder avec attention pour mieux connaître ou comprendre.'],['répliquer','verbe','Répondre à quelqu’un, souvent avec vivacité.'],['calmement','adverbe','Avec calme, sans agitation.'],['rapidement','adverbe','Avec une grande vitesse ou en peu de temps.'],['sèchement','adverbe','D’une manière brusque et peu aimable.'],['superficiel','adjectif · superficiel / superficielle','Qui concerne la surface ; au sens figuré, qui manque de profondeur.'],['lac','nom commun masculin','Grande étendue d’eau entourée de terres.'],['puits','nom commun masculin','Trou profond creusé dans le sol, notamment pour atteindre de l’eau.'],['sommeil','nom commun masculin','État de repos pendant lequel on dort.'],['tristesse','nom commun féminin','Émotion ressentie quand on a du chagrin.'],['imposant','adjectif · imposant / imposante','Qui impressionne par sa taille ou son importance.'],['barrir','verbe','Pousser son cri, en parlant de l’éléphant.'],['bouquetin','nom commun masculin','Mammifère de montagne, proche de la chèvre, dont le mâle porte de grandes cornes recourbées.']];entries.forEach(e=>add(...e));
const aliases={'diluvienne':'diluvien','torrentielle':'torrentiel','profonde':'profond','fin':'fine','pluies':'pluie','éléphants':'éléphant','imposante':'imposant','superficielle':'superficiel'};

// Associations complètes du nom « puits ».
db.puits.groups = [
 ['Avec des adjectifs','Pour décrire le puits',[
  ['un puits ','profond'], ['un puits ','sec']
 ]],
 ['Avec des verbes · sujet','Que fait le puits ?',[
  ['le puits ','tarit','tarir'], ['le puits ','fournit','fournir',' de l’eau']
 ]],
 ['Avec des verbes · COD','Que peut-on faire ?',[
  ['','creuser','',' un puits'], ['','nettoyer','',' un puits'], ['','couvrir','',' un puits']
 ]]
];
db.puits.example = 'Les villageois puisent de l’eau dans un puits profond.';
add('sec','adjectif · sec / sèche','Qui ne contient pas ou plus d’eau.',[],[],[['Avec des noms','Pour parler de ce qui manque d’eau',[[ 'un ','puits','',' sec']]]]);
add('tarir','verbe','Cesser de fournir de l’eau, en parlant notamment d’une source ou d’un puits.',[],[],[['Avec des adverbes','Pour préciser comment cela se produit',[[ 'tarir ','rapidement']]]]);
add('fournir','verbe','Donner ou procurer ce qui est nécessaire.');
add('creuser','verbe','Faire un trou dans le sol ou rendre une cavité plus profonde.');
add('nettoyer','verbe','Enlever les saletés pour rendre quelque chose propre.');
add('couvrir','verbe','Placer quelque chose sur un objet pour le protéger ou le fermer.');
aliases.sèche='sec';
export {db,aliases};
