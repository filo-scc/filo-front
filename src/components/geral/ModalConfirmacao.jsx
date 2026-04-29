import React from "react";

export default function ModalConfirmacao({ isOpen, onClose, type }) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm transition-opacity font-Outfit"
            onClick={onClose}
        >
            <div
                className="relative bg-[#F3F4FA] rounded-[24px] p-8 w-[90%] max-w-[400px] shadow-xl flex flex-col items-center text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5"
                    aria-label="Fechar modal"
                >
                    <img src="/fechar-cinza.png" className="w-3 h-3" alt="Fechar" />
                </button>

                {/* Texto dinâmico utilizando o tipoItem */}
                <p className="text-[18px] font-light text-[#404040] px-6 mb-8">
                    Cadastro {type} com sucesso!
                </p>

                <div className="flex gap-4 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 h-[39px] rounded-[18.9px] bg-[#A9E2F2] text-[#4696AD] font-light text-[16px] transition-colors hover:bg-[#A2DCED]"
                    >
                        Ok
                    </button>
                </div>
            </div>
        </div>
    );
}
