"use client";

import { useCallback, useEffect, useState } from "react";

// Este componente no sabe que Supabase existe: solo habla con /api/todos,
// que es el mismo origen. Las credenciales viven en el servidor.
type Todo = {
  id: string;
  title: string;
  is_done: boolean;
  created_at: string;
};

async function apiError(res: Response) {
  const body = await res.json().catch(() => null);
  return body?.error ?? body?.detail ?? `HTTP ${res.status}`;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error(await apiError(res));
      setTodos(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;

    setTitle("");
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: value }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      const created: Todo = await res.json();
      setTodos((prev) => [created, ...prev]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setTitle(value);
    }
  }

  async function toggleTodo(todo: Todo) {
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, is_done: !t.is_done } : t)),
    );
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_done: !todo.is_done }),
      });
      if (!res.ok) throw new Error(await apiError(res));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      load();
    }
  }

  async function removeTodo(todo: Todo) {
    setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    try {
      const res = await fetch(`/api/todos/${todo.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await apiError(res));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      load();
    }
  }

  const pending = todos.filter((t) => !t.is_done).length;

  return (
    <section className="card">
      <form className="composer" onSubmit={addTodo}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿Qué hay que hacer?"
          maxLength={500}
          aria-label="Nueva tarea"
        />
        <button type="submit" disabled={!title.trim()}>
          Añadir
        </button>
      </form>

      {error && <p className="error">Error: {error}</p>}

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : todos.length === 0 ? (
        <p className="muted">No hay tareas todavía. Añade la primera.</p>
      ) : (
        <>
          <ul className="list">
            {todos.map((todo) => (
              <li key={todo.id} className={todo.is_done ? "done" : ""}>
                <label>
                  <input
                    type="checkbox"
                    checked={todo.is_done}
                    onChange={() => toggleTodo(todo)}
                  />
                  <span>{todo.title}</span>
                </label>
                <button
                  className="delete"
                  onClick={() => removeTodo(todo)}
                  aria-label={`Eliminar ${todo.title}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <footer className="summary">
            {pending} pendiente{pending === 1 ? "" : "s"} de {todos.length}
          </footer>
        </>
      )}
    </section>
  );
}
