import { cn } from "cn";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	BookOpenIcon,
	CircleAlertIcon,
	PlusIcon,
	RotateCcwIcon,
	SquareIcon,
} from "lucide-react";
import { Fragment, useRef, useState } from "react";
import { ModeToggle } from "#/components/mode-toggle";
import { RagAnswer } from "#/components/rag-answer";
import { RagSources } from "#/components/rag-sources";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Bubble, BubbleContent } from "#/components/ui/bubble";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "#/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "#/components/ui/input-group";
import { Marker, MarkerContent, MarkerIcon } from "#/components/ui/marker";
import {
	Message,
	MessageAvatar,
	MessageContent,
	MessageFooter,
	MessageHeader,
} from "#/components/ui/message";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "#/components/ui/message-scroller";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import { type ChatTurn, useApiHealth, useRagChat } from "#/hooks/use-rag-chat";

function AssistantReply({
	turn,
	busy,
	onRetry,
}: {
	turn: ChatTurn;
	busy: boolean;
	onRetry: (id: string) => void;
}) {
	const [sourcesOpen, setSourcesOpen] = useState(false);
	const [citation, setCitation] = useState<{ id: string } | null>(null);
	const sourceIdPrefix = `rag-${turn.id}-source`;

	return (
		<Message>
			<MessageAvatar>
				<Avatar>
					<AvatarFallback>Ti</AvatarFallback>
				</Avatar>
			</MessageAvatar>
			<MessageContent>
				<MessageHeader>Tisenda</MessageHeader>
				{turn.status === "pending" && (
					<Marker role="status">
						<MarkerIcon>
							<Spinner aria-hidden="true" />
						</MarkerIcon>
						<MarkerContent>Consultando documentos…</MarkerContent>
					</Marker>
				)}
				{turn.status === "complete" && (
					<>
						<Bubble variant="ghost">
							<BubbleContent>
								<RagAnswer
									text={turn.answer.text}
									sources={turn.answer.sources}
									sourceIdPrefix={sourceIdPrefix}
									onCitation={(id) => {
										setSourcesOpen(true);
										setCitation({ id });
									}}
								/>
							</BubbleContent>
						</Bubble>
						{turn.answer.sources.length > 0 ? (
							<RagSources
								sources={turn.answer.sources}
								open={sourcesOpen}
								onOpenChange={(open) => {
									setSourcesOpen(open);
									setCitation(null);
								}}
								sourceIdPrefix={sourceIdPrefix}
								citation={citation}
							/>
						) : (
							<MessageFooter>
								Sin evidencia suficiente para responder esta consulta.
							</MessageFooter>
						)}
					</>
				)}
				{turn.status === "error" && (
					<Alert variant="destructive">
						<CircleAlertIcon aria-hidden="true" />
						<AlertTitle>No se pudo completar la consulta</AlertTitle>
						<AlertDescription>{turn.error}</AlertDescription>
					</Alert>
				)}
				{turn.status === "cancelled" && (
					<Marker role="status">
						<MarkerContent>Consulta cancelada.</MarkerContent>
					</Marker>
				)}
				{(turn.status === "error" || turn.status === "cancelled") && (
					<MessageFooter>
						<Button
							variant="ghost"
							size="sm"
							disabled={busy}
							onClick={() => onRetry(turn.id)}
						>
							<RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
							Reintentar
						</Button>
					</MessageFooter>
				)}
			</MessageContent>
		</Message>
	);
}

export function RagChat() {
	const { turns, isPending, send, cancel, clear, retry } = useRagChat();
	const health = useApiHealth();
	const [draft, setDraft] = useState("");
	const [session, setSession] = useState(0);
	const input = useRef<HTMLTextAreaElement>(null);
	const healthLabel = health.isError
		? "Sin conexión"
		: health.isSuccess
			? "API disponible"
			: "Comprobando conexión…";

	function submit() {
		if (isPending || !draft.trim()) return;
		void send(draft);
		setDraft("");
		input.current?.focus();
	}

	function newChat() {
		clear();
		setDraft("");
		setSession((previous) => previous + 1);
		input.current?.focus();
	}

	return (
		<main className="flex h-dvh min-h-0 flex-col bg-background text-foreground">
			<header className="mx-auto flex w-full max-w-4xl shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
				<div className="flex flex-col gap-1">
					<h1 className="text-lg font-semibold tracking-tight">Tisenda</h1>
					<p className="text-sm text-muted-foreground">
						Consulta tus documentos
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<ModeToggle />
					<Badge
						variant="outline"
						role="status"
						title="Indica si la API responde; no comprueba la disponibilidad de los documentos."
					>
						<span
							aria-hidden="true"
							className={cn("mr-1 size-2 shrink-0 rounded-full", {
								"bg-success ring-2 ring-success/20": health.isSuccess,
								"bg-destructive": health.isError,
								"bg-muted-foreground motion-safe:animate-pulse":
									!health.isSuccess && !health.isError,
							})}
						/>
						{healthLabel}
					</Badge>
					<Button variant="outline" onClick={newChat}>
						<PlusIcon data-icon="inline-start" aria-hidden="true" />
						Nueva consulta
					</Button>
				</div>
			</header>
			<Separator />
			<div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col">
				<MessageScrollerProvider key={session} autoScroll>
					<MessageScroller>
						<MessageScrollerViewport>
							<MessageScrollerContent
								aria-label="Historial de consultas"
								className="px-4 py-6 sm:px-6"
							>
								{turns.length === 0 && (
									<MessageScrollerItem
										messageId="welcome"
										className="flex flex-1"
									>
										<Empty>
											<EmptyHeader>
												<EmptyMedia variant="icon">
													<BookOpenIcon aria-hidden="true" />
												</EmptyMedia>
												<EmptyTitle>¿Qué necesitas consultar?</EmptyTitle>
												<EmptyDescription>
													Escribe una pregunta sobre tus documentos. Tisenda
													buscará información y mostrará las fuentes disponibles
													junto a la respuesta.
												</EmptyDescription>
											</EmptyHeader>
										</Empty>
									</MessageScrollerItem>
								)}
								{turns.map((turn) => (
									<Fragment key={turn.id}>
										<MessageScrollerItem
											messageId={`${turn.id}-question`}
											scrollAnchor
										>
											<Message align="end">
												<MessageContent>
													<MessageHeader>Tú</MessageHeader>
													<Bubble align="end" variant="secondary">
														<BubbleContent>
															<p className="whitespace-pre-wrap">
																{turn.question}
															</p>
														</BubbleContent>
													</Bubble>
												</MessageContent>
											</Message>
										</MessageScrollerItem>
										<MessageScrollerItem messageId={`${turn.id}-answer`}>
											<AssistantReply
												turn={turn}
												busy={isPending}
												onRetry={(id) => {
													void retry(id);
												}}
											/>
										</MessageScrollerItem>
									</Fragment>
								))}
							</MessageScrollerContent>
						</MessageScrollerViewport>
						<MessageScrollerButton aria-label="Ir al último mensaje">
							<ArrowDownIcon aria-hidden="true" />
						</MessageScrollerButton>
					</MessageScroller>
				</MessageScrollerProvider>
			</div>
			<footer className="mx-auto w-full max-w-4xl shrink-0 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						submit();
					}}
				>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="rag-question" className="sr-only">
								Tu pregunta
							</FieldLabel>
							<InputGroup>
								<InputGroupTextarea
									ref={input}
									id="rag-question"
									name="question"
									placeholder="Pregunta sobre tus documentos…"
									aria-describedby="query-keyboard"
									value={draft}
									onChange={(event) => setDraft(event.target.value)}
									onKeyDown={(event) => {
										if (
											event.key === "Enter" &&
											!event.shiftKey &&
											!event.nativeEvent.isComposing &&
											event.keyCode !== 229
										) {
											event.preventDefault();
											submit();
										}
									}}
									rows={1}
									className="max-h-40 min-h-0 overflow-y-auto"
								/>
								<InputGroupAddon align="block-end">
									<span id="query-keyboard" className="text-xs">
										Enter para enviar · Shift+Enter para nueva línea
									</span>
									{isPending ? (
										<InputGroupButton
											size="sm"
											variant="outline"
											className="ml-auto"
											onClick={() => {
												cancel();
												input.current?.focus();
											}}
										>
											<SquareIcon data-icon="inline-start" aria-hidden="true" />
											Cancelar
										</InputGroupButton>
									) : (
										<InputGroupButton
											type="submit"
											variant="default"
											size="icon-sm"
											className="ml-auto"
											aria-label="Enviar pregunta"
											disabled={!draft.trim()}
										>
											<ArrowUpIcon aria-hidden="true" />
										</InputGroupButton>
									)}
								</InputGroupAddon>
							</InputGroup>
						</Field>
					</FieldGroup>
				</form>
			</footer>
		</main>
	);
}
