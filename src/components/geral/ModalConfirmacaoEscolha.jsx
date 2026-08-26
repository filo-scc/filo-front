export default function ModalConfirmacaoEscolha({
    isOpen,
    onClose,
    onConfirm,
    mensagem,
    textoNao = "Não",
    textoSim = "Sim",
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-[1px] transition-opacity font-Outfit"
            onClick={onClose}
        >
            <div
                className="relative bg-[#F3F4FA] rounded-[24px] p-8 w-[90%] max-w-[420px] shadow-xl flex flex-col items-center text-center"
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

                <p className="text-[18px] font-light text-[#898C8F] px-6 mb-8">{mensagem}</p>

                <div className="flex gap-4 w-full">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-[39px] rounded-[18.9px] bg-[#D75757] text-white font-light text-[16px] transition-colors hover:bg-[#D74646]"
                    >
                        {textoNao}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 h-[39px] rounded-[18.9px] bg-[#A9E2F2] text-[#4696AD] font-light text-[16px] transition-colors hover:bg-[#A2DCED]"
                    >
                        {textoSim}
                    </button>
                </div>
            </div>
        </div>
    );
}
