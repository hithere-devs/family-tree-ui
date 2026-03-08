import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from 'react';

export type Lang = 'en' | 'ur';

interface LanguageContextValue {
	lang: Lang;
	setLang: (l: Lang) => void;
	isUrdu: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
	lang: 'en',
	setLang: () => {},
	isUrdu: false,
});

const STORAGE_KEY = 'family-tree-lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
	const [lang, setLangState] = useState<Lang>(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved === 'ur' || saved === 'en') return saved;
		} catch {
			/* ignore */
		}
		return 'en';
	});

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, lang);
		} catch {
			/* ignore */
		}
	}, [lang]);

	const setLang = (l: Lang) => setLangState(l);

	return (
		<LanguageContext.Provider value={{ lang, setLang, isUrdu: lang === 'ur' }}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	return useContext(LanguageContext);
}
