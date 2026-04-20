import Image from "next/image";

/**
 * アバター画像（ラッパーdiv内に入れる用）。
 * 既存の `<div className="h-X w-X rounded-...">...</div>` パターンの中身に
 * `<img>` の代わりに差し込めるドロップイン。src/name のいずれかを渡す。
 */
export function Avatar({
  src,
  name,
  size,
  alt,
  priority,
}: {
  src?: string | null;
  name?: string | null;
  size: number;
  alt?: string;
  priority?: boolean;
}) {
  const effectiveAlt = alt ?? (name ? `${name}のアバター` : "");
  if (src) {
    return (
      <Image
        src={src}
        alt={effectiveAlt}
        width={size}
        height={size}
        priority={priority}
        className="h-full w-full object-cover"
      />
    );
  }
  return <span aria-hidden="true">{name?.[0] ?? "?"}</span>;
}
