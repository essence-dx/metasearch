export type IconProps = {
  name: string;
  title?: string;
  className?: string;
  "aria-hidden"?: string | boolean;
  [attribute: string]: unknown;
};

const iconPaths: Record<string, any> = {
  activity: (
    <>
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 3.5 19h17L12 4Z" />
      <path d="M12 9v4" />
      <path d="M12 16h.01" />
    </>
  ),
  "chevron-down": (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),
  code: (
    <>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m14 5-4 14" />
    </>
  ),
  details: (
    <>
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M5 18h10" />
    </>
  ),
  engine: (
    <>
      <path d="M4 13h3l2-4h6l2 4h3v5H4v-5Z" />
      <path d="M9 9V6h6v3" />
      <path d="M8 18v2" />
      <path d="M16 18v2" />
    </>
  ),
  files: (
    <>
      <path d="M7 3h7l4 4v14H7V3Z" />
      <path d="M14 3v5h5" />
      <path d="M10 13h6" />
      <path d="M10 17h4" />
    </>
  ),
  filter: (
    <>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </>
  ),
  image: (
    <>
      <path d="M4 5h16v14H4V5Z" />
      <path d="m7 16 4-4 3 3 2-2 3 3" />
      <path d="M9 9h.01" />
    </>
  ),
  map: (
    <>
      <path d="M4 6 9 4l6 2 5-2v14l-5 2-6-2-5 2V6Z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <path d="M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" />
      <path d="M19 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" />
    </>
  ),
  news: (
    <>
      <path d="M5 5h14v14H5V5Z" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </>
  ),
  "package-check": (
    <>
      <path d="M4 8 12 4l8 4-8 4-8-4Z" />
      <path d="M4 8v8l8 4 8-4V8" />
      <path d="m9 15 2 2 4-5" />
    </>
  ),
  palette: (
    <>
      <path d="M12 4a8 8 0 0 0 0 16h1.5a1.7 1.7 0 0 0 1.2-2.9 1.7 1.7 0 0 1 1.2-2.9H18a2 2 0 0 0 2-2A8 8 0 0 0 12 4Z" />
      <path d="M8.5 10h.01" />
      <path d="M11 8h.01" />
      <path d="M14 8.5h.01" />
    </>
  ),
  play: (
    <>
      <path d="M8 5v14l11-7L8 5Z" />
    </>
  ),
  science: (
    <>
      <path d="M10 3h4" />
      <path d="M11 3v6l-5 9a2 2 0 0 0 1.7 3h8.6a2 2 0 0 0 1.7-3l-5-9V3" />
      <path d="M8 17h8" />
    </>
  ),
  search: (
    <>
      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
      <path d="m16 16 5 5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  social: (
    <>
      <path d="M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M16 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M10.5 10.5 13.5 13.5" />
      <path d="M10.7 8.9 15 6.5" />
    </>
  ),
};

export function Icon({ name, title, className, ...props }: IconProps) {
  const icon = iconPaths[name] || iconPaths.activity;

  return (
    <svg
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
      data-dx-icon={name}
      data-icon-source="dx-icons"
      fill="none"
      focusable="false"
      role={title ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {icon}
    </svg>
  );
}
