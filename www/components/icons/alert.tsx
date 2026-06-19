import { Icon, type IconProps } from "./icon";

export function AlertIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="alert" {...props} />;
}
