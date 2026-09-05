export default function ConfirmacaoFichaModal({
    isOpen,
    mensagem,
    onCancel,
    onConfirm,
    textoCancel,
    textoConfirm,
}) {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/35 backdrop-blur-[1px] font-['Outfit',_sans-serif]"
            onClick={onCancel}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={mensagem}
                className="bg-[#F3F4FA] rounded-[24px] p-8 w-[90%] max-w-[520px] shadow-xl text-center"
                onClick={(event) => event.stopPropagation()}
            >
                <p className="text-[18px] font-light text-[#898C8F] mb-8">{mensagem}</p>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 min-h-[39px] px-3 py-2 rounded-[18.9px] bg-[#D75757] text-white text-[14px]"
                    >
                        {textoConfirm}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 min-h-[39px] px-3 py-2 rounded-[18.9px] bg-[#A9E2F2] text-[#4696AD] text-[14px]"
                    >
                        {textoCancel}
                    </button>
                </div>
            </div>
        </div>
    );
}
