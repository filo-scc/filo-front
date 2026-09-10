import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProdutoDetalhesHeader from "../components/produtos/ProdutoDetalhesHeader";
import ModeloModal from "../components/produtos/ModeloModal";
import {
    getVinculoParceiroProduto,
    criarParceiroProduto,
    atualizarParceiroProduto,
} from "../services/parceiroProdutoService.js";
import { CadastrarTecidoModal } from "../components/produtos/CadastrarTecidoModal";
import AviamentoModal from "../components/aviamentos/AviamentoModal";
import {
    criarProduto,
    getAviamentosByFabrico,
    getGradesByFabrico,
    getTecidosByFabrico,
    getTiposProdutoByFabrico,
    vincularProdutoAviamento,
} from "../services/produtoService.js";
import { upload } from "../services/utilsService";
import { DropdownOptionsSkeleton, LoadingButton, SkeletonBox } from "../components/geral/Loading";
import { getAllEtapasByFabricoId } from "../services/etapaService.js";
import {
    getParceirosByFabrico,
    getParceirosByFabricoECategoria,
} from "../services/parceiroService.js";

// Função adicionada para formatar as unidades de medida
function formatarUnidadeDeMedida(unidade) {
    if (!unidade) return "";
    const unidadesMapeadas = {
        METRO: "m",
        CENTIMETRO: "cm",
        GRAMA: "g",
        QUILOGRAMA: "kg",
        UNIDADE: "und",
        PAR: "par",
    };
    return unidadesMapeadas[unidade.toUpperCase()] || unidade.toLowerCase();
}

function FieldLabel({ children }) {
    return <label className="block text-[20px] font-light text-[#404040] mb-3">{children}</label>;
}

function CheckIcon() {
    return (
        <svg
            className="w-[15px] h-[15px] text-[#8B8B8B]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12l5 5L19 8" />
        </svg>
    );
}

function DropdownField({
    value,
    placeholder,
    options,
    isOpen,
    onToggle,
    onSelect,
    isSelectedOption,
    showOptionIndicator = false,
    actionButton,
    actionButtonPosition = "end",
    maxVisibleOptions,
    className = "",
    loading = false,
}) {
    const shouldScrollOptions =
        Number.isFinite(maxVisibleOptions) && options.length > maxVisibleOptions;

    const actionButtonElement = actionButton ? (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                actionButton.onClick();
            }}
            className={`relative overflow-hidden flex w-full items-center pl-[12px] pr-3 py-3 border-l-[3px] text-left text-[16px] transition-colors border-transparent text-[#7B7D80] bg-white hover:bg-[#FAFAFA] ${
                actionButtonPosition === "start"
                    ? "first:rounded-t-[13px]"
                    : "last:rounded-b-[13px]"
            }`}
        >
            <span className="font-normal">{actionButton.label}</span>
            <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center text-[#898C8F] font-light text-[20px]">
                +
            </span>
        </button>
    ) : null;

    return (
        <div className={`relative ${isOpen ? "z-50" : "z-10"} ${className}`}>
            <button
                type="button"
                onClick={onToggle}
                disabled={loading}
                className="w-full h-[39px] border border-[#898C8F] rounded-[10px] px-3 text-[16px] focus:outline-none bg-white flex items-center justify-between disabled:cursor-not-allowed"
            >
                {loading ? (
                    <SkeletonBox className="h-[14px] w-32 rounded-[7px]" />
                ) : (
                    <span className={value ? "text-[#707070] font-normal" : "text-[#898C8F]"}>
                        {value || placeholder}
                    </span>
                )}
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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

            {isOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Fechar dropdown"
                        onClick={onToggle}
                        className="fixed inset-0 z-10 cursor-default"
                    />
                    <div
                        className={`absolute left-0 right-0 top-[calc(100%+2px)] z-20 rounded-[14px] border border-[#898C8F] bg-white ${
                            shouldScrollOptions
                                ? "max-h-[288px] overflow-y-auto overflow-x-hidden scrollbar-sutil"
                                : "overflow-hidden"
                        }`}
                    >
                        {actionButtonPosition === "start" && actionButtonElement}

                        {loading ? (
                            <DropdownOptionsSkeleton />
                        ) : (
                            options.map((option) => {
                                const selected = isSelectedOption(option);

                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => onSelect(option)}
                                        className={`relative overflow-hidden flex w-full items-center pl-[12px] pr-3 py-3 border-l-[3px] text-left text-[16px] transition-colors ${
                                            !actionButton || actionButtonPosition === "end"
                                                ? "first:rounded-t-[13px]"
                                                : ""
                                        } ${
                                            !actionButton || actionButtonPosition === "start"
                                                ? "last:rounded-b-[13px]"
                                                : ""
                                        } ${
                                            selected
                                                ? "border-[#C4F042] text-[#707070] bg-white"
                                                : "border-transparent text-[#707070] bg-white hover:bg-[#FAFAFA]"
                                        }`}
                                    >
                                        <span
                                            className={selected ? "font-normal text-[#707070]" : ""}
                                        >
                                            {option}
                                        </span>

                                        {showOptionIndicator && (
                                            <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center text-[#8B8B8B]">
                                                {selected ? <CheckIcon /> : "+"}
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}

                        {actionButtonPosition === "end" && actionButtonElement && !loading && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    actionButton.onClick();
                                }}
                                className="relative overflow-hidden flex w-full items-center pl-[12px] pr-3 py-3 border-l-[3px] text-left text-[16px] transition-colors border-transparent text-[#7B7D80] bg-white hover:bg-[#FAFAFA] first:rounded-t-[13px] last:rounded-b-[13px]"
                            >
                                <span className="font-normal">{actionButton.label}</span>
                                <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center text-[#898C8F] font-light text-[20px]">
                                    +
                                </span>
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function SelectedAviamentoTag({ label, onRemove }) {
    return (
        <button
            type="button"
            onClick={onRemove}
            className="h-[28px] pl-5 pr-2 rounded-full transition-colors bg-[#A9E2F2] text-[#404040] inline-flex items-center gap-2 whitespace-nowrap hover:bg-[#96d8ea]"
        >
            <span className="text-[12px] leading-none font-normal">{label}</span>
            <span className="w-[18px] h-[18px] rounded-full bg-[#4696AD] text-white flex items-center justify-center text-[16px] leading-none">
                ×
            </span>
        </button>
    );
}

export default function ProdutoCadastar() {
    const navigate = useNavigate();
    const inputFileRef = useRef(null);
    const userString = localStorage.getItem("user");
    const usuarioLogado = userString ? JSON.parse(userString) : null;
    const fabricoId = Number(usuarioLogado?.fabrico_id);
    const [produto, setProduto] = useState({
        custo_operacional: 0,
        outros_custos: 0,
    });

    const [arquivoImagem, setArquivoImagem] = useState(null);
    const [imagemPreview, setImagemPreview] = useState("");
    const [openDropdown, setOpenDropdown] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [carregandoGrades, setCarregandoGrades] = useState(false);
    const [carregandoModelos, setCarregandoModelos] = useState(false);
    const [erroCadastro, setErroCadastro] = useState("");
    const [gradesDisponiveis, setGradesDisponiveis] = useState([]);
    const [tecidosDisponiveis, setTecidosDisponiveis] = useState([]);
    const [aviamentosDisponiveis, setAviamentosDisponiveis] = useState([]);
    const [modelosDisponiveis, setModelosDisponiveis] = useState([]);
    const [modalModeloAberto, setModalModeloAberto] = useState(false);
    const [fabrico, setFabrico] = useState(null);
    const [isModalTecidoOpen, setIsModalTecidoOpen] = useState(false);
    const [modalAviamentoAberto, setModalAviamentoAberto] = useState(false);
    const [formData, setFormData] = useState({
        referencia: "",
        modelo: "",
        tipo_produto_id: undefined,
        tecido: "",
        tecido_id: undefined,
        quantidade_tecido: "",
        grade: "",
        grade_versao_id: undefined,
        aviamentos: [],
    });

    useEffect(() => {
        if (!Number.isFinite(fabricoId)) return;

        let ignorar = false;

        const carregarGrades = async () => {
            try {
                setCarregandoGrades(true);
                setCarregandoModelos(true);

                const [
                    resGrades,
                    resTecidos,
                    resAviamentos,
                    resTiposProduto,
                    resEtapasReal,
                    resParceiros,
                ] = await Promise.allSettled([
                    getGradesByFabrico(fabricoId),
                    getTecidosByFabrico(fabricoId),
                    getAviamentosByFabrico(fabricoId),
                    getTiposProdutoByFabrico(),
                    getAllEtapasByFabricoId(fabricoId),
                    getParceirosByFabrico(fabricoId),
                ]);

                if (ignorar) return;

                if (resGrades.status === "fulfilled") {
                    const dadosGrades = resGrades.value;
                    const gradesMapeadas = (dadosGrades || [])
                        .map((item) => {
                            const nome = item?.grade?.nome;
                            const versaoAtiva = item?.grade?.versoes?.find(
                                (versao) => versao?.ativo,
                            );
                            if (!nome) return null;
                            return { nome, grade_versao_id: versaoAtiva?.id };
                        })
                        .filter(Boolean);
                    setGradesDisponiveis(gradesMapeadas);
                } else {
                    console.error("Erro ao carregar grades:", resGrades.reason);
                    setGradesDisponiveis([]);
                }

                if (resTecidos.status === "fulfilled") {
                    const dadosTecidos = resTecidos.value;

                    const tecidosTratados = (dadosTecidos || []).map((t) => ({
                        id: t?.id || t?.tecido?.id,
                        nome: t?.nome || t?.tecido?.nome || "Sem nome na API",
                        custo_unitario: Number(t?.custo_unitario || t?.tecido?.custo_unitario || 0),
                        unidade_de_medida:
                            t?.unidade_de_medida || t?.tecido?.unidade_de_medida || "",
                    }));
                    setTecidosDisponiveis(tecidosTratados);
                } else {
                    console.error("Erro ao carregar tecidos:", resTecidos.reason);
                    setTecidosDisponiveis([]);
                }

                if (resAviamentos.status === "fulfilled") {
                    const dadosAviamentos = resAviamentos.value;
                    const aviamentosTratados = (dadosAviamentos || []).map((a) => ({
                        id: a.id,
                        nome: a.nome,
                        custo_unitario: Number(a.custo_unitario || 0),
                        unidade_de_medida: a.unidade_de_medida || "",
                    }));
                    setAviamentosDisponiveis(aviamentosTratados);
                } else {
                    console.error("Erro ao carregar aviamentos:", resAviamentos.reason);
                    setAviamentosDisponiveis([]);
                }

                if (resTiposProduto.status === "fulfilled") {
                    const modelosTratados = (resTiposProduto.value || [])
                        .map((tipo) => ({
                            id: tipo?.id,
                            nome: tipo?.nome || tipo?.tipo || tipo?.descricao,
                        }))
                        .filter((tipo) => tipo.id && tipo.nome);
                    setModelosDisponiveis(modelosTratados);
                } else {
                    console.error("Erro ao carregar tipos de produto:", resTiposProduto.reason);
                    setModelosDisponiveis([]);
                }

                // 2. Pegamos a lista de parceiros se a requisição foi um sucesso
                const parceirosDisponiveis =
                    resParceiros.status === "fulfilled" ? resParceiros.value || [] : [];
                if (resParceiros.status === "rejected") {
                    console.error("Erro ao carregar parceiros:", resParceiros.reason);
                }

                if (resEtapasReal.status === "fulfilled") {
                    const etapasComCusto = (resEtapasReal.value || []).map((etapa) => {
                        // Encontra o parceiro correspondente comparando o nome da etapa com a categoria (em minúsculo!)
                        const parceiroMapeado = parceirosDisponiveis.find((p) => {
                            const categoriaParceiro = (p?.categoria || "").trim().toLowerCase();
                            const nomeEtapa = (etapa?.nome || "").trim().toLowerCase();

                            return categoriaParceiro === nomeEtapa;
                        });

                        return {
                            ...etapa,
                            custo: etapa.custo || 0,
                            // Agora o ID do parceiro será injetado corretamente (1 para Modelagem, 2 para Corte)
                            parceiro_id: parceiroMapeado ? parceiroMapeado.id : null,
                        };
                    });

                    setFabrico({ etapas: etapasComCusto });
                } else {
                    console.error("Erro ao carregar etapas reais:", resEtapasReal.reason);
                    setFabrico(null);
                }
            } finally {
                if (!ignorar) {
                    setCarregandoGrades(false);
                    setCarregandoModelos(false);
                }
            }
        };

        carregarGrades();

        return () => {
            ignorar = true;
        };
    }, [fabricoId]);

    const handleChange = (field) => (event) => {
        setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleQuantidadeTecido = (event) => {
        const apenasNumeros = event.target.value.replace(/[^0-9.,]/g, "");
        setFormData((prev) => ({ ...prev, quantidade_tecido: apenasNumeros }));
    };

    const handleQuantidadeAviamento = (id, value) => {
        const apenasNumeros = value.replace(/[^0-9.,]/g, "");
        setFormData((prev) => ({
            ...prev,
            aviamentos: prev.aviamentos.map((a) =>
                a.id === id ? { ...a, quantidade: apenasNumeros } : a,
            ),
        }));
    };

    const handleToggleAviamento = (aviamentoObj) => {
        if (!aviamentoObj?.id) return;

        setFormData((prev) => {
            const jaSelecionado = prev.aviamentos.some((a) => a.id === aviamentoObj.id);
            return {
                ...prev,
                aviamentos: jaSelecionado
                    ? prev.aviamentos.filter((a) => a.id !== aviamentoObj.id)
                    : [...prev.aviamentos, { ...aviamentoObj, quantidade: "" }],
            };
        });
    };

    const toggleDropdown = (field) => {
        setOpenDropdown((prev) => (prev === field ? null : field));
    };

    const handleGradeSelect = (nomeGrade) => {
        const gradeSelecionada = gradesDisponiveis.find((grade) => grade.nome === nomeGrade);

        setFormData((prev) => ({
            ...prev,
            grade: nomeGrade,
            grade_versao_id: gradeSelecionada?.grade_versao_id,
        }));
        setOpenDropdown(null);
    };

    const handleTecidoSelect = (nomeTecido) => {
        const tecidoSelecionado = tecidosDisponiveis.find((t) => t.nome === nomeTecido);

        setFormData((prev) => ({
            ...prev,
            tecido: nomeTecido,
            tecido_id: tecidoSelecionado?.id,
        }));
        setOpenDropdown(null);
    };

    const handleModeloSelect = (nomeModelo) => {
        const modeloSelecionado = modelosDisponiveis.find((m) => m.nome === nomeModelo);

        setFormData((prev) => ({
            ...prev,
            modelo: nomeModelo,
            tipo_produto_id: modeloSelecionado?.id,
        }));
        setOpenDropdown(null);
    };

    const handleModeloCriado = (nomeModelo, tipoCriado) => {
        const novoModelo = {
            id: tipoCriado?.id,
            nome: tipoCriado?.nome || nomeModelo,
        };

        if (!novoModelo.id) return;

        setModelosDisponiveis((prev) => {
            if (prev.some((m) => m.id === novoModelo.id)) return prev;
            return [...prev, novoModelo];
        });
        setFormData((prev) => ({
            ...prev,
            modelo: novoModelo.nome,
            tipo_produto_id: novoModelo.id,
        }));
    };

    const handleAviamentoCriado = (aviamentoCriado) => {
        if (!aviamentoCriado?.id) return;

        const novoAviamento = {
            id: aviamentoCriado.id,
            nome: aviamentoCriado.nome,
        };

        setAviamentosDisponiveis((prev) => {
            if (prev.some((aviamento) => aviamento.id === aviamentoCriado.id)) return prev;
            return [...prev, novoAviamento];
        });

        setFormData((prev) => {
            if (prev.aviamentos.some((aviamento) => aviamento.id === novoAviamento.id)) return prev;
            return {
                ...prev,
                aviamentos: [...prev.aviamentos, novoAviamento],
            };
        });
    };

    const handleImagemChange = (event) => {
        const arquivo = event.target.files?.[0];
        if (!arquivo) return;

        setArquivoImagem(arquivo);
        setImagemPreview(URL.createObjectURL(arquivo));
        setErroCadastro("");
    };

    const tecidoSelecionado = tecidosDisponiveis.find((t) => t.id === formData.tecido_id);
    const qtdTecidoCalculo = Number(String(formData.quantidade_tecido).replace(",", ".") || 0);
    const custoTecidoCalculado = qtdTecidoCalculo * (tecidoSelecionado?.custo_unitario || 0);

    const custoAviamentosCalculado = formData.aviamentos.reduce((acc, av) => {
        const qtd = Number(String(av.quantidade).replace(",", ".") || 0);
        return acc + qtd * (av.custo_unitario || 0);
    }, 0);

    const valorTotalGasto = custoTecidoCalculado + custoAviamentosCalculado;

    // Função para atualizar a lista de tecidos após cadastrar um novo
    const recarregarTecidos = async () => {
        try {
            const dados = await getTecidosByFabrico(fabricoId);
            const tecidosTratados = (dados || []).map((t) => ({
                id: t?.id || t?.tecido?.id,
                nome: t?.nome || t?.tecido?.nome || "Sem nome na API",
                custo_unitario: Number(t?.custo_unitario || t?.tecido?.custo_unitario || 0),
                unidade_de_medida: t?.unidade_de_medida || t?.tecido?.unidade_de_medida || "",
            }));
            setTecidosDisponiveis(tecidosTratados);
        } catch (err) {
            console.error("Erro ao recarregar tecidos:", err);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setErroCadastro("");

        // VALIDAÇÕES DOS CAMPOS OBRIGATÓRIOS
        if (!formData.referencia.trim()) {
            setErroCadastro("Informe a referência interna do produto.");
            return;
        }

        if (!formData.modelo || !formData.tipo_produto_id) {
            setErroCadastro("Selecione o tipo de produto.");
            return;
        }

        if (!formData.grade || !formData.grade_versao_id) {
            setErroCadastro("Selecione a grade de tamanho do produto.");
            return;
        }

        if (!Number.isFinite(fabricoId)) {
            setErroCadastro("Não foi possível identificar a fábrica do usuário.");
            return;
        }

        try {
            setSalvando(true);
            let urlFoto = null;

            // Realiza o upload caso tenha uma imagem selecionada
            if (arquivoImagem) {
                const uploadData = new FormData();
                uploadData.append("file", arquivoImagem);

                const responseUpload = await upload(uploadData);

                if (responseUpload && responseUpload.url) {
                    urlFoto = responseUpload.url;
                }
            }

            const payloadProduto = {
                foto: urlFoto,
                nome: formData.referencia.trim(),
                tipo_produto_id: formData.tipo_produto_id,
                fabrico_id: fabricoId,
                tecido_id: formData.tecido_id || null,
                grade_versao_id: formData.grade_versao_id,
                quantidade_tecido: qtdTecidoCalculo || null,
                custo_tecido:
                    custoTecidoCalculado > 0 ? Number(custoTecidoCalculado.toFixed(2)) : null,
                custo_operacional: produto.custo_operacional
                    ? Number(produto.custo_operacional)
                    : 0,
                outros_custos: produto.outros_custos ? Number(produto.outros_custos) : 0,
                custo_total: Number(totalGeral.toFixed(2)),
            };

            const produtoCriado = await criarProduto(payloadProduto);
            const produtoId = produtoCriado.id;

            if (formData.aviamentos.length > 0 && produtoId) {
                for (const aviamento of formData.aviamentos) {
                    const qtd = Number(String(aviamento.quantidade).replace(",", ".") || 0);

                    await vincularProdutoAviamento({
                        produto_id: produtoId,
                        aviamento_id: aviamento.id,
                        quantidade: qtd,
                    });
                }
            }

            if (produtoId) {
                await salvarCustosNoBanco(produtoId, fabricoId);
            }

            navigate("/produtos");
        } catch (error) {
            console.error("Erro ao cadastrar produto:", error);
            setErroCadastro(
                error.response?.data?.message || "Erro ao cadastrar produto. Verifique os dados.",
            );
        } finally {
            setSalvando(false);
        }
    };

    const etapasAtivasOrdenadas =
        fabrico?.etapas
            ?.filter((etapa) => etapa?.ativa === true)
            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) || [];
    const colunasFlexiveis = etapasAtivasOrdenadas.slice(0, -1);

    const custoOperacional = produto?.custo_operacional || 0;
    const custoOutros = produto?.outros_custos || 0;

    const custoEtapasFlexiveis = colunasFlexiveis.reduce(
        (acc, etapa) => acc + (etapa.custo || 0),
        0,
    );

    const totalGeral = valorTotalGasto + custoOperacional + custoOutros + custoEtapasFlexiveis;

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(valor);
    };

    const extrairNumeroMoeda = (texto) => {
        const apenasNumeros = texto.replace(/\D/g, "");
        if (!apenasNumeros) return "";

        return (Number(apenasNumeros) / 100).toString();
    };

    // Atualiza os custos fixos do produto (Operacional e Outros)
    const handleProdutoCustoChange = (campo, valor) => {
        setProduto((prev) => ({
            ...prev,
            [campo]: parseFloat(valor) || 0,
        }));
    };

    const handleEtapaCustoChange = (etapaId, valor) => {
        setFabrico((prev) => {
            if (!prev) return null;

            // Mapeia o array original (com todas as etapas) e atualiza apenas a que tem o ID correspondente
            const novasEtapas = prev.etapas.map((etapa) => {
                if (etapa.id === etapaId) {
                    return {
                        ...etapa,
                        custo: parseFloat(valor) || 0,
                    };
                }
                return etapa;
            });

            return { ...prev, etapas: novasEtapas };
        });
    };

    // ProdutoCadastrar.jsx

    const salvarCustosNoBanco = async (produtoId, fabricoId) => {
        try {
            console.log("Conteúdo das colunas flexíveis antes do filtro:", colunasFlexiveis);

            const etapasParaSalvar = colunasFlexiveis.filter((etapa) => etapa.custo > 0);

            // Se o fabricoId não veio como parâmetro, tenta pegar do objeto produto ou do usuário logado
            const fabricoIdEfetivo = fabricoId || produto?.fabrico_id;

            if (!fabricoIdEfetivo) {
                console.error("Fabrico ID não encontrado ao tentar salvar os custos.");
                return;
            }

            for (const etapa of etapasParaSalvar) {
                const precoInformado = etapa.custo;
                const categoriaNome = etapa.nome;

                const parceirosDaEtapa = await getParceirosByFabricoECategoria(
                    fabricoIdEfetivo,
                    categoriaNome,
                );

                if (!parceirosDaEtapa || parceirosDaEtapa.length === 0) {
                    console.warn(
                        `Nenhum parceiro encontrado para a categoria '${categoriaNome}' no fabrico ${fabricoIdEfetivo}`,
                    );
                    continue;
                }

                for (const parceiro of parceirosDaEtapa) {
                    const parceiroId = parceiro.id;
                    const vinculoExistente = await getVinculoParceiroProduto(parceiroId, produtoId);

                    if (vinculoExistente) {
                        await atualizarParceiroProduto(parceiroId, produtoId, precoInformado);
                    } else {
                        await criarParceiroProduto(parceiroId, produtoId, precoInformado);
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao salvar custos de parceiros no banco:", error);
        }
    };

    return (
        <div className="w-full px-6 pt-0 mt-6">
            <div className="bg-white rounded-[24px] w-full min-h-[650px] px-8 py-7 lg:px-12 lg:py-8">
                <ProdutoDetalhesHeader
                    title="Cadastrar produto"
                    iconSrc="/adicionar-produtos-preto.png"
                    iconWrapperClassName="w-[32px] h-[32px] shrink-0 flex items-center justify-center"
                    iconClassName="w-[32px] h-[32px] object-contain"
                />

                {erroCadastro && (
                    <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
                        {erroCadastro}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-10 flex flex-col min-h-[520px]">
                    {/* Bloco Superior: Imagem e Detalhes */}
                    <div className="flex flex-col xl:flex-row gap-12 xl:gap-16">
                        <div className="w-full xl:w-[184px] shrink-0">
                            <FieldLabel>Imagem</FieldLabel>
                            <input
                                ref={inputFileRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImagemChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => inputFileRef.current?.click()}
                                className="w-[200px] h-[150px] rounded-[10px] border border-dashed border-[#898C8F] flex items-center justify-center overflow-hidden bg-white hover:bg-[#FAFAFA] transition-colors"
                            >
                                {imagemPreview ? (
                                    <img
                                        src={imagemPreview}
                                        alt="Preview do produto"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-[60px] font-extralight text-[#9B9B9B]">
                                        +
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="flex-1 max-w-[980px] pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)] gap-x-8 gap-y-6">
                                <div>
                                    <FieldLabel>Referência</FieldLabel>
                                    <div className="relative w-full group">
                                        <input
                                            type="text"
                                            value={formData.referencia}
                                            onChange={handleChange("referencia")}
                                            className="w-full h-[39px] border border-[#898C8F] rounded-[10px] px-3 text-[16px] focus:outline-none"
                                        />

                                        <label
                                            className={`
                                                absolute left-3 bg-white px-1
                                                text-[#898C8F] transition-all duration-200 pointer-events-none
                                                
                                                ${
                                                    formData.referencia
                                                        ? "top-0 -translate-y-1/2 text-[12px]"
                                                        : "top-1/2 -translate-y-1/2 text-[16px]"
                                                }
                                                
                                                group-focus-within:top-0
                                                group-focus-within:-translate-y-1/2
                                                group-focus-within:text-[12px]
                                            `}
                                        >
                                            Referência interna*
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <FieldLabel>Tipo de produto</FieldLabel>
                                    <DropdownField
                                        value={formData.modelo}
                                        placeholder={
                                            carregandoModelos
                                                ? "Carregando tipos de produto..."
                                                : "Tipo de produto*"
                                        }
                                        options={modelosDisponiveis.map((m) => m.nome)}
                                        isOpen={openDropdown === "modelo"}
                                        onToggle={() => toggleDropdown("modelo")}
                                        onSelect={handleModeloSelect}
                                        isSelectedOption={(option) => formData.modelo === option}
                                        maxVisibleOptions={6}
                                        actionButton={{
                                            label: "Novo tipo de produto",
                                            onClick: () => {
                                                setOpenDropdown(null);
                                                setModalModeloAberto(true);
                                            },
                                        }}
                                        actionButtonPosition="start"
                                    />
                                </div>
                            </div>

                            <div className="mt-7">
                                <FieldLabel>Detalhes do produto</FieldLabel>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)] gap-x-8 gap-y-5">
                                    <div>
                                        <DropdownField
                                            value=""
                                            placeholder="Aviamentos"
                                            options={aviamentosDisponiveis.map((a) => a.nome)}
                                            isOpen={openDropdown === "aviamentos"}
                                            onToggle={() => toggleDropdown("aviamentos")}
                                            onSelect={(nomeSelecionado) => {
                                                const aviamentoCompleto =
                                                    aviamentosDisponiveis.find(
                                                        (a) => a.nome === nomeSelecionado,
                                                    );
                                                handleToggleAviamento(aviamentoCompleto);
                                            }}
                                            isSelectedOption={(nome) =>
                                                formData.aviamentos.some((a) => a.nome === nome)
                                            }
                                            showOptionIndicator
                                            maxVisibleOptions={6}
                                            loading={carregandoGrades}
                                            actionButton={{
                                                label: "Novo aviamento",
                                                onClick: () => {
                                                    setOpenDropdown(null);
                                                    setModalAviamentoAberto(true);
                                                },
                                            }}
                                            actionButtonPosition="start"
                                        />
                                    </div>

                                    <div>
                                        <DropdownField
                                            value={formData.tecido}
                                            placeholder="Tecido"
                                            options={tecidosDisponiveis.map((t) => t.nome)}
                                            isOpen={openDropdown === "tecido"}
                                            onToggle={() => toggleDropdown("tecido")}
                                            onSelect={handleTecidoSelect}
                                            isSelectedOption={(option) =>
                                                formData.tecido === option
                                            }
                                            maxVisibleOptions={6}
                                            loading={carregandoGrades}
                                            actionButtonPosition="start"
                                            actionButton={{
                                                label: "Novo tecido",
                                                onClick: () => {
                                                    setOpenDropdown(null);
                                                    setIsModalTecidoOpen(true);
                                                },
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <DropdownField
                                            value={formData.grade}
                                            placeholder="Grade de tamanho*"
                                            options={gradesDisponiveis.map((grade) => grade.nome)}
                                            isOpen={openDropdown === "grade"}
                                            onToggle={() => toggleDropdown("grade")}
                                            onSelect={handleGradeSelect}
                                            isSelectedOption={(option) => formData.grade === option}
                                            loading={carregandoGrades}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap w-full gap-2 mt-3">
                                    {formData.aviamentos.map((item) => (
                                        <SelectedAviamentoTag
                                            key={item.id}
                                            label={item.nome}
                                            onRemove={() => handleToggleAviamento(item)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bloco Inferior: Tabela de Quantidade */}
                    <div className="mt-6 w-full">
                        <h3 className="text-[20px] font-light text-[#4696AD] mb-4">
                            Quantidade por aviamento
                        </h3>
                        <div className="w-full overflow-x-auto">
                            <table className="w-full table-fixed border-separate border-spacing-0">
                                <thead>
                                    <tr>
                                        <th className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] first:rounded-tl-[10px] last:rounded-tr-[10px] text-center border-none">
                                            Tecido
                                        </th>
                                        {formData.aviamentos.map((av) => (
                                            <th
                                                key={av.id}
                                                className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] text-center capitalize border-none"
                                            >
                                                {av.nome}
                                            </th>
                                        ))}
                                        <th className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] first:rounded-tl-[10px] last:rounded-tr-[10px] text-center border-none">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td
                                            onClick={(e) => {
                                                const input =
                                                    e.currentTarget.querySelector("input");
                                                if (input) input.focus();
                                            }}
                                            className="bg-[#FFFFFF] py-3 px-4 border-l-[0.5px] border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] first:rounded-bl-[10px] text-center cursor-text"
                                        >
                                            <div className="flex items-center justify-center gap-1 w-full bg-transparent">
                                                <input
                                                    type="text"
                                                    value={formData.quantidade_tecido}
                                                    onChange={handleQuantidadeTecido}
                                                    placeholder="-"
                                                    className="text-right bg-transparent focus:outline-none placeholder-[#404040] text-[16px] font-light text-[#404040]"
                                                    style={{
                                                        width: `${Math.max(1, String(formData.quantidade_tecido).length)}ch`,
                                                    }}
                                                />
                                                <span className="text-[16px] font-light text-[#404040]">
                                                    (
                                                    {formatarUnidadeDeMedida(
                                                        tecidoSelecionado?.unidade_de_medida,
                                                    ) || ""}
                                                    )
                                                </span>
                                            </div>
                                        </td>
                                        {formData.aviamentos.map((av) => (
                                            <td
                                                key={av.id}
                                                onClick={(e) => {
                                                    const input =
                                                        e.currentTarget.querySelector("input");
                                                    if (input) input.focus();
                                                }}
                                                className="bg-[#FFFFFF] py-3 px-4 border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] text-center cursor-text"
                                            >
                                                <div className="flex items-center justify-center gap-1 w-full bg-transparent">
                                                    <input
                                                        type="text"
                                                        value={av.quantidade}
                                                        onChange={(e) =>
                                                            handleQuantidadeAviamento(
                                                                av.id,
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="-"
                                                        className="text-right bg-transparent focus:outline-none placeholder-[#404040] text-[16px] font-light text-[#404040]"
                                                        style={{
                                                            width: `${Math.max(1, String(av.quantidade).length)}ch`,
                                                        }}
                                                    />
                                                    <span className="text-[16px] font-light text-[#404040]">
                                                        (
                                                        {formatarUnidadeDeMedida(
                                                            av.unidade_de_medida,
                                                        ) || ""}
                                                        )
                                                    </span>
                                                </div>
                                            </td>
                                        ))}
                                        <td className="bg-[#FFFFFF] py-3 px-4 border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] last:rounded-br-[10px] text-center text-[16px] font-light text-[#404040]">
                                            {new Intl.NumberFormat("pt-BR", {
                                                style: "currency",
                                                currency: "BRL",
                                            }).format(valorTotalGasto)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bloco Inferior: Tabela de Custo */}
                    <div className="mt-6 w-full">
                        <h3 className="text-[20px] font-light text-[#4696AD] mb-4">
                            Custo por peça
                        </h3>
                        <div className="w-full overflow-x-auto">
                            <table className="w-full table-fixed border-separate border-spacing-0">
                                <thead>
                                    <tr>
                                        <th className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] first:rounded-tl-[10px] text-center border-none">
                                            Aviamentos
                                        </th>

                                        {/* Colunas Flexíveis Dinâmicas */}
                                        {colunasFlexiveis.map((etapa, index) => (
                                            <th
                                                key={etapa.id || index}
                                                className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] text-center border-none"
                                            >
                                                <div
                                                    title={etapa.nome}
                                                    className="max-w-[150px] truncate mx-auto cursor-pointer"
                                                >
                                                    {etapa.nome}
                                                </div>
                                            </th>
                                        ))}

                                        <th className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] text-center border-none">
                                            Operacional
                                        </th>
                                        <th className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] text-center border-none">
                                            Outros
                                        </th>
                                        <th className="bg-[#D9D9D9] py-3 px-4 text-[#898C8F] font-light text-[16px] last:rounded-tr-[10px] text-center border-none">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {/* Total de materiais (tecido + aviamentos) */}
                                        <td className="bg-[#FFFFFF] py-3 px-4 border-l-[0.5px] border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] first:rounded-bl-[10px] text-center text-[16px] font-light text-[#404040]">
                                            {formatarMoeda(valorTotalGasto)}
                                        </td>

                                        {colunasFlexiveis.map((etapa, index) => (
                                            <td
                                                key={etapa.id || index}
                                                className="bg-[#FFFFFF] p-1 border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] text-center text-[16px] font-light text-[#404040]"
                                            >
                                                <input
                                                    type="text"
                                                    placeholder="R$ 0,00"
                                                    value={
                                                        etapa.custo
                                                            ? formatarMoeda(etapa.custo)
                                                            : ""
                                                    }
                                                    onChange={(e) => {
                                                        const valorNumerico = extrairNumeroMoeda(
                                                            e.target.value,
                                                        );
                                                        handleEtapaCustoChange(
                                                            etapa.id,
                                                            valorNumerico,
                                                        );
                                                    }}
                                                    className="w-full h-full py-2 px-3 text-center bg-transparent outline-none text-[#404040] placeholder:text-[#404040] rounded-[4px]"
                                                />
                                            </td>
                                        ))}

                                        {/* Valor Operacional (Preenchível) */}
                                        <td className="bg-[#FFFFFF] p-1 border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] text-center text-[16px] font-light text-[#404040]">
                                            <input
                                                type="text"
                                                placeholder="R$ 0,00"
                                                value={
                                                    produto.custo_operacional
                                                        ? formatarMoeda(produto.custo_operacional)
                                                        : ""
                                                }
                                                onChange={(e) => {
                                                    const valorNumerico = extrairNumeroMoeda(
                                                        e.target.value,
                                                    );
                                                    handleProdutoCustoChange(
                                                        "custo_operacional",
                                                        valorNumerico,
                                                    );
                                                }}
                                                className="w-full h-full py-2 px-3 text-center bg-transparent outline-none text-[#404040] placeholder:text-[#404040] rounded-[4px]"
                                            />
                                        </td>

                                        {/* Valor Outros (Preenchível) */}
                                        <td className="bg-[#FFFFFF] p-1 border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] text-center text-[16px] font-light text-[#404040]">
                                            <input
                                                type="text"
                                                placeholder="R$ 0,00"
                                                value={
                                                    produto.outros_custos
                                                        ? formatarMoeda(produto.outros_custos)
                                                        : ""
                                                }
                                                onChange={(e) => {
                                                    const valorNumerico = extrairNumeroMoeda(
                                                        e.target.value,
                                                    );
                                                    handleProdutoCustoChange(
                                                        "outros_custos",
                                                        valorNumerico,
                                                    );
                                                }}
                                                className="w-full h-full py-2 px-3 text-center bg-transparent outline-none text-[#404040] placeholder:text-[#404040] rounded-[4px]"
                                            />
                                        </td>

                                        {/* Valor Total Geral (Atualiza em tempo real) */}
                                        <td className="bg-[#FFFFFF] py-3 px-4 border-b-[0.5px] border-r-[0.5px] border-[#D9D9D9] last:rounded-br-[10px] text-center text-[16px] font-light text-[#404040]">
                                            {formatarMoeda(totalGeral)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-auto flex justify-end pt-16">
                        <LoadingButton
                            type="submit"
                            loading={salvando}
                            loadingText="Salvando..."
                            className="w-[189px] h-[39px] rounded-[18.9px] bg-[#A9E2F2] text-[#4696AD] text-sm font-medium transition-colors hover:bg-[#A2DCED] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Concluir cadastro
                        </LoadingButton>
                    </div>
                </form>
            </div>

            <CadastrarTecidoModal
                isOpen={isModalTecidoOpen}
                onClose={() => setIsModalTecidoOpen(false)}
                fabricoId={fabricoId}
                onSuccess={(novoTecido) => {
                    recarregarTecidos();

                    if (novoTecido) {
                        setFormData((prev) => ({
                            ...prev,
                            tecido: novoTecido.nome,
                            tecido_id: novoTecido.id,
                        }));
                    }
                }}
            />

            <ModeloModal
                isOpen={modalModeloAberto}
                onClose={() => setModalModeloAberto(false)}
                onSuccess={handleModeloCriado}
            />

            <AviamentoModal
                isOpen={modalAviamentoAberto}
                onClose={() => setModalAviamentoAberto(false)}
                onSuccess={handleAviamentoCriado}
                mode="create"
                fabricoId={fabricoId}
            />
        </div>
    );
}
