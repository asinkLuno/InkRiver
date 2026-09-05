"use client";

import type { ReactElement } from "react";
import { CalendarRangeIcon } from "lucide-react";
import type { MoaiMap } from "@/lib/api";
import { COPY, initialLanguage } from "@/lib/i18n";
import { dyeVar } from "@/lib/palette";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface EventHoverCardProps {
  title: string;
  start: string;
  end: string | null;
  description: string | null;
  moaiMap?: MoaiMap;
  moais: Array<{
    name: string;
    offset: [string, string | null] | null;
  }>;
  trigger: ReactElement;
}

export function EventHoverCard({
  title,
  start,
  end,
  description,
  moaiMap,
  moais,
  trigger,
}: EventHoverCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger delay={250} closeDelay={150} render={trigger} />
      <HoverCardContent
        align="start"
        className="max-h-[min(32rem,var(--available-height))] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto"
      >
        <div className="space-y-3">
          <div>
            <h3 className="text-base leading-snug font-semibold">{title}</h3>
            <div className="mt-1.5 flex items-start gap-2 text-xs text-muted-foreground tnum">
              <CalendarRangeIcon className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {start}
                {end ? ` — ${end}` : ""}
              </span>
            </div>
          </div>

          {description && (
            <p className="whitespace-pre-wrap break-words border-t pt-3 text-sm leading-relaxed">
              {description}
            </p>
          )}

          {moais.length > 0 && (
            <ul className="space-y-1.5 border-t pt-3">
              {moais.map(({ name, offset }) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-3 rounded-md bg-muted px-2.5 py-1.5 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-1.5 font-medium">
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: dyeVar(name, moaiMap) }}
                    />
                    <span className="truncate">{name}</span>
                  </span>
                  <span className="shrink-0 text-right text-muted-foreground tnum">
                    {offset ? (
                      <>
                        Δ {offset[0]}
                        {offset[1] ? ` — ${offset[1]}` : ""}
                      </>
                    ) : (
                      COPY[initialLanguage()].event_no_base_time
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
