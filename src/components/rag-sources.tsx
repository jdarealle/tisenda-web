import { BookOpenIcon, ChevronDownIcon } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible";
import type { Source } from "#/lib/rag-api";
import { cn } from "#/lib/utils";

const LOCATION_LABELS: Record<string, string> = {
	page: "PDF",
	slide: "Presentación",
	sheet: "Hoja de cálculo",
	section: "Sección",
	image: "Imagen",
	document: "Documento",
};

export function RagSources({
	sources,
	open,
	onOpenChange,
	sourceIdPrefix,
	citation,
}: {
	sources: Source[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sourceIdPrefix: string;
	citation: { id: string } | null;
}) {
	useEffect(() => {
		if (!open || !citation) return;
		const target = document.getElementById(`${sourceIdPrefix}-${citation.id}`);
		target?.focus({ preventScroll: true });
		target?.scrollIntoView({ block: "nearest" });
	}, [open, citation, sourceIdPrefix]);

	if (sources.length === 0) return null;

	return (
		<Collapsible open={open} onOpenChange={onOpenChange}>
			<CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
				<BookOpenIcon data-icon="inline-start" aria-hidden="true" />
				Fuentes ({sources.length})
				<ChevronDownIcon
					data-icon="inline-end"
					aria-hidden="true"
					className={cn("transition-transform", open && "rotate-180")}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent keepMounted>
				<ol
					aria-label="Fuentes de esta respuesta"
					className="flex flex-col gap-4 px-2 py-3"
				>
					{sources.map((source) => (
						<li
							key={source.id}
							id={`${sourceIdPrefix}-${source.id}`}
							tabIndex={-1}
							aria-label={`Fuente ${source.id}: ${source.filename}`}
							className="flex min-w-0 scroll-my-3 gap-3 rounded-md text-sm focus:outline-2 focus:outline-ring"
						>
							<Badge variant="secondary" className="h-fit">
								[{source.id}]
							</Badge>
							<div className="flex min-w-0 flex-col gap-1 wrap-anywhere">
								<p className="font-medium">{source.filename}</p>
								<p className="text-xs text-muted-foreground">
									{source.source_key}
								</p>
								<p className="text-muted-foreground">
									{LOCATION_LABELS[source.location.kind] ?? "Documento"}
									{source.location.kind === "page" &&
										!!source.location.page_numbers?.length &&
										` · ${source.location.page_numbers.length === 1 ? "Página" : "Páginas"} ${source.location.page_numbers.join(", ")}`}
								</p>
								{!!source.location.headings?.length && (
									<p>{source.location.headings.join(" › ")}</p>
								)}
								<p className="mt-2 font-medium">Fragmento consultado</p>
								<p className="whitespace-pre-wrap">{source.excerpt}</p>
							</div>
						</li>
					))}
				</ol>
			</CollapsibleContent>
		</Collapsible>
	);
}
