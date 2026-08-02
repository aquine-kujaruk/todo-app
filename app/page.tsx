import TodoApp from "@/components/TodoApp";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="page">
      <header className="header">
        <h1>Todo</h1>
        <p>
          Next.js en Vercel. El navegador solo habla con <code>/api/todos</code>
          ; las claves de Supabase viven en el servidor.
        </p>
      </header>
      <TodoApp />
    </main>
  );
}
