/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getFabricoById } from "../../services/fabricoService";
import { getCoresByFabricoId, createCor } from "../../services/corService";
import { getFaccoesByFabrico } from "../../services/faccaoService";
import { getGradesLiberadasByFabricoId } from "../../services/gradeService";
import { atualizarProduto } from "../../services/produtosService";
import {
    createFichaTecnica,
    // getFichaTecnicaById, // deixei disponível caso você queira buscar depois de salvar
} from "../../services/fichaTecnicaService";
import {
    syncFichaTecnicaCores,
    saveFichaTecnicaItens,
    syncFichaTecnicaFaccoes,
    updateFaccaoProdutoPrice,
} from "../../services/fichaTecnicaItemService";

/**
 * Modal de seleção de facções.
 *
 * - singleSelect = true  -> substitui uma facção específica
 * - singleSelect = false -> adiciona várias facções ao mesmo tempo
 */
function FaccaoSelectionModal({
    isOpen,
    title = "Selecionar facções",
    confirmLabel = "Adicionar",
    faccoes = [],
    initialSelectedIds = [],
    singleSelect = false,
    onClose,
    onConfirm,
}) {
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState(() => initialSelectedIds);

    const filteredFaccoes = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return faccoes;
        return faccoes.filter((item) => item?.nome?.toLowerCase().includes(term));
    }, [faccoes, search]);

    const toggle = (id) => {
        if (singleSelect) {
            setSelectedIds([id]);
            return;
        }

        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((current) => current !== id) : [...prev, id],
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm">
            <div
                className="w-full max-w-[720px] rounded-[24px] bg-white px-6 py-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {/* TODO: troque o asset abaixo pelo ícone correto da sua pasta /public */}
                        <img
                            src="/icons/faccao.png"
                            alt="Facções"
                            className="h-7 w-7 object-contain"
                        />
                        <h3 className="text-[22px] font-light text-[#404040]">{title}</h3>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-[22px] leading-none text-[#8C8C8C] transition hover:bg-black/5 hover:text-black"
                        aria-label="Fechar"
                    >
                        ×
                    </button>
                </div>

                <div className="mb-4">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar facção..."
                        className="w-full rounded-[14px] border border-[#D8D8D8] px-4 py-3 text-[14px] outline-none transition focus:border-[#8FD0E6]"
                    />
                </div>

                <div className="max-h-[360px] overflow-y-auto pr-1">
                    <div className="space-y-2">
                        {filteredFaccoes.map((faccao) => {
                            const checked = selectedIds.includes(faccao.id);
                            return (
                                <button
                                    type="button"
                                    key={faccao.id}
                                    onClick={() => toggle(faccao.id)}
                                    className={`flex w-full items-center justify-between rounded-[14px] border px-4 py-3 text-left transition ${checked ? "border-[#C4F042] bg-[#FAFFEE]" : "border-[#E8E8E8] bg-white hover:bg-[#FAFAFA]"}`}
                                >
                                    <div>
                                        <div className="text-[15px] font-medium text-[#404040]">
                                            {faccao.nome}
                                        </div>
                                        {faccao.telefone ? (
                                            <div className="text-[12px] text-[#888]">
                                                {faccao.telefone}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="text-[18px] text-[#6D6D6D]">
                                        {checked ? "✓" : "+"}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-5 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-[#E5E5E5] px-5 py-3 text-[14px] text-[#555] transition hover:bg-[#FAFAFA]"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(selectedIds)}
                        className="rounded-full bg-[#8FD0E6] px-5 py-3 text-[14px] font-medium text-white transition hover:opacity-90"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Célula editável da matriz cor x tamanho.
 * Quando o valor é 0, a UI mostra "-" para ficar visualmente limpa.
 */
function QuantityCell({ value, onCommit }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value > 0 ? String(value) : "");
    const inputRef = useRef(null);

    useEffect(() => {
        if (!editing) {
            setDraft(value > 0 ? String(value) : "");
        }
    }, [value, editing]);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
        }
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
                className={`flex h-[42px] w-full items-center justify-center rounded-[10px] border border-transparent text-[14px] transition hover:border-[#D4EEF7] ${value > 0 ? "text-[#484848]" : "text-[#B3B3B3]"}`}
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
            className="h-[42px] w-full rounded-[10px] border border-[#8FD0E6] text-center text-[14px] outline-none"
        />
    );
}

function normalizeGradeOptions(fabricoGrades = []) {
    return fabricoGrades
        .map((link) => {
            const grade = link?.grade;
            if (!grade) return null;

            const activeVersion =
                grade?.versoes?.find((versao) => versao?.ativo) || grade?.versoes?.[0] || null;

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
                gradeNome: grade.nome,
                gradeAtiva: grade.ativo,
                gradeVersaoId: activeVersion?.id ?? null,
                versao: activeVersion?.versao ?? null,
                sizeItems,
                label: `${grade.nome}${sizeItems.length ? ` (${sizeItems.map((item) => item.codigo).join(" - ")})` : ""}`,
            };
        })
        .filter(Boolean);
}

function buildEmptyMatrix(selectedColorIds, sizeItems) {
    const next = {};
    selectedColorIds.forEach((corId) => {
        next[corId] = {};
        sizeItems.forEach((sizeItem) => {
            next[corId][sizeItem.tamanhoId] = 0;
        });
    });
    return next;
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
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [fabricoInfo, setFabricoInfo] = useState(null);
    const [availableColors, setAvailableColors] = useState([]);
    const [availableFaccoes, setAvailableFaccoes] = useState([]);
    const [gradeOptions, setGradeOptions] = useState([]);

    const [selectedGradeVersionId, setSelectedGradeVersionId] = useState(
        produto?.gradeVersaoId || produto?.grade_versao_id || null,
    );
    const [selectedColorIds, setSelectedColorIds] = useState([]);
    const [matrix, setMatrix] = useState({});
    const [faccaoRows, setFaccaoRows] = useState([]);
    const [observacoes, setObservacoes] = useState("");

    const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
    const [faccaoModalOpen, setFaccaoModalOpen] = useState(false);
    const [replaceFaccaoIndex, setReplaceFaccaoIndex] = useState(null);

    const colorDropdownRef = useRef(null);

    const producaoSobDemanda = Boolean(
        fabricoInfo?.produz_sob_demanda ??
        fabricoInfo?.sob_demanda ??
        fabricoInfo?.producao_sob_demanda ??
        fabricoInfo?.producaoSobDemanda,
    );

    const hasClienteReferencia = Boolean(
        producaoSobDemanda && produto?.clienteNome && produto?.referenciaCliente,
    );

    const infoGridClass = hasClienteReferencia
        ? "grid grid-cols-1 gap-4 md:grid-cols-2"
        : "grid grid-cols-1 gap-4 md:grid-cols-3";

    const currentGradeOption = useMemo(() => {
        return (
            gradeOptions.find((grade) => grade.gradeVersaoId === selectedGradeVersionId) ||
            gradeOptions[0] ||
            null
        );
    }, [gradeOptions, selectedGradeVersionId]);

    const currentSizeItems = currentGradeOption?.sizeItems || [];

    const effectiveGradeVersionId = currentGradeOption?.gradeVersaoId || null;

    const selectedColors = useMemo(
        () =>
            selectedColorIds
                .map((id) => availableColors.find((color) => color.id === id))
                .filter(Boolean),
        [availableColors, selectedColorIds],
    );

    const totalsBySize = useMemo(() => {
        return currentSizeItems.map((sizeItem) =>
            selectedColorIds.reduce(
                (sum, corId) => sum + Number(matrix?.[corId]?.[sizeItem.tamanhoId] || 0),
                0,
            ),
        );
    }, [currentSizeItems, selectedColorIds, matrix]);

    /**
     * Carrega os dados externos necessários para montar o modal.
     * Não usamos storage: ao fechar, o estado fica com o ciclo natural do React.
     */
    useEffect(() => {
        if (!isOpen || !fabricoId || !produto?.id) return;

        let alive = true;

        const bootstrap = async () => {
            setLoading(true);
            setError("");

            try {
                const [fabricoResponse, colorsResponse, faccoesResponse, gradesResponse] =
                    await Promise.all([
                        getFabricoById(fabricoId),
                        getCoresByFabricoId(fabricoId),
                        getFaccoesByFabrico(fabricoId),
                        getGradesLiberadasByFabricoId(fabricoId),
                    ]);

                if (!alive) return;

                setFabricoInfo(fabricoResponse);
                setAvailableColors(Array.isArray(colorsResponse) ? colorsResponse : []);
                setAvailableFaccoes(Array.isArray(faccoesResponse) ? faccoesResponse : []);
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

                // Se não houver cores ainda, deixamos a matriz vazia.
                setMatrix((prev) =>
                    currentSizeItems.length
                        ? syncMatrix(prev, selectedColorIds, currentSizeItems)
                        : prev,
                );
            } catch (err) {
                if (!alive) return;
                setError(err?.message || "Falha ao carregar os dados da ficha técnica.");
            } finally {
                if (alive) setLoading(false);
            }
        };

        bootstrap();

        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, fabricoId, produto?.id]);

    /**
     * Sempre que a grade ou as cores mudam, a matriz acompanha a estrutura.
     * Isso preserva valores que continuem válidos e zera o que não existir mais.
     */
    useEffect(() => {
        if (!currentGradeOption) return;

        setMatrix((prev) => syncMatrix(prev, selectedColorIds, currentGradeOption.sizeItems));
    }, [currentGradeOption?.gradeVersaoId, selectedColorIds]);

    const handleToggleColor = (colorId) => {
        setSelectedColorIds((prev) =>
            prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId],
        );
    };

    const handleRequestNewColor = async () => {
        setColorDropdownOpen(false);

        if (onRequestCreateColor) {
            await Promise.resolve(onRequestCreateColor({ fabricoId }));
        }

        const colorsResponse = await getCoresByFabricoId(fabricoId);
        setAvailableColors(Array.isArray(colorsResponse) ? colorsResponse : []);
    };

    const handleQuantityChange = (corId, tamanhoId, quantity) => {
        setMatrix((prev) => ({
            ...prev,
            [corId]: {
                ...(prev?.[corId] || {}),
                [tamanhoId]: quantity,
            },
        }));
    };

    const openFaccaoModal = (replaceIndex = null) => {
        setReplaceFaccaoIndex(replaceIndex);
        setFaccaoModalOpen(true);
    };

    const handleConfirmFaccoes = (selectedIds) => {
        const selectedObjects = selectedIds
            .map((id) => availableFaccoes.find((faccao) => faccao.id === id))
            .filter(Boolean);

        if (selectedObjects.length === 0) {
            setFaccaoModalOpen(false);
            setReplaceFaccaoIndex(null);
            return;
        }

        setFaccaoRows((prev) => {
            const next = [...prev];
            const existingIds = new Set(next.map((row) => row.faccaoId));

            if (replaceFaccaoIndex !== null && next[replaceFaccaoIndex]) {
                const replacement = selectedObjects[0];

                if (
                    next.some(
                        (row, index) =>
                            index !== replaceFaccaoIndex && row.faccaoId === replacement.id,
                    )
                ) {
                    setError("Essa facção já está atribuída em outra linha.");
                    return prev;
                }

                next[replaceFaccaoIndex] = {
                    ...next[replaceFaccaoIndex],
                    faccaoId: replacement.id,
                    faccaoNome: replacement.nome,
                };
                return next;
            }

            selectedObjects.forEach((faccao) => {
                if (existingIds.has(faccao.id)) return;
                next.push({
                    faccaoId: faccao.id,
                    faccaoNome: faccao.nome,
                    operacao: "",
                    preco: "",
                });
            });

            return next;
        });

        setFaccaoModalOpen(false);
        setReplaceFaccaoIndex(null);
    };

    const removeFaccaoRow = (index) => {
        setFaccaoRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
    };

    const updateFaccaoRow = (index, field, value) => {
        setFaccaoRows((prev) =>
            prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
        );
    };

    const handleSave = async () => {
        if (!produto?.id || !fabricoId) {
            setError("Produto ou fabrico inválido para criar a ficha técnica.");
            return;
        }

        if (!effectiveGradeVersionId) {
            setError("Selecione uma grade válida para continuar.");
            return;
        }

        if (faccaoRows.some((row) => !row.operacao?.trim())) {
            setError("Preencha a operação de todas as facções antes de salvar.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            // Se o usuário trocou a grade do produto, atualizamos o produto antes de criar a ficha.
            if ((produto?.gradeVersaoId || produto?.grade_versao_id) !== effectiveGradeVersionId) {
                await atualizarProduto(produto.id, { grade_versao_id: effectiveGradeVersionId });
            }

            // 1) cria a ficha técnica
            const fichaCreated = await createFichaTecnica({
                observacoes: observacoes?.trim() || null,
                concluida: false,
                fabrico_id: fabricoId,
                produto_id: produto.id,
                etapa_atual_id: etapaAtualId,
            });

            const fichaId = fichaCreated?.id || fichaCreated?.data?.id;
            if (!fichaId) {
                throw new Error("Não foi possível identificar a ficha técnica criada.");
            }

            // 2) sincroniza as cores da ficha (cria a base da matriz)
            if (selectedColorIds.length > 0) {
                await syncFichaTecnicaCores(fichaId, selectedColorIds);
            }

            // 3) salva a matriz cor x tamanho
            const itensPayload = selectedColorIds.flatMap((corId) =>
                currentSizeItems.map((sizeItem) => ({
                    cor_id: corId,
                    grade_versao_item_id: sizeItem.gradeVersaoItemId,
                    quantidade: Number(matrix?.[corId]?.[sizeItem.tamanhoId] || 0),
                })),
            );

            if (itensPayload.length > 0) {
                await saveFichaTecnicaItens(fichaId, itensPayload);
            }

            // 4) sincroniza as facções atribuídas à ficha
            if (faccaoRows.length > 0) {
                await syncFichaTecnicaFaccoes(
                    fichaId,
                    faccaoRows.map((row) => ({
                        faccao_id: row.faccaoId,
                        operacao: row.operacao.trim(),
                        ...(row.preco !== ""
                            ? { preco: Number(String(row.preco).replace(",", ".")) }
                            : {}),
                    })),
                );

                // 5) atualiza preço da relação facção-produto apenas se o usuário digitou um valor.
                await Promise.all(
                    faccaoRows.map(async (row) => {
                        if (row.preco === "" || row.preco === null || row.preco === undefined)
                            return;
                        const parsed = Number(String(row.preco).replace(",", "."));
                        if (Number.isNaN(parsed)) return;
                        await updateFaccaoProdutoPrice(produto.id, row.faccaoId, parsed);
                    }),
                );
            }

            onFichaCreated?.(fichaCreated);
            onClose?.();
        } catch (err) {
            setError(err?.message || "Não foi possível salvar a ficha técnica.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <style>{`
                .scrollbar-sutil::-webkit-scrollbar { width: 4px; height: 4px; }
                .scrollbar-sutil::-webkit-scrollbar-thumb { background-color: #d6d6d6; border-radius: 999px; }
                .scrollbar-sutil::-webkit-scrollbar-track { background: transparent; }
            `}</style>

            <div
                className="fixed inset-0 z-[999] flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="flex max-h-[92vh] w-full max-w-[1260px] flex-col rounded-[28px] bg-white px-8 py-7 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* HEADER */}
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {/* TODO: troque o asset abaixo pelo ícone correto da sua pasta /public */}
                            <img
                                src="/icons/ficha-tecnica.png"
                                alt="Ficha técnica"
                                className="h-8 w-8 object-contain"
                            />
                            <h2 className="text-[26px] font-light text-[#404040]">Ficha Técnica</h2>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full p-2 text-[22px] leading-none text-[#8C8C8C] transition hover:bg-black/5 hover:text-black"
                            aria-label="Fechar modal"
                        >
                            ×
                        </button>
                    </div>

                    {error ? (
                        <div className="mb-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
                            {error}
                        </div>
                    ) : null}

                    {loading ? (
                        <div className="flex min-h-[420px] items-center justify-center rounded-[20px] border border-dashed border-[#EAEAEA] text-[14px] text-[#777]">
                            Carregando dados da ficha técnica...
                        </div>
                    ) : (
                        <>
                            {/* BLOCO SUPERIOR */}
                            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[250px_1fr]">
                                <div className="flex flex-col gap-3">
                                    <div className="flex h-[210px] items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-[#DADADA] bg-[#FAFAFA]">
                                        {produto?.foto ? (
                                            <img
                                                src={produto.foto}
                                                alt={produto?.nome || "Produto"}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center text-[13px] text-[#9B9B9B]">
                                                Sem imagem do produto
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-light text-[#7B7B7B]">
                                            Observações
                                        </label>
                                        <textarea
                                            value={observacoes}
                                            onChange={(e) => setObservacoes(e.target.value)}
                                            placeholder="Observações da ficha técnica"
                                            rows={4}
                                            className="w-full resize-none rounded-[14px] border border-[#D8D8D8] px-4 py-3 text-[14px] outline-none transition focus:border-[#8FD0E6]"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-5">
                                    <div className={infoGridClass}>
                                        <div>
                                            <label className="mb-1 block text-[13px] font-light text-[#7B7B7B]">
                                                Referência Interna
                                            </label>
                                            <input
                                                readOnly
                                                value={produto?.referenciaInterna || "-"}
                                                className="w-full rounded-[14px] border border-[#D8D8D8] bg-white px-4 py-3 text-[14px] outline-none"
                                            />
                                        </div>

                                        {hasClienteReferencia ? (
                                            <div>
                                                <label className="mb-1 block text-[13px] font-light text-[#7B7B7B]">
                                                    Referência da {produto?.clienteNome}
                                                </label>
                                                <input
                                                    readOnly
                                                    value={produto?.referenciaCliente || "-"}
                                                    className="w-full rounded-[14px] border border-[#D8D8D8] bg-white px-4 py-3 text-[14px] outline-none"
                                                />
                                            </div>
                                        ) : null}

                                        <div>
                                            <label className="mb-1 block text-[13px] font-light text-[#7B7B7B]">
                                                Tecido
                                            </label>
                                            <input
                                                readOnly
                                                value={produto?.tecido || "-"}
                                                className="w-full rounded-[14px] border border-[#D8D8D8] bg-white px-4 py-3 text-[14px] outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-[13px] font-light text-[#7B7B7B]">
                                                Grade
                                            </label>
                                            <select
                                                value={effectiveGradeVersionId || ""}
                                                onChange={(e) =>
                                                    setSelectedGradeVersionId(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="w-full rounded-[14px] border border-[#D8D8D8] bg-white px-4 py-3 text-[14px] outline-none transition focus:border-[#8FD0E6]"
                                            >
                                                {gradeOptions.length === 0 ? (
                                                    <option value="">
                                                        Nenhuma grade disponível
                                                    </option>
                                                ) : null}
                                                {gradeOptions.map((grade) => (
                                                    <option
                                                        key={grade.gradeVersaoId}
                                                        value={grade.gradeVersaoId}
                                                    >
                                                        {grade.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* SELETOR DE CORES */}
                                    <div
                                        ref={colorDropdownRef}
                                        className="relative w-full max-w-[320px]"
                                    >
                                        <label className="mb-1 block text-[13px] font-light text-[#7B7B7B]">
                                            Selecionar cores
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => setColorDropdownOpen((prev) => !prev)}
                                            className="flex w-full items-center justify-between rounded-[14px] border border-[#D8D8D8] bg-white px-4 py-3 text-left text-[14px] text-[#555]"
                                        >
                                            <span>
                                                {selectedColorIds.length > 0
                                                    ? `${selectedColorIds.length} cor(es) selecionada(s)`
                                                    : "Selecionar cores"}
                                            </span>
                                            <span
                                                className={`transition ${colorDropdownOpen ? "rotate-180" : ""}`}
                                            >
                                                ⌄
                                            </span>
                                        </button>

                                        <div
                                            className={`absolute z-[30] mt-2 w-full overflow-hidden rounded-[14px] border border-[#E6E6E6] bg-white shadow-lg transition-all ${colorDropdownOpen ? "visible opacity-100" : "pointer-events-none invisible opacity-0"}`}
                                        >
                                            <div className="max-h-[240px] overflow-y-auto scrollbar-sutil">
                                                {availableColors.map((color) => {
                                                    const selected = selectedColorIds.includes(
                                                        color.id,
                                                    );
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={color.id}
                                                            onClick={() =>
                                                                handleToggleColor(color.id)
                                                            }
                                                            className={`flex w-full items-center justify-between border-l-[3px] px-4 py-3 text-left text-[14px] transition ${selected ? "border-l-[#C4F042] bg-[#FAFFEE] text-[#555]" : "border-l-transparent hover:bg-[#FAFAFA]"}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span
                                                                    className="h-4 w-4 rounded-[4px] border border-black/10"
                                                                    style={{
                                                                        backgroundColor:
                                                                            color.codigo_hex ||
                                                                            "#D9D9D9",
                                                                    }}
                                                                />
                                                                <span>{color.nome}</span>
                                                            </div>
                                                            <span className="text-[16px] text-[#7A7A7A]">
                                                                {selected ? "✓" : "+"}
                                                            </span>
                                                        </button>
                                                    );
                                                })}

                                                {/* A opção sempre precisa ser a última. */}
                                                <button
                                                    type="button"
                                                    onClick={handleRequestNewColor}
                                                    className="flex w-full items-center justify-between border-t border-[#F0F0F0] px-4 py-3 text-left text-[14px] font-medium text-[#558AA4] transition hover:bg-[#F7FCFF]"
                                                >
                                                    <span>Adicionar nova cor</span>
                                                    <span>+</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CHIPS DAS CORES SELECIONADAS */}
                                    {selectedColors.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedColors.map((color) => (
                                                <button
                                                    key={color.id}
                                                    type="button"
                                                    onClick={() => handleToggleColor(color.id)}
                                                    className="inline-flex items-center gap-2 rounded-full bg-[#9DD7EF] px-3 py-1.5 text-[13px] text-[#2C6278] transition hover:opacity-90"
                                                >
                                                    <span>{color.nome}</span>
                                                    <span className="rounded-full bg-[#7EB9D1] px-1 text-[11px] text-white">
                                                        ×
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* MATRIZ COR X TAMANHO */}
                            <div className="mt-10">
                                <div className="mb-3 text-center text-[18px] font-light text-[#737373]">
                                    Grade
                                </div>

                                <div className="overflow-hidden rounded-[18px] border border-[#E8E8E8]">
                                    {/* Totais por tamanho */}
                                    <div
                                        className="grid"
                                        style={{
                                            gridTemplateColumns: `180px repeat(${currentSizeItems.length || 1}, minmax(86px, 1fr))`,
                                        }}
                                    >
                                        <div className="border-r border-[#E8E8E8] bg-[#DFF5FF] px-4 py-3 text-center text-[14px] font-light text-[#4696AD]">
                                            Cores
                                        </div>

                                        {currentSizeItems.length > 0 ? (
                                            currentSizeItems.map((sizeItem, index) => {
                                                const total = totalsBySize[index] || 0;
                                                return (
                                                    <div
                                                        key={sizeItem.gradeVersaoItemId}
                                                        className={`border-r border-[#E8E8E8] bg-white px-2 py-2 text-center text-[13px] text-[#B0B0B0] ${total === 0 ? "opacity-60" : "opacity-100"}`}
                                                    >
                                                        {total}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="bg-white px-4 py-3 text-center text-[13px] text-[#BBB]">
                                                -
                                            </div>
                                        )}
                                    </div>

                                    {/* Cabeçalho dos tamanhos */}
                                    <div
                                        className="grid"
                                        style={{
                                            gridTemplateColumns: `180px repeat(${currentSizeItems.length || 1}, minmax(86px, 1fr))`,
                                        }}
                                    >
                                        <div className="border-r border-[#E8E8E8] bg-[#DFF5FF] px-4 py-4 text-center text-[14px] font-light text-[#4696AD]">
                                            Cores
                                        </div>

                                        {currentSizeItems.length > 0 ? (
                                            currentSizeItems.map((sizeItem, index) => {
                                                const total = totalsBySize[index] || 0;
                                                return (
                                                    <div
                                                        key={sizeItem.gradeVersaoItemId}
                                                        className={`border-r border-[#E8E8E8] bg-[#DFF5FF] px-2 py-3 text-center text-[14px] font-light text-[#4696AD] ${total === 0 ? "opacity-65" : "opacity-100"}`}
                                                    >
                                                        {sizeItem.codigo}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="bg-[#DFF5FF] px-4 py-4 text-center text-[13px] text-[#4696AD]">
                                                Sem tamanhos
                                            </div>
                                        )}
                                    </div>

                                    {/* Linhas */}
                                    <div className="max-h-[290px] overflow-y-auto scrollbar-sutil">
                                        {selectedColors.length > 0 ? (
                                            selectedColors.map((color, rowIndex) => (
                                                <div
                                                    key={color.id}
                                                    className={`group grid items-stretch ${rowIndex % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}`}
                                                    style={{
                                                        gridTemplateColumns: `180px repeat(${currentSizeItems.length || 1}, minmax(86px, 1fr))`,
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3 border-r border-[#E8E8E8] px-4 py-3">
                                                        <span
                                                            className="h-5 w-5 rounded-[5px] border border-black/10"
                                                            style={{
                                                                backgroundColor:
                                                                    color.codigo_hex || "#D9D9D9",
                                                            }}
                                                        />
                                                        <span className="max-w-[120px] truncate text-[14px] font-light text-[#404040]">
                                                            {color.nome}
                                                        </span>
                                                    </div>

                                                    {currentSizeItems.length > 0 ? (
                                                        currentSizeItems.map((sizeItem, index) => {
                                                            const total = totalsBySize[index] || 0;
                                                            const faded = total === 0;
                                                            const value = Number(
                                                                matrix?.[color.id]?.[
                                                                    sizeItem.tamanhoId
                                                                ] || 0,
                                                            );

                                                            return (
                                                                <div
                                                                    key={sizeItem.gradeVersaoItemId}
                                                                    className={`border-r border-[#E8E8E8] px-2 py-2 ${faded ? "bg-white/60" : "bg-inherit"}`}
                                                                >
                                                                    <QuantityCell
                                                                        value={value}
                                                                        onCommit={(nextValue) =>
                                                                            handleQuantityChange(
                                                                                color.id,
                                                                                sizeItem.tamanhoId,
                                                                                nextValue,
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="flex items-center justify-center px-4 py-4 text-[13px] text-[#BBB]">
                                                            -
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div
                                                className="grid items-stretch bg-white"
                                                style={{
                                                    gridTemplateColumns: `180px repeat(${currentSizeItems.length || 1}, minmax(86px, 1fr))`,
                                                }}
                                            >
                                                <div className="border-r border-[#E8E8E8] px-4 py-4 text-[14px] text-[#7D7D7D]">
                                                    Nenhuma cor selecionada
                                                </div>
                                                {currentSizeItems.length > 0 ? (
                                                    currentSizeItems.map((sizeItem) => (
                                                        <div
                                                            key={sizeItem.gradeVersaoItemId}
                                                            className="border-r border-[#E8E8E8] px-2 py-2"
                                                        >
                                                            <QuantityCell
                                                                value={0}
                                                                onCommit={() => {}}
                                                            />
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-4 text-center text-[13px] text-[#BBB]">
                                                        -
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* FACÇÕES */}
                            <div className="mt-6">
                                <div className="mb-3 text-center text-[18px] font-light text-[#737373]">
                                    Facção
                                </div>

                                <div className="overflow-hidden rounded-[18px] border border-[#E8E8E8]">
                                    <div className="grid grid-cols-[1.5fr_1fr_120px_56px] bg-[#DFF5FF]">
                                        <div className="px-4 py-3 text-center text-[14px] font-light text-[#4696AD]">
                                            Facção
                                        </div>
                                        <div className="px-4 py-3 text-center text-[14px] font-light text-[#4696AD]">
                                            Operação
                                        </div>
                                        <div className="px-4 py-3 text-center text-[14px] font-light text-[#4696AD]">
                                            Preço
                                        </div>
                                        <div className="px-4 py-3 text-center text-[14px] font-light text-[#4696AD]">
                                            &nbsp;
                                        </div>
                                    </div>

                                    <div className="max-h-[220px] overflow-y-auto scrollbar-sutil">
                                        {faccaoRows.length > 0 ? (
                                            faccaoRows.map((row, index) => (
                                                <div
                                                    key={`${row.faccaoId}-${index}`}
                                                    className="group grid grid-cols-[1.5fr_1fr_120px_56px] items-center border-t border-[#ECECEC] bg-white"
                                                >
                                                    <div className="relative border-r border-[#E8E8E8] px-4 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => openFaccaoModal(index)}
                                                            className="group/faccao relative w-full text-left text-[14px] font-light text-[#404040]"
                                                        >
                                                            <span className="inline-block max-w-[250px] truncate">
                                                                {row.faccaoNome}
                                                            </span>
                                                            <span className="pointer-events-none absolute left-0 top-full mt-1 rounded-full bg-[#DFF5FF] px-3 py-1 text-[11px] text-[#4696AD] opacity-0 transition group-hover/faccao:opacity-100">
                                                                substituir facção
                                                            </span>
                                                        </button>
                                                    </div>

                                                    <div className="border-r border-[#E8E8E8] px-3 py-3">
                                                        <input
                                                            value={row.operacao}
                                                            onChange={(e) =>
                                                                updateFaccaoRow(
                                                                    index,
                                                                    "operacao",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="Ex: Costura"
                                                            className="w-full rounded-[12px] border border-[#D8D8D8] px-3 py-2 text-[14px] outline-none transition focus:border-[#8FD0E6]"
                                                        />
                                                    </div>

                                                    <div className="border-r border-[#E8E8E8] px-3 py-3">
                                                        <input
                                                            value={row.preco}
                                                            onChange={(e) =>
                                                                updateFaccaoRow(
                                                                    index,
                                                                    "preco",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="R$ 0,00"
                                                            inputMode="decimal"
                                                            className="w-full rounded-[12px] border border-[#D8D8D8] px-3 py-2 text-[14px] outline-none transition focus:border-[#8FD0E6]"
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-center px-3 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFaccaoRow(index)}
                                                            className="opacity-0 transition group-hover:opacity-100"
                                                            aria-label="Excluir facção"
                                                        >
                                                            {/* TODO: troque o asset abaixo pelo ícone correto da sua pasta /public */}
                                                            <img
                                                                src="/icons/trash.png"
                                                                alt="Excluir"
                                                                className="h-5 w-5 object-contain"
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="border-t border-[#ECECEC] px-4 py-5 text-center text-[13px] text-[#8A8A8A]">
                                                Nenhuma facção atribuída ainda.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <button
                                        type="button"
                                        onClick={() => openFaccaoModal(null)}
                                        className="w-full rounded-[16px] bg-[#F5F5F5] px-5 py-4 text-[14px] text-[#707070] transition hover:bg-[#EEEEEE]"
                                    >
                                        {faccaoRows.length > 0
                                            ? "Atribuir mais uma facção"
                                            : "Atribuir facção"}
                                    </button>
                                </div>
                            </div>

                            {/* BOTÕES */}
                            <div className="mt-8 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-full border border-[#E5E5E5] px-6 py-3 text-[14px] text-[#666] transition hover:bg-[#FAFAFA]"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="rounded-full bg-[#8FD0E6] px-7 py-3 text-[14px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {saving ? "Salvando..." : "Adicionar ficha"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal interno de facções */}
            <FaccaoSelectionModal
                isOpen={faccaoModalOpen}
                title={replaceFaccaoIndex !== null ? "Substituir facção" : "Selecionar facções"}
                confirmLabel={replaceFaccaoIndex !== null ? "Substituir" : "Adicionar"}
                faccoes={availableFaccoes}
                initialSelectedIds={
                    replaceFaccaoIndex !== null && faccaoRows[replaceFaccaoIndex]
                        ? [faccaoRows[replaceFaccaoIndex].faccaoId]
                        : []
                }
                singleSelect={replaceFaccaoIndex !== null}
                onClose={() => {
                    setFaccaoModalOpen(false);
                    setReplaceFaccaoIndex(null);
                }}
                onConfirm={handleConfirmFaccoes}
            />
        </>
    );
}
// ```

// ---

// ### Observações rápidas
// - A persistência em `sessionStorage` foi removida completamente.
// - O warning de `setSearch` desaparece porque o modal de facções não faz mais sync de estado via `useEffect`.
// - As chamadas de API ficaram isoladas em `src/services`.
// - O campo de referência do cliente só aparece quando existe vínculo e o fabrico é sob demanda.
// - A opção `Adicionar nova cor` continua sendo o último item do dropdown e chama um callback externo.
// - O path de `faccao-produto` pode precisar de ajuste se o nome real da sua rota for diferente.
