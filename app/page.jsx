// app/page.jsx
"use client"; // Next.jsのApp Routerでクライアントサイドの機能を使用するために必要

import { useState, useEffect, useCallback } from "react"; // useCallbackを追加
import Header from "./components/Header"; // Headerコンポーネントをインポート
import HomeContent from "./components/HomeContent"; // HomeContentコンポーネントをインポート
import MapContent from "./components/MapContent"; // MapContentコンポーネントをインポート

export default function Home() {
  const [currentView, setCurrentView] = useState("home"); // 'home' または 'map'
  const [currentMode, setCurrentMode] = useState("legacy"); // 'legacy' または 'remote'

  const [position, setPosition] = useState(null); // 現在位置の緯度経度を保持 (例: [緯度, 経度])
  const [loading, setLoading] = useState(true); // 位置情報取得中かどうかの状態
  const [error, setError] = useState(null); // エラーメッセージを保持

  // リモートモード時の初期位置 (岐阜駅付近)
  const remoteInitialPosition = [35.41, 136.76];
  // マーカー移動のステップ量 (約50m)
  const moveStep = 0.0005;

  // 位置情報を取得する関数 (Geolocation APIを使用)
  const fetchGeolocation = useCallback(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          // エラーが発生した場合、リモートモードに自動切り替えも検討できるが、今回は手動切り替え
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError("お使いのブラウザは位置情報機能をサポートしていません。");
      setLoading(false);
    }
  }, []); // 依存配列は空でOK

  // モードとビューが変更された時の処理
  useEffect(() => {
    if (currentView === "map") {
      if (currentMode === "legacy") {
        // レガシィモードの場合、Geolocation APIで位置情報を取得
        fetchGeolocation();
      } else {
        // currentMode === 'remote'
        // リモートモードの場合、固定の初期位置を設定し、ローディングを解除
        setPosition(remoteInitialPosition);
        setLoading(false);
        setError(null); // エラーをクリア
      }
    } else if (currentView === "home") {
      // ホーム画面の場合はローディング状態を解除し、エラーと位置情報をリセット
      setLoading(false);
      setError(null);
      setPosition(null);
    }
  }, [currentView, currentMode, fetchGeolocation]); // currentView, currentMode, fetchGeolocation が変更されるたびに実行

  // リモートモードでのマーカー移動関数
  const moveMarker = useCallback(
    (direction) => {
      if (!position) return; // 位置情報がない場合は何もしない

      let newLat = position[0];
      let newLon = position[1];

      switch (direction) {
        case "up":
          newLat += moveStep;
          break;
        case "down":
          newLat -= moveStep;
          break;
        case "left":
          newLon -= moveStep;
          break;
        case "right":
          newLon += moveStep;
          break;
        default:
          break;
      }
      setPosition([newLat, newLon]);
    },
    [position, moveStep]
  ); // position, moveStep が変更されるたびに再生成

  // モードに応じた探知範囲の定義
  const getDetectionRanges = (mode) => {
    if (mode === "remote") {
      return {
        interactive: 0.2, // 200m
        visible: 1, // 1000m
      };
    } else {
      // legacy mode
      return {
        interactive: 0.6, // 600m
        visible: 3, // 3km
      };
    }
  };

  const ranges = getDetectionRanges(currentMode);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh", // 少なくともビューポートの高さ
        backgroundColor: "#f0f0f0",
      }}
    >
      {/* HeaderコンポーネントにcurrentView, setCurrentView, currentMode, setCurrentModeをpropsとして渡す */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentMode={currentMode}
        setCurrentMode={setCurrentMode}
      />

      {/* 現在のビューに応じてコンテンツを切り替える */}
      {currentView === "home" ? (
        <HomeContent />
      ) : (
        // MapContentコンポーネントに位置情報関連のstateとモード、移動関数をpropsとして渡す
        <MapContent
          position={position}
          loading={loading}
          error={error}
          currentMode={currentMode}
          moveMarker={moveMarker} // リモートモードでの移動関数
          interactiveRadiusKm={ranges.interactive} // モードに応じて範囲を調整
          visibleRadiusKm={ranges.visible} // モードに応じて範囲を調整
        />
      )}
    </div>
  );
}
