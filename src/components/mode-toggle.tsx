import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "#/components/theme-provider";
import { Button } from "#/components/ui/button";

export function ModeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
	const label =
		nextTheme === "dark" ? "Cambiar a modo oscuro" : "Cambiar a modo claro";

	return (
		<Button
			variant="outline"
			size="icon"
			aria-label={label}
			title={label}
			onClick={() => setTheme(nextTheme)}
		>
			{resolvedTheme === "dark" ? (
				<SunIcon aria-hidden="true" />
			) : (
				<MoonIcon aria-hidden="true" />
			)}
		</Button>
	);
}
