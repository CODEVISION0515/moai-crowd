import { ImageResponse } from "next/og";

// SNS 共有用の OG 画像を動的生成 (1200x630)
export const runtime = "edge";
export const alt = "MOAI Crowd — 業界最安手数料のAI特化クラウドソーシング";
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
          background: "linear-gradient(135deg, #0f766e 0%, #134e4a 50%, #0f172a 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* 装飾円 */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
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
            backdropFilter: "blur(10px)",
            fontSize: "22px",
            fontWeight: 600,
            marginBottom: "32px",
          }}
        >
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#fbbf24" }} />
          業界最安手数料 · AI特化クラウドソーシング
        </div>

        {/* ロゴ */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "14px",
            marginBottom: "28px",
          }}
        >
          <span style={{ fontSize: "72px", fontWeight: 900, letterSpacing: "-0.02em" }}>MOAI</span>
          <span style={{ fontSize: "36px", fontWeight: 500, opacity: 0.85 }}>Crowd</span>
        </div>

        {/* キャッチ */}
        <div
          style={{
            fontSize: "60px",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: "900px",
          }}
        >
          一歩踏み出す、<br />AIの仕事を、沖縄から。
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
          <span>💰 発注者 <strong>0〜4%</strong></span>
          <span>🎯 受注者 <strong>5〜15%</strong></span>
          <span>🎓 卒業生 <strong>5%生涯</strong></span>
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
