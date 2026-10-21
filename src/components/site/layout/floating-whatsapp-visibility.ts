/** Routes that never show the floating button: own WA CTA / sticky bar (order builder) or no public chrome (admin). */
export const FLOATING_WA_HIDDEN_ROUTES = ["/custom-order", "/admin"] as const;

/** Prefix match on whole path segments: "/admin" hides "/admin/x" but not "/administrasi". */
export function isRouteHidden(
  pathname: string,
  hideOn: readonly string[],
): boolean {
  return hideOn.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export type FloatingWaState = {
  /** The site footer (which carries its own WA links) intersects the viewport. */
  footerVisible: boolean;
  /** The cookie-consent banner is on screen (bottom-fixed, would overlap). */
  bannerVisible: boolean;
};

/** Mounted on the route but temporarily tucked away (not focusable) while it would cover content. */
export function isFloatingWaTucked({
  footerVisible,
  bannerVisible,
}: FloatingWaState): boolean {
  return footerVisible || bannerVisible;
}

/** A consent banner element counts as visible unless hidden pre-paint (`hidden`) or still pending. */
export function isBannerShown(el: Element | null): boolean {
  if (!el) return false;
  return !el.hasAttribute("hidden") && !el.hasAttribute("data-pending");
}
