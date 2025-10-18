import React from "react";

export default function HeaderBar() {
  return (
    <header className="bg-[#053a34] text-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <button className="text-sm">← Back</button>
        <h1 className="font-semibold">Guest Menu</h1>
        <div className="flex items-center gap-3 text-sm">
          <div>Sat, Oct 18, 2025</div>
          <button className="bg-[#F6B24B] text-black px-2 py-1 rounded">🛒</button>
        </div>
      </div>
    </header>
  );
}
