import { Icon, type IconProps } from "./icon";

export function NewsIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="news" {...props} />;
}
