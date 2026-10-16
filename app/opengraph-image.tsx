import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "AMFB Notifier - Notificări program minifotbal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          backgroundColor: "#07140c",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(163,230,53,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.2), transparent 40%)",
          padding: 80,
        }}
      >
        <div style={{ fontSize: 28, color: "#bef264", letterSpacing: 4, marginBottom: 24 }}>
          AMFB NOTIFIER
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "white",
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Programul se schimbă. Tu afli primul.
        </div>
        <div style={{ fontSize: 28, color: "#a3a3a3", marginTop: 28, maxWidth: 800 }}>
          Notificări email pentru grupele AMFB - ora, adversarul și prognoza.
        </div>
      </div>
    ),
    { ...size }
  );
}
