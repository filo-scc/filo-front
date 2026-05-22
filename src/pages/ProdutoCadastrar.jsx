import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProdutoDetalhesHeader from "../components/produtos/ProdutoDetalhesHeader";
import {
    criarProduto,
    getGradesByFabrico,
    getTecidosByFabrico,
} from "../services/produtoService.js";
import { upload } from "../services/utilsService";

const modelos = ["Top e short", "Top e calça", "Macaquito", "Macacão"];
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
        <div className={`relative ${isOpen ? "z-50" : "z-10"} ${className}`}>
            <button
                type="button"
                onClick={onToggle}
                className="w-full h-[39px] border border-[#898C8F] rounded-[10px] px-3 text-sm focus:outline-none bg-white flex items-center justify-between"
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
                    <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-20 overflow-hidden rounded-[14px] border border-[#898C8F] bg-white ">
                        {options.map((option) => {
                            const selected = isSelectedOption(option);

                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => onSelect(option)}
                                    // Mudanças aqui: pl-[12px] em vez de 15px e border-l-[3px] global
                                    className={`relative overflow-hidden flex w-full items-center pl-[12px] pr-3 py-3 border-l-[3px] text-left text-[16px] transition-colors first:rounded-t-[13px] last:rounded-b-[13px] ${
                                        selected
                                            ? "border-[#C4F042] text-[#707070] bg-white"
                                            : "border-transparent text-[#707070] bg-white hover:bg-[#FAFAFA]"
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
    const navigate = useNavigate();
    const inputFileRef = useRef(null);
    const userString = localStorage.getItem("user");
    const usuarioLogado = userString ? JSON.parse(userString) : null;
    const fabricoId = Number(usuarioLogado?.fabrico_id);

    const [arquivoImagem, setArquivoImagem] = useState(null);
    const [imagemPreview, setImagemPreview] = useState("");
    const [openDropdown, setOpenDropdown] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [carregandoGrades, setCarregandoGrades] = useState(false);
    const [erroCadastro, setErroCadastro] = useState("");
    const [gradesDisponiveis, setGradesDisponiveis] = useState([]);
    const [tecidosDisponiveis, setTecidosDisponiveis] = useState([]);
    const [formData, setFormData] = useState({
        referencia: "",
        modelo: "",
        tecido: "",
        tecido_id: undefined,
        grade: "",
        grade_versao_id: undefined,
        aviamentos: [],
    });

    useEffect(() => {
        if (!Number.isFinite(fabricoId)) return;

        let ignorar = false;

        const carregarGrades = async () => {
            try {
                setCarregandoGrades(true);

                const [resGrades, resTecidos] = await Promise.allSettled([
                    getGradesByFabrico(fabricoId),
                    getTecidosByFabrico(fabricoId),
                ]);

                if (ignorar) return;

                if (resGrades.status === "fulfilled") {
                    const dadosGrades = resGrades.value;
                    const gradesMapeadas = (dadosGrades || [])
                        .map((item) => {
                            const nome = item?.grade?.nome;
                            const versaoAtiva = item?.grade?.versoes?.find(
                                (versao) => versao?.ativo,
                            );
                            if (!nome) return null;
                            return { nome, grade_versao_id: versaoAtiva?.id };
                        })
                        .filter(Boolean);
                    setGradesDisponiveis(gradesMapeadas);
                } else {
                    console.error("Erro ao carregar grades:", resGrades.reason);
                    setGradesDisponiveis([]);
                }

                if (resTecidos.status === "fulfilled") {
                    const dadosTecidos = resTecidos.value;

                    const tecidosTratados = (dadosTecidos || []).map((t) => ({
                        id: t?.id || t?.tecido?.id,
                        nome: t?.nome || t?.tecido?.nome || "Sem nome na API",
                    }));
                    setTecidosDisponiveis(tecidosTratados);
                } else {
                    console.error("Erro ao carregar tecidos:", resTecidos.reason);
                    setTecidosDisponiveis([]);
                }
            } finally {
                if (!ignorar) {
                    setCarregandoGrades(false);
                }
            }
        };

        carregarGrades();

        return () => {
            ignorar = true;
        };
    }, [fabricoId]);

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

    const handleGradeSelect = (nomeGrade) => {
        const gradeSelecionada = gradesDisponiveis.find((grade) => grade.nome === nomeGrade);

        setFormData((prev) => ({
            ...prev,
            grade: nomeGrade,
            grade_versao_id: gradeSelecionada?.grade_versao_id,
        }));
        setOpenDropdown(null);
    };

    const handleTecidoSelect = (nomeTecido) => {
        const tecidoSelecionado = tecidosDisponiveis.find((t) => t.nome === nomeTecido);

        setFormData((prev) => ({
            ...prev,
            tecido: nomeTecido,
            tecido_id: tecidoSelecionado?.id,
        }));
        setOpenDropdown(null);
    };

    const handleImagemChange = (event) => {
        const arquivo = event.target.files?.[0];
        if (!arquivo) return;

        setArquivoImagem(arquivo);
        setImagemPreview(URL.createObjectURL(arquivo));
        setErroCadastro("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setErroCadastro("");

        if (!formData.referencia.trim()) {
            setErroCadastro("Informe a referência interna do produto.");
            return;
        }

        if (!formData.modelo) {
            setErroCadastro("Selecione o modelo do produto.");
            return;
        }

        if (!Number.isFinite(fabricoId)) {
            setErroCadastro("Não foi possível identificar a fábrica do usuário.");
            return;
        }

        try {
            setSalvando(true);
            let urlFoto = undefined;

            // Realiza o upload caso tenha uma imagem selecionada
            if (arquivoImagem) {
                const uploadData = new FormData();
                uploadData.append("file", arquivoImagem);

                const responseUpload = await upload(uploadData);

                if (responseUpload && responseUpload.url) {
                    urlFoto = responseUpload.url;
                }
            }

            const payload = {
                foto: urlFoto,
                nome: formData.referencia.trim(),
                tipo: formData.modelo,
                fabrico_id: fabricoId,
                tecido_id: formData.tecido_id,
                grade_versao_id: formData.grade_versao_id,
            };

            await criarProduto(payload);
            navigate("/produtos");
        } catch (error) {
            console.error("Erro ao cadastrar produto:", error);
            setErroCadastro(
                error.response?.data?.message || "Erro ao cadastrar produto. Verifique os dados.",
            );
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="w-full px-6 pt-0">
            <div className="bg-white rounded-[24px] w-full min-h-[650px] px-8 py-7 lg:px-12 lg:py-8">
                <ProdutoDetalhesHeader
                    title="Cadastrar produto"
                    iconSrc="/adicionar-produtos-preto.png"
                    iconWrapperClassName="w-[32px] h-[32px] shrink-0 flex items-center justify-center"
                    iconClassName="w-[32px] h-[32px] object-contain"
                />

                {erroCadastro && (
                    <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
                        {erroCadastro}
                    </div>
                )}

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
                                className="w-[200px] h-[150px] rounded-[10px] border border-dashed border-[#898C8F] flex items-center justify-center overflow-hidden bg-white hover:bg-[#FAFAFA] transition-colors"
                            >
                                {imagemPreview ? (
                                    <img
                                        src={imagemPreview}
                                        alt="Preview do produto"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-[60px] font-extralight text-[#9B9B9B]">
                                        +
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="flex-1 max-w-[980px] pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)] gap-x-8 gap-y-6">
                                <div>
                                    <FieldLabel>Referência</FieldLabel>
                                    <div className="relative w-full group">
                                        <input
                                            type="text"
                                            value={formData.referencia}
                                            onChange={handleChange("referencia")}
                                            className="w-full h-[39px] border border-[#898C8F] rounded-[10px] px-3 text-[16px] focus:outline-none"
                                        />

                                        <label
                                            className={`
                                                absolute left-3 bg-white px-1
                                                text-[#898C8F] transition-all duration-200 pointer-events-none
                                                
                                                ${
                                                    formData.referencia
                                                        ? "top-0 -translate-y-1/2 text-xs"
                                                        : "top-1/2 -translate-y-1/2 text-[16px]"
                                                }
                                                
                                                group-focus-within:top-0
                                                group-focus-within:-translate-y-1/2
                                                group-focus-within:text-xs
                                            `}
                                        >
                                            Referência interna*
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <FieldLabel>Modelo</FieldLabel>
                                    <DropdownField
                                        value={formData.modelo}
                                        placeholder="Modelo*"
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
                                            options={tecidosDisponiveis.map((t) => t.nome)}
                                            isOpen={openDropdown === "tecido"}
                                            onToggle={() => toggleDropdown("tecido")}
                                            onSelect={handleTecidoSelect}
                                            isSelectedOption={(option) =>
                                                formData.tecido === option
                                            }
                                        />
                                    </div>

                                    <div>
                                        <DropdownField
                                            value={formData.grade}
                                            placeholder={
                                                carregandoGrades
                                                    ? "Carregando grades..."
                                                    : "Grade de tamanho*"
                                            }
                                            options={gradesDisponiveis.map((grade) => grade.nome)}
                                            isOpen={openDropdown === "grade"}
                                            onToggle={() => toggleDropdown("grade")}
                                            onSelect={handleGradeSelect}
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
                            disabled={salvando}
                            className="w-[189px] h-[39px] rounded-[18.9px] bg-[#A9E2F2] text-[#4696AD] text-sm font-medium transition-colors hover:bg-[#8acbdc] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {salvando ? "Salvando..." : "Finalizar cadastro"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
