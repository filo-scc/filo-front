import React from "react";

export default function ModalAtencao({
    isOpen,
    onConfirm,
    titulo = "Atenção!",
    mensagem,
    textoBotao = "Entendido",
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm font-Outfit">
            <div className="relative bg-[#F3F4FA] rounded-[24px] p-8 w-[90%] max-w-[420px] shadow-xl flex flex-col items-center text-center">
                {/* Título Dinâmico */}
                <p className="text-[18px] font-medium text-[#404040] mb-2">{titulo}</p>

                <p className="text-[15px] font-light text-[#6B6B6B] px-4 mb-8">
                    {mensagem || "Você será redirecionado."}
                </p>

                <button
                    onClick={onConfirm}
                    className="w-full h-[39px] rounded-[18.9px] bg-[#A9E2F2] text-[#4696AD] font-light text-[16px] transition-colors hover:bg-[#A2DCED]"
                >
                    {textoBotao}
                </button>
            </div>
        </div>
    );
}
