"use client";

import type { Session, Tenant, User } from "@repo/auth";
import { hasPermission } from "@repo/access-control";
import {
  locales,
  usePathname as useLocalePathname,
  useRouter as useLocaleRouter,
} from "@repo/i18n";
import type { Locale } from "@repo/i18n";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  Circle,
  Clock3,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleUserRound,
  Code2,
  CreditCard,
  Crown,
  ExternalLink,
  FileText,
  Folder,
  Home,
  Kanban,
  Languages,
  LayoutDashboard,
  Layers3,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Package,
  Palette,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PaintbrushVertical,
  Plus,
  Rows3,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sidebar,
  SlidersHorizontal,
  Sparkles,
  SwatchBook,
  SquareDashedKanban,
  Sun,
  Type,
  UserCircle,
  Users,
  PlugZap,
} from "lucide-react";
import type { ComponentProps, ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ThemeProvider as NextThemeProvider, useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import {
  DEFAULT_ACCENT_PRESET,
  DEFAULT_THEME_PRESET,
  getAppAccentCookieName,
  getAppAccentStorageKey,
  getAppFontCookieName,
  getAppFontStorageKey,
  getAppThemePresetCookieName,
  getAppThemePresetStorageKey,
  getDefaultFontPresetForApp,
  setAppAccentCookie,
  setAppFontCookie,
  setAppThemePresetCookie,
  setThemeCookie,
  THEME_STORAGE_KEY,
} from "../lib/theme";
import type { AccentPreset, FontPreset, ThemePreset } from "../lib/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./overlay";

type ThemeProviderProps = Omit<
  ComponentProps<typeof NextThemeProvider>,
  "nonce"
> & {
  nonce?: string | undefined;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type NavItem = {
  label: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  permission?: string;
  external?: boolean;
  badge?: string;
  section?: string;
  items?: NavItem[];
};

export const platformNavIcons = {
  home: Home,
  console: LayoutDashboard,
  dashboard: LayoutDashboard,
  admin: Shield,
  billing: CreditCard,
  reporting: BarChart3,
  settings: Settings,
  support: LifeBuoy,
  workspaces: Folder,
  product: Package,
  users: Users,
  kanban: Kanban,
  chat: MessageSquare,
  forms: FileText,
  reactQuery: Code2,
  icons: Palette,
  pro: Crown,
  account: CircleUserRound,
} as const;

export const dashboardStarterNavItems: NavItem[] = [
  {
    section: "Overview",
    label: "Dashboard",
    href: "/dashboard/overview",
    icon: LayoutDashboard,
  },
  {
    section: "Overview",
    label: "Workspaces",
    href: "/dashboard/workspaces",
    icon: Folder,
  },
  {
    section: "Overview",
    label: "Product",
    href: "/dashboard/product",
    icon: Package,
  },
  {
    section: "Overview",
    label: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    section: "Overview",
    label: "Kanban",
    href: "/dashboard/kanban",
    icon: Kanban,
  },
  {
    section: "Overview",
    label: "Chat",
    href: "/dashboard/chat",
    icon: MessageSquare,
  },
  {
    section: "Elements",
    label: "Forms",
    href: "/dashboard/forms",
    icon: FileText,
    items: [
      { label: "Basic Form", href: "/dashboard/forms/basic" },
      { label: "Multi-Step Form", href: "/dashboard/forms/multi-step" },
      { label: "Sheet & Dialog", href: "/dashboard/forms/sheet-dialog" },
      { label: "Advanced Patterns", href: "/dashboard/forms/advanced" },
    ],
  },
  {
    section: "Elements",
    label: "React Query",
    href: "/dashboard/react-query",
    icon: Code2,
  },
  {
    section: "Elements",
    label: "Icons",
    href: "/dashboard/icons",
    icon: Palette,
  },
  {
    section: "Pro",
    label: "Pro",
    href: "/dashboard/pro",
    icon: Crown,
    items: [{ label: "Exclusive", href: "/dashboard/exclusive" }],
  },
  {
    section: "Account",
    label: "Account",
    href: "/dashboard/account",
    icon: CircleUserRound,
    items: [{ label: "Profile", href: "/dashboard/profile" }],
  },
];

type VisibleNavGroup = {
  label: string;
  items: NavItem[];
};

type LocaleLabels = Record<Locale, string>;

type PresetOption<T extends string> = {
  value: T;
  label: string;
  description: string;
};

const DEFAULT_LOCALE_LABELS: LocaleLabels = {
  en: "English",
  sw: "Kiswahili",
  fr: "Français",
};

const THEME_PRESET_OPTIONS: PresetOption<ThemePreset>[] = [
  {
    value: "juris",
    label: "Juris",
    description: "Deep navy neutrals with a crisp enterprise tone.",
  },
  {
    value: "supabase",
    label: "Supabase",
    description: "Fresh mint accent with soft neutral surfaces.",
  },
  {
    value: "mono",
    label: "Mono",
    description: "High-contrast monochrome for focus-first workflows.",
  },
  {
    value: "sunset",
    label: "Sunset",
    description: "Warm terracotta and amber for a vibrant workspace.",
  },
];

const ACCENT_OPTIONS: PresetOption<AccentPreset>[] = [
  {
    value: "juris",
    label: "Juris",
    description: "Default brand blue accent.",
  },
  {
    value: "emerald",
    label: "Emerald",
    description: "Green action emphasis.",
  },
  {
    value: "blue",
    label: "Blue",
    description: "Cool saturated blue.",
  },
  {
    value: "amber",
    label: "Amber",
    description: "Vibrant yellow-orange.",
  },
  {
    value: "rose",
    label: "Rose",
    description: "Warm magenta-red accent.",
  },
  {
    value: "slate",
    label: "Slate",
    description: "Muted neutral accent.",
  },
];

const FONT_OPTIONS: PresetOption<FontPreset>[] = [
  {
    value: "outfit",
    label: "Outfit",
    description: "Default app font.",
  },
  {
    value: "inter",
    label: "Inter",
    description: "Modern UI sans-serif.",
  },
  {
    value: "manrope",
    label: "Manrope",
    description: "Friendly geometric tone.",
  },
  {
    value: "dm-sans",
    label: "DM Sans",
    description: "Compact editorial sans.",
  },
  {
    value: "space-grotesk",
    label: "Space Grotesk",
    description: "Expressive display feel.",
  },
  {
    value: "jetbrains-mono",
    label: "JetBrains Mono",
    description: "Monospace UI voice.",
  },
];

const THEME_PRESET_SWATCHES: Record<ThemePreset, string[]> = {
  juris: [
    "hsl(204 84% 32%)",
    "hsl(220 14% 96%)",
    "hsl(32 82% 48%)",
    "hsl(220 18% 12%)",
  ],
  supabase: [
    "hsl(153 60% 44%)",
    "hsl(210 17% 95%)",
    "hsl(155 16% 23%)",
    "hsl(220 10% 12%)",
  ],
  mono: ["hsl(0 0% 35%)", "hsl(0 0% 95%)", "hsl(0 0% 24%)", "hsl(0 0% 12%)"],
  sunset: [
    "hsl(15 76% 51%)",
    "hsl(43 93% 58%)",
    "hsl(30 32% 94%)",
    "hsl(18 34% 18%)",
  ],
};

type SidebarVariant = "sidebar" | "floating" | "inset";
type SidebarLayoutMode = "default" | "compact" | "offcanvas";

const SIDEBAR_VARIANT_OPTIONS: Array<{
  value: SidebarVariant;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    value: "sidebar",
    label: "Sidebar",
    description: "Classic full-height docked navigation.",
    icon: Sidebar,
  },
  {
    value: "floating",
    label: "Floating",
    description: "Detached panel with rounded container and depth.",
    icon: PanelLeftOpen,
  },
  {
    value: "inset",
    label: "Inset",
    description: "Content and nav share a framed app canvas.",
    icon: SquareDashedKanban,
  },
];

const SIDEBAR_LAYOUT_OPTIONS: Array<{
  value: SidebarLayoutMode;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    value: "default",
    label: "Default",
    description: "Expanded sidebar with full labels.",
    icon: Rows3,
  },
  {
    value: "compact",
    label: "Compact",
    description: "Icon-forward compact rail.",
    icon: PanelLeftClose,
  },
  {
    value: "offcanvas",
    label: "Offcanvas",
    description: "Hide desktop sidebar until opened.",
    icon: PanelLeft,
  },
];

const localeSet = new Set<string>(locales);

const sidebarItemBase =
  "group flex h-8 items-center rounded-lg text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring";

const sidebarItemState = {
  active:
    "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_hsl(var(--sidebar-border))]",
  idle: "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
};

function trimTrailingSlash(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

function normalizePathname(pathname: string) {
  const [path = ""] = pathname.split(/[?#]/);
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const segments = normalized.split("/");

  if (localeSet.has(segments[1] ?? "")) {
    return trimTrailingSlash(`/${segments.slice(2).join("/")}`);
  }

  return trimTrailingSlash(normalized);
}

function deriveAppBasePath(pathname: string) {
  const [cleanPath = ""] = pathname.split(/[?#]/);
  const parts = cleanPath.split("/").filter(Boolean);

  if (parts.length >= 2 && localeSet.has(parts[0] ?? "")) {
    return `/${parts[0]}/${parts[1]}`;
  }

  if (parts.length >= 1) {
    return `/${parts[0]}`;
  }

  return "/dashboard";
}

function isActiveHref(currentPath: string, href: string) {
  if (!currentPath || !href) {
    return false;
  }

  const current = normalizePathname(currentPath);
  const target = normalizePathname(href);

  if (target === "/") {
    return current === "/";
  }

  return current === target || current.startsWith(`${target}/`);
}

function resolveNavIcon(item: NavItem) {
  if (item.icon) {
    return item.icon;
  }

  const href = normalizePathname(item.href);

  if (href.includes("/overview")) {
    return LayoutDashboard;
  }
  if (href.includes("/workspaces")) {
    return Folder;
  }
  if (href.includes("/activity")) {
    return MessageSquare;
  }
  if (href.includes("/tenants")) {
    return Users;
  }
  if (href.includes("/operations/queue")) {
    return Layers3;
  }
  if (href.includes("/operations/integrations")) {
    return PlugZap;
  }
  if (href.includes("/operations/logs")) {
    return Clock3;
  }
  if (href.includes("/operations")) {
    return Package;
  }
  if (href.includes("/settings/appearance")) {
    return SwatchBook;
  }
  if (href.includes("/settings/security")) {
    return ShieldAlert;
  }
  if (href.includes("/settings")) {
    return Settings;
  }
  if (href.includes("/admin")) {
    return Shield;
  }
  if (href.includes("/billing")) {
    return CreditCard;
  }
  if (href.includes("/reports")) {
    return BarChart3;
  }
  if (href.includes("/support")) {
    return LifeBuoy;
  }
  if (href.includes("/docs")) {
    return FileText;
  }
  if (href.endsWith("/console")) {
    return LayoutDashboard;
  }
  if (/^\/[a-z]{2}$/.test(href)) {
    return Home;
  }
  if (href.includes("/401")) {
    return Shield;
  }

  const normalizedLabel = item.label.toLowerCase();
  if (normalizedLabel.includes("workspace")) {
    return Folder;
  }
  if (normalizedLabel.includes("setting")) {
    return Settings;
  }
  if (normalizedLabel.includes("admin")) {
    return Shield;
  }
  if (normalizedLabel.includes("billing")) {
    return CreditCard;
  }
  if (normalizedLabel.includes("report")) {
    return BarChart3;
  }
  if (normalizedLabel.includes("support")) {
    return LifeBuoy;
  }
  if (normalizedLabel.includes("docs")) {
    return FileText;
  }
  if (normalizedLabel.includes("public")) {
    return Home;
  }
  if (normalizedLabel.includes("security")) {
    return ShieldAlert;
  }
  if (normalizedLabel.includes("integration")) {
    return PlugZap;
  }
  if (normalizedLabel.includes("queue")) {
    return Layers3;
  }
  if (normalizedLabel.includes("log")) {
    return Clock3;
  }

  return undefined;
}

function canViewNavItem(item: NavItem, session?: Session) {
  return !item.permission || hasPermission(session, item.permission);
}

function filterVisibleNavItems(items: NavItem[], session?: Session) {
  return items.flatMap((item) => {
    if (!canViewNavItem(item, session)) {
      return [];
    }

    const visibleChildren = item.items?.filter((child) =>
      canViewNavItem(child, session),
    );

    if (item.items?.length && !visibleChildren?.length && !item.href) {
      return [];
    }

    return visibleChildren ? [{ ...item, items: visibleChildren }] : [item];
  });
}

function groupNavItems(items: NavItem[]): VisibleNavGroup[] {
  const groups = new Map<string, NavItem[]>();

  for (const item of items) {
    const label = item.section ?? "Platform";
    const group = groups.get(label) ?? [];
    group.push(item);
    groups.set(label, group);
  }

  return Array.from(groups.entries()).map(([label, groupItems]) => ({
    label,
    items: groupItems,
  }));
}

function useCurrentPath() {
  return useLocalePathname() ?? "";
}

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return undefined;
  }

  return document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`))
    ?.split("=")[1];
}

function isThemePreset(value: string | null | undefined): value is ThemePreset {
  return THEME_PRESET_OPTIONS.some((option) => option.value === value);
}

function isAccentPreset(
  value: string | null | undefined,
): value is AccentPreset {
  return ACCENT_OPTIONS.some((option) => option.value === value);
}

function isFontPreset(value: string | null | undefined): value is FontPreset {
  return FONT_OPTIONS.some((option) => option.value === value);
}

function isSidebarVariant(
  value: string | null | undefined,
): value is SidebarVariant {
  return SIDEBAR_VARIANT_OPTIONS.some((option) => option.value === value);
}

function isSidebarLayoutMode(
  value: string | null | undefined,
): value is SidebarLayoutMode {
  return SIDEBAR_LAYOUT_OPTIONS.some((option) => option.value === value);
}

function resolveInitialThemePreset(appId: string) {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_PRESET;
  }

  const attrValue = document.documentElement.getAttribute("data-theme");
  if (isThemePreset(attrValue)) {
    return attrValue;
  }

  const storedValue =
    window.localStorage.getItem(getAppThemePresetStorageKey(appId)) ??
    readCookie(getAppThemePresetCookieName(appId));

  return isThemePreset(storedValue) ? storedValue : DEFAULT_THEME_PRESET;
}

function resolveInitialAccentPreset(appId: string) {
  if (typeof window === "undefined") {
    return DEFAULT_ACCENT_PRESET;
  }

  const attrValue = document.documentElement.getAttribute("data-accent");
  if (isAccentPreset(attrValue)) {
    return attrValue;
  }

  const storedValue =
    window.localStorage.getItem(getAppAccentStorageKey(appId)) ??
    readCookie(getAppAccentCookieName(appId));

  return isAccentPreset(storedValue) ? storedValue : DEFAULT_ACCENT_PRESET;
}

function resolveInitialFontPreset(appId: string) {
  const defaultFont = getDefaultFontPresetForApp(appId);

  if (typeof window === "undefined") {
    return defaultFont;
  }

  const attrValue = document.documentElement.getAttribute("data-font");
  if (isFontPreset(attrValue)) {
    return attrValue;
  }

  const storedValue =
    window.localStorage.getItem(getAppFontStorageKey(appId)) ??
    readCookie(getAppFontCookieName(appId));

  return isFontPreset(storedValue) ? storedValue : defaultFont;
}

function useAppAppearance(appId: string) {
  const [themePreset, setThemePreset] = useState<ThemePreset>(() =>
    resolveInitialThemePreset(appId),
  );
  const [accentPreset, setAccentPreset] = useState<AccentPreset>(() =>
    resolveInitialAccentPreset(appId),
  );
  const [fontPreset, setFontPreset] = useState<FontPreset>(() =>
    resolveInitialFontPreset(appId),
  );

  useEffect(() => {
    setThemePreset(resolveInitialThemePreset(appId));
    setAccentPreset(resolveInitialAccentPreset(appId));
    setFontPreset(resolveInitialFontPreset(appId));
  }, [appId]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", themePreset);
    window.localStorage.setItem(
      getAppThemePresetStorageKey(appId),
      themePreset,
    );
    setAppThemePresetCookie(appId, themePreset);
  }, [appId, themePreset]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-accent", accentPreset);
    window.localStorage.setItem(getAppAccentStorageKey(appId), accentPreset);
    setAppAccentCookie(appId, accentPreset);
  }, [appId, accentPreset]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-font", fontPreset);
    window.localStorage.setItem(getAppFontStorageKey(appId), fontPreset);
    setAppFontCookie(appId, fontPreset);
  }, [appId, fontPreset]);

  return {
    themePreset,
    setThemePreset,
    accentPreset,
    setAccentPreset,
    fontPreset,
    setFontPreset,
  };
}

function ExternalIndicator({ className }: { className?: string }) {
  return <ExternalLink className={cx("h-3.5 w-3.5", className)} />;
}

function NavBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
      {children}
    </span>
  );
}

function SidebarItemContent({
  item,
  icon,
}: {
  item: NavItem;
  icon?: ReactNode;
}) {
  return (
    <>
      {icon}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? <NavBadge>{item.badge}</NavBadge> : null}
      {item.external ? <ExternalIndicator /> : null}
    </>
  );
}

function SidebarTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function MainNav({ items }: { items: NavItem[] }) {
  return (
    <nav
      aria-label="Primary navigation"
      className="hidden items-center gap-1 md:flex"
    >
      {items.map((item) => {
        const Icon = resolveNavIcon(item);
        return (
          <a
            key={item.href}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noreferrer" : undefined}
            className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {item.label}
            {item.external ? <ExternalIndicator /> : null}
          </a>
        );
      })}
    </nav>
  );
}

export function SidebarNav({
  items,
  session,
  collapsed = false,
  currentPath = "",
  onNavigate,
}: {
  items: NavItem[];
  session?: Session | undefined;
  collapsed?: boolean;
  currentPath?: string;
  onNavigate?: (() => void) | undefined;
}) {
  const visibleItems = useMemo(
    () => filterVisibleNavItems(items, session),
    [items, session],
  );
  const groups = useMemo(() => groupNavItems(visibleItems), [visibleItems]);

  return (
    <TooltipProvider>
      <nav aria-label="Sidebar navigation" className="flex flex-col gap-4">
        {groups.map((group) => (
          <section key={group.label} className="grid gap-1 px-2">
            {!collapsed ? (
              <p className="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/60">
                {group.label}
              </p>
            ) : null}
            <div className="grid gap-1">
              {group.items.map((item) => (
                <SidebarNavItem
                  key={`${group.label}-${item.href}-${item.label}`}
                  item={item}
                  collapsed={collapsed}
                  currentPath={currentPath}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </section>
        ))}
      </nav>
    </TooltipProvider>
  );
}

function SidebarNavItem({
  item,
  collapsed,
  currentPath,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  currentPath: string;
  onNavigate?: (() => void) | undefined;
}) {
  const Icon = resolveNavIcon(item);
  const icon = Icon ? <Icon className="h-4 w-4 shrink-0" /> : null;
  const hasChildren = Boolean(item.items?.length);
  const childIsActive = item.items?.some((child) =>
    isActiveHref(currentPath, child.href),
  );
  const isActive =
    isActiveHref(currentPath, item.href) || Boolean(childIsActive);
  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setOpen(true);
    }
  }, [isActive]);

  if (hasChildren && !collapsed) {
    return (
      <div className="grid gap-1">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={cx(
            sidebarItemBase,
            "w-full gap-2 px-2",
            isActive ? sidebarItemState.active : sidebarItemState.idle,
          )}
        >
          {icon}
          <span className="min-w-0 flex-1 truncate text-left">
            {item.label}
          </span>
          {item.badge ? <NavBadge>{item.badge}</NavBadge> : null}
          <ChevronRight
            className={cx(
              "ml-auto h-4 w-4 shrink-0 transition-transform duration-200",
              open && "rotate-90",
            )}
          />
        </button>

        {open ? (
          <div className="ml-4 grid gap-1 border-l border-sidebar-border px-2 py-0.5">
            {item.items?.map((child) => {
              const childActive = isActiveHref(currentPath, child.href);
              const ChildIcon = resolveNavIcon(child);
              return (
                <a
                  key={`${child.href}-${child.label}`}
                  href={child.href}
                  target={child.external ? "_blank" : undefined}
                  rel={child.external ? "noreferrer" : undefined}
                  aria-current={childActive ? "page" : undefined}
                  onClick={onNavigate}
                  className={cx(
                    "flex h-8 items-center gap-2 rounded-md px-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    childActive
                      ? sidebarItemState.active
                      : sidebarItemState.idle,
                  )}
                >
                  {ChildIcon ? (
                    <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Circle className="h-2.5 w-2.5 shrink-0 fill-current" />
                  )}
                  <span className="truncate">{child.label}</span>
                  {child.external ? (
                    <ExternalIndicator className="ml-auto" />
                  ) : null}
                </a>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  const link = (
    <a
      href={item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noreferrer" : undefined}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cx(
        sidebarItemBase,
        collapsed ? "justify-center px-2" : "gap-2 px-2",
        isActive ? sidebarItemState.active : sidebarItemState.idle,
      )}
    >
      {collapsed ? icon : <SidebarItemContent item={item} icon={icon} />}
    </a>
  );

  if (!collapsed) {
    return link;
  }

  return <SidebarTooltip label={item.label}>{link}</SidebarTooltip>;
}

function ThemeCookieSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme === "dark" || resolvedTheme === "light") {
      setThemeCookie(resolvedTheme);
    }
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({
  children,
  nonce,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={THEME_STORAGE_KEY}
      {...(nonce ? { nonce } : {})}
      {...props}
    >
      <ThemeCookieSync />
      {children}
    </NextThemeProvider>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Toggle theme"
            variant="secondary"
            size="icon"
            className="size-8 rounded-md"
            onClick={() => {
              setThemeCookie(nextTheme);
              setTheme(nextTheme);
            }}
          >
            {mounted && isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle theme</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ThemePresetSwitcher({
  value = "Supabase",
  presets = ["Supabase", "Default", "Neo", "Mono"],
  onChange,
}: {
  value?: string | undefined;
  presets?: string[] | undefined;
  onChange?: ((value: string) => void) | undefined;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="hidden h-9 min-w-48 justify-between gap-3 rounded-md bg-background px-3 text-sm font-medium shadow-none lg:flex"
        >
          <span className="inline-flex items-center gap-2 truncate">
            <Palette className="h-4 w-4" />
            <span className="truncate">{value}</span>
          </span>
          <span className="ml-auto flex items-center gap-2 text-muted-foreground">
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
              TT
            </kbd>
            <ChevronDown className="h-4 w-4" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Themes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {presets.map((preset) => (
          <DropdownMenuItem key={preset} onClick={() => onChange?.(preset)}>
            <Palette className="mr-2 h-4 w-4" />
            <span>{preset}</span>
            {preset === value ? <Check className="ml-auto h-4 w-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type NotificationStatus = "read" | "unread";

type AppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  status: NotificationStatus;
  href: string;
};

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function NotificationPanel({
  locale,
  appId,
}: {
  locale: Locale;
  appId: string;
}) {
  const rootPath = `/${locale}/${appId}`;
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "1",
      title: "New workspace member",
      body: "A new member joined Kilimani Chambers.",
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      status: "unread",
      href: `${rootPath}/workspaces`,
    },
    {
      id: "2",
      title: "Queue latency spike",
      body: "Processing queue exceeded baseline threshold.",
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      status: "unread",
      href: `${rootPath}/operations/queue`,
    },
    {
      id: "3",
      title: "Billing reminder",
      body: "Your next billing cycle starts in 3 days.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      status: "read",
      href: `${rootPath}/settings`,
    },
  ]);

  const unreadCount = notifications.filter(
    (notification) => notification.status === "unread",
  ).length;

  const markAsRead = (id: string) => {
    setNotifications((items) =>
      items.map((item) =>
        item.id === id ? { ...item, status: "read" } : item,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((items) =>
      items.map((item) => ({ ...item, status: "read" })),
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Notifications"
          variant="ghost"
          size="icon"
          className="relative size-8"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] p-0 sm:w-[380px]"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <a
            href={`${rootPath}/activity`}
            className="group flex items-center gap-1"
          >
            <span className="text-sm font-semibold group-hover:underline">
              Notifications
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </a>
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {unreadCount} new
              </span>
            ) : null}
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Mark all as read
              </button>
            ) : null}
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-[360px] overflow-y-auto p-2">
          {notifications.length > 0 ? (
            <div className="grid gap-1">
              {notifications.map((notification) => {
                const isUnread = notification.status === "unread";
                return (
                  <a
                    key={notification.id}
                    href={notification.href}
                    onClick={() => markAsRead(notification.id)}
                    className={cx(
                      "rounded-xl px-3 py-2 transition-colors",
                      isUnread
                        ? "bg-muted/80 hover:bg-muted"
                        : "bg-background hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cx(
                              "truncate text-sm font-semibold",
                              isUnread
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {notification.title}
                          </span>
                          {isUnread ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          ) : null}
                        </div>
                        <p
                          className={cx(
                            "mt-1 text-xs",
                            isUnread
                              ? "text-muted-foreground"
                              : "text-muted-foreground/70",
                          )}
                        >
                          {notification.body}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                        <Clock3 className="h-3 w-3" />
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Bell className="h-7 w-7 opacity-50" />
              <span className="text-sm">No notifications yet</span>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppearancePresetGrid<T extends string>({
  options,
  value,
  onChange,
  icon,
  renderPreview,
}: {
  options: PresetOption<T>[];
  value: T;
  onChange: (value: T) => void;
  icon?: ReactNode;
  renderPreview?: ((option: PresetOption<T>) => ReactNode) | undefined;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cx(
            "group rounded-lg border p-3 text-left transition-colors",
            option.value === value
              ? "border-primary bg-primary/5"
              : "hover:bg-muted/70",
          )}
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{option.label}</span>
            {option.value === value ? (
              <Check className="ml-auto h-4 w-4 text-primary" />
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {option.description}
          </p>
          {renderPreview ? (
            <div className="mt-3">{renderPreview(option)}</div>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function AppearanceSettingsDrawer({
  appId,
  themePreset,
  onThemePresetChange,
  accentPreset,
  onAccentPresetChange,
  fontPreset,
  onFontPresetChange,
  sidebarVariant,
  onSidebarVariantChange,
  sidebarLayoutMode,
  onSidebarLayoutModeChange,
}: {
  appId: string;
  themePreset: ThemePreset;
  onThemePresetChange: (value: ThemePreset) => void;
  accentPreset: AccentPreset;
  onAccentPresetChange: (value: AccentPreset) => void;
  fontPreset: FontPreset;
  onFontPresetChange: (value: FontPreset) => void;
  sidebarVariant: SidebarVariant;
  onSidebarVariantChange: (value: SidebarVariant) => void;
  sidebarLayoutMode: SidebarLayoutMode;
  onSidebarLayoutModeChange: (value: SidebarLayoutMode) => void;
}) {
  const defaultFont = getDefaultFontPresetForApp(appId);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          aria-label="Open theme settings"
          variant="outline"
          className="hidden h-9 min-w-44 justify-between gap-2 rounded-md bg-background px-3 text-sm font-medium shadow-none lg:flex"
        >
          <span className="inline-flex items-center gap-2 truncate">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="truncate">Theme settings</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Theme Settings</SheetTitle>
        </SheetHeader>

        <div className="grid gap-6 py-4">
          <section className="grid gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Preset theme
            </div>
            <AppearancePresetGrid
              options={THEME_PRESET_OPTIONS}
              value={themePreset}
              onChange={onThemePresetChange}
              icon={<Palette className="h-4 w-4 text-muted-foreground" />}
              renderPreview={(option) => (
                <div className="flex items-center gap-1.5">
                  {(THEME_PRESET_SWATCHES[option.value] ?? []).map((color) => (
                    <span
                      key={`${option.value}-${color}`}
                      className="h-3.5 w-3.5 rounded-full border border-border/80"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            />
          </section>

          <section className="grid gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <PaintbrushVertical className="h-4 w-4" />
              Accent color
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ACCENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onAccentPresetChange(option.value)}
                  className={cx(
                    "rounded-lg border p-2 text-left text-sm transition-colors hover:bg-muted/60",
                    option.value === accentPreset
                      ? "border-primary bg-primary/5"
                      : "",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Circle className="h-3.5 w-3.5 fill-current" />
                    {option.label}
                    {option.value === accentPreset ? (
                      <Check className="ml-auto h-4 w-4 text-primary" />
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Type className="h-4 w-4" />
              App font
            </div>
            <AppearancePresetGrid
              options={FONT_OPTIONS}
              value={fontPreset}
              onChange={onFontPresetChange}
              icon={<Type className="h-4 w-4 text-muted-foreground" />}
            />
            <p className="text-xs text-muted-foreground">
              Default for this app:{" "}
              <span className="font-medium text-foreground">
                {FONT_OPTIONS.find((option) => option.value === defaultFont)
                  ?.label ?? "Outfit"}
              </span>
            </p>
          </section>

          <section className="grid gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sidebar className="h-4 w-4" />
              Sidebar style
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {SIDEBAR_VARIANT_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onSidebarVariantChange(option.value)}
                    className={cx(
                      "rounded-lg border p-3 text-left transition-colors",
                      sidebarVariant === option.value
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/70",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                      {sidebarVariant === option.value ? (
                        <Check className="ml-auto h-4 w-4 text-primary" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LayoutDashboard className="h-4 w-4" />
              Layout
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {SIDEBAR_LAYOUT_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onSidebarLayoutModeChange(option.value)}
                    className={cx(
                      "rounded-lg border p-3 text-left transition-colors",
                      sidebarLayoutMode === option.value
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/70",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                      {sidebarLayoutMode === option.value ? (
                        <Check className="ml-auto h-4 w-4 text-primary" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function LocaleSwitcher({
  locale,
  labels = DEFAULT_LOCALE_LABELS,
}: {
  locale: Locale;
  labels?: LocaleLabels;
}) {
  const pathname = useLocalePathname() ?? "/";
  const router = useLocaleRouter();

  const switchLocale = (nextLocale: Locale) => {
    if (nextLocale !== locale) {
      router.replace(pathname, { locale: nextLocale });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Change language" variant="ghost" size="icon">
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((nextLocale) => (
          <DropdownMenuItem
            key={nextLocale}
            className="flex items-center justify-between gap-4"
            onSelect={() => switchLocale(nextLocale)}
          >
            <span>{labels[nextLocale]}</span>
            {locale === nextLocale ? <Check className="h-4 w-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TenantSwitcher({
  tenant,
  tenants,
  placement = "sidebar",
  collapsed = false,
  basePath = "/dashboard",
}: {
  tenant?: Tenant | undefined;
  tenants: Tenant[];
  placement?: "sidebar" | "header";
  collapsed?: boolean;
  basePath?: string;
}) {
  const hasTenant = Boolean(tenant);
  const labelVisibility = collapsed
    ? "invisible max-w-0 overflow-hidden opacity-0"
    : "visible max-w-full opacity-100";

  if (placement === "header") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="hidden h-9 min-w-40 justify-between gap-2 rounded-md bg-background px-3 text-sm font-medium shadow-none lg:flex"
          >
            <Building2 className="h-4 w-4" />
            <span className="truncate">{tenant?.name ?? "Select tenant"}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Tenants</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {tenants.length > 0 ? (
            tenants.map((item) => (
              <DropdownMenuItem key={item.id}>
                <Building2 className="mr-2 h-4 w-4" />
                {item.name}
                {item.id === tenant?.id ? (
                  <Check className="ml-auto h-4 w-4" />
                ) : null}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No tenants available</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (!hasTenant) {
    return (
      <Button
        variant="ghost"
        className="h-12 w-full justify-start gap-3 rounded-lg px-2 text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        asChild
      >
        <a href={`${basePath}/workspaces`}>
          <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Plus className="h-4 w-4" />
          </span>
          <span
            className={cx(
              "grid min-w-0 flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out",
              labelVisibility,
            )}
          >
            <span className="truncate text-sm font-medium">
              Create organization
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              Get started
            </span>
          </span>
          <ChevronsUpDown
            className={cx(
              "ml-auto h-4 w-4 text-sidebar-foreground/60 transition-all duration-200 ease-in-out",
              labelVisibility,
            )}
          />
        </a>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-12 w-full justify-start gap-3 rounded-lg px-2 text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <span className="flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <BriefcaseBusiness className="h-4 w-4" />
          </span>
          <span
            className={cx(
              "grid min-w-0 flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out",
              labelVisibility,
            )}
          >
            <span className="truncate text-sm font-medium">{tenant?.name}</span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              Organization
            </span>
          </span>
          <ChevronsUpDown
            className={cx(
              "ml-auto h-4 w-4 text-sidebar-foreground/60 transition-all duration-200 ease-in-out",
              labelVisibility,
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="right"
        sideOffset={4}
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        {tenants.map((item, index) => (
          <DropdownMenuItem key={item.id} className="gap-2 p-2">
            <span className="flex size-6 items-center justify-center rounded-md border">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            {item.id === tenant?.id ? (
              <Check className="ml-2 h-4 w-4 shrink-0" />
            ) : (
              <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                ⌘{index + 1}
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2 p-2">
          <a href={`${basePath}/workspaces`}>
            <span className="flex size-6 items-center justify-center rounded-md border">
              <Plus className="h-4 w-4" />
            </span>
            <span className="font-medium text-muted-foreground">
              Add organization
            </span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserMenu({
  user,
  basePath = "/dashboard",
}: {
  user?: User | undefined;
  basePath?: string;
}) {
  const initials = useMemo(
    () =>
      (user?.name ?? "User")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user?.name],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-12 w-full justify-start gap-3 rounded-lg px-2 text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            {user?.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
          <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              {user?.name ?? "User"}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              {user?.email ?? "Local user"}
            </span>
          </span>
          <ChevronsUpDown className="ml-auto h-4 w-4 text-sidebar-foreground/60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="right"
        sideOffset={4}
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              {user?.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {user?.name ?? "User"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email ?? "Local user"}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={`${basePath}/profile`}>
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={`${basePath}/profile`}>
            <UserCircle className="mr-2 h-4 w-4" />
            Account
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${basePath}/billing`}>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${basePath}/activity`}>
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SidebarUserMenu({
  user,
  collapsed = false,
  basePath = "/dashboard",
}: {
  user?: User | undefined;
  collapsed?: boolean;
  basePath?: string;
}) {
  if (!collapsed) {
    return <UserMenu user={user} basePath={basePath} />;
  }

  const initials = (user?.name ?? "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-12 w-full justify-center rounded-lg px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            {user?.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="right"
        sideOffset={4}
        className="w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="grid gap-1">
            <p className="truncate text-sm font-medium leading-none">
              {user?.name ?? "User"}
            </p>
            <p className="truncate text-xs leading-none text-muted-foreground">
              {user?.email ?? "Local user"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={`${basePath}/profile`}>
            <UserCircle className="mr-2 h-4 w-4" />
            Account
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${basePath}/billing`}>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${basePath}/activity`}>
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Breadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-center gap-2"
          >
            {index > 0 ? (
              <span className="text-muted-foreground" aria-hidden="true">
                /
              </span>
            ) : null}
            {item.href && index !== items.length - 1 ? (
              <a
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function AppSidebar({
  navItems,
  user,
  tenant,
  tenants,
  session,
  collapsed,
  variant,
  basePath,
  currentPath,
  onNavigate,
}: {
  navItems: NavItem[];
  user?: User | undefined;
  tenant?: Tenant | undefined;
  tenants: Tenant[];
  session?: Session | undefined;
  collapsed: boolean;
  variant: SidebarVariant;
  basePath: string;
  currentPath: string;
  onNavigate?: (() => void) | undefined;
}) {
  return (
    <div
      className={cx(
        "flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground",
        variant === "sidebar" && "border-r border-sidebar-border",
        variant === "floating" &&
          "rounded-xl border border-sidebar-border shadow-soft",
        variant === "inset" && "rounded-xl border border-sidebar-border",
        collapsed && "items-stretch",
      )}
    >
      <div className="flex h-16 shrink-0 items-center px-2">
        <TenantSwitcher
          tenant={tenant}
          tenants={tenants}
          collapsed={collapsed}
          basePath={basePath}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-4">
        <SidebarNav
          items={navItems}
          session={session}
          collapsed={collapsed}
          currentPath={currentPath}
          onNavigate={onNavigate}
        />
      </div>

      <div className="shrink-0 border-t border-sidebar-border p-2">
        <SidebarUserMenu
          user={user}
          collapsed={collapsed}
          basePath={basePath}
        />
      </div>
    </div>
  );
}

function Header({
  appName,
  appId,
  collapsed,
  sidebarLayoutMode,
  locale,
  onToggleSidebar,
  onOpenMobile,
  breadcrumb,
  themePreset,
  onThemePresetChange,
  accentPreset,
  onAccentPresetChange,
  fontPreset,
  onFontPresetChange,
  sidebarVariant,
  onSidebarVariantChange,
  onSidebarLayoutModeChange,
}: {
  appName: string;
  appId: string;
  collapsed: boolean;
  sidebarLayoutMode: SidebarLayoutMode;
  locale: Locale;
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
  breadcrumb?: ReactNode;
  themePreset: ThemePreset;
  onThemePresetChange: (value: ThemePreset) => void;
  accentPreset: AccentPreset;
  onAccentPresetChange: (value: AccentPreset) => void;
  fontPreset: FontPreset;
  onFontPresetChange: (value: FontPreset) => void;
  sidebarVariant: SidebarVariant;
  onSidebarVariantChange: (value: SidebarVariant) => void;
  onSidebarLayoutModeChange: (value: SidebarLayoutMode) => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 bg-background/60 backdrop-blur-md md:h-14">
      <div className="flex min-w-0 items-center gap-2 px-4">
        <Button
          aria-label="Open navigation"
          variant="ghost"
          size="icon"
          className="-ml-1 lg:hidden"
          onClick={onOpenMobile}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          aria-label={
            sidebarLayoutMode === "offcanvas"
              ? "Open sidebar"
              : collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
          }
          variant="ghost"
          size="icon"
          className="-ml-1 hidden lg:inline-flex"
          onClick={onToggleSidebar}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <div className="mr-2 hidden h-4 w-px bg-border md:block" />
        <div className="min-w-0">
          {breadcrumb ?? <span className="text-sm font-medium">{appName}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 px-4">
        <Button
          aria-label="Search"
          variant="outline"
          className="hidden h-9 w-40 justify-start gap-2 rounded-md bg-background text-sm font-normal text-muted-foreground shadow-none md:flex lg:w-64"
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="pointer-events-none ml-auto hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <Button
          aria-label="Search"
          variant="ghost"
          size="icon"
          className="size-8 md:hidden"
        >
          <Search className="h-4 w-4" />
        </Button>

        <ThemeToggle />
        <LocaleSwitcher locale={locale} />
        <AppearanceSettingsDrawer
          appId={appId}
          themePreset={themePreset}
          onThemePresetChange={onThemePresetChange}
          accentPreset={accentPreset}
          onAccentPresetChange={onAccentPresetChange}
          fontPreset={fontPreset}
          onFontPresetChange={onFontPresetChange}
          sidebarVariant={sidebarVariant}
          onSidebarVariantChange={onSidebarVariantChange}
          sidebarLayoutMode={sidebarLayoutMode}
          onSidebarLayoutModeChange={onSidebarLayoutModeChange}
        />
        <NotificationPanel locale={locale} appId={appId} />
      </div>
    </header>
  );
}

export function AppShell({
  appName,
  appId = "app",
  navItems,
  user,
  tenant,
  tenants,
  locale,
  session,
  breadcrumb,
  children,
}: {
  appName: string;
  appId?: string | undefined;
  navItems: NavItem[];
  user?: User | undefined;
  tenant?: Tenant | undefined;
  tenants: Tenant[];
  locale: Locale;
  session?: Session | undefined;
  breadcrumb?: ReactNode;
  children: ReactNode;
}) {
  const currentPath = useCurrentPath();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarVariant, setSidebarVariant] =
    useState<SidebarVariant>("sidebar");
  const [sidebarLayoutMode, setSidebarLayoutMode] =
    useState<SidebarLayoutMode>("default");
  const {
    themePreset,
    setThemePreset,
    accentPreset,
    setAccentPreset,
    fontPreset,
    setFontPreset,
  } = useAppAppearance(appId);

  const variantStorageKey = `${appId}:sidebar-variant`;
  const layoutStorageKey = `${appId}:sidebar-layout-mode`;
  const collapsedStorageKey = `${appId}:sidebar-collapsed`;
  const basePath = deriveAppBasePath(currentPath);
  const isOffcanvas = sidebarLayoutMode === "offcanvas";
  const collapsed = sidebarLayoutMode === "compact";

  useEffect(() => {
    const savedVariant = window.localStorage.getItem(variantStorageKey);
    const savedLayout = window.localStorage.getItem(layoutStorageKey);
    const savedCollapsed = window.localStorage.getItem(collapsedStorageKey);

    if (isSidebarVariant(savedVariant)) {
      setSidebarVariant(savedVariant);
    }

    if (isSidebarLayoutMode(savedLayout)) {
      setSidebarLayoutMode(savedLayout);
      return;
    }

    if (savedCollapsed === "true") {
      setSidebarLayoutMode("compact");
    }
  }, [collapsedStorageKey, layoutStorageKey, variantStorageKey]);

  const toggleSidebar = () => {
    if (isOffcanvas) {
      setMobileOpen(true);
      return;
    }

    setSidebarLayoutMode((value) => {
      const next = value === "compact" ? "default" : "compact";
      window.localStorage.setItem(layoutStorageKey, next);
      return next;
    });
  };

  const sidebar = (isCollapsed: boolean, onNavigate?: () => void) => (
    <AppSidebar
      navItems={navItems}
      user={user}
      tenant={tenant}
      tenants={tenants}
      session={session}
      collapsed={isCollapsed}
      variant={sidebarVariant}
      basePath={basePath}
      currentPath={currentPath}
      onNavigate={onNavigate}
    />
  );

  return (
    <TooltipProvider>
      <div
        className={cx(
          "flex min-h-svh w-full bg-background text-foreground",
          sidebarVariant === "inset" && "bg-sidebar",
        )}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2"
        >
          Skip to content
        </a>

        {!isOffcanvas ? (
          <aside
            data-state={collapsed ? "collapsed" : "expanded"}
            data-collapsible={collapsed ? "icon" : ""}
            data-variant={sidebarVariant}
            className={cx(
              "fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 ease-linear lg:block",
              collapsed ? "w-14" : "w-64",
              sidebarVariant === "floating" && "p-2",
              sidebarVariant === "inset" && "p-2",
            )}
          >
            {sidebar(collapsed)}
          </aside>
        ) : null}

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <span className="hidden" />
          </SheetTrigger>
          <SheetContent className="left-0 top-0 h-screen w-72 translate-x-0 translate-y-0 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            {sidebar(false, () => setMobileOpen(false))}
          </SheetContent>
        </Sheet>

        <div
          className={cx(
            "flex min-h-svh min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-linear",
            isOffcanvas ? "lg:pl-0" : collapsed ? "lg:pl-14" : "lg:pl-64",
            sidebarVariant === "floating" && !isOffcanvas && "lg:pl-[17rem]",
            sidebarVariant === "inset" &&
              !isOffcanvas &&
              "md:m-2 md:rounded-xl md:shadow-soft",
          )}
        >
          <Header
            appName={appName}
            appId={appId}
            collapsed={collapsed}
            sidebarLayoutMode={sidebarLayoutMode}
            locale={locale}
            onToggleSidebar={toggleSidebar}
            onOpenMobile={() => setMobileOpen(true)}
            breadcrumb={breadcrumb}
            themePreset={themePreset}
            onThemePresetChange={setThemePreset}
            accentPreset={accentPreset}
            onAccentPresetChange={setAccentPreset}
            fontPreset={fontPreset}
            onFontPresetChange={setFontPreset}
            sidebarVariant={sidebarVariant}
            onSidebarVariantChange={(value) => {
              setSidebarVariant(value);
              window.localStorage.setItem(variantStorageKey, value);
            }}
            onSidebarLayoutModeChange={(value) => {
              setSidebarLayoutMode(value);
              window.localStorage.setItem(layoutStorageKey, value);
            }}
          />

          <main
            id="main-content"
            className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-6 md:gap-6 md:px-6"
          >
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
