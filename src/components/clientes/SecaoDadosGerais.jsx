const Label = ({ children }) => (
    <span className="text-[20px] font-Outfit font-light text-[#4696AD] block">{children}</span>
);

const Valor = ({ children }) => (
    <p className="text-[16px] font-Outfit font-light text-[#898c8f] leading-none">
        {children || "-"}
    </p>
);

const apenasNumeros = (valor) => String(valor || "").replace(/\D/g, "");

const formatarCnpj = (valor) => {
    const digitos = apenasNumeros(valor).slice(0, 14);
    if (!digitos) return "";

    return digitos
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
};

const formatarTelefone = (valor) => {
    const digitos = apenasNumeros(valor).slice(0, 11);
    if (!digitos) return "";
    if (digitos.length <= 2) return `(${digitos}`;
    if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    if (digitos.length <= 10) {
        return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
    }
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
};

export default function SecaoDadosGerais({ cliente }) {
    return (
        <section>
            <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">Dados gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <Label>Empresa</Label>
                    <Valor>{cliente.nome}</Valor>
                </div>
                <div>
                    <Label>CNPJ</Label>
                    <Valor>{formatarCnpj(cliente.cnpj)}</Valor>
                </div>
                <div>
                    <Label>Proprietário</Label>
                    <Valor>{cliente.responsavel}</Valor>
                </div>
                <div>
                    <Label>Telefone</Label>
                    <Valor>{formatarTelefone(cliente.telefone)}</Valor>
                </div>
            </div>
        </section>
    );
}
