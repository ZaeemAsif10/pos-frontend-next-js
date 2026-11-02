"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { resolvePageTitle, formatFullTitle } from "@/lib/page-title";

type Listener = () => void;
const listeners = new Set<Listener>();
let activeCustomTitle: string | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

/**
 * Set a custom title override imperatively (e.g. from a detail page or modal).
 * Pass null or undefined to clear the override and revert to the active tab title.
 */
export function setCustomPageTitle(title: string | null | undefined) {
  activeCustomTitle = title ?? null;
  notify();
}

/**
 * Hook to set a dynamic custom title from within any component or page.
 * Automatically clears the override and restores the active tab title when unmounted.
 *
 * Example:
 *   usePageTitle("Invoice #INV-1042");
 */
export function usePageTitle(customTitle?: string | null) {
  useEffect(() => {
    if (!customTitle) return;
    setCustomPageTitle(customTitle);

    return () => {
      setCustomPageTitle(null);
    };
  }, [customTitle]);
}

/**
 * Global component that synchronizes the browser tab's title with the active tab/route.
 * 1. Renders React 19 native <title> tag (hoisted directly into <head>).
 * 2. Directly mutates document.title for instant browser responsiveness.
 * 3. Uses a MutationObserver to prevent Next.js router from restoring default layout title.
 */
export function PageTitleSync() {
  const pathname = usePathname();
  const [customTitle, setCustomTitle] = useState<string | null>(activeCustomTitle);

  useEffect(() => {
    const handleUpdate = () => setCustomTitle(activeCustomTitle);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const baseTitle = customTitle || resolvePageTitle(pathname);
  const fullTitle = formatFullTitle(baseTitle);

  useEffect(() => {
    if (typeof document === "undefined") return;

    // 1. Direct synchronous title update
    document.title = fullTitle;

    // 2. Microtask / timer fallback in case Next.js router head manager resets title
    const timer = setTimeout(() => {
      if (document.title !== fullTitle) {
        document.title = fullTitle;
      }
    }, 50);

    // 3. MutationObserver on <title> element to continuously lock the title
    const titleEl = document.querySelector("title");
    if (!titleEl) return () => clearTimeout(timer);

    const observer = new MutationObserver(() => {
      if (document.title !== fullTitle) {
        document.title = fullTitle;
      }
    });

    observer.observe(titleEl, { childList: true, characterData: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [fullTitle, pathname]);

  return <title>{fullTitle}</title>;
}

export default PageTitleSync;
