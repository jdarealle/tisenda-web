import { BookOpenIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
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

export function RagSources({ sources }: { sources: Source[] }) {
	const [open, setOpen] = useState(false);
	if (sources.length === 0) return null;

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
				<BookOpenIcon data-icon="inline-start" aria-hidden="true" />
				Fuentes ({sources.length})
				<ChevronDownIcon
					data-icon="inline-end"
					aria-hidden="true"
					className={cn("transition-transform", open && "rotate-180")}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<ol
					aria-label="Fuentes de esta respuesta"
					className="flex flex-col gap-4 px-2 py-3"
				>
					{sources.map((source, index) => (
						<li
							key={`${source.source_key}:${source.chunk_index}`}
							className="flex min-w-0 gap-3 text-sm"
						>
							<Badge variant="secondary" className="h-fit">
								[{index + 1}]
							</Badge>
							<div className="flex min-w-0 flex-col gap-1 wrap-anywhere">
								<p className="font-medium">{source.filename}</p>
								<p className="text-xs text-muted-foreground">
									{source.source_key}
								</p>
								<p className="text-muted-foreground">
									{LOCATION_LABELS[source.location_kind] ?? "Documento"}
									{source.location_kind === "page" &&
										!!source.page_numbers?.length &&
										` · ${source.page_numbers.length === 1 ? "Página" : "Páginas"} ${source.page_numbers.join(", ")}`}
								</p>
								{!!source.headings?.length && (
									<p>{source.headings.join(" › ")}</p>
								)}
								{!!source.captions?.length && (
									<p className="text-muted-foreground">
										{source.captions.join(" · ")}
									</p>
								)}
							</div>
						</li>
					))}
				</ol>
			</CollapsibleContent>
		</Collapsible>
	);
}
