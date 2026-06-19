import { Icon, type IconProps } from "./icon";

export function SocialIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="social" {...props} />;
}
