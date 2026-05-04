import { useRef, useState } from "react";
import ProdutoDetalhesHeader from "../components/produtos/ProdutoDetalhesHeader";

const modelos = ["Top e short", "Top e calça", "Macaquito", "Macacão"];
const tecidos = ["Microfibra", "Renda", "Algodão", "Suplex"];
const grades = ["PP ao GG", "P ao G", "36 ao 44", "Tamanho único"];
const aviamentosDisponiveis = ["Viés", "Bojo", "Elástico", "Argola"];

function FieldLabel({ children }) {
    return <label className="block text-[20px] font-light text-[#404040] mb-3">{children}</label>;
}

function CheckIcon() {
    return (
        <svg
            className="w-[15px] h-[15px] text-[#8B8B8B]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12l5 5L19 8" />
        </svg>
    );
}

function DropdownField({
    value,
    placeholder,
    options,
    isOpen,
    onToggle,
    onSelect,
    isSelectedOption,
    showOptionIndicator = false,
    className = "",
}) {
    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={onToggle}
                className="w-full h-[39px] border border-[#D3D3D3] rounded-[10px] px-3 text-sm focus:outline-none bg-white flex items-center justify-between"
            >
                <span className={value ? "text-[#707070] font-normal" : "text-[#898C8F]"}>
                    {value || placeholder}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Fechar dropdown"
                        onClick={onToggle}
                        className="fixed inset-0 z-10 cursor-default"
                    />
                    <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-20 overflow-hidden rounded-[14px] border border-[#D3D3D3] bg-white shadow-lg">
                        {options.map((option) => {
                            const selected = isSelectedOption(option);

                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => onSelect(option)}
                                    className={`flex w-full items-center border-l-[3px] px-3 py-3 text-left text-sm transition-colors ${
                                        selected
                                            ? "border-[#C4F042] text-[#707070] bg-white"
                                            : "border-transparent text-[#707070] bg-white hover:bg-white"
                                    }`}
                                >
                                    <span className={selected ? "font-normal text-[#707070]" : ""}>
                                        {option}
                                    </span>

                                    {showOptionIndicator && (
                                        <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center text-[#8B8B8B]">
                                            {selected ? <CheckIcon /> : "+"}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

function SelectedAviamentoTag({ label, onRemove }) {
    return (
        <button
            type="button"
            onClick={onRemove}
            className="h-[28px] pl-5 pr-2 rounded-full transition-colors bg-[#A9E2F2] text-[#404040] inline-flex items-center gap-2 whitespace-nowrap hover:bg-[#96d8ea]"
        >
            <span className="text-[12px] leading-none font-normal">{label}</span>
            <span className="w-[18px] h-[18px] rounded-full bg-[#4696AD] text-white flex items-center justify-center text-[16px] leading-none">
                ×
            </span>
        </button>
    );
}

export default function ProdutoCadastar() {
    const inputFileRef = useRef(null);
    const [imagemPreview, setImagemPreview] = useState("");
    const [openDropdown, setOpenDropdown] = useState(null);
    const [formData, setFormData] = useState({
        referencia: "",
        modelo: "",
        tecido: "",
        grade: "",
        aviamentos: [],
    });

    const handleChange = (field) => (event) => {
        setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleToggleAviamento = (item) => {
        setFormData((prev) => ({
            ...prev,
            aviamentos: prev.aviamentos.includes(item)
                ? prev.aviamentos.filter((aviamento) => aviamento !== item)
                : [...prev.aviamentos, item],
        }));
    };

    const toggleDropdown = (field) => {
        setOpenDropdown((prev) => (prev === field ? null : field));
    };

    const handleDropdownSelect = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setOpenDropdown(null);
    };

    const handleImagemChange = (event) => {
        const arquivo = event.target.files?.[0];
        if (!arquivo) return;

        setImagemPreview(URL.createObjectURL(arquivo));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
    };

    return (
        <div className="w-full px-6 pt-0">
            <div className="bg-white rounded-[24px] shadow-sm w-full min-h-[650px] px-8 py-7 lg:px-12 lg:py-8">
                <ProdutoDetalhesHeader
                    title="Cadastrar produto"
                    iconSrc="/adicionar-produtos.png"
                    iconClassName="w-[42px] h-[42px] object-contain"
                />

                <form onSubmit={handleSubmit} className="mt-10 flex flex-col min-h-[520px]">
                    <div className="flex flex-col xl:flex-row gap-12 xl:gap-16">
                        <div className="w-full xl:w-[184px] shrink-0">
                            <FieldLabel>Imagem</FieldLabel>
                            <input
                                ref={inputFileRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImagemChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => inputFileRef.current?.click()}
                                className="w-[160px] h-[160px] rounded-[10px] border border-dashed border-[#D3D3D3] flex items-center justify-center overflow-hidden bg-white hover:bg-[#FAFAFA] transition-colors"
                            >
                                {imagemPreview ? (
                                    <img
                                        src={imagemPreview}
                                        alt="Preview do produto"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-[60px] font-extralight text-[#9B9B9B]">+</span>
                                )}
                            </button>
                        </div>

                        <div className="flex-1 max-w-[980px] pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-[minmax(280px,1.2fr)_minmax(220px,1fr)] gap-x-10 gap-y-6">
                                <div>
                                    <FieldLabel>Referência</FieldLabel>
                                    <input
                                        type="text"
                                        value={formData.referencia}
                                        onChange={handleChange("referencia")}
                                        placeholder="Referência interna"
                                        className="w-full h-[39px] border border-[#D3D3D3] rounded-[10px] px-3 text-sm text-[#898C8F] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Modelo</FieldLabel>
                                    <DropdownField
                                        value={formData.modelo}
                                        placeholder="Modelo"
                                        options={modelos}
                                        isOpen={openDropdown === "modelo"}
                                        onToggle={() => toggleDropdown("modelo")}
                                        onSelect={(value) => handleDropdownSelect("modelo", value)}
                                        isSelectedOption={(option) => formData.modelo === option}
                                    />
                                </div>
                            </div>

                            <div className="mt-7">
                                <FieldLabel>Detalhes do produto</FieldLabel>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)] gap-x-8 gap-y-5">
                                    <div>
                                        <DropdownField
                                            value=""
                                            placeholder="Aviamentos"
                                            options={aviamentosDisponiveis}
                                            isOpen={openDropdown === "aviamentos"}
                                            onToggle={() => toggleDropdown("aviamentos")}
                                            onSelect={(value) => handleToggleAviamento(value)}
                                            isSelectedOption={(option) =>
                                                formData.aviamentos.includes(option)
                                            }
                                            showOptionIndicator
                                        />
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {formData.aviamentos.map((item) => (
                                                <SelectedAviamentoTag
                                                    key={item}
                                                    label={item}
                                                    onRemove={() => handleToggleAviamento(item)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <DropdownField
                                            value={formData.tecido}
                                            placeholder="Tecido"
                                            options={tecidos}
                                            isOpen={openDropdown === "tecido"}
                                            onToggle={() => toggleDropdown("tecido")}
                                            onSelect={(value) => handleDropdownSelect("tecido", value)}
                                            isSelectedOption={(option) => formData.tecido === option}
                                        />
                                    </div>

                                    <div>
                                        <DropdownField
                                            value={formData.grade}
                                            placeholder="Grade de tamanho"
                                            options={grades}
                                            isOpen={openDropdown === "grade"}
                                            onToggle={() => toggleDropdown("grade")}
                                            onSelect={(value) => handleDropdownSelect("grade", value)}
                                            isSelectedOption={(option) => formData.grade === option}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto flex justify-end pt-16">
                        <button
                            type="submit"
                            className="w-[189px] h-[39px] rounded-[18.9px] bg-[#A9E2F2] text-[#4696AD] text-sm font-medium transition-colors hover:bg-[#8acbdc]"
                        >
                            Finalizar cadastro
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}