import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Loader2, History, X } from 'lucide-react';
import AIChecker from './AIChecker';
import type { SearchResult } from '@/types/index';
import toast from 'react-hot-toast';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const SearchBox = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setShowHistory(false);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;
    const cx = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_CX;

    try {
      const searchTerm = `${query} price inr (site:amazon.in OR site:flipkart.com OR site:myntra.com OR site:snapdeal.com) "₹" OR "Rs." -used -refurbished`;
      
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
          searchTerm
        )}&key=${apiKey}&cx=${cx}&num=10&fields=items(title,link,snippet,pagemap)`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      
      if (!data.items?.length) {
        toast.error('No products found');
        return;
      }

      const validResults = data.items.filter((item: any) => 
        item.snippet.match(/₹|Rs\.|INR|rupees/i)
      );

      if (validResults.length === 0) {
        toast.error('No price information found');
        return;
      }

      setResults(validResults);
      
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, 5);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (error) {
      toast.error('Failed to fetch search results');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gray-900 text-gray-100 flex flex-col">
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold text-gray-100 sm:text-5xl md:text-6xl">Price Analyzer</h1>
            <p className="text-xl text-gray-300 sm:text-2xl">Compare prices across multiple e-commerce platforms in India</p>
          </div>

          <div className="relative max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
                  onFocus={() => setShowHistory(true)}
                  placeholder="Search for products (e.g., iPhone 13, Samsung TV)..."
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-800 text-gray-100 border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <><Loader2 className="animate-spin" size={20} /> Searching...</>
                ) : (
                  'Search'
                )}
              </Button>
            </div>

            {searchHistory.length > 0 && showHistory && !loading && !results.length && (
              <div
                ref={historyRef}
                className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 z-10 transition-all duration-200 ease-in-out"
              >
                <div className="flex items-center justify-between text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <History size={16} />
                    <span className="text-sm font-medium">Recent Searches</span>
                  </div>
                  <button
                    onClick={() => setSearchHistory([])}
                    className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2">
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(item);
                        handleSearch();
                      }}
                      className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <AIChecker searchResults={results} query={query} />
    </div>
  );
};

export default SearchBox;

