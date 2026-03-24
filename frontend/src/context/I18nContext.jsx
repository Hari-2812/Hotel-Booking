import { useMemo, useState } from 'react';
import { I18nContext } from './i18n-context';

const dictionary = {
  en: { discover: 'Discover', dashboard: 'Dashboard', concierge: 'Concierge', wishlist: 'Wishlist', admin: 'Admin' },
  hi: { discover: 'खोजें', dashboard: 'डैशबोर्ड', concierge: 'कंसीयर्ज', wishlist: 'इच्छासूची', admin: 'एडमिन' },
  es: { discover: 'Descubrir', dashboard: 'Panel', concierge: 'Asistente', wishlist: 'Favoritos', admin: 'Admin' },
};

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key) => dictionary[language]?.[key] || dictionary.en[key] || key,
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
