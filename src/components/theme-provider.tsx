import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useLayoutEffect,
	useState,
} from "react";

// Adapted from https://ui.shadcn.com/docs/dark-mode/vite.
type Theme = "light" | "dark" | "system";
type ResolvedTheme = Exclude<Theme, "system">;
const STORAGE_KEY = "tisenda-theme";
const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

function readTheme(): Theme {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === "light" || stored === "dark" || stored === "system") {
			return stored;
		}
	} catch {
		// A blocked storage area must not prevent changing the theme.
	}
	return "system";
}

function readSystemTheme(): ResolvedTheme {
	return typeof window !== "undefined" &&
		window.matchMedia(SYSTEM_QUERY).matches
		? "dark"
		: "light";
}

const ThemeContext = createContext<{
	theme: Theme;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, updateTheme] = useState<Theme>(readTheme);
	const [systemTheme, setSystemTheme] = useState(readSystemTheme);
	const resolvedTheme = theme === "system" ? systemTheme : theme;

	useEffect(() => {
		const media = window.matchMedia(SYSTEM_QUERY);
		const updateSystemTheme = () =>
			setSystemTheme(media.matches ? "dark" : "light");
		updateSystemTheme();
		media.addEventListener("change", updateSystemTheme);
		return () => media.removeEventListener("change", updateSystemTheme);
	}, []);

	useLayoutEffect(() => {
		const root = document.documentElement;
		root.classList.remove("light", "dark");
		root.classList.add(resolvedTheme);
		root.style.colorScheme = resolvedTheme;
	}, [resolvedTheme]);

	function setTheme(nextTheme: Theme) {
		updateTheme(nextTheme);
		try {
			localStorage.setItem(STORAGE_KEY, nextTheme);
		} catch {
			// Keep the selection for this session even if persistence is unavailable.
		}
	}

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) throw new Error("useTheme requiere ThemeProvider.");
	return context;
}
