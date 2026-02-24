import 'server-only';

const dictionaries = {
    en: () => import('./dictionaries/en.json').then((module) => module.default),
    fr: () => import('./dictionaries/fr.json').then((module) => module.default),
};

export const getDictionary = async (locale: 'en' | 'fr') => {
    if (!dictionaries[locale]) {
        return dictionaries.fr();
    }
    return dictionaries[locale]();
};
