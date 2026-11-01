import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Luminosity — Learn with Lumi" },
    { name: "description", content: "Learn concepts and prepare for exams with Lumi, your personal study buddy." },
    { property: "og:title", content: "Luminosity — Learn with Lumi" },
    { property: "og:description", content: "Learn concepts and prepare for exams with Lumi, your personal study buddy." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: () => {
    throw redirect({ to: "/about" });
  },
});
