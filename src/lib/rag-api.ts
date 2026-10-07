/** Wire contract from tisenda-api/src/answer/types.rs and src/server/http.rs. */
export interface QueryRequest {
	question: string;
}

export interface SourceLocation {
	kind: string;
	page_numbers?: number[];
	headings?: string[];
}

export interface Source {
	id: string;
	filename: string;
	source_key: string;
	location: SourceLocation;
	excerpt: string;
}

export interface Answer {
	text: string;
	sources: Source[];
}

export class RagApiError extends Error {
	constructor(
		message: string,
		public readonly status?: number,
	) {
		super(message);
		this.name = "RagApiError";
	}
}

const HTTP_ERRORS: Record<number, string> = {
	400: "La consulta no es válida. Revisa la pregunta e inténtalo de nuevo.",
	500: "La API tiene un problema de configuración.",
	502: "No se pudo consultar los documentos o generar la respuesta.",
	503: "No hay un índice de documentos disponible para consultar.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return (
		Array.isArray(value) && value.every((item) => typeof item === "string")
	);
}

function isUnsignedInteger(value: unknown): value is number {
	return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isSource(value: unknown): value is Source {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		/^[1-9][0-9]*$/.test(value.id) &&
		typeof value.filename === "string" &&
		typeof value.source_key === "string" &&
		typeof value.excerpt === "string" &&
		isRecord(value.location) &&
		typeof value.location.kind === "string" &&
		(value.location.headings === undefined ||
			isStringArray(value.location.headings)) &&
		(value.location.page_numbers === undefined ||
			(Array.isArray(value.location.page_numbers) &&
				value.location.page_numbers.every(isUnsignedInteger)))
	);
}

async function requestJson(
	path: "/query" | "/health",
	options: RequestInit,
): Promise<unknown> {
	let response: Response;
	try {
		response = await fetch(`/api${path}`, options);
	} catch (error) {
		if (options.signal?.aborted) throw error;
		throw new RagApiError(
			"No se pudo conectar con la API. Inténtalo de nuevo.",
		);
	}

	let body: unknown;
	try {
		body = await response.json();
	} catch (error) {
		if (options.signal?.aborted) throw error;
		if (response.ok) {
			throw new RagApiError("La API devolvió una respuesta JSON inválida.");
		}
	}
	if (!response.ok) {
		const message =
			isRecord(body) && typeof body.error === "string" && body.error.trim()
				? body.error
				: HTTP_ERRORS[response.status] || "No se pudo completar la consulta.";
		throw new RagApiError(message, response.status);
	}
	return body;
}

export async function queryRag(
	request: QueryRequest,
	signal?: AbortSignal,
): Promise<Answer> {
	const question = request.question.trim();
	if (!question) throw new RagApiError("Escribe una pregunta para consultar.");
	const body = JSON.stringify({ question });
	if (new TextEncoder().encode(body).byteLength > 256 * 1024) {
		throw new RagApiError("La pregunta supera el tamaño permitido por la API.");
	}
	const answer = await requestJson("/query", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body,
		signal,
	});
	if (
		!isRecord(answer) ||
		typeof answer.text !== "string" ||
		!answer.text.trim() ||
		!Array.isArray(answer.sources) ||
		!answer.sources.every(isSource) ||
		new Set(answer.sources.map((source) => source.id)).size !==
			answer.sources.length
	) {
		throw new RagApiError(
			"La respuesta de la API no cumple el contrato de consulta.",
		);
	}
	return { text: answer.text, sources: answer.sources };
}

/** Liveness only: does not verify the index, embeddings, or generation service. */
export async function getApiHealth(
	signal?: AbortSignal,
): Promise<{ status: "ok" }> {
	const body = await requestJson("/health", { signal });
	if (!isRecord(body) || body.status !== "ok") {
		throw new RagApiError("La API devolvió un estado de conexión inválido.");
	}
	return { status: "ok" };
}
