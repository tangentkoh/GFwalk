// app/components/MapContent.jsx
"use client"; // クライアントサイドでのみ動作するコンポーネントとしてマーク

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic"; // next/dynamicをインポート
import "leaflet/dist/leaflet.css"; // LeafletのCSSをインポート

// 事前定義されたマーカーデータをインポート
import predefinedMarkers from "../data/markers";

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
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);

// 緯度経度間の距離をキロメートルで計算する関数 (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 地球の半径 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance; // km
};

const MapContent = ({ position, loading, error }) => {
  // 訪問済みマーカーの状態を管理
  // キーはマーカーID、値はtrue/false
  const [visitedMarkers, setVisitedMarkers] = useState({});

  // 距離の閾値 (キロメートル)
  const interactiveRadiusKm = 0.4; // 500m以内
  const visibleRadiusKm = 2; // 2km以内 (青い円の範囲)

  // カスタムマーカーアイコンの状態
  const [redIcon, setRedIcon] = useState(null);
  const [greenIcon, setGreenIcon] = useState(null);
  const [greyIcon, setGreyIcon] = useState(null); // グレーアイコンを追加

  // MapContentコンポーネントがマウントされた時にLeafletアイコンの修正とカスタムアイコンの作成を行う
  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");

      // デフォルトのLeafletアイコンが壊れる問題への対処 (現在地マーカー用)
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });

      // 赤色のカスタムマーカーアイコンを作成
      const createRedIcon = L.divIcon({
        className: "custom-red-marker",
        html: "<div style='background-color:#dc3545; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);'></div>",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });
      setRedIcon(createRedIcon);

      // 緑色のカスタムマーカーアイコンを作成
      const createGreenIcon = L.divIcon({
        className: "custom-green-marker",
        html: "<div style='background-color:#28a745; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);'></div>",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });
      setGreenIcon(createGreenIcon);

      // グレー色のカスタムマーカーアイコンを作成
      const createGreyIcon = L.divIcon({
        className: "custom-grey-marker",
        html: "<div style='background-color:#6c757d; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);'></div>",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });
      setGreyIcon(createGreyIcon);
    }
  }, []); // 空の依存配列で一度だけ実行

  // マーカーがクリックされた時のハンドラー (インタラクティブマーカー用)
  const handleMarkerClick = (markerId) => {
    setVisitedMarkers((prev) => ({
      ...prev,
      [markerId]: true, // 訪問済みとしてマーク
    }));
  };

  // 現在位置からの距離と訪問済み状態に基づいてマーカーを分類し、表示するマーカーを決定
  const displayableMarkers = useMemo(() => {
    if (!position) return [];

    return predefinedMarkers
      .filter((marker) => {
        const distance = calculateDistance(
          position[0],
          position[1],
          marker.position[0],
          marker.position[1]
        );
        const isVisited = visitedMarkers[marker.id];

        // 訪問済みマーカーは常に表示
        // 未訪問マーカーは2km以内なら表示
        return isVisited || distance <= visibleRadiusKm;
      })
      .map((marker) => {
        const distance = calculateDistance(
          position[0],
          position[1],
          marker.position[0],
          marker.position[1]
        );
        const isVisited = visitedMarkers[marker.id];

        let status;
        if (isVisited) {
          status = "visited"; // 訪問済みマーカー (常に緑)
        } else if (distance <= interactiveRadiusKm) {
          status = "interactive"; // 500m以内、未訪問 (赤)
        } else if (
          distance > interactiveRadiusKm &&
          distance <= visibleRadiusKm
        ) {
          status = "grey"; // 500m超2km以内、未訪問 (灰色)
        } else {
          status = "hidden"; // 2km超、未訪問 (非表示)
        }
        return { ...marker, status, distance };
      });
  }, [position, interactiveRadiusKm, visibleRadiusKm, visitedMarkers]); // visitedMarkers を依存配列に追加

  // 訪問済みマーカーの数を計算
  const visitedCount = useMemo(() => {
    return Object.values(visitedMarkers).filter(Boolean).length;
  }, [visitedMarkers]);

  // ローディング中の表示
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

  // エラー発生時の表示
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

  // 位置情報が取得できなかった場合の表示
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
      {/* マーカー数の表示 (1行にまとめる) */}
      <div
        style={{
          marginBottom: "15px",
          textAlign: "center",
          backgroundColor: "white",
          padding: "10px 20px",
          borderRadius: "10px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          color: "#333",
          fontSize: "0.95em",
          width: "90vw",
          maxWidth: "1000px",
          display: "flex", // Flexboxを使用
          justifyContent: "space-around", // 均等に配置
          alignItems: "center",
          flexWrap: "wrap", // 小さい画面で折り返す
        }}
      >
        <p style={{ margin: "0 10px" }}>
          全マーカー数: <strong>{predefinedMarkers.length}</strong> 個
        </p>
        <p style={{ margin: "0 10px" }}>
          訪れたマーカー数: <strong>{visitedCount}</strong> 個
        </p>
      </div>

      {/* 地図コンテナ */}
      <div
        style={{
          height: "calc(100vh - 220px)", // ヘッダー、マーカー数表示、上下のパディングを考慮して高さを調整
          width: "90vw",
          maxWidth: "1000px",
          borderRadius: "15px",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #ddd",
        }}
      >
        <MapContainer
          center={position} // 現在位置を中心に設定
          zoom={14} // 初期ズームレベルを調整 (表示範囲に合わせて)
          scrollWheelZoom={true} // マウスホイールでのズームを許可
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* 現在位置を示すマーカー (デフォルトの青いアイコンを使用) */}
          <Marker position={position}>
            <Popup>現在地</Popup>
          </Marker>

          {/* 現在位置からの表示範囲を示す円 (2km) */}
          <Circle
            center={position}
            radius={visibleRadiusKm * 1000} // 半径をメートルで指定 (2km = 2000m)
            pathOptions={{
              fillColor: "#3498db", // 薄い青色
              fillOpacity: 0.15, // 透明度
              color: "#3498db", // 線の色
              weight: 2, // 線の太さ
              opacity: 0.5, // 線の透明度
            }}
          />

          {/* 表示可能なマーカーをループしてレンダリング */}
          {redIcon &&
            greenIcon &&
            greyIcon &&
            displayableMarkers.map((marker) => {
              let iconToUse;
              let popupContent;
              let clickHandler = null; // デフォルトではクリックハンドラーなし

              if (marker.status === "visited") {
                // 訪問済みマーカー: 緑色アイコン、通常ポップアップ
                iconToUse = greenIcon;
                popupContent = (
                  <>
                    <strong>{marker.name}</strong>
                    <br />
                    {marker.description || "ここに説明"}
                  </>
                );
              } else if (marker.status === "interactive") {
                // インタラクティブマーカー: 未訪問なら赤、訪問済みなら緑、クリックで訪問状態に
                iconToUse = visitedMarkers[marker.id] ? greenIcon : redIcon;
                popupContent = (
                  <>
                    <strong>{marker.name}</strong>
                    <br />
                    {marker.description || "ここに説明"}
                  </>
                );
                clickHandler = () => handleMarkerClick(marker.id);
              } else if (marker.status === "grey") {
                // グレーマーカー: 灰色アイコン、クリックで「???」ポップアップ
                iconToUse = greyIcon;
                popupContent = (
                  <>
                    <strong>???</strong>
                    <br />
                    ???
                  </>
                );
                // グレーマーカーはクリックで色が変わらないため、handleMarkerClickは呼ばない
                // Leafletのデフォルトのクリックでポップアップが開く
              } else {
                // hidden状態のマーカーはレンダリングしない
                return null;
              }

              if (!iconToUse) return null; // アイコンがまだロードされていない場合はレンダリングしない

              return (
                <Marker
                  key={marker.id}
                  position={marker.position}
                  icon={iconToUse}
                  // clickHandlerが存在する場合のみeventHandlersを設定
                  eventHandlers={clickHandler ? { click: clickHandler } : {}}
                >
                  <Popup>{popupContent}</Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapContent;
