import { Icon, type IconProps } from "./icon";

export function PlayIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="play" {...props} />;
}
