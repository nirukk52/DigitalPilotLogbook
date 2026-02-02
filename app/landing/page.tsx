/**
 * Static HTML landing page wrapper
 * Serves the landing page HTML file with proper routing
 */
export default function LandingPage() {
  return (
    <iframe
      src="/landing.html"
      className="w-full h-screen border-0"
      title="Digital Pilot Logbook Landing Page"
    />
  );
}
