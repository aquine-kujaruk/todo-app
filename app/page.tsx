import ThemeToggle from "@/components/ThemeToggle";
import TodoApp from "@/components/TodoApp";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="page">
      <header className="header">
        {/* El botón vive en la cabecera, hermano de la lista y no dentro de
            ella: se ve y funciona con la lista cargando, vacía o en error. */}
        <div className="header-top">
          <h1>Todo</h1>
          <ThemeToggle />
        </div>
        <p>
          Next.js en Vercel. El navegador solo habla con <code>/api/todos</code>
          ; las claves de Supabase viven en el servidor.
        </p>
      </header>
      <TodoApp />
    </main>
  );
}
