import { Icon, type IconProps } from "./icon";

export function ShieldIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="shield" {...props} />;
}
