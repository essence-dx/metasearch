import { Icon, type IconProps } from "./icon";

export function FilesIcon(
  props: Omit<IconProps, "name">,
) {
  return <Icon name="files" {...props} />;
}
