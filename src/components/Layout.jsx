import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4FAFD]" 
         style={{ background: "linear-gradient(to bottom, #F4F4F4 0%, #FFFFFF 20%, #C7E9F5 100%)" }}>
      
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      <footer className="w-full h-[117px] flex items-center justify-center p-10 mt-auto">
        <p className="text-[#4696AD] text-sm font-medium">
          Filo® | Onde negócios fluem, resultados acontecem
        </p>
      </footer>
    </div>
  );
}