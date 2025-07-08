// app/page.jsx
"use client"; // Next.jsのApp Routerでクライアントサイドの機能を使用するために必要

import { useState, useEffect } from "react";
import Header from "./components/Header"; // Headerコンポーネントをインポート
import HomeContent from "./components/HomeContent"; // HomeContentコンポーネントをインポート
import MapContent from "./components/MapContent"; // MapContentコンポーネントをインポート

export default function Home() {
  const [currentView, setCurrentView] = useState("home"); // 'home' または 'map'
  const [position, setPosition] = useState(null); // 現在位置の緯度経度を保持 (例: [緯度, 経度])
  const [loading, setLoading] = useState(true); // 位置情報取得中かどうかの状態
  const [error, setError] = useState(null); // エラーメッセージを保持

  // マップビューが選択された時、または初期ロード時に位置情報を取得
  useEffect(() => {
    // マップビューの場合のみ位置情報を取得
    if (currentView === "map") {
      if (navigator.geolocation) {
        setLoading(true); // 位置情報取得を開始する前にローディング状態にする
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setPosition([pos.coords.latitude, pos.coords.longitude]);
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        // Geolocationがサポートされていない場合
        setError("お使いのブラウザは位置情報機能をサポートしていません。");
        setLoading(false);
      }
    } else if (currentView === "home") {
      // ホーム画面の場合はローディング状態を解除
      setLoading(false);
      setError(null); // ホームに戻った時にエラーをクリア
      setPosition(null); // ホームに戻ったら位置情報をリセット
    }
  }, [currentView]); // currentViewが変更されるたびに実行

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh", // 少なくともビューポートの高さ
        backgroundColor: "#f0f0f0",
      }}
    >
      {/* HeaderコンポーネントにcurrentViewとsetCurrentViewをpropsとして渡す */}
      <Header currentView={currentView} setCurrentView={setCurrentView} />

      {/* 現在のビューに応じてコンテンツを切り替える */}
      {currentView === "home" ? (
        <HomeContent />
      ) : (
        // MapContentコンポーネントに位置情報関連のstateをpropsとして渡す
        <MapContent position={position} loading={loading} error={error} />
      )}
    </div>
  );
}
