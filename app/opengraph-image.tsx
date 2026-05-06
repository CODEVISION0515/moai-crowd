import { ImageResponse } from "next/og";

// SNS 共有用の OG 画像を動的生成 (1200x630)
export const runtime = "edge";
export const alt = "MOAI Crowd — AIに強いクラウドソーシング";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
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
          padding: "80px",
          background: "linear-gradient(135deg, #0f766e 0%, #134e4a 60%, #0f172a 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* 装飾円 (teal + coral) */}
        <div
          style={{
            position: "absolute",
            top: "-220px",
            right: "-180px",
            width: "560px",
            height: "560px",
            borderRadius: "50%",
            background: "rgba(237,110,83,0.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-180px",
            left: "-120px",
            width: "440px",
            height: "440px",
            borderRadius: "50%",
            background: "rgba(20,184,166,0.20)",
          }}
        />

        {/* 上部バッジ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 20px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.15)",
            fontSize: "22px",
            fontWeight: 600,
            marginBottom: "32px",
          }}
        >
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ED6E53" }} />
          <span>業界最安級の手数料 / AIに強いワーカー</span>
        </div>

        {/* ロゴ (テキスト版・コーラル+ティール) */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <span style={{ fontSize: "96px", fontWeight: 900, letterSpacing: "-0.02em", color: "#5eead4" }}>MOAI</span>
          <span style={{ fontSize: "60px", fontWeight: 800, letterSpacing: "-0.02em", color: "#ED6E53" }}>Crowd</span>
        </div>

        {/* キャッチ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: "52px",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: "900px",
          }}
        >
          <span>仕事を頼む人と、</span>
          <span>
            <span style={{ color: "#ED6E53" }}>AIで応える人</span>を、つなぐ。
          </span>
        </div>

        {/* 下部ベネフィット */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginTop: "44px",
            fontSize: "26px",
            opacity: 0.92,
          }}
        >
          <span style={{ display: "flex", gap: "8px" }}>
            <span>💰 発注者</span>
            <strong>4%</strong>
          </span>
          <span style={{ display: "flex", gap: "8px" }}>
            <span>🎯 受注者</span>
            <strong>5〜15%</strong>
          </span>
          <span style={{ display: "flex", gap: "8px" }}>
            <span>🎓 卒業生</span>
            <strong>5%生涯</strong>
          </span>
        </div>

        {/* 右下クレジット */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "80px",
            fontSize: "18px",
            opacity: 0.6,
          }}
        >
          moai-crowd.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
