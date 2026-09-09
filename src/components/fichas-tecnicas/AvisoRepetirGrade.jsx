import { useEffect, useState } from "react";

export default function AvisoRepetirGrade({ onDismiss, onRepeat }) {
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        if (hovered || focused) return;
        const timer = window.setTimeout(onDismiss, 15000);
        return () => window.clearTimeout(timer);
    }, [hovered, focused, onDismiss]);

    return (
        <div
            className="fixed bottom-4 right-4 z-[1100] w-[calc(100%-2rem)] max-w-[480px] rounded-[24px] bg-[#F3F4FA] px-3 py-6 sm:px-6 shadow-xl font-['Outfit',_sans-serif]"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
            }}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-2 right-8 h-5 w-5 rotate-45 rounded-[3px] bg-[#F3F4FA]"
            />
            <p role="status" className="mb-4 text-center text-[16px] font-light text-[#898C8F]">
                Deseja repetir a grade da última Ficha Técnica? As cores e quantidades dos tamanhos
                em comum serão copiadas, substituindo o preenchimento atual.
            </p>
            <div className="flex flex-nowrap justify-center gap-2">
                <button
                    type="button"
                    onClick={onDismiss}
                    className="min-w-0 rounded-full bg-[#D75757] px-3 py-2 text-[13px] leading-4 text-white sm:whitespace-nowrap"
                >
                    Não, preencher manualmente
                </button>
                <button
                    type="button"
                    onClick={onRepeat}
                    className="min-w-0 rounded-full bg-[#A9E2F2] px-3 py-2 text-[13px] leading-4 text-[#4696AD] sm:whitespace-nowrap"
                >
                    Sim, repetir grade
                </button>
            </div>
        </div>
    );
}
