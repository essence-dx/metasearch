import { Icon, type IconProps } from "./icon";

export function ImageIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="image" {...props} />;
}
