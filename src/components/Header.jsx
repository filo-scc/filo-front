import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full pt-8 pb-2 flex items-center justify-end bg-transparent relative z-50 pr-10">
      <div className="relative">
        {/* Acionador do Menu */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-col items-start">
            <span className="text-[#404040] font-normal text-[17px] leading-tight">
              {user?.nome || "Mateus Marinho"}
            </span>
            <span className="text-[#7B7D80] font-normal text-[15px] leading-none">
              {user?.cargo || "Gerente"}
            </span>
          </div>

          <div className="w-[48px] h-[48px] rounded-full border border-[#A9E2F2] p-[1px] overflow-hidden">
            <img
              src={user?.avatar || "/filo-cliente.png"}
              alt="Perfil"
              className="w-full h-full rounded-full object-cover"
            />
          </div>

          <img
            src="/arrow-down.png"
            alt="Seta"
            className={`w-3 h-2 ml-1 transition-transform duration-300 ease-in-out ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>

        {/* Dropdown */}
        <div
          className={`
          absolute right-0 mt-2 w-[175px] bg-white 
          shadow-[0_4px_15px_rgba(0,0,0,0.08)] border border-[#eeeeee] rounded-[4px] 
          flex flex-col overflow-hidden origin-top-right
          transition-all duration-300 ease-out
          ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0 visible"
              : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none"
          }
        `}
        >
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F5] transition-colors rounded-b-[8px] rounded-t-[4px]"
            onClick={() => setIsOpen(false)}
          >
            <img
              src="/configuracoes-desativado.png"
              alt=""
              className="w-4 h-4 opacity-80"
            />
            <span className="text-[#7B7D80] text-[14px]">Configurações</span>
          </button>

          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F5] transition-colors rounded-b-[4px] rounded-t-[8px]"
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
          >
            <img src="/sair.png" alt="" className="w-4 h-4 opacity-80" />
            <span className="text-[#7B7D80] text-[14px]">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
