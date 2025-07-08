// app/components/MapContent.jsx
"use client"; // クライアントサイドでのみ動作するコンポーネントとしてマーク

import React from "react";
import dynamic from "next/dynamic"; // next/dynamicをインポート
import "leaflet/dist/leaflet.css"; // LeafletのCSSをインポート

// MapContainerと関連コンポーネントを動的にインポートし、SSRを無効にする
// これにより、Leafletがwindowオブジェクトにアクセスする前にサーバーで実行されるのを防ぐ
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

const MapContent = ({ position, loading, error }) => {
  // MapContentコンポーネントがマウントされた時にLeafletアイコンの修正を行う
  // これにより、windowオブジェクトが利用可能であることを保証
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });
    }
  }, []); // 空の依存配列で一度だけ実行

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexGrow: 1,
          backgroundColor: "#f9f9f9",
        }}
      >
        <p>現在位置を取得中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          flexGrow: 1,
          backgroundColor: "#f9f9f9",
        }}
      >
        <p>エラー: {error}</p>
        <p>位置情報の利用を許可してください。</p>
      </div>
    );
  }

  if (!position) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexGrow: 1,
          backgroundColor: "#f9f9f9",
        }}
      >
        <p>現在位置が利用できません。</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexGrow: 1, // 残りのスペースを埋める
        padding: "20px",
        backgroundColor: "#f0f0f0",
      }}
    >
      <div
        style={{
          height: "calc(100vh - 150px)", // ヘッダーと上下のパディングを考慮して高さを調整
          width: "90vw",
          maxWidth: "1000px",
          borderRadius: "15px",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #ddd",
        }}
      >
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>現在地</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default MapContent;
