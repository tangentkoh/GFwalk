// app/components/HomeContent.jsx
import React from "react";

const HomeContent = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        flexGrow: 1, // 残りのスペースを埋める
        padding: "20px",
        textAlign: "center",
        backgroundColor: "#f9f9f9",
        width: "100%",
      }}
    >
      <h2 style={{ color: "#333", marginBottom: "15px" }}>
        "GFwalk!"へようこそ！
      </h2>
      <p style={{ color: "#555", lineHeight: "1.6" }}>
        このアプリは、あなたの現在位置周辺の地図を表示し、
        <br />
        様々な情報を探索するのに役立ちます。
      </p>
      <p style={{ color: "#555", marginTop: "10px" }}>
        「マップ」ボタンをクリックして、地図機能をお試しください。
      </p>
      <img
        src="https://placehold.co/300x200/aabbcc/ffffff?text=Welcome+Image"
        alt="Welcome"
        style={{
          marginTop: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      />
    </div>
  );
};

export default HomeContent;
