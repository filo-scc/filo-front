export default function ProdutoDetalhesHeader({ title }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/produtos-ativado.png"
        className="w-[30px] h-[30px] object-contain"
      />
      <h2 className="text-[30px] font-Outfit font-light text-[#404040]">
        {title}
      </h2>
    </div>
  );
}
