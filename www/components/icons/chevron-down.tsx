import { Icon, type IconProps } from "./icon";

export function ChevronDownIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="chevron-down" {...props} />;
}
