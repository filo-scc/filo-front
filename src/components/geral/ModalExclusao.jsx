import React from "react";

export default function ModalExclusao({
    isOpen,
    onClose,
    onConfirm,
    nomeItem,
    tipoItem = "o cadastro de",
<<<<<<< HEAD
    titulo,
    mensagem,
=======
    loading = false,
>>>>>>> develop
}) {
    if (!isOpen) return null;

    const handleClose = () => {
        if (!loading) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm transition-opacity font-Outfit"
            onClick={handleClose}
        >
            <div
                className="relative bg-[#F3F4FA] rounded-[24px] p-8 w-[90%] max-w-[400px] shadow-xl flex flex-col items-center text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="absolute top-5 right-5"
                    aria-label="Fechar modal"
                >
                    <img src="/fechar-cinza.png" className="w-3 h-3" alt="Fechar" />
                </button>

                {titulo && (
                    <h2 className="text-[20px] font-medium text-[#404040] mb-3 px-6">{titulo}</h2>
                )}

                {mensagem ? (
                    <p className="text-[18px] font-light text-[#404040] px-6 mb-8">{mensagem}</p>
                ) : (
                    <p className="text-[18px] font-light text-[#404040] px-6 mb-8">
                        Deseja mesmo <strong className="font-medium text-[#404040]">excluir</strong>{" "}
                        {tipoItem}{" "}
                        <strong className="font-medium text-[#404040]">{nomeItem}</strong>?
                    </p>
                )}

                <div className="flex gap-4 w-full">
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        aria-busy={loading}
                        className="flex-1 h-[39px] rounded-[18.9px] bg-[#D75757] text-white font-light text-[16px] transition-colors hover:bg-[#D74646] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? "Excluindo..." : "Sim"}
                    </button>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1 h-[39px] rounded-[18.9px] bg-[#A9E2F2] text-[#4696AD] font-light text-[16px] transition-colors hover:bg-[#A2DCED] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Não
                    </button>
                </div>
            </div>
        </div>
    );
}
