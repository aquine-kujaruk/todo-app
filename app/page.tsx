import TodoApp from "@/components/TodoApp";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="page">
      <header className="header">
        <h1>Todo</h1>
        <p>Next.js + Supabase, desplegado en Vercel. Sin autenticación.</p>
      </header>
      <TodoApp />
    </main>
  );
}
