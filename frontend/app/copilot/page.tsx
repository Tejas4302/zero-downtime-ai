"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Database, RotateCcw, Send, Sparkles } from "lucide-react";

import Protected from "@/components/Protected";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/api";

type Message = {
  role: "ai" | "user";
  text: string;
};

type CopilotResponse = {
  answer: string;
  scope: string;
};

type ParsedLine = {
  type: "heading" | "bullet" | "text" | "spacer";
  text: string;
};

const STORAGE_KEY = "zero-downtime-copilot-session";

const suggestions = [
  "Which assets need immediate attention?",
  "Which plant has the highest operational risk?",
  "Summarise maintenance priorities for today.",
  "What failure types are most common?",
];

const welcome =
  "I’m your Zero Downtime Operations Copilot. I answer from the operational data you are authorised to access and can help prioritise maintenance, explain risk and quantify downtime exposure.";

function cleanInlineMarkdown(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/\x60/g, "")
    .replace(/^#+\s*/, "")
    .trim();
}

function parseAnswer(text: string): ParsedLine[] {
  return text.split("\n").map((rawLine) => {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      return { type: "spacer", text: "" };
    }

    const isBullet = /^[-*•]\s+/.test(trimmed);
    const withoutBullet = trimmed.replace(/^[-*•]\s+/, "");
    const cleaned = cleanInlineMarkdown(withoutBullet);

    if (isBullet) {
      return { type: "bullet", text: cleaned };
    }

    const looksLikeHeading =
      /:$/.test(cleaned) ||
      /^(critical|high risk|medium risk|low risk|recommended action|summary|priority|immediate attention|maintenance plan)/i.test(
        cleaned
      );

    return {
      type: looksLikeHeading ? "heading" : "text",
      text: cleaned,
    };
  });
}

function RichAnswer({ text }: { text: string }) {
  const lines = useMemo(() => parseAnswer(text), [text]);

  return (
    <div className="ai-answer">
      {lines.map((line, index) => {
        if (line.type === "spacer") {
          return <div className="ai-spacer" key={index} />;
        }

        if (line.type === "heading") {
          return (
            <div className="ai-section-heading" key={index}>
              {line.text}
            </div>
          );
        }

        if (line.type === "bullet") {
          return (
            <div className="ai-bullet" key={index}>
              <span className="ai-bullet-dot" />
              <span>{line.text}</span>
            </div>
          );
        }

        return (
          <p className="ai-paragraph" key={index}>
            {line.text}
          </p>
        );
      })}
    </div>
  );
}

export default function Copilot() {
  const { me } = useAuth();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "ai", text: welcome }]);
  const [scope, setScope] = useState("");
  const [error, setError] = useState("");
  const streamRef = useRef<HTMLDivElement>(null);
  const initialQuestionHandled = useRef(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed.slice(-20));
        }
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      hydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      // Session persistence is optional.
    }
  }, [messages]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;

    requestAnimationFrame(() => {
      stream.scrollTo({
        top: stream.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages, busy]);

  useEffect(() => {
    if (initialQuestionHandled.current) return;
    initialQuestionHandled.current = true;

    const question = new URLSearchParams(window.location.search).get("question");
    if (question) {
      setText(question);
    }
  }, []);

  async function send(questionOverride?: string) {
    const question = (questionOverride ?? text).trim();

    if (!question || busy) return;

    setBusy(true);
    setError("");
    setText("");

    const priorHistory = messages.slice(-8);
    setMessages((current) => [...current, { role: "user", text: question }]);

    try {
      const response = await apiFetch<CopilotResponse>("/api/copilot", {
        method: "POST",
        body: JSON.stringify({
          question,
          history: priorHistory,
        }),
      });

      setScope(response.scope);
      setMessages((current) => [...current, { role: "ai", text: response.answer }]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to reach the operations copilot.";

      setError(message);
      setMessages((current) => [
        ...current,
        {
          role: "ai",
          text: "I couldn't complete that request. Please retry in a moment.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function clearConversation() {
    const next: Message[] = [{ role: "ai", text: welcome }];
    setMessages(next);
    setScope("");
    setText("");
    setError("");
    sessionStorage.removeItem(STORAGE_KEY);
  }

  return (
    <Protected>
      <div className="copilot-page">
        <div className="copilot-header">
          <div>
            <div className="badge badge-medium">
              <Sparkles size={12} />
              Gemini-powered decision support
            </div>

            <h1>
              <span className="gradient-text">Operations Copilot</span>
            </h1>

            <p>
              Grounded analysis across the operational data you are authorised to access.
            </p>
          </div>

          <button className="btn" onClick={clearConversation}>
            <RotateCcw size={15} />
            New conversation
          </button>
        </div>

        <div className="copilot-status-bar">
          <div>
            <Database size={15} />
            <span>Grounded in BigQuery operational context</span>
          </div>
          <div>
            <span className="status-dot" />
            <span>
              Scope:{" "}
              {scope ||
                (me?.client_id === "GLOBAL"
                  ? "All clients"
                  : me?.client_id || "Authorised tenant")}
            </span>
          </div>
        </div>

        {error && <div className="notice notice-error copilot-error">{error}</div>}

        <div className="chat-shell refined-chat">
          <div className="card chat-main">
            <div className="chat-stream" ref={streamRef}>
              {messages.map((message, index) => (
                <div key={index} className={"msg " + message.role}>
                  {message.role === "ai" && (
                    <div className="message-avatar">
                      <Bot size={15} />
                    </div>
                  )}

                  <div className="message-body">
                    {message.role === "ai" ? (
                      <RichAnswer text={message.text} />
                    ) : (
                      <p className="user-message-text">{message.text}</p>
                    )}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="msg ai">
                  <div className="message-avatar">
                    <Bot size={15} />
                  </div>
                  <div className="typing" aria-label="Copilot is analysing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>

            <div className="chat-composer-wrap">
              <div className="chat-input">
                <input
                  value={text}
                  disabled={busy}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask about asset risk, maintenance priorities or downtime exposure…"
                />

                <button
                  className="btn btn-primary send-button"
                  onClick={() => send()}
                  disabled={busy || !text.trim()}
                  aria-label="Send question"
                >
                  <Send size={16} />
                </button>
              </div>

              <div className="composer-hint">
                AI answers are grounded in authorised operational data. Validate critical maintenance decisions with plant teams.
              </div>
            </div>
          </div>

          <aside className="card prompt-panel">
            <div className="prompt-panel-title">
              <Sparkles size={18} />
              <div>
                <strong>Suggested analysis</strong>
                <span>Common operations questions</span>
              </div>
            </div>

            <div className="prompt-panel-scroll">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="prompt-button"
                  disabled={busy}
                  onClick={() => send(suggestion)}
                >
                  {suggestion}
                </button>
              ))}

              <div className="prompt-tip">
                <Bot size={16} />
                <p>
                  Ask “why”, “what should we do next”, or “compare plants” to move from monitoring to action.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Protected>
  );
}
