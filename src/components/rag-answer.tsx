import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "#/components/ui/button";
import type { Source } from "#/lib/rag-api";

// Minimal HAST shape: transform text nodes without rewriting Markdown or raw HTML.
interface CitationNode {
	type: string;
	tagName?: string;
	value?: string;
	properties?: Record<string, string>;
	children?: CitationNode[];
}

function rehypeCitations({ ids }: { ids: Set<string> }) {
	return function transform(node: CitationNode) {
		if (!node.children || ["a", "code", "pre"].includes(node.tagName ?? "")) {
			return;
		}
		node.children = node.children.flatMap((child): CitationNode[] => {
			if (child.type !== "text" || !child.value) {
				transform(child);
				return [child];
			}
			const parts: CitationNode[] = [];
			let offset = 0;
			for (const match of child.value.matchAll(/\[([1-9][0-9]*)\]/g)) {
				if (!ids.has(match[1])) continue;
				parts.push({
					type: "text",
					value: child.value.slice(offset, match.index),
				});
				parts.push({
					type: "element",
					tagName: "span",
					properties: { "data-rag-citation": match[1] },
					children: [{ type: "text", value: match[0] }],
				});
				offset = match.index + match[0].length;
			}
			parts.push({ type: "text", value: child.value.slice(offset) });
			return parts;
		});
	};
}

/** Display model output as text/Markdown, without executing HTML or loading media. */
export function RagAnswer({
	text,
	sources,
	sourceIdPrefix,
	onCitation,
}: {
	text: string;
	sources: Source[];
	sourceIdPrefix: string;
	onCitation: (id: string) => void;
}) {
	return (
		<div className="rag-markdown">
			<Markdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[
					[
						rehypeCitations,
						{ ids: new Set(sources.map((source) => source.id)) },
					],
				]}
				skipHtml
				components={{
					span: ({ node, children }) => {
						const id = node?.properties["data-rag-citation"];
						if (typeof id !== "string") return <span>{children}</span>;
						return (
							<Button
								type="button"
								variant="link"
								size="xs"
								className="h-auto px-1 align-baseline"
								aria-label={`Ver fuente ${id}`}
								aria-controls={`${sourceIdPrefix}-${id}`}
								onClick={() => onCitation(id)}
							>
								{children}
							</Button>
						);
					},
					img: ({ alt }) => <span>{alt}</span>,
					a: ({ href, children }) =>
						/^https?:\/\//i.test(href ?? "") ? (
							<a href={href} target="_blank" rel="noopener noreferrer">
								{children}
							</a>
						) : (
							<span>{children}</span>
						),
				}}
			>
				{text}
			</Markdown>
		</div>
	);
}
