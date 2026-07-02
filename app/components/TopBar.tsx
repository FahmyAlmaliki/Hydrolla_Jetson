"use client";

import { useEffect, useState } from "react";

interface TopBarProps {
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setDateStr(
        now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      );
      setTimeStr(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleOnline  = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <header
      className="fixed top-0 right-0 z-40 h-16 border-b border-[var(--color-outline-variant)] flex items-center justify-between px-4 sm:px-6 left-0 lg:left-[272px]"
      style={{
        background: "rgba(247,249,251,0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Left: Burger (mobile) + Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Burger button — mobile only */}
        <button
          id="sidebar-toggle"
          onClick={onMenuToggle}
          aria-label="Buka menu navigasi"
          className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[var(--color-outline)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-base font-semibold truncate" style={{ color: "var(--color-on-surface)" }}>
          HYDROLA
          <span className="font-normal mx-1.5 hidden sm:inline" style={{ color: "var(--color-outline-variant)" }}>·</span>
          <span className="hidden sm:inline" style={{ color: "var(--color-on-surface-variant)" }}>Pemantauan Akuaponik</span>
        </h2>
      </div>

      {/* Right: Status + Date + Icons */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">

        {/* Live badge */}
        <div className={[
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold",
          online
            ? "bg-[var(--color-secondary)]/10 text-[var(--color-on-secondary-container)]"
            : "bg-[var(--color-error-container)] text-[var(--color-on-error-container)]",
        ].join(" ")}>
          <span className={[
            "w-2 h-2 rounded-full shrink-0",
            online ? "bg-[var(--color-secondary)] animate-pulse-dot" : "bg-[var(--color-error)]",
          ].join(" ")} />
          <span className="hidden xs:inline">{online ? "Online" : "Offline"}</span>
          <span className="xs:hidden">{online ? "●" : "○"}</span>
        </div>

        {/* Date & time — hidden on small screens */}
        <div className="text-xs text-right hidden md:block" style={{ color: "var(--color-on-surface-variant)" }}>
          <div className="font-medium">{dateStr}</div>
          <div className="font-mono" style={{ color: "var(--color-outline)" }}>{timeStr}</div>
        </div>

        {/* Icon buttons */}
        <div className="flex gap-1">
          <button
            title="Status Sensor"
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-[var(--color-surface-container)] text-[var(--color-outline)] hover:text-[var(--color-primary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" clipRule="evenodd" />
              <path d="M5.26 17.242a.75.75 0 1 0-.897-1.203 5.243 5.243 0 0 0-2.05 5.022.75.75 0 0 0 .625.627 5.243 5.243 0 0 0 5.022-2.051.75.75 0 1 0-1.202-.897 3.744 3.744 0 0 1-3.008 1.51c0-1.23.592-2.323 1.51-3.008Z" />
            </svg>
          </button>

          <button
            title="Koneksi Jaringan"
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-[var(--color-surface-container)] text-[var(--color-outline)] hover:text-[var(--color-primary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M1.371 8.143c5.858-5.857 15.356-5.857 21.213 0a.75.75 0 0 1-1.06 1.061c-5.272-5.27-13.82-5.27-19.091 0a.75.75 0 0 1-1.063-1.06Zm3.536 3.536a9.75 9.75 0 0 1 13.78 0 .75.75 0 0 1-1.06 1.06 8.25 8.25 0 0 0-11.66 0 .75.75 0 0 1-1.06-1.06Zm3.514 3.515a5.25 5.25 0 0 1 7.424 0 .75.75 0 0 1-1.06 1.06 3.75 3.75 0 0 0-5.304 0 .75.75 0 0 1-1.06-1.06Zm3.536 3.536a.75.75 0 1 0 1.06 1.06.75.75 0 0 0-1.06-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
