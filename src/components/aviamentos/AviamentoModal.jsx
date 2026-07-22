import { useCallback, useEffect, useMemo, useState } from "react";
import FloatingLabelInput from "../FloatingLabelInput";
import { createAviamento, updateAviamento } from "../../services/aviamentoService";

const UNIDADES_OPCOES = ["METRO", "CENTIMETRO", "GRAMA", "QUILOGRAMA", "UNIDADE", "PAR"];

const UNIDADES_LABELS = {
    METRO: "Metro (m)",
    CENTIMETRO: "Centímetro (cm)",
    GRAMA: "Grama (g)",
    QUILOGRAMA: "Quilograma (kg)",
    UNIDADE: "Unidade (un)",
    PAR: "Par (par)",
};

const normalizarUnidade = (unidade) => String(unidade || "").toUpperCase();

const formatarUnidadeDeMedida = (unidade) => {
    const unidadeNormalizada = normalizarUnidade(unidade);
    return UNIDADES_LABELS[unidadeNormalizada] || unidade || "";
};

const parseNumero = (valor) => {
    const numero = Number(String(valor || "").replace(",", "."));
    return Number.isFinite(numero) ? numero : 0;
};

const formatarMoeda = (valor) => {
    const numero = Number(valor);
    return (Number.isFinite(numero) ? numero : 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
};

function CustoOption({ checked, label, onSelect }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className="flex items-center gap-2 text-[14px] font-light text-[#404040]"
        >
            <span className="relative flex h-5 w-5 items-center justify-center">
                {checked ? (
                    <img
                        src="/checkmark-background.png"
                        alt=""
                        className="h-5 w-5 object-contain"
                    />
                ) : (
                    <span className="h-[16px] w-[16px] rounded-[4px] border border-[#C4C8CD] bg-white" />
                )}
                {checked && (
                    <img
                        src="/checkmark.png"
                        alt=""
                        className="absolute inset-0 h-5 w-5 object-contain"
                    />
                )}
            </span>
            {label}
        </button>
    );
}

export default function AviamentoModal({
    isOpen,
    onClose,
    onSuccess,
    mode = "create",
    fabricoId,
    aviamento,
}) {
    const [nome, setNome] = useState("");
    const [unidadeMedida, setUnidadeMedida] = useState("");
    const [tipoCusto, setTipoCusto] = useState("unitario");
    const [custoUnitario, setCustoUnitario] = useState("");
    const [valorPago, setValorPago] = useState("");
    const [quantidadeAdquirida, setQuantidadeAdquirida] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const isEditMode = mode === "edit";
    const titulo = isEditMode ? "Editar aviamento" : "Cadastrar aviamento";
    const textoBotao = isEditMode ? "Concluir edição" : "Concluir cadastro";

    const custoCalculado = useMemo(() => {
        if (tipoCusto === "unitario") return parseNumero(custoUnitario);
        const quantidade = parseNumero(quantidadeAdquirida);
        if (quantidade <= 0) return 0;
        return parseNumero(valorPago) / quantidade;
    }, [custoUnitario, quantidadeAdquirida, tipoCusto, valorPago]);

    const resetForm = useCallback(() => {
        setNome("");
        setUnidadeMedida("");
        setTipoCusto("unitario");
        setCustoUnitario("");
        setValorPago("");
        setQuantidadeAdquirida("");
        setSubmitting(false);
        setError("");
        setIsDropdownOpen(false);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            resetForm();
            return;
        }

        if (!isEditMode || !aviamento) return;

        const custo = aviamento.custo_unitario ?? aviamento.custo ?? "";
        setNome(aviamento.nome || "");
        setUnidadeMedida(normalizarUnidade(aviamento.unidade_de_medida));
        setTipoCusto("unitario");
        setCustoUnitario(custo === "" || custo == null ? "" : String(custo).replace(".", ","));
        setValorPago("");
        setQuantidadeAdquirida("");
        setError("");
        setIsDropdownOpen(false);
    }, [aviamento, isEditMode, isOpen, resetForm]);

    const handleClose = useCallback(() => {
        if (submitting) return;
        resetForm();
        onClose?.();
    }, [onClose, resetForm, submitting]);

    const handleSubmit = async () => {
        const nomeTrim = nome.trim();
        const unidadeNormalizada = normalizarUnidade(unidadeMedida);

        if (!nomeTrim) {
            setError("Informe o nome do aviamento.");
            return;
        }

        if (!unidadeNormalizada) {
            setError("Selecione uma unidade de medida.");
            return;
        }

        if (!Number.isFinite(Number(fabricoId))) {
            setError("Não foi possível identificar a fábrica do usuário.");
            return;
        }

        if (tipoCusto === "compra" && parseNumero(quantidadeAdquirida) <= 0) {
            setError("Informe uma quantidade adquirida maior que zero.");
            return;
        }

        if (custoCalculado < 0) {
            setError("Informe um custo válido.");
            return;
        }

        const payload = {
            nome: nomeTrim,
            fabrico_id: Number(fabricoId),
            unidade_de_medida: unidadeNormalizada,
            custo_unitario: Number(custoCalculado.toFixed(2)),
        };

        try {
            setSubmitting(true);
            setError("");

            const aviamentoSalvo = isEditMode
                ? await updateAviamento(aviamento.id, payload)
                : await createAviamento(payload);

            await onSuccess?.(aviamentoSalvo);
            resetForm();
            onClose?.();
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                    `Não foi possível ${isEditMode ? "editar" : "cadastrar"} o aviamento. Tente novamente.`,
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm font-['Outfit',_sans-serif]"
            onClick={handleClose}
        >
            <div
                className="relative w-full max-w-[680px] rounded-[26px] bg-white px-10 py-9 shadow-[4px_4px_18px_rgba(0,0,0,0.12)] font-light"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src={
                                isEditMode ? "/aviamentos-ativado.png" : "/cadastrar-aviamento.png"
                            }
                            alt=""
                            className="h-[28px] w-[28px] object-contain"
                        />
                        <h2 className="text-[26px] font-light text-[#404040]">{titulo}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="transition opacity-80 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Fechar"
                    >
                        <img src="/fechar-cinza.png" className="w-3 h-3" alt="Fechar" />
                    </button>
                </div>

                {error ? (
                    <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-700">
                        {error}
                    </div>
                ) : null}

                <div className="space-y-6">
                    <div>
                        <label className="mb-3 block text-[14px] font-light text-[#4696AD]">
                            Informações
                        </label>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FloatingLabelInput
                                label="Nome do aviamento"
                                value={nome}
                                onChange={(event) => setNome(event.target.value)}
                                inputClassName="border-[#898C8F] text-[14px] text-[#898C8F]"
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                            />

                            <div className="relative w-full">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                                    className="flex h-[39px] w-full items-center justify-between rounded-[10px] border border-[#898C8F] px-3 text-[14px] font-light text-[#898C8F] focus:outline-none"
                                >
                                    <span>
                                        {unidadeMedida
                                            ? formatarUnidadeDeMedida(unidadeMedida)
                                            : "Unidade de medida"}
                                    </span>
                                    <img
                                        src="/arrow-down.png"
                                        alt=""
                                        className={`h-2 w-3 object-contain transition-transform duration-200 ${
                                            isDropdownOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute left-0 top-[43px] z-50 max-h-[180px] w-full overflow-y-auto rounded-[10px] border border-[#898C8F] bg-white py-1 shadow-lg scrollbar-sutil">
                                        {UNIDADES_OPCOES.map((unidade) => (
                                            <button
                                                key={unidade}
                                                type="button"
                                                onClick={() => {
                                                    setUnidadeMedida(unidade);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full px-3 py-2 text-left text-[14px] font-light transition hover:bg-gray-50 ${
                                                    unidadeMedida === unidade
                                                        ? "bg-gray-100 font-normal text-[#4696AD]"
                                                        : "text-[#898C8F]"
                                                }`}
                                            >
                                                {formatarUnidadeDeMedida(unidade)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="mb-3 block text-[14px] font-light text-[#4696AD]">
                            Como deseja informar o custo?
                        </label>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                            <CustoOption
                                checked={tipoCusto === "unitario"}
                                label="Já sei o custo unitário"
                                onSelect={() => setTipoCusto("unitario")}
                            />
                            <CustoOption
                                checked={tipoCusto === "compra"}
                                label="Calcular a partir da compra"
                                onSelect={() => setTipoCusto("compra")}
                            />
                        </div>
                    </div>

                    {tipoCusto === "unitario" ? (
                        <div className="w-full md:w-1/2 md:pr-2">
                            <FloatingLabelInput
                                label="Custo unitário"
                                value={custoUnitario}
                                onChange={(event) => setCustoUnitario(event.target.value)}
                                inputClassName="border-[#898C8F] text-[14px] text-[#898C8F]"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FloatingLabelInput
                                    label="Valor pago"
                                    value={valorPago}
                                    onChange={(event) => setValorPago(event.target.value)}
                                    inputClassName="border-[#898C8F] text-[14px] text-[#898C8F]"
                                />
                                <FloatingLabelInput
                                    label="Quantidade adquirida"
                                    value={quantidadeAdquirida}
                                    onChange={(event) => setQuantidadeAdquirida(event.target.value)}
                                    inputClassName="border-[#898C8F] text-[14px] text-[#898C8F]"
                                />
                            </div>

                            <div className="w-full md:w-1/2 md:pr-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={formatarMoeda(custoCalculado)}
                                    className="h-[39px] w-full rounded-[10px] border border-[#C4C8CD] bg-gray-50 px-3 text-[14px] font-light text-[#C4C8CD] focus:outline-none cursor-not-allowed select-none"
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={handleSubmit}
                            className="h-[39px] shrink-0 rounded-full bg-[#A9E2F2] px-6 text-[15px] font-light text-[#4696AD] transition hover:bg-[#94d6eb] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {submitting ? "Salvando..." : textoBotao}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
