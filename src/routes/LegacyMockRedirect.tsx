import type { ReactNode } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { legacyMockTarget } from "@/lib/legacyRedirects";

/** Forwards known old /mock-tests/<slug> addresses to the real page (query kept). */
const LegacyMockRedirect = ({ children }: { children: ReactNode }) => {
  const { slug } = useParams();
  const { search, hash } = useLocation();
  const target = legacyMockTarget(slug);
  if (target) return <Navigate replace to={`/mock-tests/${target}${search}${hash}`} />;
  return <>{children}</>;
};

export default LegacyMockRedirect;
