"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import FindCareMegaMenu from "./FindCareMegaMenu";
import { NAV_LINKS } from "./NavMenuData";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFindCareOpen, setIsFindCareOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mega menu on Escape key
  useEffect(() => {
    if (!isFindCareOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFindCareOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isFindCareOpen]);

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 bg-white ${
          isScrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-600">
                <span className="font-bold text-lg text-white">O</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Olera</span>
            </Link>

            {/* Desktop Navigation - Center */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Find Care trigger */}
              <div onMouseEnter={() => setIsFindCareOpen(true)}>
                <button
                  type="button"
                  onClick={() => setIsFindCareOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[15px] font-medium transition-colors ${
                    isFindCareOpen
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  aria-expanded={isFindCareOpen}
                  aria-haspopup="true"
                >
                  Find Care
                  <svg
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                      isFindCareOpen ? "rotate-180" : ""
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
              </div>

              {/* Simple nav links */}
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-[15px] font-medium text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Right - Auth buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link
                href="/for-providers"
                className="text-[15px] font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                For Providers
              </Link>
              <Link
                href="/auth/login"
                className="text-[15px] font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="btn-primary text-sm py-2 px-4"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-4">
                <Link
                  href="/browse"
                  className="text-gray-600 hover:text-primary-600 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Find Care
                </Link>
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-gray-600 hover:text-primary-600 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="border-gray-100" />
                <Link
                  href="/for-providers"
                  className="text-gray-600 hover:text-primary-600 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  For Providers
                </Link>
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-primary-600 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-primary text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mega Menu */}
      <FindCareMegaMenu
        isOpen={isFindCareOpen}
        onClose={() => setIsFindCareOpen(false)}
        onMouseEnter={() => setIsFindCareOpen(true)}
        onMouseLeave={() => setIsFindCareOpen(false)}
      />
    </>
  );
}
