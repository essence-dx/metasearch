import { Icon } from "../icons/icon";

export type IconLabelProps = {
  children: any;
  className?: string;
  icon: string;
};

export function IconLabel({ children, className = "", icon }: IconLabelProps) {
  return (
    <span className={`icon-label ${className}`.trim()}>
      <Icon className="ui-icon" name={icon} />
      <span>{children}</span>
    </span>
  );
}
