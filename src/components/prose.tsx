import { type ReactNode } from "react";

// Long-form Dutch content wrapper for service pages (semantic, readable).
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="prose-voltfix space-y-5 text-[0.975rem] leading-relaxed text-muted-foreground [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mt-7 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:marker:text-primary [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
      {children}
    </div>
  );
}
