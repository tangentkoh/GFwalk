// app/components/Header.jsx
import React from "react";

const Header = ({ currentView, setCurrentView }) => {
  return (
    <header
      style={{
        backgroundColor: "#3498db", // 青色
        color: "white",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        width: "100%", // 親要素の幅いっぱいに広げる
        position: "sticky", // スクロールしても上部に固定
        top: 0,
        zIndex: 1000, // 他のコンテンツの上に表示
      }}
    >
      {/* ヘッダーのコンテンツ（アプリ名とナビゲーション）を囲む内側のコンテナ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between", // アプリ名とボタンを左右に配置
          alignItems: "center",
          maxWidth: "1200px", // コンテンツの最大幅を設定（デスクトップなどで広がりすぎないように）
          margin: "0 auto", // コンテンツを中央寄せ
          padding: "15px 20px", // ここで左右のパディングを設定（コンテンツの内側）
        }}
      >
        {/* アプリ名とアイコンのコンテナ */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* アイコンのSVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: "10px" }} // テキストとの間にマージン
          >
            <path d="M18 20V10"></path>
            <path d="M12 20V4"></path>
            <path d="M6 20v-6"></path>
            <path d="M2 19l2-2 2 2"></path>
            <path d="M18 13l2-2 2 2"></path>
            <path d="M12 7l2-2 2 2"></path>
          </svg>
          <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>
            GFwalk(仮)
          </div>
        </div>
        <nav>
          <button
            onClick={() => setCurrentView("home")}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "1em",
              cursor: "pointer",
              marginRight: "15px",
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "background-color 0.3s ease",
              backgroundColor:
                currentView === "home" ? "#2980b9" : "transparent", // アクティブなボタンの色
            }}
          >
            ホーム
          </button>
          <button
            onClick={() => setCurrentView("map")}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "1em",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "background-color 0.3s ease",
              backgroundColor:
                currentView === "map" ? "#2980b9" : "transparent", // アクティブなボタンの色
            }}
          >
            マップ
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
