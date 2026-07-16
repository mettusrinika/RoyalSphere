"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { aiApi } from '@/lib/api';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "omiqora_omi_virtual_history_v1";

const SUGGESTED_PROMPTS: string[] = [
  "Find photographers",
  "Book a wedding planner",
  "Decor ideas",
  "Compare vendors",
  "Budget planning",
  "Ask OMI anything",
];

const WELCOME_MESSAGE =
  "Hi, I'm OMI — your virtual assistant for OMIQORA. Ask me to find vendors, plan a budget, get decor ideas, or anything else you need for your event.";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* storage unavailable — silently ignore */
  }
}

/* ------------------------------------------------------------------ */
/* AI integration point                                               */
/* ------------------------------------------------------------------ */

/**
 * sendMessageToAI
 *
 * Single isolated integration point for the OMI AI backend.
 * Until the existing OMI mobile AI endpoint is wired in, this returns
 * a friendly placeholder response so the UI is fully usable standalone.
 */
async function sendMessageToAI(message: string): Promise<string> {
  try {
    const data: any = unwrap(await endpoints.aiSupport(message));

    return (
      data?.response ??
      data?.answer ??
      data?.message ??
      data?.content ??
      "OMI received your request."
    );
  } catch (error) {
    return errMsg(error);
  }
}

/* ------------------------------------------------------------------ */
/* Icons (inline, no external deps)                                   */
/* ------------------------------------------------------------------ */

function IconSparkle(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <path
        d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9-1.9 5.6-1.9-5.6-5.6-1.9 5.6-1.9L12 2.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconClose(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMinimize(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconTrash(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v12a1 1 0 001 1h6a1 1 0 001-1V7"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSend(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M4 12l16-8-6 8 6 8-16-8z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function OmiVirtual(): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);

  /* Load history on mount */
  useEffect(() => {
    setMessages(loadHistory());
    setHasMounted(true);
  }, []);

  /* Persist history whenever it changes */
  useEffect(() => {
    if (!hasMounted) return;
    saveHistory(messages);
  }, [messages, hasMounted]);

  /* Auto-scroll on new messages */
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending, isOpen]);

  /* Focus input when opened */
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [isOpen, isMinimized]);

  /* ESC closes window */
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent): void {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        fabRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const handleMinimizeToggle = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const handleClear = useCallback(() => {
    setMessages([]);
  }, []);

  const dispatchMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);

    try {
      const reply = await sendMessageToAI(trimmed);
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content:
          "Sorry, something went wrong while reaching OMI. Please try again in a moment.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  }, [isSending]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void dispatchMessage(inputValue);
    },
    [dispatchMessage, inputValue],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void dispatchMessage(inputValue);
      }
    },
    [dispatchMessage, inputValue],
  );

  const handleChipClick = useCallback(
    (prompt: string) => {
      void dispatchMessage(prompt);
    },
    [dispatchMessage],
  );

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          ref={fabRef}
          type="button"
          onClick={handleOpen}
          aria-label="Open OMI Virtual assistant"
          className="fixed bottom-5 right-5 z-[9999] flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1730] via-[#0F1F42] to-[#0B1730] text-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-1 ring-[#D4AF37]/40 transition-all duration-300 ease-out hover:scale-110 hover:shadow-[0_14px_40px_rgba(212,175,55,0.35)] active:scale-95 sm:bottom-6 sm:right-6 sm:h-[68px] sm:w-[68px]"
        >
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[#D4AF37]/20 blur-md" />
          <span className="relative">
            <IconSparkle />
          </span>
        </button>
      )}

      {/* Assistant Window */}
      {isOpen && (
        <div
          ref={windowRef}
          role="dialog"
          aria-modal="true"
          aria-label="OMI Virtual assistant"
          className={`fixed bottom-0 right-0 z-[9999] flex w-full flex-col overflow-hidden bg-[#0B1730] shadow-[0_20px_60px_rgba(0,0,0,0.55)] ring-1 ring-[#D4AF37]/25 transition-all duration-300 ease-out sm:bottom-6 sm:right-6 sm:w-[400px] sm:rounded-2xl ${
            isMinimized ? "h-[64px]" : "h-[80vh] sm:h-[600px]"
          } animate-[omiSlideUp_0.28s_ease-out]`}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#D4AF37]/20 bg-gradient-to-r from-[#0F1F42] to-[#0B1730] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8942E] text-[#0B1730] shadow-md">
                <IconSparkle />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[15px] font-semibold tracking-wide text-white">
                  OMI Virtual
                </span>
                <span className="text-[11px] text-[#D4AF37]/80">
                  OMIQORA Assistant
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!isMinimized && messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear conversation"
                  title="Clear conversation"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-[#D4AF37]"
                >
                  <IconTrash />
                </button>
              )}
              <button
                type="button"
                onClick={handleMinimizeToggle}
                aria-label={isMinimized ? "Expand assistant" : "Minimize assistant"}
                title={isMinimized ? "Expand" : "Minimize"}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-[#D4AF37]"
              >
                <IconMinimize />
              </button>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close assistant"
                title="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-[#D4AF37]"
              >
                <IconClose />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Chat Area */}
              <div
                ref={scrollRef}
                className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scroll-smooth"
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#D4AF37]/20 bg-white/[0.03] px-4 py-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8942E] text-[#0B1730]">
                      <IconSparkle />
                    </div>
                    <p className="text-[13px] leading-relaxed text-white/80">
                      {WELCOME_MESSAGE}
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex w-full flex-col ${
                      message.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed shadow-sm ${
                        message.role === "user"
                          ? "rounded-br-sm bg-gradient-to-br from-[#D4AF37] to-[#B8942E] text-[#0B1730]"
                          : "rounded-bl-sm bg-white/[0.06] text-white ring-1 ring-white/10"
                      }`}
                    >
                      {message.content}
                    </div>
                    <span className="mt-1 px-1 text-[10px] text-white/35">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                ))}

                {isSending && (
                  <div className="flex w-full items-start">
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white/[0.06] px-4 py-3 ring-1 ring-white/10">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37] [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37] [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Prompts */}
              {messages.length === 0 && (
                <div className="shrink-0 border-t border-[#D4AF37]/10 px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleChipClick(prompt)}
                        disabled={isSending}
                        className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/[0.08] px-3 py-1.5 text-[12px] font-medium text-[#D4AF37] transition-all duration-200 hover:bg-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <form
                onSubmit={handleSubmit}
                className="flex shrink-0 items-end gap-2 border-t border-[#D4AF37]/20 bg-[#0B1730] px-3 py-3"
              >
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                  rows={1}
                  placeholder="Ask OMI anything..."
                  aria-label="Message OMI Virtual assistant"
                  className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[13.5px] text-white placeholder:text-white/35 outline-none transition-colors duration-200 focus:border-[#D4AF37]/60 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isSending || inputValue.trim().length === 0}
                  aria-label="Send message"
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8942E] text-[#0B1730] shadow-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                >
                  <IconSend />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes omiSlideUp {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}