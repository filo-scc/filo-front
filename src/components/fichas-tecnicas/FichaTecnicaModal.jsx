/* eslint-disable react-hooks/exhaustive-deps */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getFabricoById } from "../../services/fabricoService";
import { getCoresByFabricoId } from "../../services/corService";
import CorModal from "./CorModal";
import EstampaModal from "./EstampaModal";
import { getParceirosByFabrico } from "../../services/parceiroService";
import { getGradesLiberadasByFabricoId } from "../../services/gradeService";
import { getParceiroByProduto } from "../../services/produtoService";

import ProdutoParceiros from "../produtos/ProdutoParceiros";
import { InlineLoading, SkeletonBox } from "../geral/Loading";

function FloatingInput({ label, value, readOnly, onChange, placeholder }) {
    return (
        <div className="relative w-full">
            <input
                readOnly={readOnly}
                value={value || ""}
                onChange={onChange}
                placeholder={placeholder || " "}
                className="peer w-full h-[39px] rounded-[10px] border border-[#898C8F] bg-white px-4 text-[14px] outline-none transition !text-[#898C8F] placeholder:!text-[#898C8F] [cursor:not-allowed_!important]"
            />
            <label
                className={`
                    pointer-events-none absolute left-3 z-10 bg-white px-1 font-light text-[#898C8F]
                    transition-all duration-200
                    ${value ? "-top-[8px] text-[11px]" : "top-1/2 -translate-y-1/2 text-[14px]"}
                `}
            >
                {label}
            </label>
        </div>
    );
}

const calcularProporcao = (totaisPorTamanho) => {
    const valoresValidos = totaisPorTamanho.map(Number).filter((t) => t > 0);
    if (valoresValidos.length === 0) return totaisPorTamanho.map(() => 0);
    const base = Math.min(...valoresValidos);
    return totaisPorTamanho.map((t) => (t > 0 ? Math.round(t / base) : 0));
};

function QuantityCell({ value, onCommit }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value > 0 ? String(value) : "");
    const inputRef = useRef(null);

    useEffect(() => {
        if (!editing) setDraft(value > 0 ? String(value) : "");
    }, [value, editing]);

    useEffect(() => {
        if (editing && inputRef.current) inputRef.current.focus();
    }, [editing]);

    const commit = useCallback(() => {
        const parsed = Number.parseInt(String(draft || 0), 10);
        onCommit(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
        setEditing(false);
    }, [draft, onCommit]);

    if (!editing) {
        return (
            <button
                type="button"
                onClick={() => setEditing(true)}
                className={`flex h-[40px] w-full items-center justify-center rounded-[6px] border border-transparent text-[14px] transition ${
                    value > 0 ? "text-[#898C8F]" : "text-[#D7D7D7]"
                }`}
            >
                {value > 0 ? value : "-"}
            </button>
        );
    }

    return (
        <input
            ref={inputRef}
            type="number"
            min="0"
            step="1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditing(false);
            }}
            className="h-[40px] w-full bg-transparent text-center text-[14px] outline-none text-[#898C8F] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
        />
    );
}

function normalizeGradeOptions(fabricoGrades = []) {
    return fabricoGrades
        .map((link) => {
            const grade = link?.grade;
            if (!grade) return null;
            const activeVersion =
                grade?.versoes?.find((v) => v?.ativo) || grade?.versoes?.[0] || null;
            const versionItems = activeVersion?.itens?.length
                ? activeVersion.itens
                : grade?.items || [];
            const sizeItems = versionItems
                .map((item) => ({
                    gradeVersaoItemId: item.id,
                    tamanhoId: item.tamanho_id ?? item.tamanho?.id,
                    posicao: item.posicao,
                    codigo: item.tamanho?.codigo ?? String(item.tamanho_id ?? ""),
                }))
                .filter((item) => item.gradeVersaoItemId && item.tamanhoId);

            return {
                gradeId: grade.id,
                gradeVersaoId: activeVersion?.id ?? null,
                sizeItems,
                label: `${grade.nome}${sizeItems.length ? ` (${sizeItems.map((item) => item.codigo).join(" - ")})` : ""}`,
            };
        })
        .filter(Boolean);
}

function syncMatrix(prevMatrix, selectedColorIds, sizeItems) {
    const next = {};
    selectedColorIds.forEach((corId) => {
        next[corId] = {};
        sizeItems.forEach((sizeItem) => {
            next[corId][sizeItem.tamanhoId] = prevMatrix?.[corId]?.[sizeItem.tamanhoId] ?? 0;
        });
    });
    return next;
}

const BORDER_DARK_05 = { borderWidth: "0.5px", borderStyle: "solid", borderColor: "#7B7D80" };
const BORDER_LIGHT_05 = { borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E0E0E0" };
const BORDER_SHELL_05 = { borderWidth: "0.5px", borderStyle: "solid", borderColor: "#D9D9D9" };
const PARCEIRO_ROW_HEIGHT = 40;

export default function FichaTecnicaModal({
    isOpen,
    onClose,
    produto,
    fabricoId,
    etapaAtualId = null,
    onFichaCreated,
    onRequestCreateColor,
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [fabricoInfo, setFabricoInfo] = useState(null);
    const [availableColors, setAvailableColors] = useState([]);
    const [availableParceiros, setAvailableParceiros] = useState([]);
    const [gradeOptions, setGradeOptions] = useState([]);

    const [selectedGradeVersionId, setSelectedGradeVersionId] = useState(null);
    const [selectedColorIds, setSelectedColorIds] = useState([]);
    const [matrix, setMatrix] = useState({});
    const [parceiroRows, setParceiroRows] = useState([]);

    const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
    const [corModalOpen, setCorModalOpen] = useState(false);
    const [estampaModalOpen, setEstampaModalOpen] = useState(false);
    const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
    const [parceiroModalOpen, setParceiroModalOpen] = useState(false);

    const [hoveredParceiroIndex, setHoveredParceiroIndex] = useState(null);
    const [parceiroScrollTop, setParceiroScrollTop] = useState(0);
    const [colorSearch, setColorSearch] = useState("");
    const [existingParceiroIds, setExistingParceiroIds] = useState([]);

    const parceiroScrollRef = useRef(null);
    const colorDropdownRef = useRef(null);
    const gradeDropdownRef = useRef(null);

    const producaoSobDemanda = useMemo(
        () => Boolean(fabricoInfo?.fabricacao_sob_demanda),
        [fabricoInfo],
    );

    const currentGradeOption = useMemo(
        () =>
            gradeOptions.find((g) => g.gradeVersaoId === selectedGradeVersionId) ||
            gradeOptions[0] ||
            null,
        [gradeOptions, selectedGradeVersionId],
    );

    const currentSizeItems = currentGradeOption?.sizeItems || [];
    const effectiveGradeVersionId = currentGradeOption?.gradeVersaoId || null;

    const selectedColors = useMemo(
        () =>
            selectedColorIds.map((id) => availableColors.find((c) => c.id === id)).filter(Boolean),
        [availableColors, selectedColorIds],
    );

    const selectedParceiroIds = useMemo(
        () => parceiroRows.map((row) => row.parceiroId).filter(Boolean),
        [parceiroRows],
    );

    const totalsBySize = useMemo(
        () =>
            currentSizeItems.map((size) =>
                selectedColorIds.reduce(
                    (sum, corId) => sum + Number(matrix?.[corId]?.[size.tamanhoId] || 0),
                    0,
                ),
            ),
        [currentSizeItems, selectedColorIds, matrix],
    );

    const proporcoes = useMemo(() => calcularProporcao(totalsBySize), [totalsBySize]);
    const filteredColors = availableColors.filter((color) =>
        color.nome.toLowerCase().includes(colorSearch.toLowerCase()),
    );

    const resetStates = useCallback(() => {
        setSelectedColorIds([]);
        setMatrix({});
        setParceiroRows([]);
        setError("");
        setColorDropdownOpen(false);
        setCorModalOpen(false);
        setEstampaModalOpen(false);
        setGradeDropdownOpen(false);
        setParceiroModalOpen(false);
        setHoveredParceiroIndex(null);
        setParceiroScrollTop(0);
    }, []);

    const handleForceClose = useCallback(() => {
        resetStates();
        onClose?.();
    }, [onClose, resetStates]);

    useEffect(() => {
        if (!isOpen || !fabricoId || !produto?.id) return;
        let alive = true;

        const bootstrap = async () => {
            setLoading(true);
            try {
                const [
                    fabricoResponse,
                    colorsResponse,
                    gradesResponse,
                    parceirosProdutoResponse,
                    parceirosResponse,
                ] = await Promise.all([
                    getFabricoById(fabricoId),
                    getCoresByFabricoId(fabricoId),
                    getGradesLiberadasByFabricoId(fabricoId),
                    getParceiroByProduto(produto.id),
                    getParceirosByFabrico(fabricoId),
                ]);

                if (!alive) return;

                setFabricoInfo(fabricoResponse);
                setAvailableColors(Array.isArray(colorsResponse) ? colorsResponse : []);

                const parceiroProdutoMap = {};
                if (Array.isArray(parceirosProdutoResponse)) {
                    const idsExistentes = parceirosProdutoResponse.map((f) => f.parceiro_id);

                    setExistingParceiroIds(idsExistentes);

                    parceirosProdutoResponse.forEach((f) => {
                        parceiroProdutoMap[f.parceiro_id] = f;
                    });

                    const mergedParceiros = Array.isArray(parceirosResponse)
                        ? parceirosResponse.map((parceiro) => ({
                              ...parceiro,
                              preco: parceiroProdutoMap[parceiro.id]?.preco ?? null,
                          }))
                        : [];

                    setAvailableParceiros(mergedParceiros);
                    setParceiroRows([]);
                } else {
                    setAvailableParceiros(
                        Array.isArray(parceirosResponse) ? parceirosResponse : [],
                    );
                    setExistingParceiroIds([]);
                }

                const normalizedGrades = normalizeGradeOptions(
                    Array.isArray(gradesResponse) ? gradesResponse : [],
                );

                setGradeOptions(normalizedGrades);

                const fallbackGrade =
                    produto?.gradeVersaoId ||
                    produto?.grade_versao_id ||
                    normalizedGrades[0]?.gradeVersaoId ||
                    null;

                setSelectedGradeVersionId(fallbackGrade);
            } catch (err) {
                if (alive) setError(err?.message || "Falha ao carregar dados.");
            } finally {
                if (alive) setLoading(false);
            }
        };

        bootstrap();
        return () => {
            alive = false;
        };
    }, [isOpen, fabricoId, produto?.id]);

    useEffect(() => {
        if (!currentGradeOption) return;
        setMatrix((prev) => syncMatrix(prev, selectedColorIds, currentGradeOption.sizeItems));
    }, [currentGradeOption?.gradeVersaoId, selectedColorIds]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target))
                setColorDropdownOpen(false);
            if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(event.target))
                setGradeDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggleColor = (colorId) =>
        setSelectedColorIds((prev) =>
            prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId],
        );

    const handleOpenCorModal = () => {
        setColorDropdownOpen(false);
        setCorModalOpen(true);
        onRequestCreateColor?.();
    };

    const handleOpenEstampaModal = () => {
        setColorDropdownOpen(false);
        setEstampaModalOpen(true);
    };

    const handleCorCreated = (created) => {
        if (!created?.id) return;
        setAvailableColors((prev) => {
            if (prev.some((c) => c.id === created.id)) return prev;
            return [...prev, created];
        });
        setSelectedColorIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
    };

    const formatarPreco = (valor) => {
        if (valor === null || valor === undefined || valor === "") return "";
        return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
    };

    const handleSelectParceiroFromModal = (parceiro) => {
        if (!parceiro) return;
        setParceiroRows((prev) => {
            if (prev.some((row) => row.parceiroId === parceiro.id)) return prev;
            const jaExisteNoBanco = existingParceiroIds.includes(Number(parceiro.id));
            return [
                ...prev,
                {
                    parceiroId: parceiro.id,
                    parceiroNome: parceiro.nome,
                    operacao: "",
                    preco: formatarPreco(parceiro.preco),
                    isDirty: true,
                    isNew: !jaExisteNoBanco,
                },
            ];
        });
    };

    const handleSave = () => {
        if (!effectiveGradeVersionId) {
            setError("Selecione uma grade válida.");
            return;
        }

        // Construindo o array de itens para a matriz (cores/tamanhos x quantidades)
        const itensPayload = selectedColorIds
            .flatMap((corId) =>
                currentSizeItems.map((s) => ({
                    cor_id: corId,
                    grade_versao_item_id: s.gradeVersaoItemId,
                    quantidade: Number(matrix?.[corId]?.[s.tamanhoId] || 0),
                })),
            )
            .filter((item) => item.quantidade > 0); // Só manda pro backend se a qtd for > 0!

        // Calculando a quantidade total para exibir na Tabela da tela de Pedidos
        const quantidadeTotal = itensPayload.reduce((acc, curr) => acc + curr.quantidade, 0);

        if (quantidadeTotal === 0) {
            setError(
                "Informe a quantidade de pelo menos um tamanho/cor antes de adicionar a ficha.",
            );
            return;
        }

        // Montamos um RASCUNHO e devolvemos pra tela pai!
        const rascunhoFicha = {
            id: `temp-${Date.now()}`, // ID temporário para o frontend iterar na tabela
            isDraft: true,
            produtoId: produto.id,
            nome: produto?.referenciaInterna || produto?.nome,
            referenciaCliente: produto.referenciaInterna || null,
            etapaAtualId,
            gradeVersaoIdOriginal: produto?.gradeVersaoId || produto?.grade_versao_id,
            gradeVersaoIdNova: effectiveGradeVersionId,
            selectedColorIds,
            cores: selectedColors,
            itensPayload,
            parceiroRows,
            quantidade: quantidadeTotal, // Utilizado para preencher a tabela visualmente
        };

        onFichaCreated?.(rascunhoFicha);
        handleForceClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-[999] flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm font-['Outfit',_sans-serif]"
                onClick={handleForceClose}
            >
                <div
                    className="flex max-h-[95vh] w-full max-w-[1160px] flex-col rounded-[28px] bg-white py-8 shadow-2xl overflow-x-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-6 flex items-center justify-between px-4 mx-[30px]">
                        <div className="flex items-center gap-3">
                            <img
                                src="/etiqueta_cinza.png"
                                alt="Ficha técnica"
                                className="h-8 w-8 object-contain"
                            />
                            <h2 className="text-[26px] font-light text-[#404040]">Ficha Técnica</h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleForceClose}
                            className="text-[28px] leading-none text-[#8C8C8C] transition hover:text-black"
                        >
                            &times;
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700 mx-[30px]">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="min-h-[400px] px-[30px] pt-3">
                            <div className="flex justify-center py-8">
                                <InlineLoading label="Carregando ficha técnica" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
                                <SkeletonBox className="h-[150px] rounded-[10px]" />
                                <div className="space-y-4">
                                    <SkeletonBox className="h-[39px] rounded-[10px]" />
                                    <SkeletonBox className="h-[39px] rounded-[10px]" />
                                    <SkeletonBox className="h-[120px] rounded-[12px]" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="!max-w-full w-full flex-1 overflow-y-auto px-4 pt-3 scrollbar-sutil">
                            {/* Inputs Superiores */}
                            <div className="flex flex-col gap-6 md:flex-row mx-[30px]">
                                <div className="w-full md:w-[260px] shrink-0 flex flex-col gap-4">
                                    <div className="h-[150px] w-full rounded-[10px] border border-dashed border-[#DADADA] bg-[#FAFAFA] flex items-center justify-center overflow-hidden">
                                        {produto?.foto ? (
                                            <img
                                                src={produto.foto}
                                                alt="Produto"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-[12px] text-[#9B9B9B]">
                                                Sem imagem
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-4 content-start overflow-visible">
                                    <FloatingInput
                                        label="Referência Interna"
                                        value={produto?.referenciaInterna || produto?.nome}
                                        readOnly
                                    />
                                    {producaoSobDemanda && (
                                        <FloatingInput
                                            label={
                                                produto?.clienteNome
                                                    ? `Referência da ${produto.clienteNome}`
                                                    : "Referência do Cliente"
                                            }
                                            value={produto?.referenciaCliente || ""}
                                            readOnly
                                        />
                                    )}
                                    <FloatingInput
                                        label="Tecido"
                                        value={produto?.tecido?.nome}
                                        readOnly
                                    />

                                    {/* Select de Grade */}
                                    <div className="relative" ref={gradeDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setGradeDropdownOpen(!gradeDropdownOpen)}
                                            className="flex w-full h-[39px] items-center justify-between rounded-[10px] border border-[#898C8F] bg-white px-4 text-[14px] text-[#7B7D80]"
                                        >
                                            <span className="truncate">
                                                {currentGradeOption?.label || "Selecionar Grade"}
                                            </span>
                                            <img
                                                src={
                                                    gradeDropdownOpen
                                                        ? "/arrow-up.png"
                                                        : "/arrow-down.png"
                                                }
                                                alt="Seta"
                                                className="w-[11px] h-[6px]"
                                            />
                                        </button>
                                        {gradeDropdownOpen && (
                                            <div className="absolute z-[40] mt-1 w-full rounded-[10px] border border-[#898C8F] bg-white shadow-lg overflow-hidden">
                                                <div className="max-h-[200px] overflow-y-auto scrollbar-sutil">
                                                    {gradeOptions.map((g) => (
                                                        <button
                                                            key={g.gradeVersaoId}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedGradeVersionId(
                                                                    g.gradeVersaoId,
                                                                );
                                                                setGradeDropdownOpen(false);
                                                            }}
                                                            className={`flex w-full items-center px-4 py-2.5 text-left text-[14px] transition text-[#7B7D80] ${g.gradeVersaoId === effectiveGradeVersionId ? "border-l-[3px] border-l-[#C4F042]" : "border-l-transparent"}`}
                                                        >
                                                            {g.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Select de Cores */}
                                    <div className="relative" ref={colorDropdownRef}>
                                        <div
                                            className="flex h-[39px] w-full items-center justify-between rounded-[10px] border border-[#898C8F] bg-white px-4 text-[14px] text-[#7B7D80] cursor-text"
                                            onClick={() => {
                                                setColorDropdownOpen(true);
                                                document
                                                    .getElementById("input-busca-cores")
                                                    ?.focus();
                                            }}
                                        >
                                            <input
                                                id="input-busca-cores"
                                                type="text"
                                                value={colorSearch}
                                                onChange={(e) => {
                                                    setColorSearch(e.target.value);
                                                    setColorDropdownOpen(true);
                                                }}
                                                onFocus={() => setColorDropdownOpen(true)}
                                                placeholder="Selecionar cores/estampas"
                                                className="w-full bg-transparent outline-none placeholder:text-[#7B7D80] text-[#7B7D80]"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setColorDropdownOpen((prev) => !prev);
                                                }}
                                                className="ml-2 shrink-0 py-2"
                                            >
                                                <img
                                                    src={
                                                        colorDropdownOpen
                                                            ? "/arrow-up.png"
                                                            : "/arrow-down.png"
                                                    }
                                                    alt="Abrir"
                                                    className="w-[11px] h-[6px]"
                                                />
                                            </button>
                                        </div>
                                        {colorDropdownOpen && (
                                            <div className="absolute z-[30] mt-1 w-full rounded-[10px] border border-[#898C8F] bg-white shadow-lg overflow-hidden">
                                                <div className="max-h-[200px] overflow-y-auto scrollbar-sutil">
                                                    <button
                                                        type="button"
                                                        onClick={handleOpenCorModal}
                                                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[14px] text-[#4696AD] font-medium bg-white hover:bg-[#FAFAFA]"
                                                    >
                                                        <span>+ Nova cor</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleOpenEstampaModal}
                                                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[14px] text-[#4696AD] font-medium bg-white hover:bg-[#FAFAFA]"
                                                    >
                                                        <span>+ Nova estampa</span>
                                                    </button>
                                                    {filteredColors.length > 0 ? (
                                                        filteredColors.map((color) => {
                                                            const checked =
                                                                selectedColorIds.includes(color.id);
                                                            return (
                                                                <button
                                                                    key={color.id}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleToggleColor(color.id)
                                                                    }
                                                                    className={`flex w-full items-center border-l-[4px] px-4 py-2.5 transition bg-white text-[#7B7D80] ${checked ? "border-l-[3px] border-l-[#C4F042]" : "border-l-transparent"}`}
                                                                >
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                        {String(
                                                                            color.tipo,
                                                                        ).toUpperCase() ===
                                                                        "ESTAMPA" ? (
                                                                            <img
                                                                                src={color.foto}
                                                                                alt={color.nome}
                                                                                className="w-[20px] h-[20px] rounded-[6px] shrink-0 border border-[#D9D9D9] object-cover"
                                                                            />
                                                                        ) : (
                                                                            <span
                                                                                className="w-[20px] h-[20px] rounded-[6px] shrink-0 border border-[#D9D9D9]"
                                                                                style={{
                                                                                    backgroundColor:
                                                                                        color.codigo_hex ||
                                                                                        "#E5E5E5",
                                                                                }}
                                                                            />
                                                                        )}
                                                                        <span className="font-light text-[#7B7D80] text-left truncate">
                                                                            {color.nome}
                                                                        </span>
                                                                    </div>
                                                                    {checked ? (
                                                                        <img
                                                                            src="/check_cinza.png"
                                                                            className="w-[12px] h-[8px] shrink-0"
                                                                            alt=""
                                                                        />
                                                                    ) : (
                                                                        <img
                                                                            src="/mais_cinza.png"
                                                                            className="w-[12px] h-[12px] shrink-0"
                                                                            alt=""
                                                                        />
                                                                    )}
                                                                </button>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="px-4 py-3 text-[14px] text-[#898C8F]">
                                                            Nenhuma cor encontrada
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Badges de Cores */}
                            <div className="mt-3 mx-[30px]">
                                {selectedColors.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedColors.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => handleToggleColor(c.id)}
                                                className="inline-flex items-center gap-2 rounded-[16px] bg-[#A9E2F2] pr-[6px] pl-3 py-1 text-[12px] text-[#404040]"
                                            >
                                                <span>{c.nome}</span>
                                                <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full bg-[#4696AD] text-[13px] font-bold leading-none text-white">
                                                    ×
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tabela de Grade/Quantidades */}
                            <div className="mt-4 mx-[30px]">
                                <div className="mb-2 text-center text-[16px] font-light text-[#737373]">
                                    Grade
                                </div>
                                <div className="w-full">
                                    <div className="flex w-full items-stretch min-h-[30px]">
                                        <div className="w-[160px] shrink-0" />
                                        <div className="flex flex-1 min-w-0">
                                            {currentSizeItems.map((s, i) => (
                                                <div
                                                    key={`prop-${s.gradeVersaoItemId}`}
                                                    className="bg-[#F4F4F4] flex-1 min-w-0 text-center text-[14px] font-light flex items-center justify-center"
                                                    style={{
                                                        borderColor: "#7B7D80",
                                                        borderLeftWidth: "0.5px",
                                                        borderRightWidth:
                                                            i === currentSizeItems.length - 1
                                                                ? "0.5px"
                                                                : "0px",
                                                        borderTopWidth: "0.5px",
                                                        borderBottomWidth: "0.5px",
                                                        borderTopLeftRadius:
                                                            i === 0 ? "10px" : "0px",
                                                        borderTopRightRadius:
                                                            i === currentSizeItems.length - 1
                                                                ? "10px"
                                                                : "0px",
                                                        color:
                                                            totalsBySize[i] > 0
                                                                ? "#898C8F"
                                                                : "#D7D7D7",
                                                    }}
                                                >
                                                    {proporcoes[i]}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex h-[40px] items-stretch">
                                        <div className="w-[160px] shrink-0 rounded-tl-[10px] font-normal bg-[#C9EAF6] px-4 text-[#4696AD] flex items-center justify-center overflow-hidden">
                                            Cores
                                        </div>
                                        <div className="flex flex-1 min-w-0">
                                            {currentSizeItems.map((s, idx) => (
                                                <div
                                                    key={s.gradeVersaoItemId}
                                                    className="flex-1 min-w-0 text-center font-normal text-[#4696AD] flex items-center justify-center bg-[#C9EAF6]"
                                                    style={{
                                                        borderLeftWidth:
                                                            idx === 0 ? "0.5px" : "0px",
                                                        borderRightWidth: "0.5px",
                                                        borderBottomWidth: "0px",
                                                        borderTopWidth: "0px",
                                                        borderColor: "#7B7D80",
                                                        borderRightColor:
                                                            idx === currentSizeItems.length - 1
                                                                ? "#C9EAF6"
                                                                : "#7B7D80",
                                                    }}
                                                >
                                                    {s.codigo}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div
                                        className="rounded-b-[10px] bg-white"
                                        style={BORDER_SHELL_05}
                                    >
                                        <div className="flex flex-col w-full">
                                            {selectedColors.length > 0 ? (
                                                selectedColors.map((color, index) => (
                                                    <div
                                                        key={color.id}
                                                        className={`flex w-full min-h-[40px] items-stretch ${index % 2 === 1 ? "bg-[#F4F4F4]" : "bg-[#FFFFFF]"}`}
                                                    >
                                                        <div
                                                            className="w-[160px] shrink-0 pl-2 pr-4 flex items-center"
                                                            style={{
                                                                ...BORDER_DARK_05,
                                                                borderTopWidth: "0px",
                                                                borderLeftWidth: "0px",
                                                                borderBottomWidth: "0px",
                                                                borderRightWidth: "0.5px",
                                                            }}
                                                        >
                                                            {String(color.tipo).toUpperCase() ===
                                                            "ESTAMPA" ? (
                                                                <img
                                                                    src={color.foto}
                                                                    alt={color.nome}
                                                                    className="w-[20px] h-[20px] rounded-[6px] shrink-0 border border-[#D9D9D9] object-cover"
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="w-[20px] h-[20px] rounded-[6px] shrink-0 border border-[#D9D9D9]"
                                                                    style={{
                                                                        backgroundColor:
                                                                            color.codigo_hex ||
                                                                            "#E5E5E5",
                                                                    }}
                                                                />
                                                            )}
                                                            <span className="flex-1 text-center text-[14px] font-light text-[#898C8F] truncate leading-none">
                                                                {color.nome}
                                                            </span>
                                                        </div>
                                                        {currentSizeItems.map((s, sizeIndex) => (
                                                            <div
                                                                key={s.gradeVersaoItemId}
                                                                className="flex-1 min-w-0 px-2 flex items-center justify-center"
                                                                style={{
                                                                    ...BORDER_DARK_05,
                                                                    borderTopWidth: "0px",
                                                                    borderBottomWidth: "0px",
                                                                    borderLeftWidth: "0px",
                                                                    borderRightWidth:
                                                                        sizeIndex !==
                                                                        currentSizeItems.length - 1
                                                                            ? "0.5px"
                                                                            : "0px",
                                                                }}
                                                            >
                                                                <QuantityCell
                                                                    value={
                                                                        matrix?.[color.id]?.[
                                                                            s.tamanhoId
                                                                        ] || 0
                                                                    }
                                                                    onCommit={(v) =>
                                                                        setMatrix((p) => ({
                                                                            ...p,
                                                                            [color.id]: {
                                                                                ...(p[color.id] ||
                                                                                    {}),
                                                                                [s.tamanhoId]: v,
                                                                            },
                                                                        }))
                                                                    }
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-4 text-[13px] text-center text-[#888] bg-white w-full rounded-b-[10px]">
                                                    Nenhuma cor selecionada.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TABELA DE PARCEIROS */}
                            <div className="mt-8 mx-[30px]">
                                <div className="w-full">
                                    <div className="grid grid-cols-3 items-center h-10 font-normal text-center text-[#4696AD]">
                                        <div className="bg-[#C9EAF6] px-4 py-2.5 border-r-[0.5px] rounded-tl-[10px] border-[#7B7D80] h-10">
                                            Facção
                                        </div>
                                        <div className="bg-[#C9EAF6] px-4 py-2.5 border-[#7B7D80] border-r-[0.5px] h-10">
                                            Operação
                                        </div>
                                        <div className="bg-[#C9EAF6] rounded-tr-[10px] px-4 py-2.5 h-10">
                                            Preço Unitário
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div
                                            ref={parceiroScrollRef}
                                            className="max-h-[180px] overflow-y-auto overflow-x-hidden scrollbar-sutil"
                                            onScroll={(e) =>
                                                setParceiroScrollTop(e.currentTarget.scrollTop)
                                            }
                                        >
                                            {parceiroRows.length > 0 ? (
                                                parceiroRows.map((row, index) => {
                                                    const isLastRow =
                                                        index === parceiroRows.length - 1;
                                                    return (
                                                        <div
                                                            key={`${row.parceiroId}-${index}`}
                                                            className="grid grid-cols-3 items-stretch min-h-[40px] h-[40px]"
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
                                                                    borderBottomLeftRadius:
                                                                        isLastRow ? "10px" : "0px",
                                                                    borderRightColor: "#7B7D80",
                                                                }}
                                                            >
                                                                <span className="text-[14px] font-light text-[#898C8F] truncate">
                                                                    {row.parceiroNome}
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
                                                                        setParceiroRows((p) =>
                                                                            p.map((r, i) =>
                                                                                i === index
                                                                                    ? {
                                                                                          ...r,
                                                                                          operacao:
                                                                                              e
                                                                                                  .target
                                                                                                  .value,
                                                                                      }
                                                                                    : r,
                                                                            ),
                                                                        )
                                                                    }
                                                                    placeholder="-"
                                                                    className="w-full h-[32px] border-0 bg-transparent text-center text-[14px] outline-none focus:ring-0 text-[#898C8F] font-light"
                                                                />
                                                            </div>
                                                            <div
                                                                className={`min-w-0 flex items-center justify-center px-2 ${index % 2 === 1 ? "bg-[#F4F4F4]" : "bg-[#FFFFFF]"} ${isLastRow ? "rounded-br-[14px]" : ""}`}
                                                                style={{
                                                                    borderTopWidth: "0px",
                                                                    borderLeftWidth: "0px",
                                                                    borderRightWidth: "0.5px",
                                                                    borderBottomWidth: "0.5px",
                                                                    borderColor: "#D9D9D9",
                                                                    borderBottomRightRadius:
                                                                        isLastRow ? "10px" : "0px",
                                                                }}
                                                            >
                                                                <input
                                                                    value={row.preco || ""}
                                                                    onChange={(e) => {
                                                                        const numeros =
                                                                            e.target.value.replace(
                                                                                /\D/g,
                                                                                "",
                                                                            );
                                                                        const valorFormatado =
                                                                            numeros
                                                                                ? `R$ ${(Number(numeros) / 100).toFixed(2).replace(".", ",")}`
                                                                                : "";
                                                                        setParceiroRows((prev) =>
                                                                            prev.map((r, i) =>
                                                                                i === index
                                                                                    ? {
                                                                                          ...r,
                                                                                          preco: valorFormatado,
                                                                                          isDirty: true,
                                                                                      }
                                                                                    : r,
                                                                            ),
                                                                        );
                                                                    }}
                                                                    placeholder="R$ -"
                                                                    inputMode="numeric"
                                                                    className="w-full h-[32px] border-0 bg-transparent text-center text-[14px] outline-none focus:ring-0 text-[#898C8F] font-light"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div
                                                    className="px-4 py-5 text-center text-[13px] text-[#888] bg-white rounded-b-[10px]"
                                                    style={BORDER_LIGHT_05}
                                                >
                                                    Nenhum parceiro atribuído ainda.
                                                </div>
                                            )}
                                        </div>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 w-0 overflow-visible">
                                            {parceiroRows.map((row, index) => {
                                                const isVisible = hoveredParceiroIndex === index;
                                                const top =
                                                    index * PARCEIRO_ROW_HEIGHT +
                                                    PARCEIRO_ROW_HEIGHT / 2 -
                                                    parceiroScrollTop;
                                                return (
                                                    <button
                                                        key={`trash-${row.parceiroId}-${index}`}
                                                        type="button"
                                                        onClick={() =>
                                                            setParceiroRows((p) =>
                                                                p.filter((_, i) => i !== index),
                                                            )
                                                        }
                                                        onMouseEnter={() =>
                                                            setHoveredParceiroIndex(index)
                                                        }
                                                        onMouseLeave={() =>
                                                            setHoveredParceiroIndex(null)
                                                        }
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
                                <button
                                    type="button"
                                    onClick={() => setParceiroModalOpen(true)}
                                    className="mt-3 w-full h-[39px] rounded-[10px] bg-[#F4F4F4] hover:bg-[#F0F0F0] transition flex items-center justify-center gap-2 text-[14px] text-[#898C8F]"
                                >
                                    <img
                                        src="/maquina-costura-add.png"
                                        alt="Máquina Ícone"
                                        className="h-4 w-4 object-contain"
                                    />
                                    <span>
                                        {parceiroRows.length > 0
                                            ? "Atribuir mais uma facção"
                                            : "Atribuir facção"}
                                    </span>
                                </button>
                            </div>

                            <div className="mt-8 flex justify-end pt-2 mx-[30px]">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="rounded-[19px] bg-[#A9E2F2] px-10 h-[39px] text-[14px] font-medium text-[#4696AD] transition hover:bg-[#A2DCED]"
                                >
                                    Adicionar ficha
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ProdutoParceiros
                isOpen={parceiroModalOpen}
                parceiros={availableParceiros.filter((parceiro) => {
                    if (!parceiro.categoria) return false;

                    const etapaNormalizada = parceiro.categoria
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase();

                    return etapaNormalizada === "costura" || etapaNormalizada === "faccao";
                })}
                selectedParceiroIds={selectedParceiroIds}
                produtoId={produto?.id}
                onClose={() => setParceiroModalOpen(false)}
                onSelectParceiro={handleSelectParceiroFromModal}
            />

            <CorModal
                isOpen={corModalOpen}
                onClose={() => setCorModalOpen(false)}
                fabricoId={fabricoId}
                onSuccess={handleCorCreated}
            />

            <EstampaModal
                isOpen={estampaModalOpen}
                onClose={() => setEstampaModalOpen(false)}
                fabricoId={fabricoId}
                onSuccess={handleCorCreated}
            />
        </>
    );
}
