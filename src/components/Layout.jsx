import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function Layout({ children }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(to bottom, #F4F4F4 25%, #C7E9F5 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Conteúdo principal (Sidebar + Área) */}
      <div className="flex flex-1">
        {/* Sidebar Fixa */}
        <div className="fixed inset-y-0 left-0 z-40">
          <Sidebar />
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 ml-[219px] flex flex-col">
          <Header />

          <main className="flex-1 p-6">{children}</main>
        </div>
        <footer className="w-full h-[117px] flex items-center justify-center p-10 mt-auto pr-[219px]">
          <p className="text-[#4696AD] text-sm font-medium">
            Filo® | Onde negócios fluem, resultados acontecem
          </p>
        </footer>
      </div>
    </div>
  );
}
