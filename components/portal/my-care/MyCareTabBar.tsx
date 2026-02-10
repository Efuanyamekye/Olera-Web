"use client";

export type MyCareTab = "profile" | "connections" | "saved" | "messages";

interface MyCareTabBarProps {
  activeTab: MyCareTab;
  onTabChange: (tab: MyCareTab) => void;
  counts: { connections: number; saved: number };
}

const TABS: {
  key: MyCareTab;
  label: string;
  emoji: string;
  bg: string;
  activeBg: string;
  countKey?: "connections" | "saved";
}[] = [
  { key: "profile", label: "Care Profile", emoji: "👤", bg: "bg-blue-100", activeBg: "bg-blue-200" },
  { key: "connections", label: "Connections", emoji: "🤝", bg: "bg-emerald-100", activeBg: "bg-emerald-200", countKey: "connections" },
  { key: "saved", label: "Saved Providers", emoji: "❤️", bg: "bg-rose-100", activeBg: "bg-rose-200", countKey: "saved" },
  { key: "messages", label: "Messages", emoji: "💬", bg: "bg-amber-100", activeBg: "bg-amber-200" },
];

// ── Desktop Sidebar ──

export function MyCareSidebar({
  activeTab,
  onTabChange,
  counts,
}: MyCareTabBarProps) {
  return (
    <div className="p-4 pt-6" style={{ paddingLeft: 'max(2rem, calc((100vw - 1280px) / 2 + 2rem))' }}>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        My Care
      </h2>
      <nav className="space-y-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tab.countKey ? counts[tab.countKey] : null;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 transition-colors ${
                  isActive ? tab.activeBg : tab.bg
                }`}
              >
                {tab.emoji}
              </span>
              <span className="flex-1 text-left">{tab.label}</span>
              {count !== null && count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-gray-200 text-gray-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom link — Browse Providers */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <a
          href="/browse"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
            <svg className="w-4 h-4 text-gray-500 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm font-medium">Browse Providers</span>
          </div>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ── Mobile Pill Bar ──

export default function MyCareTabBar({
  activeTab,
  onTabChange,
  counts,
}: MyCareTabBarProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-4">
      <div className="flex gap-2 min-w-max pb-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tab.countKey ? counts[tab.countKey] : null;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {count !== null && count > 0 && (
                <span className="ml-1 text-xs opacity-70">({count})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
