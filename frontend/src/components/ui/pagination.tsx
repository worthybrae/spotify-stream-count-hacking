// components/ui/pagination.tsx
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5
}) => {
  if (totalPages <= 1) return null;

  // Calculate page range to display
  const getPageRange = () => {
    // If total pages is less than max visible, show all pages
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Calculate start and end of page range
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = start + maxVisiblePages - 1;

    // Adjust if end exceeds total pages
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const pageRange = getPageRange();

  return (
    <div className="flex items-center justify-center space-x-1">
      {/* First page */}
      {currentPage > 2 && totalPages > maxVisiblePages && (
        <button
          onClick={() => onPageChange(1)}
          className="h-8 w-8 flex items-center justify-center rounded hover:bg-white/10 text-white/70"
        >
          1
        </button>
      )}

      {/* Ellipsis for start */}
      {currentPage > 3 && totalPages > maxVisiblePages && (
        <span className="text-white/50">...</span>
      )}

      {/* Page numbers */}
      {pageRange.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`h-8 w-8 flex items-center justify-center rounded ${
            currentPage === page
              ? 'bg-blue-600 text-white'
              : 'hover:bg-white/10 text-white/70'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Ellipsis for end */}
      {currentPage < totalPages - 2 && totalPages > maxVisiblePages && (
        <span className="text-white/50">...</span>
      )}

      {/* Last page */}
      {currentPage < totalPages - 1 && totalPages > maxVisiblePages && (
        <button
          onClick={() => onPageChange(totalPages)}
          className="h-8 w-8 flex items-center justify-center rounded hover:bg-white/10 text-white/70"
        >
          {totalPages}
        </button>
      )}
    </div>
  );
};