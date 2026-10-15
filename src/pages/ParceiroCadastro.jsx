import React from "react";
import { useNavigate } from "react-router-dom";
import ParceiroForm from "../components/parceiros/ParceiroForm.jsx";

export default function ParceiroCadastro() {
    const navigate = useNavigate();

    return (
        <div className="w-full flex justify-center px-6 mt-6">
            <div className="bg-white p-14 lg:px-19 lg:py-8 rounded-[24px] shadow-sm w-full max-w-[1400px] mx-auto">
                {/* Título */}
                <div className="flex items-center gap-3 mb-10 text-gray-800">
                    <img
                        src="/maquina+-costura-icone-preto.png"
                        alt="Ícone"
                        className="w-[30px] h-[30px]"
                    />
                    <h1 className="text-[30px] font-light text-gray-800">Cadastrar parceiro</h1>
                </div>

                <ParceiroForm onSuccess={() => navigate("/parceiros")} />
            </div>
        </div>
    );
}
