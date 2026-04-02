import { ImageResponse } from "next/og";

/** Короткий alt для превью; основной текст на картинке — латиница, чтобы OG не тянул веб-шрифты для кириллицы. */
export const alt = "DONE48 marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 42%, #0f172a 100%)",
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 88,
            height: 88,
            borderRadius: 20,
            background: "rgba(255,255,255,0.2)",
            fontSize: 36,
            fontWeight: 800,
            color: "white",
          }}
        >
          D
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 68,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          DONE48
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 30,
            fontWeight: 500,
            color: "rgba(255,255,255,0.92)",
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          Micro-tasks & freelance in one workspace — for clients and freelancers
        </div>
      </div>
    ),
    { ...size },
  );
}
