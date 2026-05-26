import React, { useCallback, useEffect, useRef, useState } from "react";
import FloatingLabelInput from "../FloatingLabelInput";
import { createCor, getApiErrorMessage } from "../../services/corService";
import { upload } from "../../services/utilsService";

export default function EstampaModal({ isOpen, onClose, fabricoId, onSuccess }) {
    const inputFileRef = useRef(null);
    const [nome, setNome] = useState("");
    const [arquivoImagem, setArquivoImagem] = useState(null);
    const [imagemPreview, setImagemPreview] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const resetForm = useCallback(() => {
        setNome("");
        setArquivoImagem(null);
        setImagemPreview("");
        setSubmitting(false);
        setError("");
        if (inputFileRef.current) inputFileRef.current.value = "";
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose?.();
    }, [onClose, resetForm]);

    useEffect(() => {
        if (!isOpen) resetForm();
    }, [isOpen, resetForm]);

    const handleImagemChange = (event) => {
        const arquivo = event.target.files?.[0];
        if (!arquivo) return;

        setArquivoImagem(arquivo);
        setImagemPreview(URL.createObjectURL(arquivo));
        setError("");
    };

    const handleSubmit = async () => {
        const nomeTrim = nome.trim();
        if (!nomeTrim) {
            setError("Informe o nome da estampa.");
            return;
        }
        if (!arquivoImagem) {
            setError("Selecione a imagem da estampa.");
            return;
        }

        const fabricoIdNumerico = Number(fabricoId);
        if (!Number.isFinite(fabricoIdNumerico) || fabricoIdNumerico <= 0) {
            setError("Fabrico inválido. Recarregue a página e tente novamente.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            let urlFoto = undefined;

            // Realiza o upload caso tenha uma imagem selecionada
            if (arquivoImagem) {
                const uploadData = new FormData();
                uploadData.append("file", arquivoImagem);

                const responseUpload = await upload(uploadData);

                if (responseUpload && responseUpload.url) {
                    urlFoto = responseUpload.url;
                }
            }

            const created = await createCor({
                fabrico_id: fabricoIdNumerico,
                nome: nomeTrim,
                foto: urlFoto,
                tipo: "ESTAMPA",
            });

            onSuccess?.(created);
            handleClose();
        } catch (err) {
            console.error(err);
            setError(
                getApiErrorMessage(
                    err,
                    "Não foi possível cadastrar a estampa. Tente novamente.",
                ),
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
                className="relative w-full max-w-[620px] rounded-[28px] bg-white px-10 py-9 shadow-[4px_4px_18px_rgba(0,0,0,0.12)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/add-estampa.png"
                            alt=""
                            className="h-[28px] w-[28px] object-contain"
                        />
                        <h2 className="text-[26px] font-light text-[#404040]">Cadastrar estampa</h2>
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

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-5 sm:grid-rows-[auto_1fr] sm:items-stretch sm:gap-x-10 sm:gap-y-2">
                    <p className="text-[14px] font-light text-[#4696AD] sm:col-span-2 sm:row-start-1">
                        Imagem da estampa
                    </p>

                    <div className="relative min-h-[116px] sm:col-span-2 sm:row-start-2 sm:min-h-0">
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
                            className="flex h-full min-h-[116px] w-full items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-[#D0D0D0] bg-white transition hover:border-[#4696AD]/60 sm:absolute sm:inset-0 sm:min-h-0"
                        >
                            {imagemPreview ? (
                                <img
                                    src={imagemPreview}
                                    alt="Preview da estampa"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <img
                                    src="/add-image-icon.png"
                                    alt=""
                                    className="h-[22px] w-[22px] object-contain opacity-60"
                                />
                            )}
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 sm:col-span-3 sm:col-start-3 sm:row-start-2">
                        <FloatingLabelInput
                            label="Nome da estampa"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            inputClassName="border-[#898C8F] text-[14px] text-[#404040]"
                        />

                        <div className="invisible pointer-events-none select-none" aria-hidden="true">
                            <label className="mb-2 block text-[14px] font-light text-[#4696AD]">
                                Código HEX
                            </label>
                            <div className="relative w-full">
                                <div className="h-[39px] w-full rounded-[10px] border border-[#898C8F]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSubmit}
                        className="h-[39px] rounded-full bg-[#A9E2F2] px-8 text-[15px] font-light text-[#4696AD] transition hover:bg-[#94d6eb] disabled:opacity-60"
                    >
                        {submitting ? "Salvando..." : "Concluir cadastro"}
                    </button>
                </div>
            </div>
        </div>
    );
}
