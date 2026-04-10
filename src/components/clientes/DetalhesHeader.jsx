export default function DetalhesClienteHeader({ title }) {
  return (
    <div className="flex items-center gap-3 pl-6">
      <img
        src="/star.png"
        alt="Star"
        className="w-[30px] h-[30px] object-contain"
      />
      <h2 className="text-[30px] font-Outfit font-light text-[#404040]">
        {title}
      </h2>
    </div>
  );
}
