"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, type Todo } from "@/lib/supabase";

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else {
      setTodos(data as Todo[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;

    setTitle("");
    const { data, error } = await supabase
      .from("todos")
      .insert({ title: value })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setTitle(value);
      return;
    }
    setTodos((prev) => [data as Todo, ...prev]);
  }

  async function toggleTodo(todo: Todo) {
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, is_done: !t.is_done } : t))
    );

    const { error } = await supabase
      .from("todos")
      .update({ is_done: !todo.is_done })
      .eq("id", todo.id);

    if (error) {
      setError(error.message);
      load();
    }
  }

  async function removeTodo(todo: Todo) {
    setTodos((prev) => prev.filter((t) => t.id !== todo.id));

    const { error } = await supabase.from("todos").delete().eq("id", todo.id);

    if (error) {
      setError(error.message);
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
