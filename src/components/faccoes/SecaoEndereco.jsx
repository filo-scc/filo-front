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

export default function SecaoEndereco({ endereco }) {
  if (!endereco) return null;

  return (
    <section>
      <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
        Endereço
      </h3>

      {/* Ajuste: max-w-4xl para não espalhar demais e grid com colunas menores */}
      <div className="flex flex-wrap gap-y-8 gap-x-20">
        <div className="min-w-[120px]">
          <Label>CEP</Label>
          <Valor>00000-000</Valor>
        </div>
        <div className="min-w-[150px]">
          <Label>Rua</Label>
          <Valor>{endereco.rua}</Valor>
        </div>
        <div className="min-w-[60px]">
          <Label>Nº</Label>
          <Valor>{endereco.numero}</Valor>
        </div>
        <div className="min-w-[120px]">
          <Label>Bairro</Label>
          <Valor>{endereco.bairro}</Valor>
        </div>
        {/* O flex-wrap jogará os próximos para baixo se não couberem, 
      ou você pode colocar outra div flex abaixo para a segunda linha */}
      </div>

      <div className="flex flex-wrap gap-y-8 gap-x-20 pt-8">
        {/* Segunda Linha */}
        <div>
          <Label>Complemento</Label>
          <Valor>{endereco.complemento || "Nenhum"}</Valor>
        </div>
        <div>
          <Label>Cidade</Label>
          <Valor>{endereco.cidade}</Valor>
        </div>
        <div>
          <Label>Estado</Label>
          <Valor>{endereco.estado}</Valor>
        </div>
      </div>
    </section>
  );
}
