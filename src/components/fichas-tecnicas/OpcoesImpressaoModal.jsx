export default function OpcoesImpressaoModal({
    isOpen,
    onClose,
    onSelectFichaTecnica,
    onSelectNotaSaida,
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#F2F5F8] rounded-[30px] w-full max-w-[420px] px-8 py-8 shadow-xl relative flex flex-col items-center font-['Outfit',_sans-serif]">
                {/* Botão de Fechar (X) */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-lg transition-colors"
                    aria-label="Fechar"
                >
                    ✕
                </button>

                {/* Pergunta / Título */}
                <h2 className="text-[21px] font-normal text-[#4A5568] text-center mb-7 tracking-tight">
                    O que você deseja imprimir?
                </h2>

                {/* Botões de Ação */}
                <div className="flex items-center justify-center gap-4 w-full">
                    <button
                        onClick={() => {
                            if (onSelectFichaTecnica) onSelectFichaTecnica();
                            onClose();
                            window.location.href = "/"; 
                        }}
                        className="bg-[#AEE2F3] hover:bg-[#99D9EB] text-[#3B92A7] font-medium py-2.5 px-6 rounded-full text-[15px] transition-colors focus:outline-none"
                    >
                        Ficha técnica
                    </button>

                    <button
                        onClick={() => {
                            if (onSelectNotaSaida) onSelectNotaSaida();
                            onClose();
                            window.location.href = "/"; 
                        }}
                        className="bg-[#AEE2F3] hover:bg-[#99D9EB] text-[#3B92A7] font-medium py-2.5 px-6 rounded-full text-[15px] transition-colors focus:outline-none"
                    >
                        Nota de saída
                    </button>
                </div>
            </div>
        </div>
    );
}
