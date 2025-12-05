export interface ThesaurusSuggestion {
  word: string;
  partOfSpeech: string;
  synonyms: string[];
  antonyms?: string[];
}

export const BUILT_IN_THESAURUS: Record<string, ThesaurusSuggestion> = {
  'WALK': { word: 'WALK', partOfSpeech: 'verb', synonyms: ['stroll', 'stride', 'march', 'pace', 'amble', 'trudge', 'saunter', 'wander'] },
  'RUN': { word: 'RUN', partOfSpeech: 'verb', synonyms: ['sprint', 'dash', 'race', 'rush', 'bolt', 'flee', 'hurry', 'jog'] },
  'SAY': { word: 'SAY', partOfSpeech: 'verb', synonyms: ['speak', 'tell', 'utter', 'declare', 'state', 'announce', 'remark', 'mention'] },
  'LOOK': { word: 'LOOK', partOfSpeech: 'verb', synonyms: ['gaze', 'stare', 'glance', 'peer', 'observe', 'watch', 'view', 'inspect'] },
  'HAPPY': { word: 'HAPPY', partOfSpeech: 'adj', synonyms: ['joyful', 'elated', 'content', 'pleased', 'delighted', 'thrilled', 'ecstatic'] },
  'SAD': { word: 'SAD', partOfSpeech: 'adj', synonyms: ['unhappy', 'sorrowful', 'melancholy', 'dejected', 'downcast', 'gloomy', 'mournful'] },
  'ANGRY': { word: 'ANGRY', partOfSpeech: 'adj', synonyms: ['furious', 'enraged', 'irate', 'livid', 'incensed', 'outraged', 'seething'] },
  'SCARED': { word: 'SCARED', partOfSpeech: 'adj', synonyms: ['frightened', 'terrified', 'afraid', 'fearful', 'petrified', 'horrified', 'spooked'] },
  'FAST': { word: 'FAST', partOfSpeech: 'adv', synonyms: ['quickly', 'rapidly', 'swiftly', 'speedily', 'hastily', 'briskly'] },
  'SLOW': { word: 'SLOW', partOfSpeech: 'adv', synonyms: ['slowly', 'gradually', 'leisurely', 'unhurriedly', 'deliberately'] },
  'BIG': { word: 'BIG', partOfSpeech: 'adj', synonyms: ['large', 'huge', 'enormous', 'massive', 'immense', 'vast', 'gigantic'] },
  'SMALL': { word: 'SMALL', partOfSpeech: 'adj', synonyms: ['tiny', 'little', 'miniature', 'compact', 'petite', 'minuscule'] },
  'BEAUTIFUL': { word: 'BEAUTIFUL', partOfSpeech: 'adj', synonyms: ['gorgeous', 'stunning', 'lovely', 'attractive', 'exquisite', 'radiant'] },
  'DARK': { word: 'DARK', partOfSpeech: 'adj', synonyms: ['dim', 'shadowy', 'gloomy', 'murky', 'unlit', 'dusky', 'pitch-black'] },
  'LIGHT': { word: 'LIGHT', partOfSpeech: 'adj', synonyms: ['bright', 'luminous', 'radiant', 'illuminated', 'gleaming', 'glowing'] },
  'QUIET': { word: 'QUIET', partOfSpeech: 'adj', synonyms: ['silent', 'hushed', 'still', 'peaceful', 'tranquil', 'serene', 'muted'] },
  'LOUD': { word: 'LOUD', partOfSpeech: 'adj', synonyms: ['noisy', 'booming', 'thunderous', 'deafening', 'blaring', 'roaring'] },
};

export const BUILT_IN_THESAURUS_ES: Record<string, ThesaurusSuggestion> = {
  'HOLA': { word: 'HOLA', partOfSpeech: 'interj', synonyms: ['buenos días', 'saludos', 'qué tal', 'bienvenido'] },
  'ADIOS': { word: 'ADIOS', partOfSpeech: 'interj', synonyms: ['hasta luego', 'nos vemos', 'chao', 'despedida'] },
  'GUION': { word: 'GUION', partOfSpeech: 'sust', synonyms: ['libreto', 'texto', 'manuscrito', 'escrito', 'historia'] },
  'CASA': { word: 'CASA', partOfSpeech: 'sust', synonyms: ['hogar', 'residencia', 'vivienda', 'domicilio', 'morada'] },
  'COCHE': { word: 'COCHE', partOfSpeech: 'sust', synonyms: ['auto', 'automóvil', 'vehículo', 'carro'] },
  'CORRER': { word: 'CORRER', partOfSpeech: 'verb', synonyms: ['trotar', 'galopar', 'sprintar', 'huir', 'acelerar'] },
  'FELIZ': { word: 'FELIZ', partOfSpeech: 'adj', synonyms: ['contento', 'alegre', 'dichoso', 'jovial', 'radiante'] },
  'TRISTE': { word: 'TRISTE', partOfSpeech: 'adj', synonyms: ['apenado', 'melancólico', 'angustiado', 'deprimido'] },
};
