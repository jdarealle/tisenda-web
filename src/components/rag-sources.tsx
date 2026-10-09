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

	const files = new Map<string, Source[]>();
	for (const source of sources) {
		const fileKey = source.source_key || source.filename;
		const fragments = files.get(fileKey);
		if (fragments) fragments.push(source);
		else files.set(fileKey, [source]);
	}

	return (
		<Collapsible open={open} onOpenChange={onOpenChange}>
			<CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
				<BookOpenIcon data-icon="inline-start" aria-hidden="true" />
				Fuentes ({files.size} {files.size === 1 ? "archivo" : "archivos"} ·{" "}
				{sources.length} {sources.length === 1 ? "fragmento" : "fragmentos"})
				<ChevronDownIcon
					data-icon="inline-end"
					aria-hidden="true"
					className={cn("transition-transform", open && "rotate-180")}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent keepMounted>
				<ol
					aria-label="Archivos consultados para esta respuesta"
					className="flex flex-col gap-4 px-2 py-3"
				>
					{Array.from(files, ([fileKey, fragments]) => (
						<li
							key={fileKey}
							className="flex min-w-0 flex-col gap-2 text-sm wrap-anywhere"
						>
							<div className="flex flex-wrap items-center gap-2">
								<p className="font-medium">{fragments[0].filename}</p>
								<Badge variant="secondary">
									{fragments.length}{" "}
									{fragments.length === 1 ? "fragmento" : "fragmentos"}
								</Badge>
							</div>
							<p className="text-xs text-muted-foreground">
								{fragments[0].source_key}
							</p>
							<ol
								aria-label={`Fragmentos de ${fragments[0].filename}`}
								className="flex flex-col gap-3"
							>
								{fragments.map((source) => (
									<li
										key={source.id}
										id={`${sourceIdPrefix}-${source.id}`}
										tabIndex={-1}
										aria-label={`Fuente ${source.id}: ${source.filename}`}
										className="flex min-w-0 scroll-my-3 gap-3 rounded-md focus:outline-2 focus:outline-ring"
									>
										<Badge variant="secondary" className="h-fit">
											[{source.id}]
										</Badge>
										<div className="flex min-w-0 flex-col gap-1">
											<p className="text-muted-foreground">
												{LOCATION_LABELS[source.location.kind] ?? "Documento"}
												{source.location.kind === "page" &&
													!!source.location.page_numbers?.length &&
													` · ${source.location.page_numbers.length === 1 ? "Página" : "Páginas"} ${source.location.page_numbers.join(", ")}`}
											</p>
											{!!source.location.headings?.length && (
												<p>{source.location.headings.join(" › ")}</p>
											)}
											<Collapsible defaultOpen={false} className="mt-2">
												<CollapsibleTrigger
													render={<Button variant="ghost" size="sm" />}
													aria-label={`Fragmento consultado de la fuente ${source.id}: ${source.filename}`}
													className="[&[aria-expanded=true]>svg]:rotate-180"
												>
													Fragmento consultado
													<ChevronDownIcon
														data-icon="inline-end"
														aria-hidden="true"
														className="transition-transform"
													/>
												</CollapsibleTrigger>
												<CollapsibleContent>
													<p className="pt-2 whitespace-pre-wrap">
														{source.excerpt}
													</p>
												</CollapsibleContent>
											</Collapsible>
										</div>
									</li>
								))}
							</ol>
						</li>
					))}
				</ol>
			</CollapsibleContent>
		</Collapsible>
	);
}
