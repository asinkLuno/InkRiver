import type { ReactNode } from "react";

/**
 * Shared page masthead: the title in the book face, with machine-measured
 * counts (seasons, events, nodes) set in mono beneath it.
 */
export function PageHeader({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[1.65rem] leading-tight font-medium tracking-tight">
        {title}
      </h1>
      {meta && (
        <p className="mt-1 font-mono text-xs text-muted-foreground">{meta}</p>
      )}
      {children}
    </div>
  );
}
