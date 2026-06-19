import { Icon, type IconProps } from "./icon";

export function MapIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="map" {...props} />;
}
