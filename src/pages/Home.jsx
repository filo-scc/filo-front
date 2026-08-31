import { useLocation, useNavigate } from "react-router-dom";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { getAllEtapasByFabricoId } from "../services/etapaService";
import { getFichaTecnicaByFabrico } from "../services/fichasTecnicasService";
import { getMe } from "../services/authService";
import TransferenciaEtapaModal from "../components/fichas-tecnicas/TransferenciaEtapaModal";
import FichaTecnicaDetalhesModal from "../components/fichas-tecnicas/FichaTecnicaDetalhesModal";
import HomeSkeleton from "../components/home/HomeSkeleton";
import OperationalSummaryCards from "../components/home/OperationalSummaryCards";
import ProductionChart from "../components/home/ProductionChart";
import NotificationsPanel from "../components/home/NotificationsPanel";

const CATEGORIAS_DE_COSTURA = ["costur", "faccao", "confeccao", "costura"];

const normalizarCategoria = (categoria) =>
    String(categoria || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

const ehCategoriaDeCostura = (categoria) => {
    const categoriaNormalizada = normalizarCategoria(categoria);

    return CATEGORIAS_DE_COSTURA.some((categoriaAceita) =>
        categoriaNormalizada.includes(categoriaAceita),
    );
};

const formatarParceirosDeCostura = (ficha) => {
    const parceirosDeCostura = (ficha?.ficha_parceiro || [])
        .map((vinculo) => vinculo?.parceiro)
        .filter((parceiro) => parceiro?.nome && ehCategoriaDeCostura(parceiro?.categoria))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    if (parceirosDeCostura.length === 0) return "Não designado";

    const [primeiroParceiro] = parceirosDeCostura;
    const quantidadeAdicional = parceirosDeCostura.length - 1;

    return quantidadeAdicional > 0
        ? `${primeiroParceiro.nome} +${quantidadeAdicional}`
        : primeiroParceiro.nome;
};

export default function Home() {
    const location = useLocation();
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const scrollIntervalRef = useRef(null);

    const [mostrarErro, setMostrarErro] = useState(!!location.state?.error);
    const [quadro, setQuadro] = useState([]);
    const [loading, setLoading] = useState(true);

    const [mostrarSetaEsquerda, setMostrarSetaEsquerda] = useState(false);
    const [mostrarSetaDireita, setMostrarSetaDireita] = useState(false);
    const [transferenciaAtiva, setTransferenciaAtiva] = useState(null);
    const [fabricoId, setFabricoId] = useState(null);

    const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
    const [fichaSelecionadaId, setFichaSelecionadaId] = useState(null);
    const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

    const mensagem = location.state?.error;

    useEffect(() => {
        if (mostrarErro) {
            const timer = setTimeout(() => {
                setMostrarErro(false);
                navigate(location.pathname, { replace: true, state: {} });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [mostrarErro, location.pathname, navigate]);

    const carregarDadosDoQuadro = useCallback(async () => {
        setLoading(true);
        try {
            const dadosUsuario = await getMe();
            const fId = dadosUsuario.fabrico_id;
            setFabricoId(fId);

            if (!fId) {
                throw new Error("Usuário não possui um fabrico associado");
            }

            const [etapas, fichasTecnicas] = await Promise.all([
                getAllEtapasByFabricoId(fId),
                getFichaTecnicaByFabrico(fId),
            ]);

            const etapas_ativas = etapas.filter((etapa) => etapa.ativa);
            const etapasOrdenada = etapas_ativas.sort((a, b) => a.ordem - b.ordem);
            const colunasAgrupadas = etapasOrdenada.map((etapa) => ({
                ...etapa,
                fichas: fichasTecnicas.filter((ficha) => ficha.etapa_atual_id == etapa.id),
            }));

            setQuadro(colunasAgrupadas);
        } catch (error) {
            console.error("Erro ao carregar os dados", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarDadosDoQuadro();
    }, [carregarDadosDoQuadro]);

    const handleScroll = useCallback(() => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setMostrarSetaEsquerda(scrollLeft > 0);
            setMostrarSetaDireita(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
        }
    }, []);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return undefined;

        const frame = requestAnimationFrame(handleScroll);
        const resizeObserver =
            typeof ResizeObserver === "undefined" ? null : new ResizeObserver(handleScroll);

        resizeObserver?.observe(container);
        Array.from(container.children).forEach((column) => resizeObserver?.observe(column));
        window.addEventListener("resize", handleScroll);

        return () => {
            cancelAnimationFrame(frame);
            resizeObserver?.disconnect();
            window.removeEventListener("resize", handleScroll);
        };
    }, [handleScroll, quadro]);

    const rolarParaDireita = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 290, behavior: "smooth" });
        }
    };

    const rolarParaEsquerda = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -290, behavior: "smooth" });
        }
    };

    const handleDragStart = (e, fichaId, etapaOrigemId) => {
        e.dataTransfer.setData("fichaId", fichaId);
        e.dataTransfer.setData("etapaOrigemId", etapaOrigemId);
        e.currentTarget.style.opacity = "0.5";
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = "1";
        pararAutoScroll();
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (scrollRef.current) {
            const rect = scrollRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const larguraContainer = rect.width;
            const zonaGatilho = 100;

            if (mouseX > larguraContainer - zonaGatilho) {
                iniciarAutoScroll(10);
            } else if (mouseX < zonaGatilho && mouseX > 0) {
                iniciarAutoScroll(-10);
            } else {
                pararAutoScroll();
            }
        }
    };

    const iniciarAutoScroll = (velocidade) => {
        if (!scrollIntervalRef.current) {
            scrollIntervalRef.current = setInterval(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollLeft += velocidade;
                }
            }, 15);
        } else {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = setInterval(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollLeft += velocidade;
                }
            }, 15);
        }
    };

    const pararAutoScroll = () => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    };

    const handleDrop = async (e, etapaFinalId) => {
        e.preventDefault();
        pararAutoScroll();

        const fichaId = Number(e.dataTransfer.getData("fichaId"));
        const etapaOrigemId = Number(e.dataTransfer.getData("etapaOrigemId"));

        if (etapaOrigemId == etapaFinalId || !etapaOrigemId || !fichaId) return;

        const colunaOrigem = quadro.find((c) => c.id == etapaOrigemId);
        const colunaDestino = quadro.find((c) => c.id == etapaFinalId);

        if (colunaOrigem && colunaDestino) {
            if (colunaDestino.ordem < colunaOrigem.ordem) {
                console.warn("Não é permitido mover a ficha para uma etapa anterior.");
                return;
            }
        }

        const fichaSelecionada = colunaOrigem?.fichas.find((f) => f.id == fichaId);

        if (colunaOrigem && colunaDestino && fichaSelecionada) {
            setTransferenciaAtiva({
                fichaTecnica: fichaSelecionada,
                etapaConcluida: { id: colunaOrigem.id, nome: colunaOrigem.nome },
                proximaEtapa: { id: colunaDestino.id, nome: colunaDestino.nome },
            });
        }
    };

    return (
        <div className="mt-2 w-full min-w-0 px-3 pb-6 sm:mt-5 sm:px-5 lg:ml-6 lg:mr-10 lg:mt-[23px] lg:w-auto lg:px-0 lg:pb-[25px]">
            {mostrarErro && mensagem && (
                <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-2xl animate-fade-in-out">
                    <div className="flex items-center gap-2">
                        <p>{mensagem}</p>
                    </div>
                </div>
            )}

            <OperationalSummaryCards refreshKey={dashboardRefreshKey} />

            <div className="mt-3 hidden min-w-0 grid-cols-1 gap-3 sm:mt-4 sm:grid sm:gap-[14px] xl:grid-cols-[minmax(0,639fr)_minmax(0,504fr)]">
                <ProductionChart refreshKey={dashboardRefreshKey} />
                <NotificationsPanel />
            </div>

            <div className="relative mt-3 flex h-[620px] w-full min-w-0 flex-col overflow-hidden rounded-[24px] bg-white px-4 py-6 sm:mt-[15px] sm:h-[664px] lg:px-[19px] lg:pb-[23px] lg:pt-[31px]">
                {loading ? (
                    <HomeSkeleton />
                ) : (
                    <>
                        <div className="mb-6 flex shrink-0 items-center justify-between lg:ml-[18px]">
                            <h1 className="font-normal text-base text-[#404040] flex items-center gap-2">
                                <span className="flex items-center">
                                    <img
                                        src="icone-quadro-producao.png"
                                        alt="Ícone Quadro Produção"
                                        className="w-5 h-5 shrink-0 object-contain"
                                    />
                                </span>
                                Quadro de produção
                            </h1>
                        </div>

                        <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden">
                            {mostrarSetaEsquerda && (
                                <button
                                    onClick={rolarParaEsquerda}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#AEE5E8] text-[#347A8A] w-10 h-10 rounded-r-xl shadow-md flex items-center justify-center hover:bg-[#9cdfe2] transition-colors z-10"
                                >
                                    ❮
                                </button>
                            )}

                            <div
                                ref={scrollRef}
                                onScroll={handleScroll}
                                className="flex h-full w-full gap-3.5 overflow-x-auto overflow-y-hidden pb-4 scroll-smooth no-scrollbar"
                                style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
                            >
                                {quadro.map((coluna, index) => {
                                    let rounded = "rounded-xl";

                                    if (index === 0) {
                                        rounded = "rounded-l-[24px] rounded-r-xl";
                                    } else if (index === quadro.length - 1) {
                                        rounded = "rounded-l-xl rounded-r-[24px]";
                                    }

                                    return (
                                        <div
                                            key={coluna.id}
                                            className={`flex max-h-full min-w-[260px] flex-1 flex-col bg-[#F4F4F4] ${rounded} px-3 pb-2 pt-1`}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, coluna.id)}
                                        >
                                            <div className="mb-4 flex shrink-0 items-center justify-between px-2 pt-3">
                                                <h2 className="font-normal text-base text-[#404040] flex items-center gap-2">
                                                    <img
                                                        src={coluna.icone?.link || ""}
                                                        alt={`Ícone ${coluna.nome}`}
                                                        className="w-5 h-5 object-contain shrink-0"
                                                    />
                                                    {coluna.nome}
                                                </h2>
                                                <button className="hidden items-center justify-center transition-opacity hover:opacity-70">
                                                    <img
                                                        src="/tres-pontos.png"
                                                        alt="Três pontos"
                                                        className="w-4 h-4 object-contain"
                                                    />
                                                </button>
                                            </div>

                                            <div className="scrollbar-sutil -mr-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-scroll pb-2 pr-1">
                                                {coluna.fichas.map((ficha) => {
                                                    const textoParceiro =
                                                        formatarParceirosDeCostura(ficha);

                                                    let isAtrasado = false;
                                                    if (ficha.pedido?.data_prevista) {
                                                        const hoje = new Date();
                                                        hoje.setHours(0, 0, 0, 0);

                                                        const dataFicha = new Date(
                                                            ficha.pedido.data_prevista,
                                                        );
                                                        dataFicha.setHours(0, 0, 0, 0);

                                                        isAtrasado = dataFicha < hoje;
                                                    }

                                                    const corPrincipal = isAtrasado
                                                        ? "text-[#D75757]"
                                                        : "text-[#7B7D80]";
                                                    const corParceiro = isAtrasado
                                                        ? "text-[#E9C6C6]"
                                                        : "text-gray-400";

                                                    return (
                                                        <div
                                                            key={ficha.id}
                                                            onClick={() => {
                                                                setModalDetalhesAberto(true);
                                                                setFichaSelecionadaId(ficha.id);
                                                            }}
                                                            className="relative flex w-full shrink-0 cursor-grab flex-col gap-1.5 rounded-[10px] border border-l-4 border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                                                            style={{
                                                                borderLeftColor:
                                                                    ficha.pedido?.cor || "#ffffff",
                                                            }}
                                                            draggable
                                                            onDragStart={(e) =>
                                                                handleDragStart(
                                                                    e,
                                                                    ficha.id,
                                                                    coluna.id,
                                                                )
                                                            }
                                                            onDragEnd={handleDragEnd}
                                                        >
                                                            <div
                                                                className={`flex justify-between text-base font-normal ${corPrincipal}`}
                                                            >
                                                                <span className="pointer-events-none break-words max-w-[180px]">
                                                                    {ficha.numero}
                                                                    {`${ficha.pedido?.cliente?.nome ? ` - ${ficha.pedido?.cliente?.nome}` : ""}`}
                                                                </span>
                                                                <span className="font-light text-xs pointer-events-none">
                                                                    Nº{ficha.pedido?.numero || "--"}
                                                                </span>
                                                            </div>

                                                            <div
                                                                className={`text-xs font-light flex flex-col gap-1 pointer-events-none ${corPrincipal}`}
                                                            >
                                                                <span className="flex items-start gap-1">
                                                                    <img
                                                                        src={
                                                                            isAtrasado
                                                                                ? "/etiqueta-vermelha.png"
                                                                                : "/etiqueta_cinza_claro.png"
                                                                        }
                                                                        alt="Ícone etiqueta"
                                                                        className="w-[12px] h-[12px] shrink-0 mt-[2px]"
                                                                    />
                                                                    <span className="break-words">
                                                                        Ref.{" "}
                                                                        {ficha.produto?.nome ||
                                                                            "Produto"}
                                                                    </span>
                                                                </span>

                                                                <span className="flex items-start gap-1">
                                                                    <img
                                                                        src={
                                                                            isAtrasado
                                                                                ? "/camisa-vermelha.png"
                                                                                : "/camisa_cinza_clara.png"
                                                                        }
                                                                        alt="ícone camisa"
                                                                        className="w-[12px] h-[12px] shrink-0 mt-[2px]"
                                                                    />
                                                                    <span className="break-words">
                                                                        {ficha.quantidade} peças
                                                                    </span>
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between items-center pointer-events-none text-xs">
                                                                <span
                                                                    className={`flex items-center gap-1 ${corParceiro}`}
                                                                >
                                                                    <img
                                                                        src={
                                                                            isAtrasado
                                                                                ? "/maquina-costura-rosa-claro.png"
                                                                                : "/maquina-costura-preta.png"
                                                                        }
                                                                        alt="máquina de costura"
                                                                        className={`w-[12px] h-[12px] shrink-0 ${isAtrasado ? "" : "opacity-40"}`}
                                                                    />
                                                                    <span className="truncate max-w-[120px]">
                                                                        {textoParceiro}
                                                                    </span>
                                                                </span>

                                                                {ficha.pedido?.data_prevista && (
                                                                    <span
                                                                        className={`flex items-center gap-1 font-light shrink-0 ${corPrincipal}`}
                                                                    >
                                                                        <img
                                                                            src={
                                                                                isAtrasado
                                                                                    ? "/calendario-vermelho.png"
                                                                                    : "/calendario-prazo.png"
                                                                            }
                                                                            alt="calendario"
                                                                            className="w-[12px] h-[12px] shrink-0"
                                                                        />
                                                                        {new Date(
                                                                            ficha.pedido
                                                                                .data_prevista,
                                                                        )
                                                                            .toLocaleDateString(
                                                                                "pt-BR",
                                                                                {
                                                                                    day: "2-digit",
                                                                                    month: "2-digit",
                                                                                },
                                                                            )
                                                                            .replace("/", ".")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {mostrarSetaDireita && (
                                <button
                                    onClick={rolarParaDireita}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#AEE5E8] text-[#347A8A] w-10 h-10 rounded-l-xl shadow-md flex items-center justify-center hover:bg-[#9cdfe2] transition-colors z-10"
                                >
                                    ❯
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {transferenciaAtiva && (
                <TransferenciaEtapaModal
                    isOpen={!!transferenciaAtiva}
                    onClose={() => setTransferenciaAtiva(null)}
                    fichaTecnica={transferenciaAtiva.fichaTecnica}
                    fabricoId={fabricoId}
                    etapaConcluida={transferenciaAtiva.etapaConcluida}
                    proximaEtapa={transferenciaAtiva.proximaEtapa}
                    onSuccess={() => {
                        carregarDadosDoQuadro();
                        setDashboardRefreshKey((key) => key + 1);
                    }}
                />
            )}

            {modalDetalhesAberto && fichaSelecionadaId && (
                <FichaTecnicaDetalhesModal
                    isOpen={modalDetalhesAberto}
                    fichaId={fichaSelecionadaId}
                    onFichaAtualizada={async () => {
                        await carregarDadosDoQuadro();
                        setDashboardRefreshKey((key) => key + 1);
                    }}
                    onClose={() => {
                        setModalDetalhesAberto(false);
                        setFichaSelecionadaId(null);
                    }}
                />
            )}
        </div>
    );
}
