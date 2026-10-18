import { useEffect, useState } from "react";

export type Route = { courseId?: string; unitId?: string };

const parse = (): Route => {
  const [courseId, unitId] = window.location.hash.replace(/^#\/?/, "").split("/");
  return { courseId: courseId || undefined, unitId: unitId || undefined };
};

/**
 * Routes live in the hash (#/discrete/sets) so GitHub Pages can serve
 * every link from the single index.html, and Back works as expected.
 */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export const go = (courseId?: string, unitId?: string) => {
  window.location.hash = courseId ? `/${courseId}${unitId ? `/${unitId}` : ""}` : "/";
};
