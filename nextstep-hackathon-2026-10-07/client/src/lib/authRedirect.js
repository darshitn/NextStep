const PUBLIC_LOGIN_URL = 'https://next-step-six-theta.vercel.app/login';

// Confirmation emails must remain usable outside the developer's machine.
// A separate development Supabase project may explicitly opt into loopback returns.
export function resolveConfirmationRedirect(currentOrigin, configuredRedirect) {
  if (configuredRedirect) {
    let target;
    try { target = new URL(configuredRedirect); } catch { /* handled below */ }
    const loopback = target && ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname);
    if (!target || (target.protocol !== 'https:' && !(target.protocol === 'http:' && loopback)) ||
        target.username || target.password || target.search || target.hash) {
      const error = new Error('The confirmation return URL is invalid. Configure VITE_AUTH_REDIRECT_URL as an HTTPS URL (or an explicit loopback development URL).');
      error.code = 'CONFIG_INVALID';
      throw error;
    }
    return target.href;
  }
  try {
    const origin = new URL(currentOrigin);
    if (origin.protocol === 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)) {
      return new URL('/login', origin).href;
    }
  } catch { /* non-browser calls use the public application */ }
  return PUBLIC_LOGIN_URL;
}
