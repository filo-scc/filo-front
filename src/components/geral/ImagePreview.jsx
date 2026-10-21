import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const fallbackClassName =
    "flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] border border-[#D9D9D9] bg-[#E5E5E5]";

export default function ImagePreview({ src, alt, title }) {
    const [isOpen, setIsOpen] = useState(false);
    const [failedSrc, setFailedSrc] = useState(null);
    const hasError = !src || failedSrc === src;

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key !== "Escape") return;
            event.stopPropagation();
            setIsOpen(false);
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    if (hasError) {
        return <span className={fallbackClassName} aria-label={`${title} sem imagem`} />;
    }

    const closePreview = () => setIsOpen(false);

    return (
        <>
            <button
                type="button"
                title={`Ampliar ${title}`}
                aria-label={`Ampliar imagem de ${title}`}
                onClick={(event) => {
                    event.stopPropagation();
                    setIsOpen(true);
                }}
                className="h-[20px] w-[20px] shrink-0 overflow-hidden rounded-[6px] border border-[#D9D9D9]"
            >
                <img
                    src={src}
                    alt={alt || title}
                    onError={() => {
                        setFailedSrc(src);
                        setIsOpen(false);
                    }}
                    className="h-full w-full object-cover"
                />
            </button>

            {isOpen &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        data-image-preview="true"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Visualização ampliada de ${title}`}
                        className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 px-4 py-6"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                            event.stopPropagation();
                            if (event.target === event.currentTarget) closePreview();
                        }}
                    >
                        <div
                            className="relative flex max-h-full max-w-full flex-col items-center rounded-[16px] bg-white p-4 shadow-2xl"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button
                                type="button"
                                aria-label="Fechar visualização"
                                onClick={closePreview}
                                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[24px] leading-none text-[#404040] shadow"
                            >
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <img
                                src={src}
                                alt={alt || title}
                                onError={() => {
                                    setFailedSrc(src);
                                    setIsOpen(false);
                                }}
                                className="max-h-[calc(100vh-150px)] max-w-[calc(100vw-48px)] rounded-[10px] object-contain"
                            />
                            <p className="mt-3 max-w-[min(80vw,720px)] text-center text-[15px] text-[#404040]">
                                {title}
                            </p>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}
