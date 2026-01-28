import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Slider } from "@/components/ui/slider";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  pageNumbers: (number | "ellipsis")[];
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const ProductPagination = ({
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange,
  hasNextPage,
  hasPrevPage,
}: ProductPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      {/* Slider for quick navigation */}
      <div className="w-full max-w-md flex items-center gap-4">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Page {currentPage}
        </span>
        <Slider
          value={[currentPage]}
          min={1}
          max={totalPages}
          step={1}
          onValueChange={(value) => onPageChange(value[0])}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          of {totalPages}
        </span>
      </div>

      {/* Numbered pagination */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => hasPrevPage && onPageChange(currentPage - 1)}
              className={!hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {pageNumbers.map((page, index) => (
            <PaginationItem key={index}>
              {page === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => onPageChange(page)}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => hasNextPage && onPageChange(currentPage + 1)}
              className={!hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default ProductPagination;
