import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Display model output as text/Markdown, without executing HTML or loading media. */
export function RagAnswer({ text }: { text: string }) {
	return (
		<div className="rag-markdown">
			<Markdown
				remarkPlugins={[remarkGfm]}
				skipHtml
				components={{
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
