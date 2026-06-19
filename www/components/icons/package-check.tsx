import { Icon, type IconProps } from "./icon";

export function PackageCheckIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="package-check" {...props} />;
}
