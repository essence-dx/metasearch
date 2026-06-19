import { Icon } from "../icons/icon";
import { IconLabel } from "./icon-label";

export type DropdownProps = {
  children: any;
  className?: string;
  icon: string;
  label: string;
  open?: boolean;
};

export function Dropdown({ children, className = "", icon, label, open = false }: DropdownProps) {
  return (
    <details className={`dropdown ${className}`.trim()} open={open}>
      <summary className="dropdown-trigger">
        <IconLabel icon={icon}>{label}</IconLabel>
        <Icon className="ui-icon disclosure-icon" name="chevron-down" />
      </summary>
      <div className="dropdown-panel">{children}</div>
    </details>
  );
}
