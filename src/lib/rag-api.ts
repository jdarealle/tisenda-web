/** Wire contract from tisenda-api/src/answer.rs and src/server.rs. */
export interface QueryRequest {
	question: string;
	top_k?: number | null;
}

export interface Source {
	filename: string;
	source_key: string;
	headings: string[] | null;
	captions: string[] | null;
	page_numbers: number[] | null;
	doc_items: string[];
	chunk_index: number;
	score: number;
	location_kind: string;
	provenance: unknown;
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
		typeof value.filename === "string" &&
		typeof value.source_key === "string" &&
		(value.headings === null || isStringArray(value.headings)) &&
		(value.captions === null || isStringArray(value.captions)) &&
		(value.page_numbers === null ||
			(Array.isArray(value.page_numbers) &&
				value.page_numbers.every(isUnsignedInteger))) &&
		isStringArray(value.doc_items) &&
		isUnsignedInteger(value.chunk_index) &&
		typeof value.score === "number" &&
		Number.isFinite(value.score) &&
		typeof value.location_kind === "string" &&
		"provenance" in value
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
	if (
		request.top_k != null &&
		(!Number.isInteger(request.top_k) ||
			request.top_k < 1 ||
			request.top_k > 50)
	) {
		throw new RagApiError("top_k debe ser un entero entre 1 y 50.");
	}
	const body = JSON.stringify({ question, top_k: request.top_k });
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
		!answer.sources.every(isSource)
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
