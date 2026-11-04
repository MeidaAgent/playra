/** Hostname suffix for UGC economy game sites (`{slug}.economies.playra.io`), matching API `ECONOMIES_SITE_HOST_SUFFIX`. */
export const HOSTED_ECONOMY_SITE_HOST_SUFFIX = "economies.playra.io";

/**
 * Canonical origin for player-economy hosted games, matching API `economyHostedSiteStoragePrefix`.
 */
export function canonicalHostedMinigamePlayUrl(slug: string): string {
  const s = slug.trim().toLowerCase();
  if (!s) return "";
  return `https://${s}.${HOSTED_ECONOMY_SITE_HOST_SUFFIX}`;
}

/** True if URL looks like a Playra hosted economy/minigames site (legacy or current host). */
export function looksLikeMinigamesSunflowerLandUrl(url: string): boolean {
  const t = url.trim();
  return /^https:\/\/[^/]+\.(economies|minigames)\.sunflower-land\.com\/?$/i.test(
    t,
  );
}
