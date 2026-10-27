import React from "react";
import ParceiroForm from "./ParceiroForm.jsx";

// Cadastro de parceiro dentro de outro fluxo (ex.: modal de transferência de etapa).
// O z-index fica acima do modal de transferência (z-[9999]).
export default function NovoParceiroModal({ isOpen, onClose, etapa, onSuccess }) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-2 font-['Outfit'] sm:px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="novo-parceiro-titulo"
        >
            <div className="scrollbar-sutil relative max-h-[96dvh] w-full max-w-5xl overflow-y-auto rounded-[20px] bg-white p-4 shadow-2xl sm:max-h-[90vh] sm:rounded-[24px] sm:p-8">
                <div className="mb-8 flex items-start justify-between">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <img
                                src="/maquina+-costura-icone-preto.png"
                                alt=""
                                className="h-5 w-5 object-contain"
                            />
                            <h2
                                id="novo-parceiro-titulo"
                                className="text-[22px] font-light leading-none text-[#404040]"
                            >
                                Novo Parceiro
                            </h2>
                        </div>
                        {etapa?.nome && (
                            <p className="ml-7 mt-1 text-[14px] font-light leading-none text-[#7B7D80]">
                                Etapa de produção: {etapa.nome}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 transition-colors"
                        aria-label="Fechar"
                    >
                        <img src="/fechar-cinza.png" alt="" className="h-3 w-3 opacity-50" />
                    </button>
                </div>

                <ParceiroForm
                    etapaInicial={etapa}
                    etapaFixa={Boolean(etapa?.id)}
                    onSuccess={onSuccess}
                    onCancel={onClose}
                />
            </div>
        </div>
    );
}
