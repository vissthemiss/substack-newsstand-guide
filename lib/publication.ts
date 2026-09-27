export const publication = {
  name: "uts: murmur.",
  author: "annna zlogoni",
  tagline: "the voice behind the radio frequency",
  description:
    "Poet, radio host, curator. Thinking out loud — music, literature, all of it in wav format.",
  substackUrl: "https://pechat.substack.com/",
  subscribeUrl: "https://pechat.substack.com/subscribe",
  archiveApiBase: "https://pechat.substack.com/api/v1/archive",
  allowedHosts: ["pechat.substack.com"] as const,
  colors: {
    page: "#FFFFE8",
    header: "#AACB73",
    accent: "#CD2C58",
    text: "#1a1a1a",
  },
  assets: {
    wordmark: "/assets/wordmark.png",
    wood: "/assets/worn-wood.jpg",
  },
  revalidateSeconds: 3600,
} as const;
