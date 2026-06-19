import { Icon, type IconProps } from "./icon";

export function ScienceIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="science" {...props} />;
}
