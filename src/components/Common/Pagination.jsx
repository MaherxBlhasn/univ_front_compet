import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 25, 50, 100]
}) => {
  const [customInput, setCustomInput] = useState('');

  // Calculate start and end item numbers
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handleCustomInputChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setCustomInput(value);
    }
  };

  const handleCustomInputSubmit = (e) => {
    e.preventDefault();
    const itemsNum = parseInt(customInput);
    if (itemsNum >= 1 && itemsNum <= 1000) {
      onItemsPerPageChange(itemsNum);
    }
  };

  const handleCustomInputBlur = () => {
    if (customInput && parseInt(customInput) >= 1) {
      const itemsNum = parseInt(customInput);
      if (itemsNum >= 1 && itemsNum <= 1000) {
        onItemsPerPageChange(itemsNum);
      }
    }
    // Don't clear - show current value
    setCustomInput('');
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    
    // Always show only previous, current, and next page numbers
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between sm:px-6">
      <div className="flex-1 flex items-center justify-between">
        {/* Left side - Info */}
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-700">
            Affichage de <span className="font-semibold">{startItem}</span> à{' '}
            <span className="font-semibold">{endItem}</span> sur{' '}
            <span className="font-semibold">{totalItems}</span> résultats
          </p>

          {/* Items per page - Dropdown + Separate Input */}
          {showItemsPerPage && (
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                Par page:
              </label>
              {/* Dropdown with preset options */}
              <select
                id="itemsPerPage"
                value={itemsPerPageOptions.includes(itemsPerPage) ? itemsPerPage : ''}
                onChange={(e) => e.target.value && onItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {!itemsPerPageOptions.includes(itemsPerPage) && (
                  <option value="">-</option>
                )}
                {itemsPerPageOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              
              {/* "ou" text */}
              <span className="text-sm text-gray-500">ou</span>
              
              {/* Custom input that always shows current value */}
              <form onSubmit={handleCustomInputSubmit} className="inline-block">
                <input
                  type="text"
                  value={customInput || (customInput === '' && itemsPerPage ? '' : '')}
                  onChange={handleCustomInputChange}
                  onBlur={handleCustomInputBlur}
                  placeholder={itemsPerPage.toString()}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  title={`Valeur actuelle: ${itemsPerPage}`}
                />
              </form>
              
              {/* Show current value if custom */}
              {!itemsPerPageOptions.includes(itemsPerPage) && (
                <span className="text-xs text-blue-600 font-medium">
                  (actuel: {itemsPerPage})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right side - Pagination controls */}
        <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
          {/* First Page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-2 py-2 rounded-l-lg border border-gray-300 text-sm font-medium ${
              currentPage === 1
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
            title="Première page"
          >
            <ChevronsLeft size={18} />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
              currentPage === 1
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
            title="Page précédente"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Page Numbers */}
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span
                key={`ellipsis-${index}`}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  currentPage === page
                    ? 'z-10 bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {page}
              </button>
            )
          ))}

          {/* Next Page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
              currentPage === totalPages
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
            title="Page suivante"
          >
            <ChevronRight size={18} />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center px-2 py-2 rounded-r-lg border border-gray-300 text-sm font-medium ${
              currentPage === totalPages
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
            title="Dernière page"
          >
            <ChevronsRight size={18} />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Pagination;
