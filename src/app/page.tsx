"use client";
import { useCallback, useEffect, useState } from "react";

type Status = "TODO" | "IN_PROGRESS" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH";
type User = { id: string; name: string; email: string; role: string };
type Workspace = { id: string; name: string; role: "OWNER" | "EDITOR" | "VIEWER" };
type Project = { id: string; name: string };
type Task = { id: string; title: string; description: string | null; status: Status; priority: Priority };
type Stats = { projects: number; members: number; total: number; completion: number; status: Record<Status, number> };

const COLUMNS: { key: Status; label: string }[] = [
  { key: "TODO", label: "À faire" },
  { key: "IN_PROGRESS", label: "En cours" },
  { key: "DONE", label: "Terminé" },
];
const PRIORITY_LABEL: Record<Priority, string> = { LOW: "Basse", MEDIUM: "Moyenne", HIGH: "Haute" };

async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Une erreur est survenue");
  return body;
}

function AuthForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(data) });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <main className="mx-auto mt-24 max-w-sm px-4">
      <h1 className="text-3xl font-semibold">TaskFlow</h1>
      <p className="mt-1 text-sm text-ink/70">{mode === "login" ? "Connectez-vous pour retrouver vos projets." : "Créez un compte pour démarrer."}</p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
        {mode === "register" && <input name="name" placeholder="Nom" required minLength={2} />}
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Mot de passe (8 caractères min.)" required minLength={mode === "register" ? 8 : 1} />
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button className="btn">{mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
      </form>
      <button className="mt-4 text-sm text-brand underline" onClick={() => { setError(""); setMode(mode === "login" ? "register" : "login"); }}>
        {mode === "login" ? "Pas de compte ? Inscrivez-vous" : "Déjà inscrit ? Connectez-vous"}
      </button>
    </main>
  );
}

function Board({ workspace }: { workspace: Workspace }) {
  const canWrite = workspace.role !== "VIEWER";
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");

  const loadStats = useCallback(() => api<Stats>(`/api/dashboard?workspaceId=${workspace.id}`).then(setStats).catch(() => {}), [workspace.id]);

  useEffect(() => {
    api<Project[]>(`/api/projects?workspaceId=${workspace.id}`).then((p) => { setProjects(p); setProjectId(p[0]?.id ?? ""); });
    loadStats();
  }, [workspace.id, loadStats]);

  const loadTasks = useCallback(async () => {
    if (!projectId) return setTasks([]);
    const params = new URLSearchParams({ projectId, page: String(page), ...(q && { q }), ...(priority && { priority }) });
    const r = await api<{ items: Task[]; totalPages: number }>(`/api/tasks?${params}`);
    setTasks(r.items);
    setTotalPages(r.totalPages);
  }, [projectId, page, q, priority]);

  useEffect(() => { const t = setTimeout(() => loadTasks().catch((e) => setError(e.message)), 250); return () => clearTimeout(t); }, [loadTasks]);

  const run = async (fn: () => Promise<unknown>) => {
    try { setError(""); await fn(); await Promise.all([loadTasks(), loadStats()]); } catch (e) { setError((e as Error).message); }
  };

  async function addProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = new FormData(form).get("name");
    try {
      const p = await api<Project>("/api/projects", { method: "POST", body: JSON.stringify({ name, workspaceId: workspace.id }) });
      setProjects((l) => [p, ...l]); setProjectId(p.id); form.reset(); loadStats();
    } catch (err) { setError((err as Error).message); }
  }

  function addTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form));
    run(async () => { await api("/api/tasks", { method: "POST", body: JSON.stringify({ ...d, projectId }) }); form.reset(); });
  }

  const move = (t: Task, status: Status) => run(() => api(`/api/tasks/${t.id}`, { method: "PATCH", body: JSON.stringify({ status }) }));
  const remove = (t: Task) => run(() => api(`/api/tasks/${t.id}`, { method: "DELETE" }));

  return (
    <section>
      {stats && (
        <dl className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[["Projets", stats.projects], ["Membres", stats.members], ["Tâches", stats.total], ["En cours", stats.status.IN_PROGRESS], ["Avancement", `${stats.completion} %`]].map(([k, v]) => (
            <div key={k as string} className="border-l-4 border-brand pl-3"><dt className="text-xs text-ink/60">{k}</dt><dd className="text-2xl font-semibold">{v}</dd></div>
          ))}
        </dl>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setPage(1); }} aria-label="Projet">
          {projects.length === 0 && <option value="">Aucun projet</option>}
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {canWrite && (
          <form onSubmit={addProject} className="flex gap-2"><input name="name" placeholder="Nouveau projet" required minLength={2} /><button className="btn">Créer le projet</button></form>
        )}
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher une tâche" className="ml-auto" />
        <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} aria-label="Priorité">
          <option value="">Toutes priorités</option>
          {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
        </select>
      </div>

      {canWrite && projectId && (
        <form onSubmit={addTask} className="mb-6 flex flex-wrap gap-2">
          <input name="title" placeholder="Titre de la tâche" required className="min-w-60 flex-1" />
          <input name="description" placeholder="Description (optionnel)" className="min-w-60 flex-1" />
          <select name="priority" defaultValue="MEDIUM">{(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}</select>
          <button className="btn">Ajouter la tâche</button>
        </form>
      )}
      {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
      {!projectId && <p className="text-sm text-ink/70">Créez un premier projet pour ajouter des tâches.</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col, i) => (
          <div key={col.key} className="rounded-lg bg-white/70 p-3">
            <h3 className="mb-3 flex justify-between font-medium">{col.label}<span className="text-ink/50">{tasks.filter((t) => t.status === col.key).length}</span></h3>
            <ul className="flex min-h-24 flex-col gap-2">
              {tasks.filter((t) => t.status === col.key).map((t) => (
                <li key={t.id} className="rounded-md border border-ink/10 bg-white p-3">
                  <p className="font-medium">{t.title}</p>
                  {t.description && <p className="mt-1 text-sm text-ink/70">{t.description}</p>}
                  <p className="mt-2 text-xs text-ink/60">Priorité {PRIORITY_LABEL[t.priority].toLowerCase()}</p>
                  {canWrite && (
                    <div className="mt-2 flex gap-1">
                      {i > 0 && <button className="btn-ghost" onClick={() => move(t, COLUMNS[i - 1].key)}>← {COLUMNS[i - 1].label}</button>}
                      {i < 2 && <button className="btn-ghost" onClick={() => move(t, COLUMNS[i + 1].key)}>{COLUMNS[i + 1].label} →</button>}
                      <button className="btn-ghost ml-auto text-red-700" onClick={() => remove(t)}>Supprimer</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <nav className="mt-6 flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
        <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</button>
        <span>Page {page} sur {totalPages}</span>
        <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Suivant</button>
      </nav>
    </section>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [wsId, setWsId] = useState("");

  const boot = useCallback(async () => {
    try {
      setUser(await api<User>("/api/me"));
      const w = await api<Workspace[]>("/api/workspaces");
      setWorkspaces(w);
      setWsId((cur) => cur || w[0]?.id || "");
    } catch { setUser(null); }
  }, []);
  useEffect(() => { boot(); }, [boot]);

  if (user === undefined) return null;
  if (!user) return <AuthForm onDone={boot} />;

  const ws = workspaces.find((w) => w.id === wsId);
  async function newWorkspace() {
    const name = prompt("Nom du nouvel espace de travail");
    if (!name) return;
    try { const w = await api<Workspace>("/api/workspaces", { method: "POST", body: JSON.stringify({ name }) }); setWorkspaces((l) => [...l, w]); setWsId(w.id); }
    catch (e) { alert((e as Error).message); }
  }
  async function invite() {
    const email = prompt("Email du membre à inviter (il doit avoir un compte)");
    if (!email) return;
    const role = prompt("Rôle : OWNER, EDITOR ou VIEWER", "EDITOR");
    try { await api(`/api/workspaces/${wsId}/members`, { method: "POST", body: JSON.stringify({ email, role }) }); alert("Membre ajouté"); }
    catch (e) { alert((e as Error).message); }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">TaskFlow</h1>
        <select value={wsId} onChange={(e) => setWsId(e.target.value)} aria-label="Espace de travail">
          {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.role.toLowerCase()})</option>)}
        </select>
        <button className="btn-ghost" onClick={newWorkspace}>Nouvel espace</button>
        {ws?.role === "OWNER" && <button className="btn-ghost" onClick={invite}>Inviter un membre</button>}
        <a href="/docs" className="text-sm underline">API</a>
        <span className="ml-auto text-sm text-ink/70">{user.name}{user.role === "ADMIN" ? " · admin" : ""}</span>
        <button className="btn-ghost" onClick={async () => { await api("/api/auth/logout", { method: "POST" }); setUser(null); }}>Déconnexion</button>
      </header>
      {ws && <Board key={ws.id} workspace={ws} />}
    </main>
  );
}
