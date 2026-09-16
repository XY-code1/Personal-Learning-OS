import type { Metadata } from "next";

import "./globals.css";
import "@xyflow/react/dist/style.css";

export const metadata: Metadata = {
  title: "Personal Learning OS — 看见自己的成长",
  description: "把零散笔记、知识、实践与思考，逐渐整理成属于自己的知识体系。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
