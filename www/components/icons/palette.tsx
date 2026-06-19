import { Icon, type IconProps } from "./icon";

export function PaletteIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="palette" {...props} />;
}
