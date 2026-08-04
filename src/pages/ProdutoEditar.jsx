import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ProdutoDetalhesHeader from "../components/produtos/ProdutoDetalhesHeader";
import TabelaClientesDoProduto from "../components/produtos/TabelaClientesDoProduto";
import AviamentoModal from "../components/aviamentos/AviamentoModal";
import ModalAtencao from "../components/geral/ModalAtencao";
import ModalConfirmacao from "../components/geral/ModalConfirmacao";
import ModalExclusao from "../components/geral/ModalExclusao";
import {
    LoadingButton,
    ProductEditPageSkeleton,
    SelectionListSkeleton,
} from "../components/geral/Loading";
import {
    atualizarProduto,
    excluirProduto,
    desvincularProdutoAviamento,
    getAviamentosByFabrico,
    getAviamentosDoProduto,
    getClientesDoProduto,
    getGradesByFabrico,
    getProdutoById,
    getTecidosByFabrico,
    getTiposProdutoByFabrico,
    vincularProdutoAviamento,
} from "../services/produtoService";
import { getFabricoById } from "../services/fabricoService";
import {
    desvincularProdutoDoCliente,
    getClientes,
    vincularProdutoAoCliente,
} from "../services/clientesService";
import { upload } from "../services/utilsService";

function FieldLabel({ children, className = "" }) {
    return (
        <label
            className={`block text-[20px] font-Outfit font-light text-[#404040] mb-3 ${className}`}
        >
            {children}
        </label>
    );
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
}) {
    return (
        <div className={`relative ${isOpen ? "z-50" : "z-10"}`}>
            <button
                type="button"
                onClick={onToggle}
                className="w-full h-[35px] border border-[#D3D3D3] rounded-[10px] px-3 text-[13px] focus:outline-none bg-white flex items-center justify-between"
            >
                <span className={value ? "text-[#707070]" : "text-[#898C8F]"}>
                    {value || placeholder}
                </span>
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
                    <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-20 overflow-hidden rounded-[14px] border border-[#D3D3D3] bg-white shadow-sm">
                        {actionButton && (
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    actionButton.onClick();
                                }}
                                className="relative flex w-full items-center pl-[12px] pr-3 py-3 border-l-[3px] border-transparent text-left text-[15px] text-[#7B7D80] transition-colors bg-white hover:bg-[#FAFAFA]"
                            >
                                <span>{actionButton.label}</span>
                                <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center text-[#898C8F] font-light text-[20px]">
                                    +
                                </span>
                            </button>
                        )}
                        {options.map((option) => {
                            const selected = isSelectedOption(option);

                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => onSelect(option)}
                                    className={`relative flex w-full items-center pl-[12px] pr-3 py-3 border-l-[3px] text-left text-[15px] transition-colors ${
                                        selected
                                            ? "border-[#C4F042] text-[#707070] bg-white"
                                            : "border-transparent text-[#707070] bg-white hover:bg-[#FAFAFA]"
                                    }`}
                                >
                                    <span>{option}</span>
                                    {showOptionIndicator && (
                                        <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center text-[#8B8B8B]">
                                            {selected ? <CheckIcon /> : "+"}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
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
            className="h-[22px] pl-3 pr-1 rounded-full transition-colors bg-[#A9E2F2] text-[#404040] inline-flex items-center gap-2 whitespace-nowrap hover:bg-[#96d8ea]"
        >
            <span className="text-[11px] leading-none font-normal">{label}</span>
            <span className="w-[15px] h-[15px] rounded-full bg-[#4696AD] text-white flex items-center justify-center text-[12px] leading-none">
                x
            </span>
        </button>
    );
}

function getTecidoNome(produto) {
    if (!produto) return "";
    if (typeof produto.tecido === "string") return produto.tecido;
    return produto.tecido?.nome || produto.tecido_nome || "";
}

function getGradeNome(produto) {
    if (!produto) return "";
    if (typeof produto.grade === "string") return produto.grade;
    return (
        produto.grade?.nome ||
        produto.grade_versao?.grade?.nome ||
        produto.grade_versao?.nome ||
        produto.grade_nome ||
        ""
    );
}

function normalizarId(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor);
}

function normalizarTexto(valor) {
    return String(valor || "")
        .trim()
        .toLowerCase();
}

function getClienteAssociadoId(item) {
    return normalizarId(
        item?.cliente?.id ??
            item?.cliente?.cliente_id ??
            item?.cliente?.clienteId ??
            item?.cliente?.clienteID ??
            item?.cliente?.id_cliente ??
            item?.cliente_id ??
            item?.clienteId ??
            item?.clienteID ??
            item?.id_cliente ??
            item?.fk_cliente_id ??
            item?.cliente_produto?.cliente_id ??
            item?.clienteProduto?.cliente_id,
    );
}

function getClienteAssociadoNome(item) {
    return normalizarTexto(
        (typeof item?.cliente === "string" ? item.cliente : item?.cliente?.nome) ||
            item?.cliente_nome ||
            item?.nome_cliente,
    );
}

function enriquecerClientesAssociados(clientesAssociados, clientesDoFabrico) {
    const clientesPorNome = new Map(
        (clientesDoFabrico || [])
            .map((cliente) => [normalizarTexto(cliente?.nome), cliente])
            .filter(([nome, cliente]) => nome && cliente?.id),
    );

    return (clientesAssociados || []).map((item) => {
        if (getClienteAssociadoId(item)) return item;

        const nomeAssociado = getClienteAssociadoNome(item);
        const clienteEncontrado = clientesPorNome.get(nomeAssociado);

        if (!clienteEncontrado?.id) return item;

        return {
            ...item,
            cliente_id: clienteEncontrado.id,
            cliente:
                item?.cliente && typeof item.cliente === "object"
                    ? { ...item.cliente, id: clienteEncontrado.id }
                    : {
                          id: clienteEncontrado.id,
                          nome:
                              item?.cliente?.nome ||
                              item?.cliente_nome ||
                              item?.nome_cliente ||
                              clienteEncontrado.nome,
                      },
        };
    });
}

function normalizarAviamentoDisponivel(item) {
    const aviamento = item?.aviamento || item;
    const id = aviamento?.id ?? item?.aviamento_id;
    const nome = aviamento?.nome || item?.nome;

    if (!id || !nome) return null;

    return {
        id,
        nome,
    };
}

function normalizarAviamentoRelacionado(item) {
    const aviamento = normalizarAviamentoDisponivel(item);
    if (!aviamento) return null;

    return {
        ...aviamento,
        relacao_id: item?.id ?? item?.relacao_id,
    };
}

function ModalClientesDoProduto({
    isOpen,
    onClose,
    produtoId,
    fabricoId,
    clientesAssociados,
    onSuccess,
}) {
    const [clientes, setClientes] = useState([]);
    const [selecionados, setSelecionados] = useState([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const idsAssociados = useMemo(
        () =>
            new Set(
                (clientesAssociados || [])
                    .map((item) => getClienteAssociadoId(item))
                    .filter(Boolean),
            ),
        [clientesAssociados],
    );

    const nomesAssociados = useMemo(
        () =>
            new Set(
                (clientesAssociados || [])
                    .map((item) => getClienteAssociadoNome(item))
                    .filter(Boolean),
            ),
        [clientesAssociados],
    );

    const clienteJaAssociado = (cliente) => {
        const clienteId = normalizarId(cliente?.id);
        const clienteNome = normalizarTexto(cliente?.nome);

        return (
            (clienteId && idsAssociados.has(clienteId)) ||
            (clienteNome && nomesAssociados.has(clienteNome))
        );
    };

    useEffect(() => {
        if (!isOpen || !fabricoId) return;

        let ignorar = false;

        async function carregarClientes() {
            try {
                setLoading(true);
                const dados = await getClientes(fabricoId);
                if (ignorar) return;
                setClientes(Array.isArray(dados) ? dados : []);
            } catch (error) {
                console.error("Erro ao carregar clientes:", error);
                setClientes([]);
            } finally {
                if (!ignorar) setLoading(false);
            }
        }

        carregarClientes();

        return () => {
            ignorar = true;
        };
    }, [fabricoId, isOpen]);

    const clientesDisponiveis = clientes.filter((cliente) => !clienteJaAssociado(cliente));

    const clientesFiltrados = clientesDisponiveis.filter((cliente) =>
        normalizarTexto(cliente.nome).includes(normalizarTexto(busca)),
    );

    const handleClose = () => {
        setBusca("");
        setSelecionados([]);
        onClose();
    };

    const toggleSelecionado = (clienteId) => {
        const idNormalizado = normalizarId(clienteId);

        setSelecionados((prev) =>
            prev.includes(idNormalizado)
                ? prev.filter((item) => item !== idNormalizado)
                : [...prev, idNormalizado],
        );
    };

    const handleAdicionar = async () => {
        const selecionadosNaoAssociados = selecionados.filter((clienteId) => {
            const cliente = clientes.find(
                (item) => normalizarId(item.id) === normalizarId(clienteId),
            );

            return cliente && !clienteJaAssociado(cliente);
        });

        if (!selecionadosNaoAssociados.length) return;

        try {
            setSalvando(true);
            await Promise.all(
                selecionadosNaoAssociados.map((clienteId) =>
                    vincularProdutoAoCliente(clienteId, produtoId, {
                        nome_para_cliente: "-",
                        preco_padrao: 0,
                    }),
                ),
            );
            await onSuccess();
            handleClose();
        } catch (error) {
            console.error("Erro ao associar clientes:", error);
        } finally {
            setSalvando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-Outfit"
            onClick={handleClose}
        >
            <div
                className="bg-[#F3F4FA] w-full max-w-[620px] rounded-[24px] shadow-xl p-8"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[26px] font-light text-[#404040]">Associar clientes</h2>
                    <input
                        type="text"
                        placeholder="Buscar"
                        value={busca}
                        onChange={(event) => setBusca(event.target.value)}
                        className="pl-4 pr-4 border border-[#898c8e] bg-[#f3f4fa] rounded-[12px] text-sm placeholder-[#898c8e] focus:outline-none focus:border-[#4696AD] w-[196px] h-[34px]"
                    />
                </div>

                <div className="max-h-[280px] overflow-y-auto pr-2 scrollbar-sutil">
                    {loading ? (
                        <SelectionListSkeleton />
                    ) : clientesFiltrados.length === 0 ? (
                        <div className="flex justify-center py-12 text-[#898c8f]">
                            Nenhum cliente disponível.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {clientesFiltrados.map((cliente) => {
                                const clienteId = normalizarId(cliente.id);
                                const selecionado = selecionados.includes(clienteId);

                                return (
                                    <button
                                        key={cliente.id}
                                        type="button"
                                        onClick={() => toggleSelecionado(clienteId)}
                                        className={`h-[54px] rounded-[14px] px-4 text-left transition-colors ${
                                            selecionado
                                                ? "bg-[#A9E2F2] text-[#4696AD]"
                                                : "bg-white text-[#707070] hover:bg-[#FAFAFA]"
                                        }`}
                                    >
                                        {cliente.nome}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        type="button"
                        onClick={handleAdicionar}
                        disabled={salvando || selecionados.length === 0}
                        className="w-[189px] h-[39px] rounded-[18.9px] bg-[#A9E2F2] text-[#4696AD] font-Outfit text-[16px] transition-colors hover:bg-[#A2DCED] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {salvando ? "Adicionando..." : "Adicionar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ProdutoEditar() {
    const { id } = useParams();
    const navigate = useNavigate();
    const inputFileRef = useRef(null);

    const usuarioLogado = useMemo(() => {
        const userString = localStorage.getItem("user");
        return userString ? JSON.parse(userString) : null;
    }, []);
    const fabricoId = Number(usuarioLogado?.fabrico_id);

    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [produto, setProduto] = useState(null);
    const [fabrico, setFabrico] = useState(null);
    const [clientesAssociados, setClientesAssociados] = useState([]);
    const [arquivoImagem, setArquivoImagem] = useState(null);
    const [imagemPreview, setImagemPreview] = useState("");
    const [openDropdown, setOpenDropdown] = useState(null);
    const [gradesDisponiveis, setGradesDisponiveis] = useState([]);
    const [tecidosDisponiveis, setTecidosDisponiveis] = useState([]);
    const [aviamentosDisponiveis, setAviamentosDisponiveis] = useState([]);
    const [modelosDisponiveis, setModelosDisponiveis] = useState([]);
    const [modalClientesAberto, setModalClientesAberto] = useState(false);
    const [modalAviamentoAberto, setModalAviamentoAberto] = useState(false);
    const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
    const [modalAtencaoAberto, setModalAtencaoAberto] = useState(false);
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
    const [modalExcluidoAberto, setModalExcluidoAberto] = useState(false);
    const [excluindo, setExcluindo] = useState(false);
    const [aviamentosOriginais, setAviamentosOriginais] = useState([]);
    const [formData, setFormData] = useState({
        referencia: "",
        modelo: "",
        tipo_produto_id: undefined,
        tecido: "",
        tecido_id: undefined,
        grade: "",
        grade_versao_id: undefined,
        aviamentos: [],
    });

    const carregarClientesDoProduto = async () => {
        const [dadosClientes, clientesDoFabrico] = await Promise.all([
            getClientesDoProduto(id),
            Number.isFinite(fabricoId) ? getClientes(fabricoId) : Promise.resolve([]),
        ]);

        setClientesAssociados(
            enriquecerClientesAssociados(
                Array.isArray(dadosClientes) ? dadosClientes : [],
                Array.isArray(clientesDoFabrico) ? clientesDoFabrico : [],
            ),
        );
    };

    useEffect(() => {
        let ignorar = false;

        async function carregarDados() {
            try {
                setLoading(true);

                const [
                    dadosProduto,
                    dadosClientes,
                    clientesDoFabrico,
                    resGrades,
                    resTecidos,
                    resAviamentos,
                    resAviamentosProduto,
                    resTiposProduto,
                    dadosFabrico,
                ] = await Promise.all([
                    getProdutoById(id),
                    getClientesDoProduto(id),
                    Number.isFinite(fabricoId) ? getClientes(fabricoId) : Promise.resolve([]),
                    Number.isFinite(fabricoId)
                        ? getGradesByFabrico(fabricoId)
                        : Promise.resolve([]),
                    Number.isFinite(fabricoId)
                        ? getTecidosByFabrico(fabricoId)
                        : Promise.resolve([]),
                    Number.isFinite(fabricoId)
                        ? getAviamentosByFabrico(fabricoId)
                        : Promise.resolve([]),
                    getAviamentosDoProduto(id).catch(() => []),
                    getTiposProdutoByFabrico().catch(() => []),
                    Number.isFinite(fabricoId) ? getFabricoById(fabricoId) : Promise.resolve(null),
                ]);

                if (ignorar) return;

                if (usuarioLogado && dadosProduto.fabrico_id !== usuarioLogado.fabrico_id) {
                    setModalAtencaoAberto(true);
                    return;
                }

                const gradesMapeadas = (resGrades || [])
                    .map((item) => {
                        const nome = item?.grade?.nome || item?.nome;
                        const versaoAtiva = item?.grade?.versoes?.find((versao) => versao?.ativo);
                        if (!nome) return null;
                        return {
                            nome,
                            grade_versao_id:
                                versaoAtiva?.id || item?.grade_versao_id || item?.gradeVersaoId,
                        };
                    })
                    .filter(Boolean);

                const tecidosMapeados = (resTecidos || []).map((tecido) => ({
                    id: tecido?.id || tecido?.tecido?.id,
                    nome: tecido?.nome || tecido?.tecido?.nome || "Sem nome na API",
                }));

                const aviamentosMapeados = (resAviamentos || [])
                    .map(normalizarAviamentoDisponivel)
                    .filter(Boolean);

                const aviamentosSelecionados = (resAviamentosProduto || [])
                    .map(normalizarAviamentoRelacionado)
                    .filter(Boolean);

                const modelosMapeados = (resTiposProduto || [])
                    .map((tipo) => ({
                        id: tipo?.id,
                        nome: tipo?.nome || tipo?.tipo || tipo?.descricao,
                    }))
                    .filter((tipo) => tipo.id && tipo.nome);

                const tipoProdutoRelacionado =
                    dadosProduto.tipo_produto ||
                    dadosProduto.tipoProduto ||
                    modelosMapeados.find((tipo) => tipo.id === dadosProduto.tipo_produto_id);

                const nomeModelo = tipoProdutoRelacionado?.nome || dadosProduto.tipo || "";
                const tipoProdutoId =
                    dadosProduto.tipo_produto_id || tipoProdutoRelacionado?.id || undefined;

                setProduto(dadosProduto);
                setFabrico(dadosFabrico);
                setClientesAssociados(
                    enriquecerClientesAssociados(
                        Array.isArray(dadosClientes) ? dadosClientes : [],
                        Array.isArray(clientesDoFabrico) ? clientesDoFabrico : [],
                    ),
                );
                setGradesDisponiveis(gradesMapeadas);
                setTecidosDisponiveis(tecidosMapeados);
                setAviamentosDisponiveis(aviamentosMapeados);
                setModelosDisponiveis(modelosMapeados);
                setImagemPreview(dadosProduto.foto || "");
                setAviamentosOriginais(aviamentosSelecionados);
                setFormData({
                    referencia: dadosProduto.nome || "",
                    modelo: nomeModelo,
                    tipo_produto_id: tipoProdutoId,
                    tecido: getTecidoNome(dadosProduto),
                    tecido_id: dadosProduto.tecido_id || dadosProduto.tecido?.id,
                    grade: getGradeNome(dadosProduto),
                    grade_versao_id: dadosProduto.grade_versao_id || dadosProduto.grade_versao?.id,
                    aviamentos: aviamentosSelecionados,
                });
            } catch (error) {
                console.error("Erro ao carregar produto:", error);
                setModalAtencaoAberto(true);
            } finally {
                if (!ignorar) setLoading(false);
            }
        }

        carregarDados();

        return () => {
            ignorar = true;
        };
    }, [fabricoId, id, usuarioLogado]);

    const handleChange = (field) => (event) => {
        setFormData((prev) => ({ ...prev, [field]: event.target.value }));
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
        const tecidoSelecionado = tecidosDisponiveis.find((tecido) => tecido.nome === nomeTecido);

        setFormData((prev) => ({
            ...prev,
            tecido: nomeTecido,
            tecido_id: tecidoSelecionado?.id,
        }));
        setOpenDropdown(null);
    };

    const handleModeloSelect = (nomeModelo) => {
        const modeloSelecionado = modelosDisponiveis.find((modelo) => modelo.nome === nomeModelo);

        setFormData((prev) => ({
            ...prev,
            modelo: nomeModelo,
            tipo_produto_id: modeloSelecionado?.id,
        }));
        setOpenDropdown(null);
    };

    const handleAviamentoCriado = (aviamentoCriado) => {
        const novoAviamento = normalizarAviamentoDisponivel(aviamentoCriado);
        if (!novoAviamento) return;

        setAviamentosDisponiveis((prev) => {
            if (prev.some((aviamento) => aviamento.id === novoAviamento.id)) return prev;
            return [...prev, novoAviamento];
        });

        setFormData((prev) => {
            if (prev.aviamentos.some((aviamento) => aviamento.id === novoAviamento.id)) {
                return prev;
            }
            return {
                ...prev,
                aviamentos: [...prev.aviamentos, novoAviamento],
            };
        });
    };

    const handleToggleAviamento = (aviamento) => {
        const aviamentoSelecionado = formData.aviamentos.find((item) => item.id === aviamento.id);

        if (aviamentoSelecionado) {
            setFormData((prev) => ({
                ...prev,
                aviamentos: prev.aviamentos.filter((item) => item.id !== aviamento.id),
            }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            aviamentos: [...prev.aviamentos, aviamento],
        }));
    };

    const sincronizarAviamentosProduto = async () => {
        const idsAtuais = new Set(
            formData.aviamentos.map((aviamento) => normalizarId(aviamento.id)),
        );
        const idsOriginais = new Set(
            aviamentosOriginais.map((aviamento) => normalizarId(aviamento.id)),
        );

        const aviamentosRemovidos = aviamentosOriginais.filter(
            (aviamento) => !idsAtuais.has(normalizarId(aviamento.id)) && aviamento.relacao_id,
        );
        const aviamentosAdicionados = formData.aviamentos.filter(
            (aviamento) => !idsOriginais.has(normalizarId(aviamento.id)),
        );

        await Promise.all(
            aviamentosRemovidos.map((aviamento) =>
                desvincularProdutoAviamento(aviamento.relacao_id),
            ),
        );
        await Promise.all(
            aviamentosAdicionados.map((aviamento) =>
                vincularProdutoAviamento({
                    produto_id: Number(id),
                    aviamento_id: aviamento.id,
                }),
            ),
        );

        const aviamentosAtualizados = await getAviamentosDoProduto(id);
        const aviamentosSelecionados = (aviamentosAtualizados || [])
            .map(normalizarAviamentoRelacionado)
            .filter(Boolean);

        setAviamentosOriginais(aviamentosSelecionados);
        setFormData((prev) => ({
            ...prev,
            aviamentos: aviamentosSelecionados,
        }));
    };

    const handleImagemChange = (event) => {
        const arquivo = event.target.files?.[0];
        if (!arquivo) return;

        setArquivoImagem(arquivo);
        setImagemPreview(URL.createObjectURL(arquivo));
        setErro("");
    };

    const handleSalvar = async (event) => {
        event.preventDefault();
        setErro("");

        if (!formData.referencia.trim()) {
            setErro("Informe a referência interna do produto.");
            return;
        }

        if (!formData.modelo || !formData.tipo_produto_id) {
            setErro("Selecione o modelo do produto.");
            return;
        }

        try {
            setSalvando(true);
            let urlFoto = produto?.foto;

            if (arquivoImagem) {
                const uploadData = new FormData();
                uploadData.append("file", arquivoImagem);

                const responseUpload = await upload(uploadData);
                if (responseUpload?.url) urlFoto = responseUpload.url;
            }

            await atualizarProduto(id, {
                foto: urlFoto,
                nome: formData.referencia.trim(),
                tipo_produto_id: formData.tipo_produto_id,
                fabrico_id: fabricoId,
                tecido_id: formData.tecido_id,
                grade_versao_id: formData.grade_versao_id,
            });

            await sincronizarAviamentosProduto();

            setModalConfirmacaoAberto(true);
        } catch (error) {
            console.error("Erro ao editar produto:", error);
            setErro(error.response?.data?.message || "Erro ao salvar alterações do produto.");
        } finally {
            setSalvando(false);
        }
    };

    const handleSalvarReferencia = async (dadosEditados) => {
        const clienteId = normalizarId(dadosEditados.cliente_id);
        const linhaId = normalizarId(dadosEditados.linha_id);
        const chaveEdicao = clienteId || linhaId;

        setClientesAssociados((prev) =>
            prev.map((item, index) => {
                const clienteId = getClienteAssociadoId(item);
                const itemLinhaId = clienteId || `linha-${index}`;

                if (itemLinhaId !== chaveEdicao) return item;

                return {
                    ...item,
                    nome_para_cliente: dadosEditados.nome_para_cliente,
                    preco_padrao: dadosEditados.preco_padrao,
                };
            }),
        );
    };

    const handleRemoverReferencia = async (item) => {
        const clienteId = getClienteAssociadoId(item);
        await desvincularProdutoDoCliente(clienteId, id);
        setClientesAssociados((prev) =>
            prev.filter((clienteProduto) => {
                const itemClienteId = getClienteAssociadoId(clienteProduto);
                return itemClienteId !== clienteId;
            }),
        );
    };

    const handleConfirmarExclusao = async () => {
        if (excluindo) return;
        try {
            setExcluindo(true);
            await excluirProduto(id);
            setModalExclusaoAberto(false);
            setModalExcluidoAberto(true);
        } catch (error) {
            console.error("Erro ao excluir produto:", error);
            setErro("Erro ao excluir produto.");
        } finally {
            setExcluindo(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 pt-0 mt-6 w-full flex justify-center font-Outfit">
                <div className="bg-white p-8 rounded-[24px] shadow-sm w-full min-h-[650px]">
                    <ProdutoDetalhesHeader
                        title="Editar produto"
                        iconSrc="/produtos-ativado.png"
                        iconClassName="w-[30px] h-[30px] object-contain"
                    />
                    <ProductEditPageSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 pt-0 mt-6 w-full flex justify-center font-Outfit">
            <div className="bg-white p-8 rounded-[24px] shadow-sm w-full min-h-[650px]">
                <ProdutoDetalhesHeader
                    title="Editar produto"
                    iconSrc="/produtos-ativado.png"
                    iconClassName="w-[30px] h-[30px] object-contain"
                />

                {erro && (
                    <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
                        {erro}
                    </div>
                )}

                <form onSubmit={handleSalvar} className="mt-8 flex flex-col min-h-[520px]">
                    <div className="flex flex-col xl:flex-row gap-9 xl:gap-10">
                        <div className="w-[260px] shrink-0">
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
                                className="w-[260px] h-[170px] rounded-[10px] overflow-hidden bg-[#D9D9D9] hover:opacity-90 transition-opacity"
                            >
                                {imagemPreview ? (
                                    <img
                                        src={imagemPreview}
                                        alt={formData.referencia || "Produto"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-[54px] font-extralight text-[#9B9B9B]">
                                        +
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="flex-1 max-w-[780px]">
                            <div className="grid grid-cols-1 md:grid-cols-[220px_220px] gap-x-10 gap-y-6">
                                <div>
                                    <FieldLabel>Referência</FieldLabel>
                                    <input
                                        type="text"
                                        value={formData.referencia}
                                        onChange={handleChange("referencia")}
                                        className="w-full h-[35px] border border-[#D3D3D3] rounded-[10px] px-3 text-[14px] text-[#707070] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Modelo</FieldLabel>
                                    <DropdownField
                                        value={formData.modelo}
                                        placeholder="Modelo"
                                        options={modelosDisponiveis.map((modelo) => modelo.nome)}
                                        isOpen={openDropdown === "modelo"}
                                        onToggle={() => toggleDropdown("modelo")}
                                        onSelect={handleModeloSelect}
                                        isSelectedOption={(option) => formData.modelo === option}
                                    />
                                </div>
                            </div>

                            <div className="mt-7">
                                <FieldLabel>Detalhes do produto</FieldLabel>
                                <div className="grid grid-cols-1 md:grid-cols-[220px_220px_220px] gap-x-4 gap-y-5">
                                    <div>
                                        <span className="block text-[13px] font-light text-[#4696AD] mb-1">
                                            Aviamentos
                                        </span>
                                        <DropdownField
                                            value=""
                                            placeholder="Aviamentos"
                                            options={aviamentosDisponiveis.map(
                                                (aviamento) => aviamento.nome,
                                            )}
                                            isOpen={openDropdown === "aviamentos"}
                                            onToggle={() => toggleDropdown("aviamentos")}
                                            onSelect={(nomeSelecionado) => {
                                                const aviamentoCompleto =
                                                    aviamentosDisponiveis.find(
                                                        (aviamento) =>
                                                            aviamento.nome === nomeSelecionado,
                                                    );
                                                if (aviamentoCompleto) {
                                                    handleToggleAviamento(aviamentoCompleto);
                                                }
                                            }}
                                            isSelectedOption={(option) =>
                                                formData.aviamentos.some(
                                                    (aviamento) => aviamento.nome === option,
                                                )
                                            }
                                            showOptionIndicator
                                            actionButton={{
                                                label: "Novo aviamento",
                                                onClick: () => {
                                                    setOpenDropdown(null);
                                                    setModalAviamentoAberto(true);
                                                },
                                            }}
                                        />
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {formData.aviamentos.map((item) => (
                                                <SelectedAviamentoTag
                                                    key={item.id}
                                                    label={item.nome}
                                                    onRemove={() => handleToggleAviamento(item)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="block text-[13px] font-light text-[#4696AD] mb-1">
                                            Tecido
                                        </span>
                                        <DropdownField
                                            value={formData.tecido}
                                            placeholder="Tecido"
                                            options={tecidosDisponiveis.map(
                                                (tecido) => tecido.nome,
                                            )}
                                            isOpen={openDropdown === "tecido"}
                                            onToggle={() => toggleDropdown("tecido")}
                                            onSelect={handleTecidoSelect}
                                            isSelectedOption={(option) =>
                                                formData.tecido === option
                                            }
                                        />
                                    </div>

                                    <div>
                                        <span className="block text-[13px] font-light text-[#4696AD] mb-1">
                                            Grade de tamanhos
                                        </span>
                                        <DropdownField
                                            value={formData.grade}
                                            placeholder="Grade de tamanho"
                                            options={gradesDisponiveis.map((grade) => grade.nome)}
                                            isOpen={openDropdown === "grade"}
                                            onToggle={() => toggleDropdown("grade")}
                                            onSelect={handleGradeSelect}
                                            isSelectedOption={(option) => formData.grade === option}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 w-full">
                        <TabelaClientesDoProduto
                            clientes={clientesAssociados}
                            referenciaInterna={formData.referencia}
                            produtoId={id}
                            fabricacao_sob_demanda={fabrico?.fabricacao_sob_demanda}
                            onAbrirModal={() => setModalClientesAberto(true)}
                            onRemoverLinha={handleRemoverReferencia}
                            onSalvarEdicao={handleSalvarReferencia}
                        />
                    </div>

                    <div className="mt-auto flex justify-between items-center pt-12">
                        <button
                            type="button"
                            onClick={() => navigate("/produtos")}
                            className="w-[147px] h-[39px] rounded-[18.9px] bg-[#F3F4FA] border border-[#4696ad] text-[#4696ad] font-Outfit text-[16px] transition-colors hover:bg-[#E1F1F6]"
                        >
                            Voltar
                        </button>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setModalExclusaoAberto(true)}
                                className="w-[189px] h-[39px] rounded-[18.9px] bg-[#D75757] text-white font-Outfit text-[16px] transition-colors hover:bg-[#d74646]"
                            >
                                Excluir produto
                            </button>
                            <LoadingButton
                                type="submit"
                                loading={salvando}
                                loadingText="Salvando..."
                                className="w-[189px] h-[39px] rounded-[18.9px] bg-[#A9E2F2] text-[#4696AD] font-Outfit text-[16px] transition-colors hover:bg-[#A2DCED] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Editar produto
                            </LoadingButton>
                        </div>
                    </div>
                </form>
            </div>

            <ModalClientesDoProduto
                isOpen={modalClientesAberto}
                onClose={() => setModalClientesAberto(false)}
                produtoId={id}
                fabricoId={fabricoId}
                clientesAssociados={clientesAssociados}
                onSuccess={carregarClientesDoProduto}
            />

            <AviamentoModal
                isOpen={modalAviamentoAberto}
                onClose={() => setModalAviamentoAberto(false)}
                onSuccess={handleAviamentoCriado}
                mode="create"
                fabricoId={fabricoId}
            />

            <ModalExclusao
                isOpen={modalExclusaoAberto}
                onClose={() => setModalExclusaoAberto(false)}
                onConfirm={handleConfirmarExclusao}
                titulo="Excluir produto"
                nomeItem={produto?.nome}
                tipoItem="o produto"
                loading={excluindo}
            />

            <ModalConfirmacao
                isOpen={modalConfirmacaoAberto}
                onClose={() => {
                    setModalConfirmacaoAberto(false);
                    navigate(`/produtos/${id}`);
                }}
                type="atualizado"
            />

            <ModalConfirmacao
                isOpen={modalExcluidoAberto}
                onClose={() => {
                    setModalExcluidoAberto(false);
                    navigate("/produtos", {
                        replace: true,
                        state: { success: "Produto excluído com sucesso." },
                    });
                }}
                type="excluído"
            />

            <ModalAtencao
                isOpen={modalAtencaoAberto}
                mensagem="Este produto não pertence ou não existe no seu fabrico. Você será redirecionado para a lista de produtos."
                onConfirm={() => {
                    setModalAtencaoAberto(false);
                    navigate("/produtos", { replace: true });
                }}
            />
        </div>
    );
}
