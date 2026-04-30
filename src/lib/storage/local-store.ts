"use client";

import { get, set } from "idb-keyval";
import type { HoldingInput } from "@/lib/types";

const HOLDINGS_KEY = "stock-specifier:holdings";
const CHAT_KEY = "stock-specifier:chat";

export type LocalChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export async function loadLocalHoldings() {
  return (await get<HoldingInput[]>(HOLDINGS_KEY)) ?? [];
}

export async function saveLocalHoldings(holdings: HoldingInput[]) {
  await set(HOLDINGS_KEY, holdings);
}

export async function loadLocalChat() {
  return (await get<LocalChatMessage[]>(CHAT_KEY)) ?? [];
}

export async function saveLocalChat(messages: LocalChatMessage[]) {
  await set(CHAT_KEY, messages);
}
