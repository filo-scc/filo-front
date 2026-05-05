export default function ProdutoDetalhesHeader({
    title,
    iconSrc = "/produtos-ativado.png",
    iconClassName = "w-[30px] h-[30px] object-contain",
    iconWrapperClassName = "",
}) {
    return (
        <div className="flex items-center gap-3">
            <div className={iconWrapperClassName}>
                <img src={iconSrc} alt="" className={iconClassName} />
            </div>
            <h2 className="text-[30px] font-Outfit font-light text-[#404040]">{title}</h2>
        </div>
    );
}
