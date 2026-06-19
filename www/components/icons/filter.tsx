import { Icon, type IconProps } from "./icon";

export function FilterIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="filter" {...props} />;
}
