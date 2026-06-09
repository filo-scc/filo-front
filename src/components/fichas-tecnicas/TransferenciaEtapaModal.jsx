import React, { useState, useEffect, useRef, useMemo } from "react";
import { getAllEtapasByFabricoId } from "../../services/etapaService";
import { getParceirosByFabrico } from "../../services/parceiroService";
import {
    createParceiroProduto,
    getProdutoParceiro,
    updateParceiroProdutoPrice,
} from "../../services/fichaTecnicaItemService";
import {
    finalizarFichaEtapa,
    getFichaEtapaByFichaTecnica,
    updateEtapaFichaTecnica,
} from "../../services/fichasTecnicasService";

import {
    getFichaParceiroByFicha,
    createFichaTecnicaParceiro,
    updateFichaTecnicaParceiro,
} from "../../services/fichaParceiroService";
import { createFichaEtapa } from "../../services/fichaEtapaService";

export default function TransferenciaEtapaModal({
    isOpen,
    onClose,
    fichaTecnica,
    fabricoId,
    etapaConcluida,
    proximaEtapa,
    onSuccess,
}) {
    // --- Estados ---
    const [etapas, setEtapas] = useState([]);
    const [parceirosDisponiveis, setParceirosDisponiveis] = useState([]);
    const [linhasTabela, setLinhasTabela] = useState([]);

    const [buscaParceiro, setBuscaParceiro] = useState("");
    const [dropdownAberto, setDropdownAberto] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [parceirosIniciais, setParceirosIniciais] = useState([]);

    // Estados para o comportamento visual da nova tabela
    const [hoveredParceiroIndex, setHoveredParceiroIndex] = useState(null);
    const [tabelaScrollTop, setTabelaScrollTop] = useState(0);

    // Refs
    const dropdownRef = useRef(null);
    const tabelaScrollRef = useRef(null);

    // --- Máscaras e Utilitários de Formatação ---
    const formatarMoedaBR = (valor) => {
        const limpo = String(valor).replace(/\D/g, "");
        const numero = Number(limpo) / 100;
        return numero.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    };

    const converterMoedaParaFloat = (stringMoeda) => {
        if (!stringMoeda) return 0;
        const limpo = stringMoeda.replace(/[^\d]/g, "");
        return Number(limpo) / 100;
    };

    // --- Carga Inicial de Dados ---
    useEffect(() => {
        const carregarDadosIniciais = async () => {
            setLoading(true);
            try {
                // 1. Buscar todas as etapas do fabrico
                const listaEtapas = await getAllEtapasByFabricoId(fabricoId);
                const ativasEOrdenadas = listaEtapas
                    .filter((e) => e.ativa)
                    .sort((a, b) => a.ordem - b.ordem);
                setEtapas(ativasEOrdenadas);

                // 2. Buscar parceiros do fabrico filtrando pela categoria da etapa concluída
                const listaParceiros = await getParceirosByFabrico(fabricoId);
                const filtradosPorCategoria = listaParceiros.filter(
                    (p) => p.categoria?.toLowerCase() === etapaConcluida.nome?.toLowerCase(),
                );
                setParceirosDisponiveis(filtradosPorCategoria);

                // 3. Buscar parceiros já associados a esta Ficha Técnica
                const parceirosExistentes = await getFichaParceiroByFicha(fichaTecnica.id);

                setParceirosIniciais(parceirosExistentes);

                const jaVinculadosDestaEtapa = parceirosExistentes
                    .filter(
                        (fp) =>
                            fp.parceiro?.categoria?.toLowerCase() ===
                            etapaConcluida.nome?.toLowerCase(),
                    )
                    .map((fp) => ({
                        id: fp.parceiro.id,
                        nome: fp.parceiro.nome,
                        operacao: fp.operacao || "",
                        quantidade: fp.quantidade,
                        custoTotalFormatado: formatarMoedaBR(fp.custo ? Number(fp.custo) : 0),
                    }));

                setLinhasTabela(jaVinculadosDestaEtapa);
            } catch (error) {
                console.error("Erro ao carregar dados do modal de transferência:", error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && fabricoId && fichaTecnica?.id) {
            carregarDadosIniciais();
        }
    }, [isOpen, fabricoId, fichaTecnica, etapaConcluida]);

    // --- Fechamento do Dropdown ao clicar fora ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownAberto(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Filtragem Dinâmica do Dropdown ---
    const parceirosFiltrados = useMemo(() => {
        return parceirosDisponiveis.filter((p) => {
            const jaAdicionado = linhasTabela.some((linha) => linha.id === p.id);
            const bateBusca = p.nome?.toLowerCase().includes(buscaParceiro.toLowerCase());
            return !jaAdicionado && bateBusca;
        });
    }, [parceirosDisponiveis, linhasTabela, buscaParceiro]);

    // --- Ações da Tabela ---
    const adicionarParceiroNaTabela = (parceiro) => {
        const novaLinha = {
            id: parceiro.id,
            nome: parceiro.nome,
            operacao: "",
            // Se for o primeiro, assume o total. Se já existirem outros, inicia zerado para validação forçar o ajuste
            quantidade: linhasTabela.length === 0 ? fichaTecnica.quantidade : 0,
            custoTotalFormatado: formatarMoedaBR(0),
        };
        setLinhasTabela([...linhasTabela, novaLinha]);
        setBuscaParceiro("");
        setDropdownAberto(false);
    };

    const removerParceiroDaTabela = (id) => {
        setLinhasTabela((prev) => prev.filter((linha) => linha.id !== id));
    };

    const atualizarCampoLinha = (id, campo, valor) => {
        setLinhasTabela(
            linhasTabela.map((linha) => {
                if (linha.id !== id) return linha;
                if (campo === "custoTotalFormatado") {
                    return { ...linha, [campo]: formatarMoedaBR(valor) };
                }
                return { ...linha, [campo]: valor };
            }),
        );
    };

    // --- Cálculos de Validação de Quantidade ---
    const somaQuantidades = useMemo(() => {
        return linhasTabela.reduce((acc, curr) => acc + Number(curr.quantidade || 0), 0);
    }, [linhasTabela]);

    const quantidadeValida = useMemo(() => {
        if (linhasTabela.length <= 1) return true;
        return somaQuantidades === fichaTecnica.quantidade;
    }, [linhasTabela, somaQuantidades, fichaTecnica]);

    // --- Submit / Processamento da Transferência ---
    const handleTransferir = async () => {
        if (!quantidadeValida) return;
        setSubmitting(true);
        try {
            if (linhasTabela.length > 0) {
                for (const linha of linhasTabela) {
                    const custoTotal = converterMoedaParaFloat(linha.custoTotalFormatado);
                    const qtdAlocada =
                        linhasTabela.length === 1
                            ? fichaTecnica.quantidade
                            : Number(linha.quantidade);
                    // Evita divisão por zero boba
                    const precoUnitario = qtdAlocada > 0 ? custoTotal / qtdAlocada : 0;

                    // Passos de Negócio mapeados:
                    // 1 - Ver se existe parceiro_produto
                    const parceiro_produto = await getProdutoParceiro(
                        fichaTecnica.produto_id,
                        linha.id,
                    );

                    if (parceiro_produto) {
                        // 1. Atualizar preço da relação parceiro_produto
                        await updateParceiroProdutoPrice(
                            linha.id,
                            fichaTecnica.produto_id,
                            precoUnitario,
                        );
                    } else {
                        // 2. Criar relação parceiro_produto
                        await createParceiroProduto(
                            linha.id,
                            fichaTecnica.produto_id,
                            precoUnitario,
                        );
                    }

                    const payloadCusto = {
                        operacao: linha.operacao,
                        custo: custoTotal,
                        quantidade: qtdAlocada,
                    };

                    // Analisa se a relação já existia antes de fazer qualquer requisição
                    const parceiroJaExistia = parceirosIniciais.some(
                        (p) => p.parceiro.id === linha.id,
                    );

                    if (parceiroJaExistia) {
                        // Se já existia, atualiza
                        await updateFichaTecnicaParceiro(fichaTecnica.id, linha.id, payloadCusto);
                    } else {
                        // Se não existia, cria
                        await createFichaTecnicaParceiro({
                            ficha_id: fichaTecnica.id,
                            parceiro_id: linha.id,
                            ...payloadCusto,
                        });
                    }
                }
            }

            const fichas_etapas = await getFichaEtapaByFichaTecnica(fichaTecnica.id);
            const ficha_etapa_concluida = fichas_etapas.find(
                (fe) => fe.etapa_id === etapaConcluida.id,
            );

            if (ficha_etapa_concluida) {
                await finalizarFichaEtapa(ficha_etapa_concluida.id);
            }

            // 4. Iniciar a nova etapa do fluxo
            await createFichaEtapa({
                ficha_tecnica_id: fichaTecnica.id,
                etapa_id: proximaEtapa.id,
                data_inicio: new Date().toISOString(),
            });

            // 5. Atualizar etapa_atual_id da ficha técnica para refletir a nova etapa
            await updateEtapaFichaTecnica(fichaTecnica.id, proximaEtapa.id);

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Falha ao processar a transferência de etapa:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 font-['Outfit'] px-4">
            {/* CONTAINER PRINCIPAL DO MODAL */}
            <div className="relative w-full max-w-4xl rounded-[24px] bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* CABEÇALHO DO MODAL */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <img
                                src="/transferencia.png"
                                alt="Ícone"
                                className="w-6 h-6 object-contain"
                            />
                            <h2 className="text-[22px] font-light text-[#404040] leading-none">
                                Transferência para {proximaEtapa.nome}
                            </h2>
                        </div>

                        <div className="text-[14px] font-light text-[#7B7D80] ml-9 mt-1 leading-none">
                            {[
                                fichaTecnica?.pedido?.numero
                                    ? `Nº${fichaTecnica.pedido.numero}`
                                    : null,
                                fichaTecnica?.id ? `Ficha Técnica: ${fichaTecnica.id}` : null,
                                fichaTecnica?.pedido?.cliente?.nome || null,
                            ]
                                .filter(Boolean)
                                .map((texto, index, arrayOriginal) => (
                                    <React.Fragment key={index}>
                                        {texto}
                                        {/* Insere a barra colorida apenas se não for o último item da lista */}
                                        {index < arrayOriginal.length - 1 && (
                                            <span className="text-[#D9D9D9] mx-2">|</span>
                                        )}
                                    </React.Fragment>
                                ))}
                        </div>
                    </div>

                    <button onClick={onClose} className="rounded-full p-2 transition-colors">
                        <img src="/fechar-cinza.png" alt="Fechar" className="w-3 h-3 opacity-50" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex h-64 items-center justify-center text-[#898C8F] font-light">
                        Carregando informações da etapa...
                    </div>
                ) : (
                    <>
                        {/* BARRA DE PROGRESSÃO (ETAPAS) */}
                        <div className="w-full overflow-x-auto pb-8 mb-4 scrollbar-thin">
                            <div className="flex items-center justify-center min-w-max px-2">
                                {etapas.map((etapa, idx) => {
                                    const idxProxima = etapas.findIndex(
                                        (e) => e.id === proximaEtapa.id,
                                    );
                                    const isConcluida = idx < idxProxima;

                                    const linkIcone = isConcluida
                                        ? etapa.icone_verde?.link
                                        : etapa.icone_cinza?.link;

                                    const estiloCaixa = isConcluida
                                        ? "bg-[#FBFFF0] border-[#B4D64E] text-[#B4D64E]"
                                        : "bg-[#F5F5F5] border-[#D9D9D9] text-[#D9D9D9]";

                                    return (
                                        <React.Fragment key={etapa.id}>
                                            <div className="flex flex-col items-center gap-3 relative z-10 bg-white">
                                                <div
                                                    className={`w-[83px] h-[83px] rounded-[30px] border flex items-center justify-center transition-all ${estiloCaixa}`}
                                                    title={etapa.descricao}
                                                >
                                                    {linkIcone && (
                                                        <img
                                                            src={linkIcone}
                                                            className="w-9 h-9 object-contain"
                                                        />
                                                    )}
                                                </div>
                                                <span
                                                    className={`text-[16px] font-normal tracking-wide absolute -bottom-7 whitespace-nowrap ${isConcluida ? "text-[#B4D64E]" : "text-[#D9D9D9]"}`}
                                                >
                                                    {etapa.nome}
                                                </span>
                                            </div>

                                            {idx < etapas.length - 1 &&
                                                (() => {
                                                    const proxEtapaLista = etapas[idx + 1];
                                                    const estaConcluida = idx < idxProxima;
                                                    const proximaConcluida = idx + 1 < idxProxima;

                                                    let estiloLinha = {
                                                        backgroundColor: "#D9D9D9",
                                                    };

                                                    if (estaConcluida && proximaConcluida) {
                                                        estiloLinha = {
                                                            backgroundColor: "#B4D64E",
                                                        };
                                                    } else if (
                                                        etapa.id === etapaConcluida.id &&
                                                        proxEtapaLista.id === proximaEtapa.id
                                                    ) {
                                                        estiloLinha = {
                                                            backgroundImage:
                                                                "linear-gradient(90deg, #B4D64E 0%, #D9D9D9 100%)",
                                                        };
                                                    }

                                                    return (
                                                        <div
                                                            className="h-[2px] w-[60px] mx-1 transition-all z-0"
                                                            style={estiloLinha}
                                                        />
                                                    );
                                                })()}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SELETOR (INPUT DE BUSCA COM DROPDOWN) */}
                        <div className="mb-6 flex flex-col items-start">
                            <label className="block text-[16px] font-light text-[#7B7D80] mb-2">
                                Registrar custo do(a) {etapaConcluida.nome}
                            </label>

                            <div className="relative w-[45%] max-w-[320px]" ref={dropdownRef}>
                                <input
                                    type="text"
                                    value={buscaParceiro}
                                    onFocus={() => setDropdownAberto(true)}
                                    onChange={(e) => setBuscaParceiro(e.target.value)}
                                    placeholder="Colaborador"
                                    className="w-full h-[39px] rounded-[10px] border border-[#898C8F] bg-white px-4 text-[14px] outline-none placeholder:text-[#898C8F] text-[#404040] transition-all"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#898C8F]">
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>

                                {dropdownAberto && (
                                    <ul className="absolute left-0 right-0 top-[45px] z-50 max-h-[200px] overflow-y-auto rounded-[10px] border border-[#D9D9D9] bg-white shadow-lg">
                                        {parceirosFiltrados.length === 0 ? (
                                            <li className="px-4 py-3 text-[14px] text-[#898C8F] font-light">
                                                Nenhum colaborador disponível para esta categoria
                                            </li>
                                        ) : (
                                            parceirosFiltrados.map((parceiro) => (
                                                <li
                                                    key={parceiro.id}
                                                    onClick={() =>
                                                        adicionarParceiroNaTabela(parceiro)
                                                    }
                                                    className="px-4 py-2.5 text-[14px] text-[#404040] font-light hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                                                >
                                                    {parceiro.nome}
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* TABELA DE CUSTOS (VISUAL REFATORADO AO PADRÃO DA FICHA TECNICA) */}
                        <div className="mb-6 w-full">
                            <div
                                className={`grid ${linhasTabela.length > 1 ? "grid-cols-4" : "grid-cols-3"} items-center h-10 font-normal text-center text-[#4696AD]`}
                            >
                                <div className="bg-[#C9EAF6] px-4 py-2.5 border-r-[0.5px] rounded-tl-[10px] border-[#7B7D80] h-10">
                                    Colaborador
                                </div>
                                <div className="bg-[#C9EAF6] px-4 py-2.5 border-r-[0.5px] border-[#7B7D80] h-10">
                                    Operação
                                </div>
                                {linhasTabela.length > 1 && (
                                    <div className="bg-[#C9EAF6] px-4 py-2.5 border-r-[0.5px] border-[#7B7D80] h-10">
                                        Total de peças
                                    </div>
                                )}
                                <div className="bg-[#C9EAF6] rounded-tr-[10px] px-4 py-2.5 h-10">
                                    Custo Total
                                </div>
                            </div>

                            <div className="relative">
                                <div
                                    ref={tabelaScrollRef}
                                    className="max-h-[180px] overflow-y-auto overflow-x-hidden scrollbar-sutil"
                                    onScroll={(e) => setTabelaScrollTop(e.currentTarget.scrollTop)}
                                >
                                    {linhasTabela.length > 0 ? (
                                        linhasTabela.map((row, index) => {
                                            const isLastRow = index === linhasTabela.length - 1;
                                            return (
                                                <div
                                                    key={row.id}
                                                    className={`grid ${linhasTabela.length > 1 ? "grid-cols-4" : "grid-cols-3"} items-stretch min-h-[40px] h-[40px]`}
                                                    onMouseEnter={() =>
                                                        setHoveredParceiroIndex(index)
                                                    }
                                                    onMouseLeave={() =>
                                                        setHoveredParceiroIndex(null)
                                                    }
                                                >
                                                    <div
                                                        className={`min-w-0 flex items-center justify-center px-4 ${index % 2 === 1 ? "bg-[#F4F4F4]" : "bg-[#FFFFFF]"}`}
                                                        style={{
                                                            borderTopWidth: "0px",
                                                            borderLeftWidth: "0.5px",
                                                            borderRightWidth: "0.5px",
                                                            borderBottomWidth: "0.5px",
                                                            borderColor: "#D9D9D9",
                                                            borderBottomLeftRadius: isLastRow
                                                                ? "10px"
                                                                : "0px",
                                                            borderRightColor: "#7B7D80",
                                                        }}
                                                    >
                                                        <span className="text-[14px] font-light text-[#898C8F] truncate cursor-not-allowed select-none">
                                                            {row.nome}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={`min-w-0 flex items-center justify-center px-2 ${index % 2 === 1 ? "bg-[#F4F4F4]" : "bg-[#FFFFFF]"}`}
                                                        style={{
                                                            borderTopWidth: "0px",
                                                            borderLeftWidth: "0px",
                                                            borderRightWidth: "0.5px",
                                                            borderBottomWidth: "0.5px",
                                                            borderColor: "#D9D9D9",
                                                            borderRightColor: "#7B7D80",
                                                        }}
                                                    >
                                                        <input
                                                            value={row.operacao}
                                                            onChange={(e) =>
                                                                atualizarCampoLinha(
                                                                    row.id,
                                                                    "operacao",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="-"
                                                            className="w-full h-[32px] border-0 bg-transparent text-center text-[14px] outline-none focus:ring-0 text-[#898C8F] font-light"
                                                        />
                                                    </div>

                                                    {linhasTabela.length > 1 && (
                                                        <div
                                                            className={`min-w-0 flex items-center justify-center px-2 ${index % 2 === 1 ? "bg-[#F4F4F4]" : "bg-[#FFFFFF]"}`}
                                                            style={{
                                                                borderTopWidth: "0px",
                                                                borderLeftWidth: "0px",
                                                                borderRightWidth: "0.5px",
                                                                borderBottomWidth: "0.5px",
                                                                borderColor: "#D9D9D9",
                                                                borderRightColor: "#7B7D80",
                                                            }}
                                                        >
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={row.quantidade}
                                                                onChange={(e) => {
                                                                    const val = Math.max(
                                                                        0,
                                                                        parseInt(e.target.value) ||
                                                                            0,
                                                                    );
                                                                    atualizarCampoLinha(
                                                                        row.id,
                                                                        "quantidade",
                                                                        val,
                                                                    );
                                                                }}
                                                                placeholder="-"
                                                                className="w-full h-[32px] border-0 bg-transparent text-center text-[14px] outline-none focus:ring-0 text-[#898C8F] font-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
                                                            />
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`min-w-0 flex items-center justify-center px-2 ${index % 2 === 1 ? "bg-[#F4F4F4]" : "bg-[#FFFFFF]"} ${isLastRow ? "rounded-br-[10px]" : ""}`}
                                                        style={{
                                                            borderTopWidth: "0px",
                                                            borderLeftWidth: "0px",
                                                            borderRightWidth: "0.5px",
                                                            borderBottomWidth: "0.5px",
                                                            borderColor: "#D9D9D9",
                                                            borderBottomRightRadius: isLastRow
                                                                ? "10px"
                                                                : "0px",
                                                        }}
                                                    >
                                                        <input
                                                            type="text"
                                                            value={row.custoTotalFormatado}
                                                            onChange={(e) =>
                                                                atualizarCampoLinha(
                                                                    row.id,
                                                                    "custoTotalFormatado",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="R$ -"
                                                            className="w-full h-[32px] border-0 bg-transparent text-center text-[14px] outline-none focus:ring-0 text-[#898C8F] font-light"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div
                                            className="px-4 py-5 text-center text-[13px] text-[#888] bg-white rounded-b-[10px]"
                                            style={{
                                                borderLeft: "0.5px solid #D9D9D9",
                                                borderRight: "0.5px solid #D9D9D9",
                                                borderBottom: "0.5px solid #D9D9D9",
                                            }}
                                        >
                                            Nenhum custo lançado ainda.
                                        </div>
                                    )}
                                </div>

                                {/* Lixeira Interativa Suspensa (Fora da Tabela) */}
                                <div className="pointer-events-none absolute inset-y-0 right-0 w-0 overflow-visible">
                                    {linhasTabela.map((row, index) => {
                                        const isVisible = hoveredParceiroIndex === index;
                                        const top = index * 40 + 20 - tabelaScrollTop;
                                        return (
                                            <button
                                                key={`trash-${row.id}-${index}`}
                                                type="button"
                                                onClick={() => removerParceiroDaTabela(row.id)}
                                                onMouseEnter={() => setHoveredParceiroIndex(index)}
                                                onMouseLeave={() => setHoveredParceiroIndex(null)}
                                                className={`pointer-events-auto absolute z-20 rounded p-1 transition-opacity ${isVisible ? "opacity-100" : "opacity-0"}`}
                                                style={{
                                                    top,
                                                    right: "-28px",
                                                    transform: "translateY(-50%)",
                                                    width: "28px",
                                                    height: "28px",
                                                }}
                                                title="Remover parceiro"
                                            >
                                                <img
                                                    src="/excluir-cinza-claro.png"
                                                    alt="Remover parceiro"
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "contain",
                                                        display: "block",
                                                    }}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* MENSAGEM DE VALIDAÇÃO (SE QUANTIDADE NÃO BATER E > 1 COLABORADOR) */}
                        {!quantidadeValida && linhasTabela.length > 0 && (
                            <div className="mb-6 bg-amber-50 text-amber-800 p-4 rounded-[10px] text-[14px] font-light border border-amber-200">
                                <span className="font-medium">Atenção:</span> A soma das peças (
                                {somaQuantidades}) não corresponde ao total da Ficha (
                                {fichaTecnica.quantidade}).
                            </div>
                        )}

                        {/* FOOTER / AÇÕES FINAIS DO MODAL */}
                        <div className="flex justify-end pt-4">
                            <button
                                type="button"
                                onClick={handleTransferir}
                                disabled={submitting || !quantidadeValida}
                                className={`px-10 h-[39px] w-[200px] rounded-full font-normal transition-all text-[15px] ${
                                    !quantidadeValida
                                        ? "bg-[#F5F5F5] text-[#898C8F] cursor-not-allowed border border-[#D9D9D9]"
                                        : "bg-[#A9E2F2] text-[#4696AD] hover:bg-[#A2DCED] active:scale-95"
                                }`}
                            >
                                {submitting ? "Processando..." : "Transferir"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
