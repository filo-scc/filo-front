import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

export function Header({ onMenuOpen }) {
    const { user, logout, loading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const cargoMap = {
        GERENTE: "Gerente",
        PROPRIETARIO: "Proprietário",
        ADMIN: "Admin",
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (loading) {
        return <header className="h-[72px] w-full" />;
    }

    return (
        <header className="relative z-20 flex w-full items-center justify-between bg-transparent px-4 pb-2 pt-4 sm:px-6 sm:pt-6 lg:justify-end lg:pr-10 lg:pt-8">
            <button
                type="button"
                onClick={onMenuOpen}
                aria-label="Abrir menu"
                className="flex h-11 w-11 items-center justify-center rounded-full  text-[#6A838B] shadow-sm transition-colors hover:bg-white lg:hidden"
            >
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-6 w-6 fill-none stroke-current stroke-2"
                >
                    <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
            </button>

            <div className="relative" ref={dropdownRef}>
                <div
                    className="flex items-center gap-3 cursor-pointer select-none"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="hidden flex-col items-start sm:flex">
                        <span className="text-[15px] font-normal leading-tight text-[#404040] lg:text-[17px]">
                            {user?.nome || "Usuario Sem Nome"}
                        </span>
                        <span className="text-[13px] font-normal leading-none text-[#7B7D80] lg:text-[15px]">
                            {user?.cargo ? cargoMap[user.cargo] || user.cargo : "Gerente"}
                        </span>
                    </div>

                    <div className="h-[42px] w-[42px] overflow-hidden rounded-full border border-[#A9E2F2] p-[1px] sm:h-[48px] sm:w-[48px]">
                        <img
                            src={user?.foto_de_perfil || "/no-user-image.png"}
                            alt="Perfil"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>

                    <img
                        src="/arrow-down.png"
                        alt="Seta"
                        className={`ml-0 h-2 w-3 transition-transform duration-300 ease-in-out sm:ml-1 ${
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
