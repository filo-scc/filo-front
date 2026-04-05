// src/components/Header.jsx
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { user } = useAuth();

  return (
      <header className="w-full pt-8 pb-2 flex items-center justify-between bg-transparent">      
      {/* Logo alinhada a 77px da borda esquerda */}
      <div className="pl-[77px]">
        <img src="/filo-logo.png" alt="Filo" className="h-[47px] w-auto" />
      </div>

      {/* Perfil alinhado à direita */}
      <div className="flex items-center gap-3 pr-10">
        <div className="flex flex-col items-start">
          <span className="text-[#404040] font-normal text-[17px] leading-tight">
            {user?.nome || "User Name"}
          </span>
          <span className="text-[#7B7D80] font-normal text-[15px] leading-tight">
            {user?.cargo || "Role"}
          </span>
        </div>
        
        <div className="w-[48px] h-[48px] rounded-full border border-[#A9E2F2] p-[1px] overflow-hidden">
          <img 
            src={user?.avatar || "https://github.com/shadcn.png"} 
            alt="Perfil" 
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        <img src="/arrow-down.png" alt="Seta" className="w-3 h-2 ml-1" />
      </div>
    </header>
  );
}