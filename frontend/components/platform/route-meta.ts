export type RouteMeta = {
  match: string;
  title: string;
  sub: string;
};

export function resolveRouteMeta(
  pathname: string,
  routes: RouteMeta[],
  fallback: { title: string; sub: string }
) {
  const match = [...routes]
    .sort((a, b) => b.match.length - a.match.length)
    .find((route) => pathname === route.match || pathname.startsWith(`${route.match}/`));
  return match ?? fallback;
}
