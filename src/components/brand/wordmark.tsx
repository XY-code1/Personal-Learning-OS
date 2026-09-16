import Link from "next/link";

export function Wordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Personal Learning OS 首页">
      <span className={inverse ? "flex size-8 items-center justify-center rounded-md bg-background text-xs font-bold text-foreground" : "flex size-8 items-center justify-center rounded-md bg-foreground text-xs font-bold text-background"}>P</span>
      <span className={inverse ? "text-sm font-semibold tracking-[-0.03em] text-background" : "text-sm font-semibold tracking-[-0.03em] text-foreground"}>Personal Learning OS</span>
    </Link>
  );
}