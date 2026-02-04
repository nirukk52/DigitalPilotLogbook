"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Main app overview/home page shown after onboarding
 * Displays sidebar navigation and getting started options for new users
 */
export default function OverviewPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState({
    logbook: true,
    analyze: false,
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => setSessionId(data.sessionId))
      .catch(() => {});
  }, []);

  const copySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleSection = (section: "logbook" | "analyze") => {
    setSidebarExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-black/30 backdrop-blur-sm border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="p-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center text-white font-bold text-sm">
            FL
          </div>
          <span className="text-white/80 text-sm">For Pilots</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {/* Logbook Section */}
          <button
            onClick={() => toggleSection("logbook")}
            className="w-full flex items-center gap-2 px-3 py-2 text-white/80 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-sm">Logbook</span>
            <svg
              className={`w-4 h-4 ml-auto transition-transform ${sidebarExpanded.logbook ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {sidebarExpanded.logbook && (
            <div className="ml-4 space-y-1">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-white bg-white/10 rounded-lg text-sm"
              >
                Overview
              </Link>
              <Link
                href="/flights"
                className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg text-sm transition-colors"
              >
                Flights
              </Link>
              <Link
                href="/totals"
                className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg text-sm transition-colors"
              >
                Totals
              </Link>
              <Link
                href="/calendar"
                className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg text-sm transition-colors"
              >
                Calendar
              </Link>
              <Link
                href="/aircraft"
                className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg text-sm transition-colors"
              >
                Aircraft
              </Link>
              <Link
                href="/people"
                className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg text-sm transition-colors"
              >
                People
              </Link>
              <Link
                href="/airports"
                className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg text-sm transition-colors"
              >
                Airports
              </Link>
              <Link
                href="/import"
                className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg text-sm transition-colors"
              >
                Import
              </Link>
              <Link
                href="/export"
                className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg text-sm transition-colors"
              >
                Export/Print
              </Link>
            </div>
          )}

          {/* Analyze Section */}
          <button
            onClick={() => toggleSection("analyze")}
            className="w-full flex items-center gap-2 px-3 py-2 text-white/80 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm">Analyze</span>
            <svg
              className={`w-4 h-4 ml-auto transition-transform ${sidebarExpanded.analyze ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Standalone Links */}
          <Link
            href="/licences"
            className="flex items-center gap-2 px-3 py-2 text-white/80 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            <span className="text-sm">Licences</span>
          </Link>

          <Link
            href="/maps"
            className="flex items-center gap-2 px-3 py-2 text-white/80 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-sm">Maps</span>
          </Link>

          <Link
            href="/career"
            className="flex items-center gap-2 px-3 py-2 text-white/80 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Career</span>
            <span className="ml-auto bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded">39</span>
          </Link>

          <Link
            href="/messages"
            className="flex items-center gap-2 px-3 py-2 text-white/80 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Messages</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6">
          <h1 className="text-white text-lg font-medium">Overview</h1>
          <div className="flex items-center gap-4">
            <button className="text-white/60 hover:text-white/80 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
              <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-white/80 text-sm">Personal</span>
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-4">
            <h2 className="text-3xl font-semibold text-white text-center mb-8">
              Let&apos;s get started
            </h2>

            {/* Action Cards */}
            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors group">
              <div className="text-white font-medium">Add first flight</div>
              <svg
                className="w-6 h-6 text-white/60 mx-auto mt-2 group-hover:text-white/80 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors group">
              <div className="text-white font-medium">Import your data</div>
              <svg
                className="w-6 h-6 text-white/60 mx-auto mt-2 group-hover:text-white/80 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>

            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors group">
              <div className="text-white font-medium">Settings</div>
              <svg
                className="w-6 h-6 text-white/60 mx-auto mt-2 group-hover:text-white/80 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors group">
              <div className="text-white font-medium">User manual</div>
              <svg
                className="w-6 h-6 text-white/60 mx-auto mt-2 group-hover:text-white/80 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>
          </div>
        </div>

        {/* Session ID - subtle footer */}
        {sessionId && (
          <div className="px-6 py-2 text-center">
            <button
              onClick={copySessionId}
              className="text-white/20 hover:text-white/40 text-[10px] font-mono transition-colors"
              title="Click to copy session ID"
            >
              {copied ? "Copied!" : sessionId}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
