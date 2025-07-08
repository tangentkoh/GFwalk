// app/components/Header.jsx
import React from "react";

const Header = ({ currentView, setCurrentView }) => {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 20px",
        backgroundColor: "#3498db", // 青色
        color: "white",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        width: "100%", // 親要素の幅いっぱいに広げる
        position: "sticky", // スクロールしても上部に固定
        top: 0,
        zIndex: 1000, // 他のコンテンツの上に表示
      }}
    >
      <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>GFwalk(仮)</div>
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
            backgroundColor: currentView === "home" ? "#2980b9" : "transparent",
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
            backgroundColor: currentView === "map" ? "#2980b9" : "transparent",
          }}
        >
          マップ
        </button>
      </nav>
    </header>
  );
};

export default Header;
