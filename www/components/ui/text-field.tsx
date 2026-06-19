import { Icon } from "../icons/icon";

export type TextFieldProps = {
  attributes?: Record<string, unknown>;
  className?: string;
  icon: string;
  id: string;
  label: string;
  name: string;
  placeholder: string;
  type?: "search" | "text";
};

export function TextField({
  attributes,
  className = "",
  icon,
  id,
  label,
  name,
  placeholder,
  type = "text",
}: TextFieldProps) {
  return (
    <label className={`text-field ${className}`.trim()} htmlFor={id}>
      <span className="field-label">{label}</span>
      <span className="field-shell">
        <Icon className="ui-icon field-icon" name={icon} />
        <input
          id={id}
          name={name}
          type={type}
          inputMode="text"
          autoComplete="off"
          placeholder={placeholder}
          {...attributes}
        />
      </span>
    </label>
  );
}
