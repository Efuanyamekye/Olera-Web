"use client";

import { useLayoutEffect } from "react";

export default function MyCareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hide the global footer when this layout is active (matches Community Forum pattern)
  useLayoutEffect(() => {
    const footer = document.querySelector("footer");
    if (footer) {
      footer.style.display = "none";
    }

    return () => {
      if (footer) {
        footer.style.display = "";
      }
    };
  }, []);

  return <>{children}</>;
}
