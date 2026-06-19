import { Icon, type IconProps } from "./icon";

export function DetailsIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="details" {...props} />;
}
