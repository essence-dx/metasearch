import { Icon } from "../icons/icon";

export type SegmentedOption = {
  attributes?: Record<string, unknown>;
  icon: string;
  label: string;
  value: string;
};

export type SegmentedSelectProps = {
  className?: string;
  label: string;
  options: SegmentedOption[];
};

export function SegmentedSelect({ className = "", label, options }: SegmentedSelectProps) {
  return (
    <div className={`segmented-select ${className}`.trim()} role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" {...option.attributes}>
          <Icon className="ui-icon" name={option.icon} />
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
