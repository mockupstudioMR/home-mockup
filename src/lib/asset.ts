/**
 * A file from /public at the address the app is served from: "/" on Lovable, "/home-mockup/" on GitHub Pages.
 * Use it for every public file the code loads, instead of a path starting with "/".
 */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
