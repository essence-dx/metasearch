import { Icon, type IconProps } from "./icon";

export function EngineIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="engine" {...props} />;
}
