import { createFileRoute } from "@tanstack/react-router";
import { RagChat } from "#/components/rag-chat";

export const Route = createFileRoute("/")({ component: RagChat });
