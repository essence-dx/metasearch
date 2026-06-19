import { Icon } from "../icons/icon";
import { IconLabel } from "./icon-label";

export type CollapseProps = {
  children: any;
  className?: string;
  icon: string;
  label: string;
  open?: boolean;
};

export function Collapse({ children, className = "", icon, label, open = true }: CollapseProps) {
  return (
    <details className={`ui-collapse ${className}`.trim()} open={open}>
      <summary className="ui-collapse-trigger">
        <IconLabel icon={icon}>{label}</IconLabel>
        <Icon className="ui-icon disclosure-icon" name="chevron-down" />
      </summary>
      <div className="ui-collapse-content">{children}</div>
    </details>
  );
}
