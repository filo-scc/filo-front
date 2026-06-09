import { useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { getEtapasByFabrico } from "../services/etapasService";
import { getFabricoById } from "../services/fabricoService";
import {
    getFichaTecnicaByFabrico,
    updateEtapaFichaTecnica,
} from "../services/fichasTecnicasService";
import { getMe } from "../services/authService";

export default function Home() {
    const location = useLocation();
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const scrollIntervalRef = useRef(null);

    const [mostrarErro, setMostrarErro] = useState(!!location.state?.error);
    const [quadro, setQuadro] = useState([]);
    const [loading, setLoading] = useState(true);

    const [mostrarSetaEsquerda, setMostrarSetaEsquerda] = useState(null);
    const [mostrarSetaDireita, setMostrarSetaDireita] = useState(null);

    const [producaoSobDemanda, setProducaoSobDemanda] = useState(null);

    const mensagem = location.state?.error;
    const labelNovaFicha =
        producaoSobDemanda === null ? "" : producaoSobDemanda ? "Novo pedido" : "Nova produção";

    useEffect(() => {
        if (mostrarErro) {
            const timer = setTimeout(() => {
                setMostrarErro(false);
                navigate(location.pathname, { replace: true, state: {} });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [mostrarErro, location.pathname, navigate]);

    useEffect(() => {
        const inicializarDados = async () => {
            const dadosUsuario = await getMe();
            const fabricoId = dadosUsuario.fabrico_id;
            const fabrico = await getFabricoById(fabricoId);
            setProducaoSobDemanda(fabrico?.fabricacao_sob_demanda === true);
            try {
                setLoading(true);

                if (!fabricoId) {
                    throw new Error("Usuário não possui um fabrico associado");
                }

                const [etapas, fichasTecnicas] = await Promise.all([
                    getEtapasByFabrico(fabricoId),
                    getFichaTecnicaByFabrico(fabricoId),
                ]);

                const etapasOrdenada = etapas.sort((a, b) => a.ordem - b.ordem);
                const colunasAgrupadas = etapasOrdenada.map((etapa) => ({
                    ...etapa,
                    fichas: fichasTecnicas.filter((ficha) => ficha.etapa_atual_id == etapa.id),
                }));

                setQuadro(colunasAgrupadas);

                if (colunasAgrupadas.length > 4) {
                    setMostrarSetaDireita(true);
                }
            } catch (error) {
                console.error("Erro ao carregar os dados", error);
            } finally {
                setLoading(false);
            }
        };

        inicializarDados();
    }, []);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setMostrarSetaEsquerda(scrollLeft > 0);
            setMostrarSetaDireita(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
        }
    };

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

        setQuadro((quadroAtual) => {
            const novoQuadro = quadroAtual.map((coluna) => ({
                ...coluna,
                fichas: [...coluna.fichas],
            }));

            const indexOrigem = novoQuadro.findIndex((e) => e.id == etapaOrigemId);
            const indexFinal = novoQuadro.findIndex((e) => e.id == etapaFinalId);
            if (indexOrigem === -1 || indexFinal === -1) return quadroAtual;

            const indexFicha = novoQuadro[indexOrigem].fichas.findIndex((f) => f.id == fichaId);
            if (indexFicha === -1) return quadroAtual;

            const [fichaMovida] = novoQuadro[indexOrigem].fichas.splice(indexFicha, 1);
            fichaMovida.etapa_atual_id = etapaFinalId;
            novoQuadro[indexFinal].fichas.push(fichaMovida);

            return novoQuadro;
        });
        try {
            await updateEtapaFichaTecnica(fichaId, etapaFinalId);
        } catch (error) {
            console.error("Erro ao mover a ficha no back-end", error);
        }
    };

    return (
        <div className="p-6 pt-0 w-full min-w-0 mt-6">
            {mostrarErro && mensagem && (
                <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-2xl animate-fade-in-out">
                    <div className="flex items-center gap-2">
                        <p>{mensagem}</p>
                    </div>
                </div>
            )}

            <div className="bg-white px-6 py-8 rounded-[24px] shadow-sm h-[calc(100vh-120px)] w-full flex flex-col relative overflow-hidden min-w-0">
                <div className="flex justify-between items-center mb-8 shrink-0">
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
                    <button
                        onClick={() => navigate("/pedidos/cadastrar")}
                        disabled={producaoSobDemanda === null}
                        aria-busy={producaoSobDemanda === null}
                        className="w-[169px] h-[39px] bg-[#A9E2F2] text-[#4696AD] font-normal text-base rounded-full flex items-center justify-center gap-2 shrink-0"
                    >
                        <span className="flex items-center w-4 h-4 relative">
                            <img
                                src="nova-ficha-azul.png"
                                alt="Ícone Nova ficha"
                                className="w-full h-full object-contain"
                            />
                        </span>
                        <span className="min-w-[103px]">{labelNovaFicha}</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        Carregando quadro...
                    </div>
                ) : (
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
                            className="flex gap-1 overflow-x-auto overflow-y-hidden h-full pb-4 scroll-smooth no-scrollbar w-full"
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
                                        className={`w-[270px] min-w-[270px] max-h-full bg-[#F4F4F4] ${rounded} p-1 flex flex-col shrink-0`}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, coluna.id)}
                                    >
                                        <div className="flex justify-between items-center mb-4 px-1 shrink-0">
                                            <h2 className="font-normal text-base text-[#404040] flex items-center gap-2">
                                                <img
                                                    src={coluna.icone?.link || ""}
                                                    alt={`Ícone ${coluna.nome}`}
                                                    className="w-5 h-5 object-contain shrink-0"
                                                />
                                                {coluna.nome}
                                            </h2>
                                            <button className="hover:opacity-70 transition-opacity flex items-center justify-center">
                                                <img
                                                    src="/tres-pontos.png"
                                                    alt="Três pontos"
                                                    className="w-4 h-4 object-contain"
                                                />
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-1 pb-2 flex flex-col gap-1 min-h-0 scrollbar-sutil">
                                            {coluna.fichas.map((ficha) => {
                                                const parceirosVinculados =
                                                    ficha.produto?.parceiro_produto || [];
                                                let textoParceiro = "Não designado";

                                                if (parceirosVinculados.length === 1) {
                                                    textoParceiro =
                                                        parceirosVinculados[0].parceiro?.nome;
                                                } else if (parceirosVinculados.length > 1) {
                                                    textoParceiro = `${parceirosVinculados[0].parceiro?.nome} +${parceirosVinculados.length - 1}`;
                                                }

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
                                                        className="bg-white p-4 rounded-[10px] shadow-sm border border-gray-100 flex flex-col gap-1.5 relative border-l-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow shrink-0"
                                                        style={{
                                                            borderLeftColor:
                                                                ficha.pedido?.cor || "#ffffff",
                                                        }}
                                                        draggable
                                                        onDragStart={(e) =>
                                                            handleDragStart(e, ficha.id, coluna.id)
                                                        }
                                                        onDragEnd={handleDragEnd}
                                                    >
                                                        <div
                                                            className={`flex justify-between text-base font-normal ${corPrincipal}`}
                                                        >
                                                            <span className="pointer-events-none break-words max-w-[180px]">
                                                                {ficha.id}
                                                                {`${ficha.pedido?.cliente?.nome ? ` - ${ficha.pedido?.cliente?.nome}` : ""}`}
                                                            </span>
                                                            <span className="font-light text-xs pointer-events-none">
                                                                Nº{ficha.pedido?.id || "--"}
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
                                                                        ficha.pedido.data_prevista,
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
                )}
            </div>
        </div>
    );
}
