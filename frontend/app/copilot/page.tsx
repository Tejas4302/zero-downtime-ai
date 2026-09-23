"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Database,
  FileText,
  FlaskConical,
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
import type {
  DecisionBrief,
  EvidenceChart,
  EvidenceItem,
  Explainability,
  WorkspaceState,
} from "@/lib/types";

type Message = {
  role: "ai" | "user";
  text: string;
  evidence?: EvidenceItem[];
  chart?: EvidenceChart;
  explainability?: Explainability;
};

type CopilotResponse = {
  answer: string;
  scope: string;
  evidence: EvidenceItem[];
  chart: EvidenceChart;
  explainability: Explainability;
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

const DEFAULT_PROJECTS: Project[] = [];

const welcome =
  "I’m your Zero Downtime AI Analyst. I can connect operational health, downtime exposure, governed metrics and labelled marketplace signals to support better manufacturing decisions.";

function createThread(projectId: string | null = null): ChatThread {
  return {
    id: "chat-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    title: "New analysis",
    projectId,
    updatedAt: Date.now(),
    messages: [{ role: "ai", text: welcome }],
  };
}

function cleanText(value: string) {
  return value
    .replace(/\*+/g, "")
    .replace(/__/g, "")
    .replace(/\x60/g, "")
    .replace(/^#+\s*/gm, "")
    .trim();
}

function RichAnswer({ text }: { text: string }) {
  const lines = useMemo(
    () =>
      cleanText(text)
        .split("\n")
        .map((line) => line.trim()),
    [text]
  );

  return (
    <div className="ai-answer">
      {lines.map((line, index) => {
        if (!line) return <div className="ai-spacer" key={index} />;

        if (/^[-•]\s+/.test(line)) {
          return (
            <div className="ai-bullet" key={index}>
              <span className="ai-bullet-dot" />
              <span>{line.replace(/^[-•]\s+/, "")}</span>
            </div>
          );
        }

        if (
          /:$/.test(line) ||
          /^(summary|key insight|evidence|recommended action|what this means|next steps|priority|immediate attention)/i.test(
            line
          )
        ) {
          return (
            <div className="ai-section-heading" key={index}>
              {line}
            </div>
          );
        }

        return (
          <p className="ai-paragraph" key={index}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

function EvidencePanel({
  evidence,
  chart,
  explainability,
}: {
  evidence?: EvidenceItem[];
  chart?: EvidenceChart;
  explainability?: Explainability;
}) {
  const [open, setOpen] = useState(false);

  if (!evidence?.length && !chart && !explainability) return null;

  return (
    <div className="answer-evidence">
      <button className="evidence-toggle" onClick={() => setOpen((value) => !value)}>
        <Database size={14} />
        Why this answer?
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="evidence-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {explainability && (
              <div className="explainability-card">
                <strong>Explainability</strong>
                <p>{explainability.summary}</p>
                <div className="explainability-factors">
                  {explainability.factors.map((factor) => (
                    <span key={factor}>{factor}</span>
                  ))}
                </div>
              </div>
            )}

            {evidence && evidence.length > 0 && (
              <div className="structured-evidence-grid">
                {evidence.slice(0, 6).map((item, index) => (
                  <div className="structured-evidence-item" key={item.type + "-" + item.label + "-" + index}>
                    <span>{item.label}</span>
                    <strong>
                      {item.unit.toLowerCase().includes("inr")
                        ? new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          }).format(item.value)
                        : item.value}
                    </strong>
                    <small>{item.unit} · {item.source}</small>
                  </div>
                ))}
              </div>
            )}

            {chart?.data?.length ? (
              <div className="evidence-chart">
                <div className="evidence-chart-title">{chart.title}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chart.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.055)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#8fa4ba", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#8fa4ba", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) =>
                        new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 0,
                        }).format(Number(value))
                      }
                      contentStyle={{
                        background: "#0d1b2e",
                        border: "1px solid rgba(255,255,255,.1)",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="value" fill="#5aa7ff" radius={[7, 7, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Copilot() {
  const { me } = useAuth();
  const router = useRouter();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [briefs, setBriefs] = useState<DecisionBrief[]>([]);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [briefBusy, setBriefBusy] = useState(false);
  const [scope, setScope] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activeBrief, setActiveBrief] = useState<DecisionBrief | null>(null);

  const streamRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handoffHandled = useRef(false);

  const storagePrefix = me?.uid ? "zero-downtime-copilot:" + me.uid : "";

  useEffect(() => {
    if (!me?.uid) return;

    async function loadWorkspace() {
      try {
        const workspace = await apiFetch<WorkspaceState>("/api/workspace");
        const serverThreads = Array.isArray(workspace.threads)
          ? (workspace.threads as ChatThread[])
          : [];
        const serverProjects = Array.isArray(workspace.projects)
          ? (workspace.projects as Project[])
          : [];

        const localThreads = storagePrefix
          ? JSON.parse(localStorage.getItem(storagePrefix + ":threads") || "[]")
          : [];
        const localProjects = storagePrefix
          ? JSON.parse(localStorage.getItem(storagePrefix + ":projects") || "[]")
          : [];

        const nextThreads =
          serverThreads.length
            ? serverThreads
            : Array.isArray(localThreads) && localThreads.length
            ? localThreads
            : [createThread(null)];

        const nextProjects =
          serverProjects.length
            ? serverProjects
            : Array.isArray(localProjects) && localProjects.length
            ? localProjects
            : [];

        setThreads(nextThreads);
        setProjects(nextProjects);
        setBriefs(workspace.briefs || []);
        setActiveThreadId(nextThreads[0].id);
      } catch {
        const next = createThread(null);
        setThreads([next]);
        setProjects([]);
        setActiveThreadId(next.id);
      } finally {
        setHydrated(true);
      }
    }

    loadWorkspace();
  }, [me?.uid, storagePrefix]);

  useEffect(() => {
    if (!hydrated || !storagePrefix) return;

    localStorage.setItem(storagePrefix + ":threads", JSON.stringify(threads.slice(0, 30)));
    localStorage.setItem(storagePrefix + ":projects", JSON.stringify(projects));

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      apiFetch("/api/workspace", {
        method: "PUT",
        body: JSON.stringify({
          threads: threads.slice(0, 30),
          projects,
        }),
      }).catch(() => {
        // Local persistence remains available if cloud persistence is temporarily unavailable.
      });
    }, 650);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [threads, projects, hydrated, storagePrefix]);

  const activeThread =
    threads.find((thread) => thread.id === activeThreadId) || threads[0] || null;

  const visibleThreads = useMemo(
    () =>
      threads
        .filter((thread) => {
          const matchesProject =
            selectedProjectId === null || thread.projectId === selectedProjectId;
          const matchesSearch =
            !search.trim() ||
            thread.title.toLowerCase().includes(search.trim().toLowerCase());

          return matchesProject && matchesSearch;
        })
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [threads, selectedProjectId, search]
  );

  useEffect(() => {
    if (!hydrated || !activeThread || handoffHandled.current) return;

    const question = new URLSearchParams(window.location.search).get("question");
    if (!question) return;

    handoffHandled.current = true;
    setText(question);
  }, [hydrated, activeThread]);

  useEffect(() => {
    streamRef.current?.scrollTo({
      top: streamRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeThread?.messages, busy]);

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
    const priorHistory = activeThread.messages.slice(-8).map(({ role, text }) => ({ role, text }));

    updateThread(threadId, (thread) => ({
      ...thread,
      title:
        thread.title === "New analysis"
          ? question.length > 42
            ? question.slice(0, 42) + "…"
            : question
          : thread.title,
      updatedAt: Date.now(),
      messages: [...thread.messages, { role: "user", text: question }],
    }));

    try {
      const response = await apiFetch<CopilotResponse>("/api/copilot", {
        method: "POST",
        body: JSON.stringify({ question, history: priorHistory }),
      });

      setScope(response.scope);

      updateThread(threadId, (thread) => ({
        ...thread,
        updatedAt: Date.now(),
        messages: [
          ...thread.messages,
          {
            role: "ai",
            text: response.answer,
            evidence: response.evidence,
            chart: response.chart,
            explainability: response.explainability,
          },
        ],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach the AI Analyst.");
    } finally {
      setBusy(false);
    }
  }

  function sendToScenario(message: Message) {
    localStorage.setItem(
      "zero-downtime-scenario-handoff",
      JSON.stringify({
        answer: message.text,
        evidence: message.evidence || [],
        createdAt: Date.now(),
      })
    );
    router.push("/scenario?from=ai");
  }

  async function createDecisionBrief(message: Message) {
    setBriefBusy(true);
    setError("");

    try {
      const response = await apiFetch<{ title: string; brief: string; scope: string }>(
        "/api/decision-brief",
        {
          method: "POST",
          body: JSON.stringify({
            title: activeThread?.title || "AI Decision Brief",
            context: {
              answer: message.text,
              evidence: message.evidence,
              explainability: message.explainability,
            },
          }),
        }
      );

      const brief: DecisionBrief = {
        id: "brief-" + Date.now(),
        title: response.title,
        brief: response.brief,
        createdAt: Date.now(),
      };

      const next = [brief, ...briefs].slice(0, 20);
      setBriefs(next);
      setActiveBrief(brief);

      await apiFetch("/api/workspace", {
        method: "PUT",
        body: JSON.stringify({ briefs: next }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create decision brief");
    } finally {
      setBriefBusy(false);
    }
  }

  if (!activeThread) {
    return (
      <Protected>
        <div className="loading">
          <div>
            <div className="pulse" />
            Loading AI Analyst workspace…
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
              Gemini AI Analyst
            </div>
            <h1>
              <span className="gradient-text">AI Analyst</span>
            </h1>
            <p>
              Cross-domain reasoning with governed metrics, structured evidence and persistent decision workflows.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => startNewChat()}>
            <Plus size={15} />
            New chat
          </button>
        </div>

        <div className="copilot-status-bar">
          <div>
            <Database size={15} />
            <span>BigQuery operations + governed metrics + labelled marketplace signals</span>
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
              <button className="icon-button" onClick={() => startNewChat()} aria-label="New chat">
                <Plus size={16} />
              </button>
            </div>

            <div className="library-search">
              <Search size={14} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats" />
            </div>

            <div className="library-section">
              <div className="library-section-heading">
                <span>Projects</span>
                <button className="library-mini-button" onClick={() => setShowProjectForm(true)} aria-label="Create project">
                  <FolderPlus size={14} />
                </button>
              </div>

              {projects.length === 0 && !showProjectForm ? (
                <button className="create-project-empty" onClick={() => setShowProjectForm(true)}>
                  <FolderPlus size={15} />
                  <span>Create your first project</span>
                </button>
              ) : null}

              {projects.length > 0 ? (
                <button className={"project-row " + (selectedProjectId === null ? "active" : "")} onClick={() => setSelectedProjectId(null)}>
                  <Folder size={15} />
                  <span>All project chats</span>
                  <small>{threads.filter((thread) => thread.projectId).length}</small>
                </button>
              ) : null}

              {projects.map((project) => {
                const count = threads.filter((thread) => thread.projectId === project.id).length;

                return (
                  <button
                    key={project.id}
                    className={"project-row " + (selectedProjectId === project.id ? "active" : "")}
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
                {visibleThreads.map((thread) => (
                  <button
                    key={thread.id}
                    className={"recent-chat-row " + (thread.id === activeThread.id ? "active" : "")}
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
                ))}
              </div>
            </div>
          </aside>

          <section className="card chat-main">
            <div className="chat-thread-header">
              <div>
                <strong>{activeThread.title}</strong>
                <span>
                  {activeThread.projectId
                    ? projects.find((project) => project.id === activeThread.projectId)?.name || "Project"
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
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {message.role === "ai" && (
                      <div className="message-avatar">
                        <Bot size={15} />
                      </div>
                    )}

                    <div className="message-body">
                      {message.role === "ai" ? (
                        <>
                          <RichAnswer text={message.text} />
                          <EvidencePanel
                            evidence={message.evidence}
                            chart={message.chart}
                            explainability={message.explainability}
                          />

                          {message.evidence?.length ? (
                            <div className="ai-action-row">
                              <button className="ai-action-button" onClick={() => sendToScenario(message)}>
                                <FlaskConical size={14} />
                                Open in Scenario Lab
                              </button>
                              <button
                                className="ai-action-button"
                                disabled={briefBusy}
                                onClick={() => createDecisionBrief(message)}
                              >
                                <FileText size={14} />
                                {briefBusy ? "Creating brief…" : "Create Decision Brief"}
                              </button>
                            </div>
                          ) : null}
                        </>
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
                        <strong>Reasoning across domains</strong>
                        <span>Connecting operational risk, metric definitions and marketplace signals…</span>
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
                  placeholder="Ask a cross-domain operational question…"
                />

                {text && (
                  <button className="composer-clear" onClick={() => setText("")} aria-label="Clear input">
                    <X size={14} />
                  </button>
                )}

                <button className="btn btn-primary send-button" onClick={send} disabled={busy || !text.trim()} aria-label="Send question">
                  <Send size={16} />
                </button>
              </div>

              <div className="composer-hint">
                Chats and projects are persisted to your secure workspace. Evidence and metric definitions are available under “Why this answer?”.
              </div>
            </div>
          </section>
        </div>

        <AnimatePresence>
          {activeBrief && (
            <motion.div
              className="brief-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveBrief(null)}
            >
              <motion.div
                className="card decision-brief-modal"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="decision-brief-header">
                  <div>
                    <span>AI → Decision Brief</span>
                    <h2>{activeBrief.title}</h2>
                  </div>
                  <button className="icon-button" onClick={() => setActiveBrief(null)}>
                    <X size={16} />
                  </button>
                </div>

                <div className="decision-brief-content">
                  <RichAnswer text={activeBrief.brief} />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => {
                    localStorage.setItem("zero-downtime-decision-brief", JSON.stringify(activeBrief));
                    router.push("/decisions?from=brief");
                  }}
                >
                  Send to Decision Board
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Protected>
  );
}
