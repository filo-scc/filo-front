import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { getFabricoById } from "../services/fabricoService";

const FABRICACAO_SOB_DEMANDA_CACHE_KEY = "filo:fabricacaoSobDemanda";

const getFabricacaoSobDemandaCache = (fabricoId) => {
    if (!fabricoId) {
        return { fabricoId: null, valor: null };
    }

    try {
        const cached = JSON.parse(
            sessionStorage.getItem(FABRICACAO_SOB_DEMANDA_CACHE_KEY) || "null",
        );

        if (cached?.fabricoId === fabricoId && typeof cached.valor === "boolean") {
            return cached;
        }
    } catch (error) {
        console.error("Erro ao ler cache de fabricação sob demanda:", error);
    }

    return { fabricoId: null, valor: null };
};

const setFabricacaoSobDemandaCache = (fabricoId, valor) => {
    try {
        sessionStorage.setItem(
            FABRICACAO_SOB_DEMANDA_CACHE_KEY,
            JSON.stringify({ fabricoId, valor }),
        );
    } catch (error) {
        console.error("Erro ao salvar cache de fabricação sob demanda:", error);
    }
};

export function Sidebar({ isOpen = false, onClose }) {
    const [hoveredPath, setHoveredPath] = useState(null);
    const navigate = useNavigate();

    const usuarioLogado = JSON.parse(localStorage.getItem("user") || "{}");
    const fabricoId = usuarioLogado?.fabrico_id;
    const [producaoSobDemanda, setProducaoSobDemanda] = useState(() =>
        getFabricacaoSobDemandaCache(fabricoId),
    );
    const fabricoResolvido =
        !fabricoId ||
        (producaoSobDemanda.fabricoId === fabricoId && producaoSobDemanda.valor !== null);
    const producaoSobDemandaAtiva =
        fabricoId && producaoSobDemanda.fabricoId === fabricoId
            ? producaoSobDemanda.valor === true
            : false;

    const labelNovaFicha = producaoSobDemandaAtiva ? "Novo pedido" : "Nova produção";

    useEffect(() => {
        if (!fabricoId) {
            return;
        }

        let ignorar = false;

        const carregarDados = async () => {
            try {
                const response = await getFabricoById(fabricoId);

                if (ignorar) return;

                setProducaoSobDemanda({
                    fabricoId,
                    valor: response?.fabricacao_sob_demanda === true,
                });
                setFabricacaoSobDemandaCache(fabricoId, response?.fabricacao_sob_demanda === true);
            } catch (error) {
                if (ignorar) return;

                console.error("Erro ao carregar dados do fabrico na Sidebar:", error);
                setProducaoSobDemanda({ fabricoId, valor: false });
                setFabricacaoSobDemandaCache(fabricoId, false);
            }
        };

        carregarDados();

        return () => {
            ignorar = true;
        };
    }, [fabricoId]);

    const menuItems = useMemo(() => {
        const items = [
            { name: "Início", slug: "inicio", path: "/" },
            { name: "Parceiros", slug: "parceiros", path: "/parceiros" },
            { name: "Produtos", slug: "produtos", path: "/produtos" },
            { name: "Aviamentos", slug: "aviamentos", path: "/aviamentos" },
            { name: "Tecidos", slug: "tecidos", path: "/tecidos" },
            { name: "Financeiro", slug: "financeiro", path: "/financeiro" },
            { name: "Configurações", slug: "configuracoes", path: "/configuracoes" },
        ];

        if (!fabricoResolvido) {
            return items;
        }

        items.splice(1, 0, {
            name: producaoSobDemandaAtiva ? "Pedidos" : "Produções",
            slug: "pedidos",
            path: "/pedidos",
        });

        if (producaoSobDemandaAtiva) {
            items.splice(3, 0, { name: "Clientes", slug: "clientes", path: "/clientes" });
        }

        return items;
    }, [fabricoResolvido, producaoSobDemandaAtiva]);

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-[219px] flex-col items-center gap-8 overflow-y-auto bg-[#F3F4FA]/95 py-8 pl-6 shadow-xl backdrop-blur-md transition-transform duration-300 scrollbar-sutil lg:translate-x-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-none ${
                isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            aria-label="Navegação principal"
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Fechar menu"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-[#7B7D80] hover:bg-white lg:hidden"
            >
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5 fill-none stroke-current stroke-2"
                >
                    <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
                </svg>
            </button>

            {/* Logo Filo */}
            <div className="w-full pl-[53px] flex justify-start">
                <img src="/filo-logo.png" alt="Filo" className="h-[47px] w-auto" />
            </div>

            {/* 1. Botão Nova Ficha */}
            {fabricoResolvido && (
                <button
                    className="w-[182px] h-[39px] min-h-[39px] bg-[#A9E2F2] rounded-[18.5px] flex items-center justify-center px-3 gap-2 transition-all duration-200 shadow-sm hover:bg-[#A2DCED]"
                    onClick={() => {
                        onClose?.();
                        navigate("/pedidos/cadastrar");
                    }}
                >
                    <img src="/pedidos-azul.png" alt="" className="w-5 h-5" />
                    <span className="whitespace-nowrap text-[#4696AD] font-normal text-sm">
                        {labelNovaFicha}
                    </span>
                </button>
            )}

            {/* 2. Menu Itens */}
            <nav className="flex flex-col gap-2 w-full pb-8">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onMouseEnter={() => setHoveredPath(item.path)}
                        onMouseLeave={() => setHoveredPath(null)}
                        onClick={onClose}
                        className={({ isActive }) => `
              flex items-center gap-3 h-[39px] min-h-[39px] px-4 transition-all duration-300
              ${
                  isActive
                      ? "w-[182px] text-[#404040] bg-[#D7FE65] rounded-[18.5px]"
                      : "w-[169px] text-[#898C8F] hover:bg-[#F9F9F9] hover:rounded-[18.5px] hover:text-[#404040] hover:w-[182px]"
              }
            `}
                    >
                        {({ isActive }) => {
                            const isItemHovered = hoveredPath === item.path;
                            const iconSrc =
                                isActive || isItemHovered
                                    ? `/${item.slug}-ativado.png`
                                    : `/${item.slug}-desativado.png`;

                            return (
                                <>
                                    <img
                                        src={iconSrc}
                                        alt={item.name}
                                        className="w-5 h-5 transition-opacity duration-200"
                                    />
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
