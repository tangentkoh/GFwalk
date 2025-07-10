// app/components/MapContent.jsx
"use client"; // クライアントサイドでのみ動作するコンポーネントとしてマーク

import React, { useState, useEffect } from "react";
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

// 事前定義されたマーカーのデータ
// ここに表示したい場所の緯度経度と名前を追加してください
const predefinedMarkers = [
  { position: [35.434, 136.782], name: "岐阜城" }, // ok
  { position: [35.435, 136.774], name: "岐阜公園" }, // ok
  { position: [35.441, 136.776], name: "長良川温泉" }, // ok
  { position: [35.409, 136.757], name: "JR岐阜駅" }, // ok
  { position: [35.433, 136.773], name: "岐阜市歴史博物館" }, // ok
];

const MapContent = ({ position, loading, error }) => {
  // カスタムマーカーアイコンの状態
  const [customGreenIcon, setCustomGreenIcon] = useState(null);

  // MapContentコンポーネントがマウントされた時にLeafletアイコンの修正とカスタムアイコンの作成を行う
  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");

      // デフォルトのLeafletアイコンが壊れる問題への対処
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });

      // 緑色のカスタムマーカーアイコンを作成
      // L.divIcon を使用して、HTML要素をアイコンとしてレンダリングします
      const greenIcon = L.divIcon({
        className: "custom-green-marker", // 必要であればCSSでさらにスタイルを適用するためのクラス名
        html: "<div style='background-color:#28a745; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);'></div>",
        iconSize: [24, 24], // アイコンのサイズ (幅, 高さ)
        iconAnchor: [12, 12], // アイコンのアンカーポイント (中心)
        popupAnchor: [0, -12], // ポップアップのアンカーポイント (アイコンの少し上)
      });
      setCustomGreenIcon(greenIcon); // 作成したアイコンをstateに保存
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
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        flexGrow: 1,
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

          {customGreenIcon &&
            predefinedMarkers.map((marker, index) => (
              <Marker
                key={index}
                position={marker.position}
                icon={customGreenIcon}
              >
                <Popup>{marker.name}</Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapContent;
