// app/components/MapContent.jsx
"use client"; // クライアントサイドでのみ動作するコンポーネントとしてマーク

import React, { useState, useEffect, useMemo, useRef } from "react"; // useRefを追加
import dynamic from "next/dynamic"; // next/dynamicをインポート
import "leaflet/dist/leaflet.css"; // LeafletのCSSをインポート
import "pannellum/build/pannellum.css"; // PannellumのCSSをインポート

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

// Pannellumビューアのコンポーネントを動的にインポート
const PanoramaViewer = dynamic(
  () => {
    require("pannellum"); // クライアントサイドでのみPannellumをロード
    return import("react").then((React) => {
      return ({ panoramaUrl }) => {
        const panoramaRef = React.useRef(null);

        React.useEffect(() => {
          let viewer = null;
          if (panoramaRef.current && panoramaUrl) {
            if (
              typeof window !== "undefined" &&
              window.pannellum &&
              typeof window.pannellum.viewer === "function"
            ) {
              viewer = window.pannellum.viewer(panoramaRef.current, {
                type: "equirectangular",
                panorama: panoramaUrl,
                autoLoad: true,
                compass: true,
                hotSpotDebug: false,
                mouseZoom: true,
                hfov: 100,
              });
            } else {
              console.error(
                "Pannellum global object or viewer function not found on window."
              );
            }

            return () => {
              if (viewer) {
                viewer.destroy();
              }
            };
          }
        }, [panoramaUrl]);

        return (
          <div
            ref={panoramaRef}
            style={{
              width: "90vw",
              height: "80vh",
              backgroundColor: "black",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            {/* Pannellumビューアがここにマウントされます */}
          </div>
        );
      };
    });
  },
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

const MapContent = ({
  position,
  loading,
  error,
  currentMode,
  moveMarker,
  interactiveRadiusKm,
  visibleRadiusKm,
  remoteInitialPosition,
}) => {
  // 訪問済みマーカーの状態を管理
  const [visitedMarkers, setVisitedMarkers] = useState({});

  // カスタムマーカーアイコンの状態
  const [redIcon, setRedIcon] = useState(null);
  const [greenIcon, setGreenIcon] = useState(null);
  const [greyIcon, setGreyIcon] = useState(null);

  // 360度パノラマビューアの状態
  const [showPanorama, setShowPanorama] = useState(false);
  const [currentPanoramaUrl, setCurrentPanoramaUrl] = useState("");

  // 連続移動のためのRef
  const movingIntervalRef = useRef(null);
  const initialDelay = 500; // 最初の移動までの遅延 (ms)
  const repeatInterval = 100; // 連続移動の間隔 (ms)

  // 連続移動を開始する関数
  const startMoving = (direction) => {
    // 既に移動中の場合は何もしない
    if (movingIntervalRef.current) return;

    // 最初の移動
    moveMarker(direction);

    // 連続移動を開始
    movingIntervalRef.current = setInterval(() => {
      moveMarker(direction);
    }, repeatInterval);
  };

  // 連続移動を停止する関数
  const stopMoving = () => {
    if (movingIntervalRef.current) {
      clearInterval(movingIntervalRef.current);
      movingIntervalRef.current = null;
    }
  };

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

    // コンポーネントがアンマウントされるときに連続移動を停止
    return () => {
      stopMoving();
    };
  }, []); // 空の依存配列で一度だけ実行

  // マーカーがクリックされた時のハンドラー (インタラクティブマーカー用)
  const handleMarkerClick = (markerId) => {
    setVisitedMarkers((prev) => ({
      ...prev,
      [markerId]: true, // 訪問済みとしてマーク
    }));
  };

  // 360度パノラマビューアを開く
  const openPanorama = (panoramaUrl) => {
    setCurrentPanoramaUrl(panoramaUrl);
    setShowPanorama(true);
  };

  // 360度パノラマビューアを閉じる
  const closePanorama = () => {
    setShowPanorama(false);
    setCurrentPanoramaUrl("");
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
        // 未訪問マーカーは visibleRadiusKm (モードによって異なる) 以内なら表示
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
          status = "interactive"; // interactiveRadiusKm (モードによって異なる) 以内、未訪問 (赤)
        } else if (
          distance > interactiveRadiusKm &&
          distance <= visibleRadiusKm
        ) {
          status = "grey"; // interactiveRadiusKm超～visibleRadiusKm以内、未訪問 (灰色)
        } else {
          status = "hidden"; // visibleRadiusKm超、未訪問 (非表示)
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
  if (error && currentMode === "legacy") {
    // レガシィモードでのみエラーを表示
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
        <p>または「リモートモード」をお試しください。</p>
      </div>
    );
  }

  // 位置情報が取得できなかった場合の表示 (リモートモードでは表示されない)
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

  // 全モードで表示される固定の赤色円の半径 (岐阜駅中心)
  const fixedRedCircleRadiusKm = 10; // 10km

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
          訪マーカー数: <strong>{visitedCount}</strong> 個
        </p>
      </div>

      {/* リモートモード時の移動ボタン (横一列) */}
      {currentMode === "remote" && (
        <div
          style={{
            marginBottom: "15px",
            backgroundColor: "white",
            padding: "10px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            display: "flex", // Flexboxを使用
            flexDirection: "row", // 横一列に並べる
            justifyContent: "center", // 中央寄せ
            alignItems: "center",
            gap: "10px", // ボタン間のスペース
            width: "fit-content",
            maxWidth: "90vw",
          }}
        >
          <button
            onMouseDown={() => startMoving("left")}
            onMouseUp={stopMoving}
            onMouseLeave={stopMoving}
            onTouchStart={() => startMoving("left")}
            onTouchEnd={stopMoving}
            onTouchCancel={stopMoving}
            style={{
              padding: "8px 12px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              backgroundColor: "#e9e9e9",
              cursor: "pointer",
            }}
          >
            ←
          </button>
          <button
            onMouseDown={() => startMoving("up")}
            onMouseUp={stopMoving}
            onMouseLeave={stopMoving}
            onTouchStart={() => startMoving("up")}
            onTouchEnd={stopMoving}
            onTouchCancel={stopMoving}
            style={{
              padding: "8px 12px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              backgroundColor: "#e9e9e9",
              cursor: "pointer",
            }}
          >
            ↑
          </button>
          <button
            onMouseDown={() => startMoving("down")}
            onMouseUp={stopMoving}
            onMouseLeave={stopMoving}
            onTouchStart={() => startMoving("down")}
            onTouchEnd={stopMoving}
            onTouchCancel={stopMoving}
            style={{
              padding: "8px 12px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              backgroundColor: "#e9e9e9",
              cursor: "pointer",
            }}
          >
            ↓
          </button>
          <button
            onMouseDown={() => startMoving("right")}
            onMouseUp={stopMoving}
            onMouseLeave={stopMoving}
            onTouchStart={() => startMoving("right")}
            onTouchEnd={stopMoving}
            onTouchCancel={stopMoving}
            style={{
              padding: "8px 12px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              backgroundColor: "#e9e9e9",
              cursor: "pointer",
            }}
          >
            →
          </button>
        </div>
      )}

      {/* 地図コンテナ */}
      <div
        style={{
          height:
            currentMode === "remote"
              ? "calc(100vh - 300px)"
              : "calc(100vh - 220px)", // リモートモードでは移動ボタンの分高さを調整
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
          zoom={currentMode === "remote" ? 14 : 14} // リモートモードではズームを14に設定し、目安円全体が見えるように
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

          {/* 外側の表示範囲を示す円 (visibleRadiusKm を使用 - 薄い青色) */}
          <Circle
            center={position}
            radius={visibleRadiusKm * 1000} // 半径をメートルで指定
            pathOptions={{
              fillColor: "#3498db", // 薄い青色
              fillOpacity: 0.15, // 透明度
              color: "#3498db", // 線の色
              weight: 2, // 線の太さ
              opacity: 0.5, // 線の透明度
            }}
          />

          {/* 内側のインタラクティブ範囲を示す円 (interactiveRadiusKm を使用 - 濃い青色) */}
          <Circle
            center={position}
            radius={interactiveRadiusKm * 1000} // 半径をメートルで指定
            pathOptions={{
              fillColor: "#2196f3", // 濃い青色
              fillOpacity: 0.25, // 透明度を少し上げる
              color: "#2196f3", // 線の色
              weight: 2, // 線の太さ
              opacity: 0.7, // 線の透明度を上げる
            }}
          />

          {/* 全モードで表示される半径10kmの赤色の円 (淵のみ) */}
          {remoteInitialPosition && (
            <Circle
              center={remoteInitialPosition} // 岐阜駅を中心
              radius={fixedRedCircleRadiusKm * 1000} // 半径10km
              pathOptions={{
                fillOpacity: 0, // 塗りつぶしなし
                color: "#ff0000", // 赤色
                weight: 3, // 線の太さ
                opacity: 0.8, // 線の透明度
              }}
            />
          )}

          {/* 表示可能なマーカーをループしてレンダリング */}
          {redIcon &&
            greenIcon &&
            greyIcon &&
            displayableMarkers.map((marker) => {
              let iconToUse;
              let popupContent;
              let clickHandler = null; // デフォルトではクリックハンドラーなし
              let imageSrc = marker.image; // マーカーに設定された画像パス

              if (marker.status === "visited") {
                // 訪問済みマーカー: 緑色アイコン、通常ポップアップ
                iconToUse = greenIcon;
                popupContent = (
                  <>
                    <strong>{marker.name}</strong>
                    <br />
                    {marker.description || "ここに説明"}
                    <br />
                    {imageSrc && (
                      <img
                        src={imageSrc}
                        alt={marker.name}
                        style={{
                          width: "100%",
                          height: "auto",
                          marginTop: "10px",
                          borderRadius: "5px",
                        }}
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/150x100/eeeeee/333333?text=No+Image";
                        }} // エラー時のフォールバック
                      />
                    )}
                    {/* パノラマ画像がある場合のみボタンを表示（モード問わず） */}
                    {marker.panoramaImage && (
                      <button
                        onClick={() => openPanorama(marker.panoramaImage)}
                        style={{
                          marginTop: "10px",
                          padding: "8px 12px",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        360°ビューを見る
                      </button>
                    )}
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
                    <br />
                    {imageSrc && (
                      <img
                        src={imageSrc}
                        alt={marker.name}
                        style={{
                          width: "100%",
                          height: "auto",
                          marginTop: "10px",
                          borderRadius: "5px",
                        }}
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/150x100/eeeeee/333333?text=No+Image";
                        }} // エラー時のフォールバック
                      />
                    )}
                    {/* パノラマ画像がある場合のみボタンを表示（モード問わず） */}
                    {marker.panoramaImage && (
                      <button
                        onClick={() => openPanorama(marker.panoramaImage)}
                        style={{
                          marginTop: "10px",
                          padding: "8px 12px",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        360°ビューを見る
                      </button>
                    )}
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
                    <br />
                    <img
                      src="https://placehold.co/150x100/6c757d/ffffff?text=%3F%3F%3F" // グレーマーカー用の「???」画像
                      alt="Unknown Image"
                      style={{
                        width: "100%",
                        height: "auto",
                        marginTop: "10px",
                        borderRadius: "5px",
                      }}
                    />
                    {/* パノラマ画像がある場合のみボタンを表示（モード問わず） */}
                    {marker.panoramaImage && (
                      <button
                        onClick={() => openPanorama(marker.panoramaImage)}
                        style={{
                          marginTop: "10px",
                          padding: "8px 12px",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        360°ビューを見る
                      </button>
                    )}
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

      {/* 360度パノラマビューアのオーバーレイ */}
      {showPanorama && currentPanoramaUrl && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            zIndex: 2000, // 地図よりも手前に表示
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <button
            onClick={closePanorama}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              backgroundColor: "white",
              color: "#333",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              fontSize: "1.5em",
              cursor: "pointer",
              zIndex: 2001,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
            }}
          >
            &times;
          </button>
          <PanoramaViewer panoramaUrl={currentPanoramaUrl} />
        </div>
      )}
    </div>
  );
};

export default MapContent;
