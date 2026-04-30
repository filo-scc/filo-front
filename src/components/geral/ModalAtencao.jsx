import React from "react";

export default function ModalAtencao({ isOpen, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm font-Outfit">
            <div className="relative bg-[#F3F4FA] rounded-[24px] p-8 w-[90%] max-w-[420px] shadow-xl flex flex-col items-center text-center">
                {/* Ícone de aviso */}
                <div className="w-12 h-12 rounded-full bg-[#FDE8E8] flex items-center justify-center mb-4">
                    <img src="/atencao.png" className="w-6 h-6" alt="Aviso" />
                </div>

                <p className="text-[18px] font-medium text-[#404040] mb-2">Atenção!</p>

                <p className="text-[15px] font-light text-[#6B6B6B] px-4 mb-8">
                    Este produto não pertence ou não existe no seu fabrico. Você será redirecionado
                    para a lista de produtos.
                </p>

                <button
                    onClick={onConfirm}
                    className="w-full h-[39px] rounded-[18.9px] bg-[#A9E2F2] text-[#4696AD] font-light text-[16px] transition-colors hover:bg-[#A2DCED]"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
}
