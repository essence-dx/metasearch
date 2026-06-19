import { Icon, type IconProps } from "./icon";

export function MusicIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="music" {...props} />;
}
