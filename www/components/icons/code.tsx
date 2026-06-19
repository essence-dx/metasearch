import { Icon, type IconProps } from "./icon";

export function CodeIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="code" {...props} />;
}
