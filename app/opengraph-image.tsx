import { ImageResponse } from "next/og";
import { publication } from "@/lib/publication";

export const alt = `${publication.name} — ${publication.tagline}`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: publication.colors.page,
          color: publication.colors.text,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "64px 76px",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            justifyContent: "space-between",
            letterSpacing: "0.08em",
          }}
        >
          <span>{publication.author}</span>
          <span style={{ color: publication.colors.accent }}>SUBSTACK</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              color: publication.colors.accent,
              display: "flex",
              fontFamily: "Georgia, serif",
              fontSize: 108,
              fontWeight: 700,
              letterSpacing: "-0.06em",
              lineHeight: 0.9,
            }}
          >
            {publication.name}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Georgia, serif",
              fontSize: 42,
              lineHeight: 1.15,
              maxWidth: 850,
            }}
          >
            {publication.tagline}
          </div>
        </div>
        <div
          style={{
            background: publication.colors.header,
            display: "flex",
            height: 18,
            width: "100%",
          }}
        />
      </div>
    ),
    size,
  );
}
