"use client";
import { useEffect } from "react";

export default function Docs() {
  useEffect(() => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css";
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    s.onload = () => (window as any).SwaggerUIBundle({ url: "/api/openapi", dom_id: "#swagger" });
    document.body.appendChild(s);
  }, []);
  return <div id="swagger" className="bg-white" />;
}
