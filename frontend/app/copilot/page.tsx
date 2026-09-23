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

const suggestions = [
  "Which assets need immediate attention?",
  "Which client has the highest downtime exposure?",
  "Summarise maintenance priorities for today.",
  "What failure types are most common?",
];

const welcome =
  "I’m your Zero Downtime Operations Copilot. I answer from the operational data you are authorised to access and can help prioritise maintenance, explain risk and quantify downtime exposure.";

export default function Copilot() {
  const { me } = useAuth();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "ai", text: welcome }]);
  const [scope, setScope] = useState("");
  const streamRef = useRef<HTMLDivElement>(null);
  const initialQuestionHandled = useRef(false);

  useEffect(() => {
    streamRef.current?.scrollTo({
      top: streamRef.current.scrollHeight,
      behavior: "smooth",
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
    setText("");
    setMessages((current) => [...current, { role: "user", text: question }]);

    try {
      const response = await apiFetch<CopilotResponse>("/api/copilot", {
        method: "POST",
        body: JSON.stringify({ question }),
      });

      setScope(response.scope);
      setMessages((current) => [...current, { role: "ai", text: response.answer }]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to reach the operations copilot.";

      setMessages((current) => [
        ...current,
        {
          role: "ai",
          text: `I couldn't complete that request: ${message}`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function clearConversation() {
    setMessages([{ role: "ai", text: welcome }]);
    setScope("");
    setText("");
  }

  return (
    <Protected>
      <div className="hero">
        <div>
          <div className="badge badge-medium">
            <Sparkles size={12} />
            Gemini-powered decision support
          </div>

          <h1>
            <span className="gradient-text">Operations Copilot</span>
          </h1>

          <p>
            Grounded natural-language analysis over the same secure, tenant-scoped operational data as your dashboard.
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
          <span>Grounded in live BigQuery operational context</span>
        </div>
        <div>
          <span className="status-dot" />
          <span>
            Scope: {scope || (me?.client_id === "GLOBAL" ? "All clients" : me?.client_id || "Authorised tenant")}
          </span>
        </div>
      </div>

      <div className="chat-shell refined-chat">
        <div className="card chat-main">
          <div className="chat-stream" ref={streamRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`msg ${message.role}`}
              >
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
                <div className="typing">
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
              Answers are generated from authorised operational context. Verify critical maintenance decisions with plant teams.
            </div>
          </div>
        </div>

        <div className="card prompt-panel">
          <div className="prompt-panel-title">
            <Sparkles size={18} />
            <div>
              <strong>Suggested analysis</strong>
              <span>Start with a common operations question</span>
            </div>
          </div>

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
              Try asking “why”, “what should we do next”, or “compare plants” to move from monitoring to decision support.
            </p>
          </div>
        </div>
      </div>
    </Protected>
  );
}
