import React, { useState, useEffect, useRef } from "react";

export default function MenuOpcoes({ onEdit, onDelete }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Fecha o menu ao clicar fora dele
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleMenu = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative flex justify-center items-center" ref={menuRef}>
            {/* Botão de abrir o menu */}
            <button onClick={toggleMenu} className="w-10 h-8 flex items-center justify-center">
                <img
                    src="/tres-pontos.png"
                    alt="Opções"
                    className="w-5 h-5 object-contain opacity-60"
                />
            </button>

            {/* Menu Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-10 w-[140px] bg-white rounded-[10px] shadow-[0px_4px_16px_rgba(0,0,0,0.1)] border border-gray-100 z-50 overflow-hidden flex flex-col font-Outfit">
                    {/* Botão Editar */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            onEdit();
                        }}
                        className="flex items-center gap-2 px-4 py-3 text-[14px] text-[#7B7D80] font-light bg-white hover:bg-[#F1F1F1] transition-colors w-full text-left"
                    >
                        <img
                            src="/editar-cinza.png"
                            className="w-[15px] h-[15px] object-contain flex-shrink-0"
                        />
                        <span>Editar</span>
                    </button>

                    {/* Botão Excluir */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            onDelete();
                        }}
                        className="flex items-center gap-2 px-4 py-3 text-[14px] text-[#7B7D80] font-light bg-white hover:bg-[#F1F1F1] transition-colors w-full text-left"
                    >
                        <img
                            src="/excluir-cinza.png"
                            className="w-[15px] h-[15px] object-contain flex-shrink-0"
                        />
                        Excluir
                    </button>
                </div>
            )}
        </div>
    );
}
