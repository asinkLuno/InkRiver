import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { FileX, FolderOpen } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { PageErrorBoundary, PageLoading } from "@/components/page-state";
import { SettingsDialog } from "@/components/settings-dialog";
import { QuickSwitcher } from "@/components/quick-switcher";
import { AppEvents } from "@/app/app-events";
import {
  closeStory,
  formatWeftError,
  getAppState,
  getLoadError,
  hasLoadedStory,
  openRecentStory,
  openStory,
  reloadStory,
  setLanguage as setMenuLanguage,
  triggerRefetch,
  type AppStateInfo,
  type OpenedStory,
} from "@/lib/api";
import { emit, listen, openUrl } from "@/lib/platform";
import {
  COPY,
  LANGUAGE_KEY,
  initialLanguage,
  formatErrorMessage,
  type Language,
} from "@/lib/i18n";

const StoryPage = lazy(() => import("@/app/story/page"));
const MoaiPage = lazy(() => import("@/app/moai/page"));
const MoaiLinkPage = lazy(() => import("@/app/moai-link/page"));
const DriftPage = lazy(() => import("@/app/drift/page"));
const NarrativePage = lazy(() => import("@/app/narrative/page"));

const NAV_ITEMS = [
  { key: "nav_story", path: "/story" },
  { key: "nav_moai", path: "/moai" },
  { key: "nav_moai_link", path: "/moai-link" },
  { key: "nav_drift", path: "/drift" },
  { key: "nav_narrative", path: "/narrative" },
] as const;

const PAGES: Record<string, React.ComponentType> = {
  "/story": StoryPage,
  "/moai": MoaiPage,
  "/moai-link": MoaiLinkPage,
  "/drift": DriftPage,
  "/narrative": NarrativePage,
};

const RECENT_STORIES_KEY = "weft.recentStories";
const MAX_RECENT_STORIES = 5;

/* landing 的织线开场：虚线是经线，粗线是纬线，转折处打结。
 * 线的语言来自 logo，事件结随梭子经过依次落定。 */
const WEFT_VERTICES: Array<[number, number]> = [
  [110, 135],
  [230, 55],
  [350, 135],
  [470, 15],
  [590, 95],
  [710, 15],
  [830, 95],
];
const WEFT_KNOT_DELAYS = [
  "0.36s",
  "0.55s",
  "0.77s",
  "0.98s",
  "1.17s",
  "1.37s",
  "1.56s",
];

function LandingWeave() {
  return (
    <svg
      viewBox="0 0 960 150"
      fill="none"
      aria-hidden="true"
      className="h-auto w-full text-primary"
    >
      {[15, 55, 95, 135].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="960"
          y2={y}
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1.5"
          strokeDasharray="7 7"
        />
      ))}
      <path
        d="M0 15 L110 135 L230 55 L350 135 L470 15 L590 95 L710 15 L830 95 L960 15"
        pathLength={1}
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="weft-draw"
      />
      {WEFT_VERTICES.map(([cx, cy], index) => (
        <circle
          key={cx}
          cx={cx}
          cy={cy}
          r={index % 2 === 0 ? 6 : 8}
          className="weft-knot"
          style={{ animationDelay: WEFT_KNOT_DELAYS[index] }}
          fill={index % 2 === 0 ? "currentColor" : "var(--background)"}
          stroke="currentColor"
          strokeWidth={index % 2 === 0 ? 0 : 3.5}
        />
      ))}
    </svg>
  );
}

function loadRecentStories(): OpenedStory[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(RECENT_STORIES_KEY) ?? "[]",
    );
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (item): item is OpenedStory =>
          typeof item?.title === "string" && typeof item?.path === "string",
      )
      .slice(0, MAX_RECENT_STORIES);
  } catch {
    return [];
  }
}

function currentPath() {
  return window.location.hash.slice(1) || "/story";
}

export function App() {
  const [path, setPath] = useState(currentPath);
  const [hasStory, setHasStory] = useState<boolean | null>(null);
  const [appState, setAppState] = useState<AppStateInfo | null>(null);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [recentStories, setRecentStories] =
    useState<OpenedStory[]>(loadRecentStories);
  const [fileLostPath, setFileLostPath] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [dragPath, setDragPath] = useState<string | null>(null);

  const refreshAppState = useCallback(() => {
    getAppState()
      .then(setAppState)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setMenuLanguage(language).catch(() => undefined);
    hasLoadedStory()
      .then((loaded) => {
        setHasStory(loaded);
        if (loaded) refreshAppState();
        else
          getLoadError()
            .then((error) => {
              if (!error) return;
              const location = error.line
                ? ` (${error.line}${error.column ? `:${error.column}` : ""})`
                : "";
              setOpenError(`${formatErrorMessage(language, error)}${location} [${error.code}]`);
            })
            .catch(() => undefined);
      })
      .catch((error) => {
        setHasStory(false);
        setOpenError(error instanceof Error ? error.message : String(error));
      });

    if (!window.location.hash) {
      window.location.replace("#/story");
    }
    const navigate = () => setPath(currentPath());
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, [refreshAppState]);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let disposed = false;
    listen<string>("weft-menu", (event) => {
      switch (event.payload) {
        case "open":
          void handleOpenStory();
          break;
        case "open_recent":
          setSwitcherOpen(true);
          break;
        case "close":
          void handleCloseStory();
          break;
        case "reload":
          void handleReload();
          break;
        case "preferences":
          setSettingsOpen(true);
          break;
        case "help_docs":
          openExternal("https://asinkluno.github.io/WEFT/");
          break;
        case "help_issue":
          openExternal("https://github.com/asinkLuno/WEFT/issues");
          break;
      }
    }).then((un) => {
      if (disposed) un();
      else unlisten = un;
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unlisteners: UnlistenFn[] = [];
    let disposed = false;
    Promise.all([
      listen<string>("weft-drag-enter", (event) => setDragPath(event.payload)),
      listen<string>("weft-drag-drop", (event) => {
        setDragPath(null);
        void handleDrop(event.payload);
      }),
      listen("weft-drag-leave", () => setDragPath(null)),
    ]).then((listeners) => {
      if (disposed) listeners.forEach((un) => un());
      else unlisteners.push(...listeners);
    });
    return () => {
      disposed = true;
      unlisteners.forEach((un) => un());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Page = PAGES[path] ?? StoryPage;

  function rememberStory(story: OpenedStory) {
    setRecentStories((prev) => {
      const next = [
        story,
        ...prev.filter((recent) => recent.path !== story.path),
      ].slice(0, MAX_RECENT_STORIES);
      localStorage.setItem(RECENT_STORIES_KEY, JSON.stringify(next));
      return next;
    });
  }

  function changeLanguage(next: Language) {
    setLanguage(next);
    localStorage.setItem(LANGUAGE_KEY, next);
    setMenuLanguage(next).catch(() => undefined);
  }

  function finishOpening(story: OpenedStory) {
    rememberStory(story);
    window.location.hash = "/story";
    window.location.reload();
  }

  async function handleOpenStory() {
    setOpening(true);
    setOpenError(null);
    try {
      const story = await openStory();
      if (story !== null) finishOpening(story);
    } catch (error) {
      setOpenError(formatWeftError(error));
    } finally {
      setOpening(false);
    }
  }

  async function handleOpenRecent(story: OpenedStory) {
    setOpening(true);
    setOpenError(null);
    try {
      finishOpening(await openRecentStory(story.path));
    } catch (error) {
      setOpenError(formatWeftError(error));
    } finally {
      setOpening(false);
    }
  }

  async function handleCloseStory() {
    try {
      await closeStory();
      setFileLostPath(null);
      setHasStory(false);
      setAppState(null);
      window.location.hash = "/story";
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleLocate() {
    setOpening(true);
    try {
      const story = await openStory();
      if (story !== null) {
        setFileLostPath(null);
        finishOpening(story);
      }
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : String(error));
    } finally {
      setOpening(false);
    }
  }

  async function handleReload() {
    try {
      await reloadStory();
      triggerRefetch();
      refreshAppState();
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleDrop(rawPath: string) {
    const path = rawPath.trim();
    if (!/\.(ya?ml)$/i.test(path)) {
      setOpenError(COPY[language].landing_invalid_drop);
      return;
    }
    setOpenError(null);
    setOpening(true);
    try {
      const story = await openRecentStory(path);
      finishOpening(story);
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : String(error));
    } finally {
      setOpening(false);
    }
  }

  function openExternal(url: string) {
    void openUrl(url);
  }

  const onFileLost = useCallback((lostPath: string) => {
    setFileLostPath(lostPath);
  }, []);

  useEffect(() => {
    if (hasStory === null) return;
    void emit("weft-menu-state", {
      close: hasStory,
      reload: hasStory && !fileLostPath,
    });
  }, [hasStory, fileLostPath]);

  if (hasStory === null) {
    return <div className="min-h-screen bg-background" />;
  }

  const dragOverlay = dragPath !== null && (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      aria-live="polite"
    >
      <div className="pointer-events-none rounded-xl border-2 border-dashed border-primary/50 bg-background/95 px-12 py-8 text-center shadow-lg">
        <FolderOpen className="mx-auto mb-3 size-8 text-primary" />
        <p className="text-sm font-medium">{COPY[language].landing_drop_to_open}</p>
        <p
          className="mt-1 max-w-xs truncate text-xs text-muted-foreground"
          title={dragPath}
        >
          {dragPath.split(/[\\/]/).pop()}
        </p>
      </div>
    </div>
  );

  const dialogs = (
    <>
      {dragOverlay}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        language={language}
        onLanguageChange={changeLanguage}
      />
      <QuickSwitcher
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        recent={recentStories}
        onPick={(story) => {
          setSwitcherOpen(false);
          void handleOpenRecent(story);
        }}
        language={language}
      />
    </>
  );

  if (!hasStory) {
    return (
      <>
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-12 sm:py-16">
          <LandingWeave />
          <div className="mt-10">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {COPY[language].landing_title}
            </h1>
            <p className="mt-3 text-base leading-7">
              {COPY[language].landing_tagline}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {COPY[language].landing_description}
            </p>
          </div>

          <div className="mt-10 rounded-lg border border-dashed border-ring/40 bg-card/60 px-8 py-10 text-center">
            <p className="mb-6 font-mono text-xs tracking-wide text-muted-foreground">
              {COPY[language].landing_formats}
            </p>
            <Button
              type="button"
              size="lg"
              onClick={handleOpenStory}
              disabled={opening}
            >
              <FolderOpen data-icon="inline-start" />
              {opening ? COPY[language].landing_opening : COPY[language].landing_choose}
            </Button>
          </div>

          <section className="mt-10" aria-labelledby="recent-stories-heading">
            <h2
              id="recent-stories-heading"
              className="font-heading text-lg font-semibold"
            >
              {COPY[language].landing_recent}
            </h2>
            {recentStories.length > 0 ? (
              <ul className="mt-2 divide-y divide-border/70">
                {recentStories.map((story) => (
                  <li key={story.path}>
                    <button
                      type="button"
                      className="-mx-3 block w-full rounded-sm px-3 py-3 text-left transition-colors hover:bg-accent disabled:opacity-50"
                      onClick={() => handleOpenRecent(story)}
                      disabled={opening}
                    >
                      <span className="block truncate text-sm font-medium">
                        {story.title}
                      </span>
                      <span
                        className="mt-0.5 block truncate font-mono text-xs text-muted-foreground"
                        title={story.path}
                      >
                        {story.path}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {COPY[language].landing_no_recent}
              </p>
            )}
          </section>
          {openError && (
            <p className="mt-6 text-sm text-destructive" role="alert">
              {COPY[language].landing_open_failed}: {openError}
            </p>
          )}
        </main>
        {dialogs}
      </>
    );
  }

  if (fileLostPath) {
    return (
      <>
        <AppEvents onFileLost={onFileLost} language={language} />
        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md text-center">
            <FileX className="mx-auto mb-4 size-10 text-muted-foreground" />
            <h1 className="text-xl font-semibold tracking-tight">
              {COPY[language].landing_file_lost_title}
            </h1>
            <p className="mt-3 break-all rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              {fileLostPath}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {COPY[language].landing_file_lost_hint}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button type="button" onClick={handleLocate} disabled={opening}>
                <FolderOpen data-icon="inline-start" />
                {opening ? COPY[language].landing_opening : COPY[language].landing_locate}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseStory}
              >
                {COPY[language].landing_close_story}
              </Button>
            </div>
            {openError && (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {COPY[language].landing_open_failed}: {openError}
              </p>
            )}
          </div>
        </main>
        {dialogs}
      </>
    );
  }

  const fileName = appState?.story_path
    ? appState.story_path.split(/[\\/]/).pop()
    : null;

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <AppEvents onFileLost={onFileLost} language={language} />
        <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border px-4 py-3 sm:flex-nowrap sm:px-6">
          <a
            href="#/story"
            className="flex items-center gap-2 font-heading text-lg font-semibold tracking-wide"
          >
            <img src="/logo-icon.svg" alt="WEFT" width={20} height={20} />
            WEFT
          </a>
          <NavigationMenu className="order-last min-w-0 max-w-none basis-full justify-start overflow-x-auto sm:order-none sm:basis-auto sm:overflow-visible">
            <NavigationMenuList className="gap-1">
              {NAV_ITEMS.map((item) => (
                <NavigationMenuItem key={item.path}>
                  <NavigationMenuLink
                    href={`#${item.path}`}
                    active={path === item.path}
                    aria-current={path === item.path ? "page" : undefined}
                  >
                    {COPY[language][item.key as keyof typeof COPY[typeof language]]}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            {openError && (
              <span
                className="max-w-80 truncate text-sm text-destructive"
                title={openError}
              >
                {COPY[language].landing_open_failed}: {openError}
              </span>
            )}
            {fileName && (
              <span
                className="flex max-w-32 items-center gap-1.5 truncate text-sm text-muted-foreground sm:max-w-60"
                title={appState?.story_path ?? fileName}
              >
                <span
                  className="size-1.5 rounded-full bg-success"
                  aria-label={COPY[language].landing_watching}
                />
                <span className="truncate">{fileName}</span>
              </span>
            )}
          </div>
        </header>
        <PageErrorBoundary key={path}>
          <Suspense fallback={<PageLoading />}>
            <Page />
          </Suspense>
        </PageErrorBoundary>
      </div>
      {dialogs}
    </>
  );
}
