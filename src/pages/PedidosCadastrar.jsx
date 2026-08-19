import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TabelaFichaTecnica from "../components/pedidos/TabelaReferenciaFichaTecnica";
import {
    getClientes,
    getProdutosDoCliente,
    getProdutosPorFabrico,
} from "../services/clientesService";
import { getFabricoById } from "../services/fabricoService";
import FichaTecnicaModal from "../components/fichas-tecnicas/FichaTecnicaModal";

import { atualizarProduto, getProdutoById } from "../services/produtoService";
import { createFichaTecnica } from "../services/fichaTecnicaService";
import {
    syncFichaTecnicaCores,
    saveFichaTecnicaItens,
    updateParceiroProdutoPrice,
    createParceiroProduto,
} from "../services/fichaTecnicaItemService";
import { iniciarFichaEtapa } from "../services/fichasTecnicasService";
import { createFichaParceiro } from "../services/fichaParceiroService";
import { createPedido } from "../services/pedidoService";
import { getPedidosByFabricoId } from "../services/pedidoService";

import { getAllEtapasByFabricoId } from "../services/etapaService";
import { DropdownOptionsSkeleton, LoadingButton, SkeletonBox } from "../components/geral/Loading";

const sectionTitleClass = "text-[20px] font-light text-[#404040] mb-4 font-['Outfit',_sans-serif]";

function DropdownField({
    value,
    placeholder,
    options,
    isOpen,
    onToggle,
    onSelect,
    isSelectedOption,
    disabled = false,
    className = "",
    loading = false,
}) {
    const [termoBusca, setTermoBusca] = useState("");
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    const inputRef = useRef(null);
    const fieldDisabled = disabled || loading;

    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setTermoBusca(""); // Limpa a busca na mesma renderização em que o menu abre!
        }
    }

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const opcoesFiltradas = options.filter((option) =>
        option.label.toLowerCase().includes(termoBusca.toLowerCase()),
    );

    return (
        <div className={`relative ${isOpen ? "z-50" : "z-10"} ${className}`}>
            <div
                onClick={() => {
                    if (fieldDisabled) return;
                    if (!isOpen) onToggle();
                    inputRef.current?.focus();
                }}
                className={`w-full h-[39px] border border-[#898C8F] rounded-[10px] px-3 text-sm bg-white flex items-center justify-between transition-opacity ${
                    fieldDisabled ? "opacity-60 cursor-not-allowed" : "cursor-text"
                }`}
            >
                {loading ? (
                    <SkeletonBox className="h-[14px] w-36 rounded-[7px]" />
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        disabled={fieldDisabled}
                        value={isOpen ? termoBusca : value || ""}
                        onChange={(e) => {
                            setTermoBusca(e.target.value);
                            if (!isOpen) onToggle();
                        }}
                        placeholder={isOpen && value ? value : placeholder}
                        className="w-full bg-transparent outline-none text-[#707070] placeholder:text-[#898C8F] truncate disabled:cursor-not-allowed"
                    />
                )}

                <button
                    type="button"
                    disabled={fieldDisabled}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!fieldDisabled) onToggle();
                    }}
                    className="ml-2 py-2 shrink-0 outline-none"
                >
                    <svg
                        className={`w-4 h-4 text-[#898C8F] transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>
            </div>

            {isOpen && !fieldDisabled && (
                <>
                    <button
                        type="button"
                        aria-label="Fechar dropdown"
                        onClick={onToggle}
                        className="fixed inset-0 z-10 cursor-default outline-none"
                    />

                    <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-20 overflow-hidden rounded-[14px] border border-[#898C8F] bg-white max-h-[240px] overflow-y-auto scrollbar-sutil py-1">
                        {loading ? (
                            <DropdownOptionsSkeleton />
                        ) : opcoesFiltradas.length === 0 ? (
                            <p className="px-3 py-3 text-sm text-[#898C8F] font-light">
                                Nenhuma opção encontrada
                            </p>
                        ) : (
                            opcoesFiltradas.map((option) => {
                                const selected = isSelectedOption(option);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => onSelect(option)}
                                        className={`relative overflow-hidden flex w-full items-center pl-[12px] pr-3 py-3 border-l-[3px] text-left text-[16px] transition-colors ${
                                            selected
                                                ? "border-[#C4F042] text-[#707070] bg-white"
                                                : "border-transparent text-[#707070] bg-white hover:bg-[#FAFAFA]"
                                        }`}
                                    >
                                        <span className="truncate">{option.label}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

const primeiroNumeroValido = (...valores) => {
    for (const valor of valores) {
        if (valor === null || valor === undefined) continue;
        const texto = String(valor).trim();
        if (!texto) continue;
        const numero = Number(texto);
        if (Number.isFinite(numero)) return numero;
    }
    return undefined;
};

const getProdutoId = (item) =>
    item?.produto?.id ?? item?.produto_id ?? item?.id_produto ?? item?.id;

const getReferenciaInterna = (item) =>
    item?.produto?.nome ?? item?.produto?.referencia ?? item?.nome ?? "-";

export default function PedidosCadastrar() {
    const navigate = useNavigate();
    const usuarioLogado = JSON.parse(localStorage.getItem("user") || "{}");
    const fabricoId = primeiroNumeroValido(
        usuarioLogado?.fabrico_id,
        usuarioLogado?.fabricoId,
        usuarioLogado?.fabrico?.id,
    );

    const [primeiraEtapaId, setPrimeiraEtapaId] = useState(null);

    const [openDropdown, setOpenDropdown] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [referenciasDisponiveis, setReferenciasDisponiveis] = useState([]);
    const [carregandoClientes, setCarregandoClientes] = useState(true);
    const [carregandoReferencias, setCarregandoReferencias] = useState(false);

    const [salvandoPedido, setSalvandoPedido] = useState(false);

    const [isSobDemanda, setIsSobDemanda] = useState(true);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [referenciaSelecionada, setReferenciaSelecionada] = useState(null);
    const [dataPrevista, setDataPrevista] = useState("");

    const [modalFichaAberto, setModalFichaAberto] = useState(false);
    const [referenciaParaModal, setReferenciaParaModal] = useState(null);

    const [fichas, setFichas] = useState([]);
    const [erro, setErro] = useState("");
    const [numeroPedido, setNumeroPedido] = useState("...");

    useEffect(() => {
        if (!fabricoId) return;

        let ignorar = false;

        const carregarNumeroDoPedido = async () => {
            try {
                const resposta = await getPedidosByFabricoId(fabricoId);

                if (ignorar) return;

                // Garante que extraímos o Array corretamente, mesmo se a API retornar dentro de .data
                const pedidos_do_fabrico = Array.isArray(resposta)
                    ? resposta
                    : resposta?.data || resposta?.pedidos || [];

                // Próximo número = maior número do fabrico + 1 (ou 1 se não houver pedidos)
                // Ignora null/undefined (Number(null) === 0 e poluiria o max)
                const numeros = pedidos_do_fabrico
                    .map((p) => p.numero)
                    .filter((n) => n != null && n !== "")
                    .map((n) => Number(n))
                    .filter((n) => Number.isFinite(n));
                const proximoNumero = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;

                setNumeroPedido(String(proximoNumero));
            } catch (error) {
                console.error("Erro ao gerar o número do pedido:", error);
                if (!ignorar) setNumeroPedido("-");
            }
        };

        carregarNumeroDoPedido();

        return () => {
            ignorar = true;
        };
    }, [fabricoId]);

    useEffect(() => {
        if (!fabricoId) return;

        let ignorar = false;

        const carregarEtapas = async () => {
            try {
                const etapas = await getAllEtapasByFabricoId(fabricoId);

                if (ignorar) return;

                if (etapas && etapas.length > 0) {
                    const etapaInicial = etapas
                        .sort((a, b) => a.ordem - b.ordem)
                        .find((etapa) => etapa.ativa === true);

                    if (etapaInicial) {
                        setPrimeiraEtapaId(etapaInicial.id);
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar as etapas do fabrico:", error);
            }
        };

        carregarEtapas();

        return () => {
            ignorar = true;
        };
    }, [fabricoId]);

    useEffect(() => {
        if (!fabricoId) {
            setCarregandoClientes(false);
            return;
        }
        let ignorar = false;
        const carregarDados = async () => {
            setCarregandoClientes(true);
            try {
                const fabricoInfo = await getFabricoById(fabricoId);
                if (ignorar) return;

                const produzSobDemanda = fabricoInfo?.fabricacao_sob_demanda === true;
                setIsSobDemanda(produzSobDemanda);

                if (!produzSobDemanda) {
                    setClientes([]);
                    return;
                }

                try {
                    const listaClientes = await getClientes(fabricoId);
                    if (ignorar) return;

                    setClientes(listaClientes || []);
                } catch (error) {
                    console.error("Erro ao carregar clientes:", error);
                    if (!ignorar) {
                        setClientes([]);
                        setErro("Não foi possível carregar clientes.");
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar configuração do fabrico:", error);
                if (!ignorar) {
                    setIsSobDemanda(false);
                    setClientes([]);
                    setErro("Não foi possível carregar configurações do fabrico.");
                }
            } finally {
                if (!ignorar) setCarregandoClientes(false);
            }
        };
        carregarDados();
        return () => {
            ignorar = true;
        };
    }, [fabricoId]);

    useEffect(() => {
        if (isSobDemanda && !clienteSelecionado?.id) {
            setReferenciasDisponiveis([]);
            setReferenciaSelecionada(null);
            return;
        }
        if (!fabricoId) return;

        let ignorar = false;
        const carregarReferencias = async () => {
            setCarregandoReferencias(true);
            try {
                let listaProdutosCliente = [];
                const promessas = [getProdutosPorFabrico(fabricoId)];
                if (isSobDemanda && clienteSelecionado?.id) {
                    promessas.push(getProdutosDoCliente(clienteSelecionado.id));
                }
                const resultados = await Promise.all(promessas);
                const todosProdutos = resultados[0];
                if (resultados[1]) listaProdutosCliente = resultados[1];
                if (ignorar) return;

                const mapaAssociados = new Map(
                    (listaProdutosCliente || []).map((item) => [String(getProdutoId(item)), item]),
                );
                const idsJaAdicionados = new Set(fichas.map((f) => String(f.produtoId)));

                const referenciasOrdenadas = (todosProdutos || [])
                    .filter((produto) => !idsJaAdicionados.has(String(produto.id)))
                    .map((produto) => {
                        const associado = mapaAssociados.get(String(produto.id));
                        if (associado) return { ...associado, produto, associadoAoCliente: true };
                        return { produto, produto_id: produto.id, associadoAoCliente: false };
                    })
                    .sort((a, b) => {
                        if (a.associadoAoCliente !== b.associadoAoCliente)
                            return a.associadoAoCliente ? -1 : 1;
                        return getReferenciaInterna(a).localeCompare(
                            getReferenciaInterna(b),
                            "pt-BR",
                            { sensitivity: "base" },
                        );
                    });
                setReferenciasDisponiveis(referenciasOrdenadas);
            } catch (error) {
                if (!ignorar) setErro("Não foi possível carregar as referências.");
                console.error("Erro ao carregar referências:", error);
            } finally {
                if (!ignorar) setCarregandoReferencias(false);
            }
        };
        carregarReferencias();
        return () => {
            ignorar = true;
        };
    }, [clienteSelecionado, fabricoId, fichas, isSobDemanda]);

    const opcoesClientes = clientes.map((cliente) => ({
        value: String(cliente.id),
        label: cliente.nome,
        raw: cliente,
    }));

    const opcoesReferencias = referenciasDisponiveis.map((item) => ({
        value: String(getProdutoId(item)),
        label: getReferenciaInterna(item),
        raw: item,
    }));

    const toggleDropdown = (nome) => setOpenDropdown((atual) => (atual === nome ? null : nome));

    const handleSelecionarCliente = (opcao) => {
        setClienteSelecionado(opcao.raw);
        setReferenciaSelecionada(null);
        setOpenDropdown(null);
        setErro("");
    };

    const handleSelecionarReferencia = async (opcao) => {
        if (isSobDemanda && !clienteSelecionado) {
            setErro("Selecione um cliente antes de adicionar a referência.");
            return;
        }

        let referenciaCliente = "";

        if (isSobDemanda && clienteSelecionado?.id) {
            try {
                const produtosDoCliente = await getProdutosDoCliente(clienteSelecionado.id);

                const produtoClienteSelecionado = (produtosDoCliente || []).find(
                    (item) => String(getProdutoId(item)) === String(opcao.value),
                );

                referenciaCliente = produtoClienteSelecionado?.nome_para_cliente || "";
            } catch (error) {
                console.error("Erro ao buscar produto do cliente:", error);
            }
        }

        setReferenciaParaModal({
            ...opcao.raw?.produto,
            clienteNome: clienteSelecionado?.nome,
            referenciaCliente,
            id: getProdutoId(opcao.raw),
        });

        setModalFichaAberto(true);
        setReferenciaSelecionada(null);
        setOpenDropdown(null);
        setErro("");
    };

    // Função de máscara de data dd/MM/yyyy em tempo real
    const handleDataPrevistaChange = (e) => {
        let v = e.target.value.replace(/\D/g, ""); // Remove caracteres não numéricos
        if (v.length > 8) v = v.slice(0, 8); // Trava em 8 dígitos

        if (v.length > 4) {
            v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        } else if (v.length > 2) {
            v = `${v.slice(0, 2)}/${v.slice(2)}`;
        }
        setDataPrevista(v);
    };

    const fecharModalFicha = () => {
        setModalFichaAberto(false);
        setReferenciaParaModal(null);
    };

    const handleRemoverFicha = (id) => {
        setFichas((prev) => prev.filter((f) => f.id !== id));
    };

    const handleConcluirPedido = async () => {
        if (isSobDemanda && !clienteSelecionado) {
            setErro("Selecione um cliente para prosseguir.");
            return;
        }

        if (fichas.length === 0) {
            setErro("Adicione pelo menos uma ficha técnica ao pedido.");
            return;
        }

        if (dataPrevista && dataPrevista.length < 10) {
            setErro("Por favor, insira uma data de previsão completa (dd/mm/aaaa).");
            return;
        }

        setSalvandoPedido(true);
        setErro(null);

        try {
            // === 2. LÓGICA DA QUANTIDADE DO PEDIDO ===
            const quantidadeTotalPedido = fichas.reduce(
                (acc, ficha) => acc + (Number(ficha.quantidade) || 0),
                0,
            );

            const getFichaProdutoId = (ficha) =>
                String(ficha.produtoId || ficha.produto_id || "");

            let valorTotalPedido = 0;

            if (isSobDemanda && clienteSelecionado?.id) {
                const produtosDoCliente = await getProdutosDoCliente(clienteSelecionado.id);
                const mapaPrecos = new Map(
                    (produtosDoCliente || []).map((item) => [
                        String(getProdutoId(item)),
                        Number(item.preco_padrao) || 0,
                    ]),
                );

                valorTotalPedido = fichas.reduce((acc, ficha) => {
                    const quantidade = Number(ficha.quantidade) || 0;
                    const preco = mapaPrecos.get(getFichaProdutoId(ficha)) || 0;
                    return acc + quantidade * preco;
                }, 0);
            } else {
                const idsUnicos = [
                    ...new Set(fichas.map(getFichaProdutoId).filter(Boolean)),
                ];
                const produtos = await Promise.all(
                    idsUnicos.map((id) => getProdutoById(id)),
                );
                const mapaCustos = new Map(
                    (produtos || []).map((produto) => [
                        String(produto?.id),
                        Number(produto?.custo_total) || 0,
                    ]),
                );

                valorTotalPedido = fichas.reduce((acc, ficha) => {
                    const quantidade = Number(ficha.quantidade) || 0;
                    const custo = mapaCustos.get(getFichaProdutoId(ficha)) || 0;
                    return acc + quantidade * custo;
                }, 0);
            }

            // === AJUSTE DA DATA PARA O BACKEND (ISO-8601) ===
            let dataFormatadaBackend = undefined;
            if (dataPrevista && dataPrevista.length === 10) {
                const [dia, mes, ano] = dataPrevista.split("/");
                // Converte dd/MM/yyyy para ISO UTC meio-dia (evita bugs de fuso horário no banco de dados)
                dataFormatadaBackend = new Date(`${ano}-${mes}-${dia}T12:00:00.000Z`).toISOString();
            }

            const novoPedido = await createPedido({
                cliente_id: clienteSelecionado?.id || null,
                finalizado: false,
                data_prevista: dataFormatadaBackend,
                observacoes: null,
                quantidade: quantidadeTotalPedido,
                valor_total: Number(valorTotalPedido.toFixed(2)),
                usarCorPaleta: fichas.length > 1,
            });

            // === 4. ASSEGURAR ID DA ETAPA ATUAL ===
            let etapaIdFallback = primeiraEtapaId;
            if (!etapaIdFallback && fabricoId) {
                try {
                    const etapas = await getAllEtapasByFabricoId(fabricoId);
                    if (etapas && etapas.length > 0) {
                        const etapasOrdenadas = [...etapas].sort(
                            (a, b) => (a.ordem || 0) - (b.ordem || 0),
                        );
                        etapaIdFallback = etapasOrdenadas[0].id;
                    }
                } catch (e) {
                    console.error("Erro ao carregar etapas de segurança:", e);
                }
            }

            // === 5. CRIAR AS FICHAS TÉCNICAS E RELAÇÕES ===
            for (const ficha of fichas) {
                const pId = ficha.produtoId || ficha.produto_id;
                if (
                    ficha.gradeVersaoIdNova &&
                    ficha.gradeVersaoIdNova !== ficha.gradeVersaoIdOriginal &&
                    pId
                ) {
                    await atualizarProduto(pId, {
                        grade_versao_id: ficha.gradeVersaoIdNova,
                    });
                }

                const novaFicha = await createFichaTecnica({
                    pedido_id: novoPedido.id,
                    produto_id: pId,
                    grade_versao_id: ficha.gradeVersaoIdNova || ficha.gradeVersaoIdOriginal,
                    etapa_atual_id: ficha.etapa_atual_id || etapaIdFallback,
                    quantidade: Number(ficha.quantidade) || 0,
                    concluida: false,
                    fabrico_id: fabricoId,
                });

                if (ficha.selectedColorIds?.length > 0) {
                    await syncFichaTecnicaCores(novaFicha.id, ficha.selectedColorIds);
                }

                if (ficha.itensPayload?.length > 0) {
                    const itensParaSalvar = ficha.itensPayload.map((item) => ({
                        ficha_tecnica_id: novaFicha.id,
                        cor_id: item.cor_id,
                        grade_versao_item_id: item.grade_versao_item_id,
                        quantidade: item.quantidade,
                    }));

                    await saveFichaTecnicaItens(novaFicha.id, itensParaSalvar);
                }

                const etapaIdAtual = ficha.etapa_atual_id || etapaIdFallback;
                if (etapaIdAtual) {
                    try {
                        await iniciarFichaEtapa(novaFicha.id, etapaIdAtual);
                    } catch (err) {
                        if (err?.response?.status !== 409) {
                            console.error("Erro ao registrar ficha_etapa:", err);
                        }
                    }
                }

                // Sincronizar Parceiros atribuídos
                if (ficha.parceiroRows?.length > 0) {
                    const totalParceiros = ficha.parceiroRows.length;

                    for (const parceiro of ficha.parceiroRows) {
                        let precoFormatado = 0;

                        if (parceiro.preco) {
                            precoFormatado =
                                typeof parceiro.preco === "string"
                                    ? parseFloat(
                                          parceiro.preco
                                              .replace(",", ".")
                                              .replace("R$ ", "")
                                              .trim(),
                                      ) || 0
                                    : Number(parceiro.preco);
                        }

                        const parceiroIdFinal = parceiro.parceiroId || parceiro.id;
                        const produtoIdFinal = pId;

                        try {
                            if (parceiro.isNew === false) {
                                await updateParceiroProdutoPrice(
                                    parceiroIdFinal,
                                    produtoIdFinal,
                                    precoFormatado,
                                );
                            } else {
                                await createParceiroProduto(
                                    parceiroIdFinal,
                                    produtoIdFinal,
                                    precoFormatado,
                                );
                            }
                        } catch (err) {
                            console.error(
                                `Erro ao processar parceiro ${parceiro.parceiroId || parceiro.id}:`,
                                err,
                            );
                        }
                        try {
                            let valorFinal = undefined;
                            let quantidadeFinal = undefined;

                            if (totalParceiros === 1) {
                                quantidadeFinal = Number(ficha.quantidade);
                                const calculo = quantidadeFinal * precoFormatado;
                                valorFinal = Number(calculo.toFixed(2));
                            }

                            await createFichaParceiro(
                                novaFicha.id,
                                parceiroIdFinal,
                                parceiro.operacao || null,
                                valorFinal,
                                quantidadeFinal,
                            );
                        } catch (err) {
                            console.error(
                                `Erro ao criar Ficha-Parceiro para o id ${parceiroIdFinal}`,
                                err,
                            );
                        }
                        try {
                            let valorFinal = undefined;
                            let quantidadeFinal = undefined;

                            if (totalParceiros === 1) {
                                quantidadeFinal = Number(ficha.quantidade);
                                const calculo = quantidadeFinal * precoFormatado;
                                valorFinal = Number(calculo.toFixed(2));
                            }

                            await createFichaParceiro(
                                novaFicha.id,
                                parceiroIdFinal,
                                parceiro.operacao || null,
                                valorFinal,
                                quantidadeFinal,
                            );
                        } catch (err) {
                            console.error(
                                `Erro ao criar Ficha-Parceiro para o id ${parceiroIdFinal}`,
                                err,
                            );
                        }
                    }
                }
            }

            navigate("/pedidos");
        } catch (error) {
            console.error(error);
            setErro("Falha ao salvar pedido. Verifique os dados e tente novamente.");
        } finally {
            setSalvandoPedido(false);
        }
    };

    return (
        <>
            <style>{`
                ::-webkit-scrollbar {
                    width: 6px; 
                    height: 6px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent; 
                }
                ::-webkit-scrollbar-thumb {
                    background-color: #d6d6d6;
                    border-radius: 999px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background-color: #bcbcbc; 
                }
                .scrollbar-sutil::-webkit-scrollbar { 
                    width: 4px; 
                    height: 4px; 
                } 
                .scrollbar-sutil::-webkit-scrollbar-thumb { 
                    background-color: #d6d6d6; 
                    border-radius: 999px; 
                }
                .scrollbar-sutil::-webkit-scrollbar-track {
                    margin-top: 8px;
                    margin-bottom: 8px;
                }
            `}</style>

            <div className="p-6 pt-0 mt-6 w-full relative z-0 font-['Outfit',_sans-serif]">
                <div className="bg-white p-10 rounded-[24px] shadow-sm w-full mx-auto">
                    {/* 1. CABEÇALHO: Título da tela e número do pedido */}
                    <div className="mb-6">
                        <div className="flex items-start gap-3">
                            <img
                                src="/pedidos-desativado.png"
                                alt=""
                                className="h-8 w-8 shrink-0 object-contain brightness-0 opacity-[0.85]"
                            />

                            <div className="flex flex-col gap-0 items-start">
                                <h1 className="text-[28px] sm:text-[30px] font-light text-[#404040] tracking-tight leading-none">
                                    {isSobDemanda ? "Novo Pedido" : "Nova Produção"}
                                </h1>

                                <p className="text-[18px] font-light text-[#898C8F] mt-0.5 leading-none">
                                    Nº {numeroPedido}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. SEÇÃO DE INCLUSÃO: Alinhamento horizontal com Dropdowns à esquerda e Previsão na extrema direita */}
                    {/* 2. SEÇÃO DE INCLUSÃO */}
                    <section className="mb-4">
                        <div className="flex flex-wrap gap-4 justify-between items-start">
                            {/* BLOCO ESQUERDO: Título e Dropdowns de Ficha Técnica */}
                            <div className="flex flex-col">
                                <h2 className={sectionTitleClass}>Adicionar ficha técnica</h2>
                                <div className="flex flex-wrap gap-4">
                                    {/* Dropdown de Cliente */}
                                    {isSobDemanda && (
                                        <div className="w-full max-w-[320px]">
                                            <DropdownField
                                                value={clienteSelecionado?.nome || ""}
                                                placeholder="Selecionar cliente"
                                                options={opcoesClientes}
                                                isOpen={openDropdown === "cliente"}
                                                onToggle={() => toggleDropdown("cliente")}
                                                onSelect={handleSelecionarCliente}
                                                isSelectedOption={(option) =>
                                                    String(clienteSelecionado?.id) === option.value
                                                }
                                                disabled={carregandoClientes || salvandoPedido}
                                                loading={carregandoClientes}
                                            />
                                        </div>
                                    )}

                                    {/* Dropdown de Referência */}
                                    <div className="w-full max-w-[320px]">
                                        <DropdownField
                                            value={referenciaSelecionada?.label || ""}
                                            placeholder={
                                                isSobDemanda && !clienteSelecionado
                                                    ? "Adicionar referência*"
                                                    : "Adicionar referência*"
                                            }
                                            options={opcoesReferencias}
                                            isOpen={openDropdown === "referencia"}
                                            onToggle={() => toggleDropdown("referencia")}
                                            onSelect={handleSelecionarReferencia}
                                            isSelectedOption={(option) =>
                                                referenciaSelecionada?.value === option.value
                                            }
                                            disabled={
                                                (isSobDemanda && !clienteSelecionado) ||
                                                carregandoReferencias ||
                                                salvandoPedido
                                            }
                                            loading={carregandoReferencias}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* BLOCO DIREITO: Título e Input de Previsão de Entrega */}
                            <div className="flex flex-col w-fit max-w-full">
                                <h2 className={sectionTitleClass}>Previsão de entrega</h2>
                                <input
                                    type="text"
                                    disabled={salvandoPedido}
                                    value={dataPrevista}
                                    onChange={handleDataPrevistaChange}
                                    placeholder="Data"
                                    className={`w-full h-[39px] border border-[#898C8F] rounded-[10px] px-3 bg-white outline-none text-[#707070] placeholder:text-[#898C8F]/60 text-sm font-['Outfit',_sans-serif] transition-opacity ${
                                        salvandoPedido ? "opacity-60 cursor-not-allowed" : ""
                                    }`}
                                />
                            </div>
                        </div>
                    </section>
                    {/* 3. TABELA DE RASCUNHOS */}
                    <div className="mb-10">
                        <TabelaFichaTecnica
                            fichas={fichas}
                            isSobDemanda={isSobDemanda}
                            onRemoverFicha={handleRemoverFicha}
                        />
                    </div>

                    {/* 4. RODAPÉ / AÇÕES DO PEDIDO */}
                    <div className="flex flex-wrap justify-end gap-4 pt-2">
                        <button
                            type="button"
                            disabled={salvandoPedido}
                            onClick={() => navigate("/pedidos")}
                            className="bg-[#D75757] hover:bg-[#c94a4a] text-white h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px] disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <LoadingButton
                            type="button"
                            loading={salvandoPedido}
                            loadingText="Salvando..."
                            onClick={handleConcluirPedido}
                            className="bg-[#A9E2F2] hover:bg-[#A2DCED] text-[#4696AD] h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px] disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSobDemanda ? "Concluir pedido" : "Concluir ordem"}
                        </LoadingButton>
                    </div>

                    {/* 5. MENSAGEM DE ERRO GERAL */}
                    {erro ? <p className="pt-4 text-sm text-[#D75757] text-right">{erro}</p> : null}
                </div>
            </div>

            <FichaTecnicaModal
                isOpen={modalFichaAberto}
                onClose={fecharModalFicha}
                produto={referenciaParaModal}
                fabricoId={fabricoId}
                onFichaCreated={(rascunhoFicha) => {
                    setFichas((prev) => [
                        ...prev,
                        {
                            ...rascunhoFicha,
                            foto: rascunhoFicha.foto || referenciaParaModal?.foto,
                            referenciaInterna:
                                rascunhoFicha.referenciaInterna ||
                                referenciaParaModal?.nome ||
                                referenciaParaModal?.referenciaInterna,
                            referenciaCliente:
                                rascunhoFicha.referenciaCliente ||
                                referenciaParaModal?.referenciaCliente,
                            cores: rascunhoFicha.cores || rascunhoFicha.selectedColors || [],
                            etapa_atual_id: primeiraEtapaId,
                        },
                    ]);
                }}
            />
        </>
    );
}
