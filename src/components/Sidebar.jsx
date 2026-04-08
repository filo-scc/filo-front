import { useState } from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { name: "Início", slug: "inicio", path: "/" },
  { name: "Pedidos", slug: "pedidos", path: "/pedidos" },
  { name: "Facções", slug: "faccoes", path: "/faccoes" },
  { name: "Clientes", slug: "clientes", path: "/clientes" },
  { name: "Produtos", slug: "produtos", path: "/produtos" },
  { name: "Estoque", slug: "estoque", path: "/estoque" },
  { name: "Financeiro", slug: "financeiro", path: "/financeiro" },
  { name: "Configurações", slug: "configuracoes", path: "/configuracoes" },
];

export function Sidebar() {
  const [hoveredPath, setHoveredPath] = useState(null);

  return (
    <aside className="w-[219px] h-screen pl-[24px] flex flex-col items-center py-8 gap-[32px] bg-transparent overflow-y-auto">
      
      {/* Logo Filo */}
      <div className="w-full pl-[53px] flex justify-start">
        <img src="/filo-logo.png" alt="Filo" className="h-[47px] w-auto" />
      </div>

      {/* 1. Botão Nova Ficha */}
      <button 
        className="w-[169px] h-[39px] min-h-[39px] bg-[#A9E2F2] rounded-[18.5px] flex items-center justify-start px-4 gap-3 transition-all duration-200 shadow-sm hover:bg-[#8ecce0]"
      >
        <img src="/nova-ficha.png" alt="" className="w-5 h-5" />
        <span className="text-[#FFFFFF] font-normal text-sm">Nova ficha</span>
      </button>

      {/* 2. Menu Itens */}
      <nav className="flex flex-col gap-2 w-full pb-8">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onMouseEnter={() => setHoveredPath(item.path)}
            onMouseLeave={() => setHoveredPath(null)}
            className={({ isActive }) => `
              flex items-center gap-3 h-[39px] min-h-[39px] px-4 transition-all duration-300
              ${isActive 
                ? "w-[182px] text-[#404040] bg-[#D7FE65] rounded-[18.5px]" 
                : "w-[169px] text-[#898C8F] hover:bg-[#F9F9F9] hover:rounded-[18.5px] hover:text-[#404040] hover:w-[182px]"
              }
            `}
          >
            {({ isActive }) => {
              const isItemHovered = hoveredPath === item.path;
              const iconSrc = (isActive || isItemHovered) 
                ? `/${item.slug}-ativado.png` 
                : `/${item.slug}-desativado.png`;

              return (
                <>
                  <img src={iconSrc} alt={item.name} className="w-5 h-5 transition-opacity duration-200" />
                  <span className="text-sm">{item.name}</span>
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}