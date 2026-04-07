import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function Layout({ children }) {
  return (
    // Mantemos o gradiente no container principal para consistência visual
    <div 
      className="min-h-screen flex" 
      style={{ 
        background: "linear-gradient(to bottom, #F4F4F4 25%, #C7E9F5 100%)",
        backgroundAttachment: "fixed" 
      }}>
      
      {/* Sidebar Fixa: Ocupa a altura total da tela e permite scroll próprio se necessário */}
      <div className="fixed inset-y-0 left-0 z-40">
        <Sidebar />
      </div>
      
      {/* Área de Conteúdo: Header + Main. O ml-[219px] reserva o espaço da Sidebar */}
      <div className="flex-1 ml-[219px] flex flex-col">
        <Header />
        
        <main className="flex-1 p-6">
          {children}
        </main>

        <footer className="w-full h-[117px] flex items-center justify-center p-10 mt-auto">
          <p className="text-[#4696AD] text-sm font-medium">
            Filo® | Onde negócios fluem, resultados acontecem
          </p>
        </footer>
      </div>
    </div>
  );
}