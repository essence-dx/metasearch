import { Icon, type IconProps } from "./icon";

export function ActivityIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="activity" {...props} />;
}
