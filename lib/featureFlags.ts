/**
 * Centralized feature flags and helpers.
 * 
 * BETA MODE rules:
 * - Server-side: controlled by process.env.BETA_MODE === 'true'
 * - Client-side: controlled by process.env.NEXT_PUBLIC_BETA_MODE === 'true'
 *
 * Use checkBetaMode() everywhere to toggle beta behavior.
 */

export function checkBetaMode(): boolean {
  // In Next.js, process.env variables are inlined at build-time for client bundles.
  // We support both server and client flags; if either is true, beta is enabled.
  const serverFlag = process.env.BETA_MODE;
  const publicFlag = process.env.NEXT_PUBLIC_BETA_MODE;

  // Prefer explicit public flag when running in the browser
  if (typeof window !== 'undefined') {
    return publicFlag === 'true' || serverFlag === 'true';
  }

  // Server-side
  return serverFlag === 'true' || publicFlag === 'true';
}

export function logBetaStatus(context: string) {
  if (checkBetaMode()) {
    console.log(`🚧 BETA_MODE activé (${context})`)
  } else {
    // Keep logs concise in production mode
    // console.log(`BETA_MODE désactivé (${context})`)
  }
}


