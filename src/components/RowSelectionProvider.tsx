"use client";

import { useEffect } from "react";

export function RowSelectionProvider() {
  useEffect(() => {
    const handleTableClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Find the closest TR element
      const tr = target.closest("tr");
      
      // If we clicked on a TR inside a table with class "data-table" and inside a tbody
      if (tr && tr.closest(".data-table") && tr.closest("tbody")) {
        const tbody = tr.closest("tbody");
        if (tbody) {
          // Find if this TR is already selected
          const isSelected = tr.classList.contains("row-selected");
          
          // Remove selected class from all rows in this tbody
          const allRows = tbody.querySelectorAll("tr");
          allRows.forEach(row => row.classList.remove("row-selected"));
          
          // Toggle selection on the clicked row
          if (!isSelected) {
            tr.classList.add("row-selected");
          }
        }
      }
    };

    document.addEventListener("click", handleTableClick);
    return () => {
      document.removeEventListener("click", handleTableClick);
    };
  }, []);

  return null;
}
