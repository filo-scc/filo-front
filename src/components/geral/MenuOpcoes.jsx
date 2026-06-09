import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function MenuOpcoes({ onEdit, onDelete }) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            const clickedInsideButton =
                buttonRef.current && buttonRef.current.contains(event.target);
            const clickedInsideMenu = menuRef.current && menuRef.current.contains(event.target);

            if (!clickedInsideButton && !clickedInsideMenu) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useLayoutEffect(() => {
        if (!isOpen || !buttonRef.current) return;

        const updatePosition = () => {
            const rect = buttonRef.current.getBoundingClientRect();
            const menuWidth = 140;
            const menuHeight = 98;
            const gap = 6;

            const hasSpaceBelow = rect.bottom + gap + menuHeight <= window.innerHeight;
            const top = hasSpaceBelow ? rect.bottom + gap : rect.top - menuHeight - gap;
            const left = Math.min(
                Math.max(rect.right - menuWidth, 8),
                window.innerWidth - menuWidth - 8,
            );

            setMenuPosition({
                top: Math.max(top, 8),
                left,
            });
        };

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [isOpen]);

    const toggleMenu = (event) => {
        event.stopPropagation();
        setIsOpen((current) => !current);
    };

    const menuDropdown = (
        <div
            ref={menuRef}
            style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
            }}
            className="fixed w-[140px] bg-white rounded-[10px] shadow-[0px_4px_16px_rgba(0,0,0,0.1)] border border-gray-100 z-[9999] overflow-hidden flex flex-col font-Outfit"
        >
            <button
                onClick={(event) => {
                    event.stopPropagation();
                    setIsOpen(false);
                    onEdit();
                }}
                className="flex items-center gap-2 px-4 py-3 text-[14px] text-[#7B7D80] font-light bg-white hover:bg-[#F1F1F1] transition-colors w-full text-left"
            >
                <img
                    src="/editar-cinza.png"
                    alt=""
                    className="w-[15px] h-[15px] object-contain flex-shrink-0"
                />
                <span>Editar</span>
            </button>

            <button
                onClick={(event) => {
                    event.stopPropagation();
                    setIsOpen(false);
                    onDelete();
                }}
                className="flex items-center gap-2 px-4 py-3 text-[14px] text-[#7B7D80] font-light bg-white hover:bg-[#F1F1F1] transition-colors w-full text-left"
            >
                <img
                    src="/excluir-cinza.png"
                    alt=""
                    className="w-[15px] h-[15px] object-contain flex-shrink-0"
                />
                <span>Excluir</span>
            </button>
        </div>
    );

    return (
        <div className="relative flex justify-center items-center">
            <button
                ref={buttonRef}
                type="button"
                onClick={toggleMenu}
                className="w-10 h-8 flex items-center justify-center"
            >
                <img
                    src="/tres-pontos.png"
                    alt="Opcoes"
                    className="w-5 h-5 object-contain opacity-60"
                />
            </button>

            {isOpen && createPortal(menuDropdown, document.body)}
        </div>
    );
}
