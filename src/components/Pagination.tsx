import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

interface PaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages?: number;
}

export function Pagination({ currentPage, onPageChange, totalPages = 400 }: PaginationProps) {
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const range = 10; // Show 10 pages at a time
    
    // Calculate start page
    let start = Math.floor((currentPage - 1) / range) * range + 1;
    let end = Math.min(start + range - 1, totalPages);
    
    // Add page numbers
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [currentPage, totalPages]);

  const firstPage = pageNumbers[0];
  const lastPage = pageNumbers[pageNumbers.length - 1];
  const canGoPrevSet = firstPage > 1;
  const canGoNextSet = lastPage < totalPages;

  return (
    <div className="flex items-center justify-center gap-1 py-4 safe-bottom">
      {/* Previous Set */}
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 rounded-lg"
        onClick={() => onPageChange(Math.max(1, firstPage - 5))}
        disabled={!canGoPrevSet}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* Page Numbers */}
      {pageNumbers.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "ghost"}
          size="icon"
          className={`w-8 h-8 rounded-lg text-sm font-medium ${
            currentPage === page ? 'gradient-primary' : ''
          }`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}

      {/* Next Set */}
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 rounded-lg"
        onClick={() => onPageChange(lastPage + 1)}
        disabled={!canGoNextSet}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
