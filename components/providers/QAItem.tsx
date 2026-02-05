"use client";

import { useState } from "react";

interface QAItemProps {
  question: string;
  answer: string;
}

export default function QAItem({ question, answer }: QAItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-25 transition-colors"
      >
        <span className="text-[16px] font-medium text-gray-900 pr-4">
          {question}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-[16px] text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
