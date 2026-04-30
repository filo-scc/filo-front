/**
 * Mesmo padrão de label flutuante de Login.jsx: label no centro da linha,
 * sobe ao focar ou quando há valor.
 */
export default function FloatingLabelInput({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  inputClassName = "",
  endAdornment,
  ...inputProps
}) {
  const hasValue = Boolean(value && String(value).length > 0);

  return (
    <div className={`relative w-full group ${className}`}>
      <input
        {...inputProps}
        type={type}
        value={value}
        onChange={onChange}
        className={`
          w-full h-[39px] border border-[#D3D3D3] rounded-[10px] text-sm text-gray-600
          leading-[39px] focus:outline-none
          transition-colors bg-white
          ${endAdornment ? "pl-3 pr-10" : "px-3"}
          ${inputClassName}
        `}
      />
      <label
        className={`
          absolute left-3 bg-white px-1 text-gray-400 transition-all duration-200 pointer-events-none
          ${
            hasValue
              ? "top-0 -translate-y-1/2 text-xs text-[#898C8F]"
              : "top-1/2 -translate-y-1/2 text-sm"
          }
          group-focus-within:top-0
          group-focus-within:-translate-y-1/2
          group-focus-within:text-xs
          group-focus-within:text-[#898C8F]
        `}
      >
        {label}
      </label>
      {endAdornment}
    </div>
  );
}
