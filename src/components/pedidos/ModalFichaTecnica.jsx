export default function ModalFichaTecnica({ isOpen, onClose, referencia }) {
    void referencia;

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm font-['Outfit',_sans-serif]"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-[900px] rounded-[24px] shadow-[4px_4px_10px_2px_rgba(0,0,0,0.15)] p-8 mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/etiqueta_cinza.png"
                            alt=""
                            className="w-[26px] h-[26px] object-contain"
                        />
                        <h2 className="text-[26px] font-light text-[#404040]">Ficha Técnica</h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar modal"
                        className="p-2 hover:opacity-70 transition-opacity"
                    >
                        <img src="/fechar-cinza.png" alt="Fechar" className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
