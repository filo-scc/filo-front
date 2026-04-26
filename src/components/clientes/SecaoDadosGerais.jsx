const Label = ({ children }) => (
  <span className="text-[20px] font-Outfit font-light text-[#4696AD] block">
    {children}
  </span>
);

const Valor = ({ children }) => (
  <p className="text-[16px] font-Outfit font-light text-[#898c8f] leading-none">
    {children || "-"}
  </p>
);

export default function SecaoDadosGerais({ cliente }) {
  return (
    <section>
      <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
        Dados gerais
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <Label>Empresa</Label>
          <Valor>{cliente.nome}</Valor>
        </div>
        <div>
          <Label>CNPJ</Label>
          <Valor>{cliente.cnpj}</Valor>
        </div>
        <div>
          <Label>Proprietário</Label>
          <Valor>{cliente.responsavel}</Valor>
        </div>
        <div>
          <Label>Telefone</Label>
          <Valor>{cliente.telefone}</Valor>
        </div>
      </div>
    </section>
  );
}
