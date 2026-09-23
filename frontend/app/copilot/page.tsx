"use client";

import { useState } from "react";
import Protected from "@/components/Protected";
import { Bot, Send, Sparkles } from "lucide-react";
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

export default function Copilot() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "I’m your Zero Downtime operations copilot. Ask about client health, urgent assets, downtime risk or maintenance priorities.",
    },
  ]);

  async function send(questionOverride?: string) {
    const question = (questionOverride ?? text).trim();

    if (!question || busy) return;

    setBusy(true);
    setText("");

    setMessages((current) => [
      ...current,
      { role: "user", text: question },
    ]);

    try {
      const response = await apiFetch<CopilotResponse>("/api/copilot", {
        method: "POST",
        body: JSON.stringify({ question }),
      });

      setMessages((current) => [
        ...current,
        { role: "ai", text: response.answer },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to reach the operations copilot.";

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

  return (
    <Protected>
      <div className="hero">
        <div>
          <div className="badge badge-medium">
            <Sparkles size={12} />
            Gemini-powered
          </div>

          <h1>
            <span className="gradient-text">Operations Copilot</span>
          </h1>

          <p>
            Natural-language decision support grounded in the same secure,
            tenant-scoped operational data as your dashboard.
          </p>
        </div>
      </div>

      <div className="chat-shell">
        <div className="card chat-main">
          <div className="chat-stream">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`msg ${message.role}`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {message.text}
              </div>
            ))}

            {busy && (
              <div className="msg ai">
                Analysing operational data...
              </div>
            )}
          </div>

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
              placeholder="Ask about asset health or downtime risk…"
            />

            <button
              className="btn btn-primary"
              onClick={() => send()}
              disabled={busy || !text.trim()}
              aria-label="Send question"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        <div className="card">
          <Bot size={24} />
          <h3>Suggested prompts</h3>

          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              className="btn"
              disabled={busy}
              style={{
                width: "100%",
                textAlign: "left",
                margin: "6px 0",
              }}
              onClick={() => send(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </Protected>
  );
}
