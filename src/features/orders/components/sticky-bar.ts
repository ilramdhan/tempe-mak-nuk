export type StickyBarState = {
  /** Viewport is below `md`: the action bar is fixed to the bottom. */
  mobile: boolean;
  /** The order builder form intersects the viewport. */
  builderInView: boolean;
};

/**
 * The mobile action bar ("Lanjut" / "Kirim pesanan") stays hidden — and inert — until the
 * builder is on screen, so it never covers the hero. On desktop the bar is inline: never hidden.
 */
export function isStickyBarHidden({
  mobile,
  builderInView,
}: StickyBarState): boolean {
  return mobile && !builderInView;
}
