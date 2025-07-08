// app/layout.jsx
// このファイルはNext.jsのApp Routerにおけるルートレイアウトです。
// 全てのページはこのレイアウトによってラップされます。

import "./globals.css"; // グローバルCSSをインポート

export const metadata = {
  title: "GFwalk!", // アプリケーションのタイトル
  description: "現在位置を表示する地図Webアプリ", // アプリケーションの説明
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        {/* ビューポートの設定 (レスポンシブデザインに必須) */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Interフォントの読み込み */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
