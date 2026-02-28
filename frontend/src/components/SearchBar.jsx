import React from 'react';

const SearchBar = ({ searchTerm, onSearchChange, placeholder = 'Search stocks...' }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-dark-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-3 py-2.5 bg-dark-card border border-dark-border rounded-lg 
                   text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 
                   focus:ring-blue-accent focus:border-transparent transition-all duration-200"
      />
    </div>
  );
};

export default SearchBar;
