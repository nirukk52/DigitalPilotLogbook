import { redirect } from "next/navigation";

/**
 * Landing page route - redirects to the HTML landing page
 * This ensures users see the landing page when visiting the root URL
 */
export default function Home() {
  redirect("/landing");
}
