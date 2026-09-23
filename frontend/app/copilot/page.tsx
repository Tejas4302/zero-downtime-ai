"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Database,
  Folder,
  FolderPlus,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";

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

type Project = {
  id: string;
  name: string;
};

type ChatThread = {
  id: string;
  title: string;
  projectId: string | null;
  updatedAt: number;
  messages: Message[];
};

const DEFAULT_PROJECTS: Project[] = [
  { id: "operations", name: "Operations" },
  { id: "maintenance", name: "Maintenance" },
  { id: "risk-review", name: "Risk Review" },
];

const welcome =
  "I’m your Zero Downtime Operations Copilot. I can help you understand asset risk, prioritise maintenance and quantify downtime exposure using the operational data you are authorised to access.";

function createThread(projectId: string | null = null): ChatThread {
  return {
    id: "chat-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    title: "New analysis",
    projectId,
    updatedAt: Date.now(),
    messages: [{ role: "ai", text: welcome }],
  };
}

function cleanInlineMarkdown(value: string) {
  return value
    .replace(/\*+/g, "")
    .replace(/__/g, "")
    .replace(/\x60/g, "")
    .replace(/^#+\s*/, "")
    .trim();
}

function parseAnswer(text: string): ParsedLine[] {
  return text.split("\n").map((rawLine) => {
    const trimmed = rawLine.trim();

    if (!trimmed) return { type: "spacer", text: "" };

    const isBullet = /^[-*•]\s+/.test(trimmed);
    const withoutBullet = trimmed.replace(/^[-*•]\s+/, "");
    const cleaned = cleanInlineMarkdown(withoutBullet);

    if (isBullet) {
      return { type: "bullet", text: cleaned };
    }

    const looksLikeHeading =
      /:$/.test(cleaned) ||
      /^(critical|high risk|medium risk|low risk|recommended action|summary|priority|immediate attention|maintenance plan|key insight|what this means)/i.test(
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

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const streamRef = useRef<HTMLDivElement>(null);
  const initialQuestionHandled = useRef(false);

  const storagePrefix = me?.uid ? "zero-downtime-copilot:" + me.uid : "";

  useEffect(() => {
    if (!storagePrefix) return;

    try {
      const storedThreads = localStorage.getItem(storagePrefix + ":threads");
      const storedProjects = localStorage.getItem(storagePrefix + ":projects");

      const parsedThreads = storedThreads ? (JSON.parse(storedThreads) as ChatThread[]) : [];
      const parsedProjects = storedProjects ? (JSON.parse(storedProjects) as Project[]) : [];

      const nextProjects =
        Array.isArray(parsedProjects) && parsedProjects.length
          ? parsedProjects
          : DEFAULT_PROJECTS;

      const nextThreads =
        Array.isArray(parsedThreads) && parsedThreads.length
          ? parsedThreads
          : [createThread(null)];

      setProjects(nextProjects);
      setThreads(nextThreads);
      setActiveThreadId(nextThreads[0].id);
    } catch {
      const thread = createThread(null);
      setProjects(DEFAULT_PROJECTS);
      setThreads([thread]);
      setActiveThreadId(thread.id);
    } finally {
      setHydrated(true);
    }
  }, [storagePrefix]);

  useEffect(() => {
    if (!hydrated || !storagePrefix) return;

    localStorage.setItem(storagePrefix + ":threads", JSON.stringify(threads.slice(0, 30)));
    localStorage.setItem(storagePrefix + ":projects", JSON.stringify(projects));
  }, [threads, projects, hydrated, storagePrefix]);

  const activeThread =
    threads.find((thread) => thread.id === activeThreadId) || threads[0] || null;

  const visibleThreads = useMemo(() => {
    return threads
      .filter((thread) => {
        const matchesProject =
          selectedProjectId === null || thread.projectId === selectedProjectId;
        const matchesSearch =
          !search.trim() ||
          thread.title.toLowerCase().includes(search.trim().toLowerCase());

        return matchesProject && matchesSearch;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [threads, selectedProjectId, search]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;

    requestAnimationFrame(() => {
      stream.scrollTo({
        top: stream.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [activeThread?.messages, busy]);

  useEffect(() => {
    if (initialQuestionHandled.current || !activeThread) return;
    initialQuestionHandled.current = true;

    const question = new URLSearchParams(window.location.search).get("question");
    if (question) setText(question);
  }, [activeThread]);

  function updateThread(threadId: string, updater: (thread: ChatThread) => ChatThread) {
    setThreads((current) =>
      current.map((thread) => (thread.id === threadId ? updater(thread) : thread))
    );
  }

  function startNewChat(projectId: string | null = selectedProjectId) {
    const next = createThread(projectId);
    setThreads((current) => [next, ...current]);
    setActiveThreadId(next.id);
    setText("");
    setScope("");
    setError("");
  }

  function addProject() {
    const name = newProjectName.trim();
    if (!name) return;

    const id =
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
      "-" +
      Date.now().toString().slice(-5);

    const next = { id, name };

    setProjects((current) => [...current, next]);
    setSelectedProjectId(id);
    setNewProjectName("");
    setShowProjectForm(false);
    startNewChat(id);
  }

  async function send() {
    const question = text.trim();

    if (!question || busy || !activeThread) return;

    setBusy(true);
    setError("");
    setText("");

    const threadId = activeThread.id;
    const priorHistory = activeThread.messages.slice(-8);

    updateThread(threadId, (thread) => {
      const isUntitled = thread.title === "New analysis";
      return {
        ...thread,
        title: isUntitled
          ? question.length > 42
            ? question.slice(0, 42) + "…"
            : question
          : thread.title,
        updatedAt: Date.now(),
        messages: [...thread.messages, { role: "user", text: question }],
      };
    });

    try {
      const response = await apiFetch<CopilotResponse>("/api/copilot", {
        method: "POST",
        body: JSON.stringify({
          question,
          history: priorHistory,
        }),
      });

      setScope(response.scope);

      updateThread(threadId, (thread) => ({
        ...thread,
        updatedAt: Date.now(),
        messages: [...thread.messages, { role: "ai", text: response.answer }],
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to reach the operations copilot.";

      setError(message);

      updateThread(threadId, (thread) => ({
        ...thread,
        updatedAt: Date.now(),
        messages: [
          ...thread.messages,
          {
            role: "ai",
            text: "I couldn't complete that request. Please retry in a moment.",
          },
        ],
      }));
    } finally {
      setBusy(false);
    }
  }

  if (!activeThread) {
    return (
      <Protected>
        <div className="loading">
          <div>
            <div className="pulse" />
            Loading Copilot workspace…
          </div>
        </div>
      </Protected>
    );
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

            <p>Persistent, grounded analysis across your authorised manufacturing operations.</p>
          </div>

          <button className="btn btn-primary" onClick={() => startNewChat()}>
            <Plus size={15} />
            New chat
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

        <div className="chat-shell copilot-workspace">
          <aside className="card copilot-library">
            <div className="library-top">
              <div className="library-title">
                <MessageSquare size={17} />
                <strong>Chats & projects</strong>
              </div>

              <button
                className="icon-button"
                onClick={() => startNewChat()}
                aria-label="New chat"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="library-search">
              <Search size={14} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search chats"
              />
            </div>

            <div className="library-section">
              <div className="library-section-heading">
                <span>Projects</span>
                <button
                  className="library-mini-button"
                  onClick={() => setShowProjectForm((value) => !value)}
                >
                  <FolderPlus size={14} />
                </button>
              </div>

              <button
                className={"project-row " + (selectedProjectId === null ? "active" : "")}
                onClick={() => setSelectedProjectId(null)}
              >
                <Folder size={15} />
                <span>All chats</span>
                <small>{threads.length}</small>
              </button>

              {projects.map((project) => {
                const count = threads.filter((thread) => thread.projectId === project.id).length;

                return (
                  <button
                    key={project.id}
                    className={
                      "project-row " + (selectedProjectId === project.id ? "active" : "")
                    }
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <Folder size={15} />
                    <span>{project.name}</span>
                    <small>{count}</small>
                  </button>
                );
              })}

              <AnimatePresence>
                {showProjectForm && (
                  <motion.div
                    className="project-create"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <input
                      value={newProjectName}
                      onChange={(event) => setNewProjectName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") addProject();
                      }}
                      placeholder="Project name"
                      autoFocus
                    />
                    <button onClick={addProject}>Add</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="library-section recent-section">
              <div className="library-section-heading">
                <span>Recent chats</span>
              </div>

              <div className="recent-chat-list">
                {visibleThreads.length ? (
                  visibleThreads.map((thread) => (
                    <button
                      key={thread.id}
                      className={
                        "recent-chat-row " + (thread.id === activeThread.id ? "active" : "")
                      }
                      onClick={() => setActiveThreadId(thread.id)}
                    >
                      <MessageSquare size={14} />
                      <div>
                        <strong>{thread.title}</strong>
                        <span>
                          {new Date(thread.updatedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="library-empty">No chats in this view.</div>
                )}
              </div>
            </div>
          </aside>

          <section className="card chat-main">
            <div className="chat-thread-header">
              <div>
                <strong>{activeThread.title}</strong>
                <span>
                  {activeThread.projectId
                    ? projects.find((project) => project.id === activeThread.projectId)?.name ||
                      "Project"
                    : "General"}
                </span>
              </div>
            </div>

            <div className="chat-stream" ref={streamRef}>
              <AnimatePresence initial={false}>
                {activeThread.messages.map((message, index) => (
                  <motion.div
                    key={activeThread.id + "-" + index}
                    className={"msg " + message.role}
                    initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
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
                  </motion.div>
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {busy && (
                  <motion.div
                    className="msg ai ai-thinking-row"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    <div className="message-avatar thinking-avatar">
                      <Sparkles size={15} />
                    </div>

                    <div className="ai-thinking-card">
                      <div className="thinking-copy">
                        <strong>Analysing operational context</strong>
                        <span>Reviewing asset health, risk and downtime exposure…</span>
                      </div>
                      <div className="thinking-shimmer" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

                {text && (
                  <button
                    className="composer-clear"
                    onClick={() => setText("")}
                    aria-label="Clear input"
                  >
                    <X size={14} />
                  </button>
                )}

                <button
                  className="btn btn-primary send-button"
                  onClick={send}
                  disabled={busy || !text.trim()}
                  aria-label="Send question"
                >
                  <Send size={16} />
                </button>
              </div>

              <div className="composer-hint">
                Conversations are saved in this browser for your signed-in account.
              </div>
            </div>
          </section>
        </div>
      </div>
    </Protected>
  );
}
