import { Icon, type IconProps } from "./icon";

export function SearchIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="search" {...props} />;
}
