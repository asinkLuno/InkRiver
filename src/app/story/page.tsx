"use client";

import { useEffect, useState } from "react";
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
    <main className="flex-1 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <header>
          <h1 className="font-display text-4xl leading-tight">{story.title}</h1>
          {story.description && (
            <div className="mt-5 max-w-[72ch] text-[15px] leading-7 text-foreground/85 whitespace-pre-wrap">
              {story.description}
            </div>
          )}
        </header>

        <section
          aria-labelledby="story-calendar-heading"
          className="mt-12 border-t pt-6"
        >
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-[9rem_1fr]">
            <h2
              id="story-calendar-heading"
              className="text-sm font-medium text-muted-foreground"
            >
              {COPY[initialLanguage()].story_calendar}
            </h2>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-display text-xl">{calendar.title}</span>
                <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  {calendar.source === "builtin"
                    ? COPY[initialLanguage()].story_builtin
                    : COPY[initialLanguage()].story_plugin}
                </span>
              </div>
              {calendar.description && (
                <p className="mt-2 max-w-[64ch] text-sm leading-6 text-muted-foreground">
                  {calendar.description}
                </p>
              )}
              <dl className="mt-3 flex items-baseline gap-2 text-sm">
                <dt className="text-muted-foreground">
                  {COPY[initialLanguage()].story_mode}
                </dt>
                <dd className="tnum text-xs">{calendar.name}</dd>
              </dl>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
