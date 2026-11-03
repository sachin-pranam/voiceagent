import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // For now, redirect everyone to dashboard
    // In the future, we can check user role and redirect admins to /admin
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Awaaz AI" },
      {
        name: "description",
        content: "Monitor AI phone calls, recordings and transcripts from Twilio.",
      },
      { property: "og:title", content: "Awaaz AI" },
      {
        property: "og:description",
        content: "Monitor AI phone calls, recordings and transcripts from Twilio.",
      },
    ],
  }),
});
