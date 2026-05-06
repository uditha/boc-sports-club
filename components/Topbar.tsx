"use client";

export default function Topbar() {
  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-purple-100 flex items-center justify-between px-6 z-20">
      {/* Search */}
      <div className="relative w-80">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-grey"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search players, events…"
          className="w-full pl-9 pr-4 py-2 text-sm bg-brand-bg rounded-xl border border-transparent focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-text-dark placeholder-text-grey"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="w-9 h-9 rounded-xl hover:bg-brand-bg flex items-center justify-center text-text-grey transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
            <span className="text-sm font-semibold text-white">A</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-text-dark leading-tight">Admin</p>
            <p className="text-xs text-text-grey leading-tight">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
