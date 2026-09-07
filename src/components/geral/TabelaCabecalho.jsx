export default function TabelaCabecalho({ children, className = "" }) {
    return (
        <thead className={`bg-[#C9EAF6] text-[#4696AD] font-['Outfit',_sans-serif] ${className}`}>
            <tr className="h-[64px]">{children}</tr>
        </thead>
    );
}

export function TabelaCabecalhoCelula({ children, className = "" }) {
        return (
            <th className={`h-[64px] whitespace-nowrap px-6 text-center align-middle text-[16px] font-normal ${className}`}>
            {children}
        </th>
    );
}
