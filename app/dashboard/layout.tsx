/**
 * Dashboard layout — RSC wrapper.
 * Auth protection is handled by middleware.ts (cookie check at the Edge),
 * so this layout has zero auth logic and stays a pure Server Component.
 *
 * Each dashboard page renders its own <DashboardShell title="..."> to pass
 * the correct page title — this layout simply provides the route segment
 * boundary for Next.js nested routing.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
