import { useCallback, useEffect, useState } from "react";
import FloatingLabelInput from "../FloatingLabelInput";
import { criarTipoProduto } from "../../services/produtoService";

export default function ModeloModal({ isOpen, onClose, onSuccess }) {
    const [nome, setNome] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const resetForm = useCallback(() => {
        setNome("");
        setSubmitting(false);
        setError("");
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose?.();
    }, [onClose, resetForm]);

    useEffect(() => {
        if (!isOpen) resetForm();
    }, [isOpen, resetForm]);

    const handleSubmit = async () => {
        const nomeTrim = nome.trim();
        if (!nomeTrim) {
            setError("Informe o nome do modelo.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const created = await criarTipoProduto({ nome: nomeTrim });
            const nomeCriado = created?.nome || nomeTrim;
            onSuccess?.(nomeCriado, created);
            handleClose();
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                    "Não foi possível cadastrar o modelo. Tente novamente.",
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
                className="relative w-full max-w-[580px] rounded-[28px] bg-white px-10 py-9 shadow-[4px_4px_18px_rgba(0,0,0,0.12)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/adicionar-produtos-preto.png"
                            alt=""
                            className="h-[28px] w-[28px] object-contain"
                        />
                        <h2 className="text-[26px] font-light text-[#404040]">
                            Cadastrar tipo de modelo
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="transition opacity-80 hover:opacity-100"
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

                <div>
                    <label className="mb-2 block text-[14px] font-light text-[#4696AD]">
                        Novo tipo de modelo
                    </label>
                    <div className="flex items-center gap-4">
                        <FloatingLabelInput
                            label="Nome do tipo de modelo"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="flex-1"
                            inputClassName="border-[#898C8F] text-[14px] text-[#404040]"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={handleSubmit}
                            className="h-[39px] shrink-0 rounded-full bg-[#A9E2F2] px-6 text-[15px] font-light text-[#4696AD] transition hover:bg-[#94d6eb] disabled:opacity-60 whitespace-nowrap"
                        >
                            {submitting ? "Salvando..." : "Concluir cadastro"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
