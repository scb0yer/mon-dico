import {index,demoIndex} from './dictionaryStore.js';
import readyIds from './data/entryStatus.json' with {type:'json'};
import {buildAlphabeticalIndex,summarizeVocabulary} from './alphabeticalIndex.js';
export const vocabulary=buildAlphabeticalIndex([...index,...demoIndex],readyIds);
export const vocabularyStats=summarizeVocabulary(vocabulary);
