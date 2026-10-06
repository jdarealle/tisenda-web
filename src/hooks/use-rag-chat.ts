import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { type Answer, getApiHealth, queryRag } from "#/lib/rag-api";

export type ChatTurn = {
	id: string;
	question: string;
} & (
	| { status: "pending" | "cancelled" }
	| { status: "complete"; answer: Answer }
	| { status: "error"; error: string }
);

export function useRagChat() {
	const [turns, setTurns] = useState<ChatTurn[]>([]);
	const active = useRef<{ id: string; controller: AbortController } | null>(
		null,
	);
	const { mutateAsync, reset } = useMutation({
		mutationFn: ({
			question,
			signal,
		}: {
			question: string;
			signal: AbortSignal;
		}) => queryRag({ question }, signal),
		retry: false,
		networkMode: "always",
	});

	useEffect(() => () => active.current?.controller.abort(), []);

	async function send(question: string, existingId?: string): Promise<boolean> {
		if (active.current || !question.trim()) return false;
		const id = existingId ?? crypto.randomUUID();
		const pending = { id, controller: new AbortController() };
		active.current = pending;
		const turn: ChatTurn = { id, question: question.trim(), status: "pending" };
		setTurns((previous) =>
			existingId
				? previous.map((item) => (item.id === id ? turn : item))
				: [...previous, turn],
		);
		try {
			const answer = await mutateAsync({
				question: turn.question,
				signal: pending.controller.signal,
			});
			if (active.current === pending && !pending.controller.signal.aborted) {
				setTurns((previous) =>
					previous.map((item) =>
						item.id === id ? { ...turn, status: "complete", answer } : item,
					),
				);
			}
		} catch (error) {
			if (active.current === pending && !pending.controller.signal.aborted) {
				setTurns((previous) =>
					previous.map((item) =>
						item.id === id
							? {
									...turn,
									status: "error",
									error:
										error instanceof Error
											? error.message
											: "La consulta falló.",
								}
							: item,
					),
				);
			}
		} finally {
			if (active.current === pending) active.current = null;
		}
		return true;
	}

	function cancel() {
		const pending = active.current;
		active.current = null;
		pending?.controller.abort();
		reset();
		if (pending) {
			setTurns((previous) =>
				previous.map((turn) =>
					turn.id === pending.id
						? { id: turn.id, question: turn.question, status: "cancelled" }
						: turn,
				),
			);
		}
	}

	function clear() {
		cancel();
		setTurns([]);
	}

	function retry(id: string) {
		const turn = turns.find((item) => item.id === id);
		if (turn && (turn.status === "error" || turn.status === "cancelled")) {
			return send(turn.question, id);
		}
		return Promise.resolve(false);
	}

	return {
		turns,
		isPending: turns.some((turn) => turn.status === "pending"),
		send,
		retry,
		cancel,
		clear,
	};
}

export function useApiHealth() {
	return useQuery({
		queryKey: ["rag", "health"],
		queryFn: ({ signal }) => getApiHealth(signal),
		retry: false,
		staleTime: 30_000,
		refetchOnWindowFocus: "always",
	});
}
