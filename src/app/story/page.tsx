"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PageError, PageLoading } from "@/components/page-state";
import { COPY, initialLanguage } from "@/lib/i18n";
import {
  getCalendarMetadata,
  getStory,
  onRefetch,
  type CalendarMetadata,
  type Story,
} from "@/lib/api";

export default function StoryPage() {
  const [data, setData] = useState<{
    story: Story;
    calendar: CalendarMetadata;
  } | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      Promise.all([getStory(), getCalendarMetadata()])
        .then(([story, calendar]) => {
          if (!cancelled) {
            setError(null);
            setData({ story, calendar });
          }
        })
        .catch((err) => !cancelled && setError(err));
    };
    load();
    const off = onRefetch(load);
    return () => {
      cancelled = true;
      off();
    };
  }, []);

  if (error)
    return <PageError title={COPY[initialLanguage()].error_load_story} error={error} />;
  if (!data) return <PageLoading />;

  const { story, calendar } = data;

  return (
    <main className="flex-1 px-6 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        {/* 卷首：书页式版面，标题与描述之间只留呼吸，不留卡片 */}
        <section aria-labelledby="story-title">
          <h1 id="story-title" className="font-heading text-4xl font-semibold tracking-tight">
            {story.title}
          </h1>
          {story.description && (
            <p className="mt-5 max-w-prose text-[15px] leading-8 text-muted-foreground">
              {story.description}
            </p>
          )}
        </section>

        <section
          aria-labelledby="calendar-title"
          className="mt-10 border-t border-border pt-8"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2
              id="calendar-title"
              className="font-heading text-xl font-semibold"
            >
              {COPY[initialLanguage()].story_calendar}
            </h2>
            <Badge variant="secondary">
              {calendar.source === "builtin" ? COPY[initialLanguage()].story_builtin : COPY[initialLanguage()].story_plugin}
            </Badge>
          </div>
          <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
            {calendar.title}
            {calendar.description ? `——${calendar.description}` : ""}
          </p>
          <dl className="mt-5 grid gap-y-2.5 text-sm sm:grid-cols-[8rem_1fr] sm:gap-x-6">
            <dt className="text-muted-foreground">{COPY[initialLanguage()].story_mode}</dt>
            <dd className="font-mono text-xs leading-6">{calendar.name}</dd>
          </dl>
        </section>
      </div>
    </main>
  );
}
