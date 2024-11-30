import React, { useState, useCallback, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Loader2, ShoppingBag, AlertCircle, Info } from 'lucide-react';
import type { SearchResult, ProductDetail } from "@/types/index";
import { PLATFORM_DETAILS } from "@/utils/constants";
import {
  extractPriceFromText,
  extractImageFromResult,
  determineAvailability,
} from "@/utils/priceExtractor";
import ProductCard from "@/components/ProductCard";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button"
import PriceAnalyzer from "./PriceAnalyzer";

interface AICheckerProps {
  searchResults: SearchResult[];
  query: string;
}

function AIChecker({ searchResults, query }: AICheckerProps) {
  const [loading, setLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const analyzeProducts = useCallback(async () => {
    if (!searchResults.length) return;

    setLoading(true);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;

    try {
      const genAI = new GoogleGenerativeAI(apiKey as string);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Analyze these product search results carefully. Extract precise pricing information.

Search Results:
${searchResults
  .map(
    (r) => `
Title: ${r.title}
Description: ${r.snippet}
URL: ${r.link}
`
  )
  .join("\n")}

Critical Price Extraction Rules:
- MUST extract SELLING price, NOT MRP
- Price MUST be in ₹ format
- Ensure price matches specific product
- ONLY include products with CLEAR, VERIFIABLE prices
- Ignore used/refurbished items
- Validate price against product description
- No placeholder or estimated prices
- Prioritize CURRENT price

STRICT JSON Format:
[{
  "platform": "amazon"|"flipkart"|"myntra"|"snapdeal",
  "name": "Exact Product Name",
  "price": "₹Exact Current Price",
  "link": "Product URL",
  "availability": true|false,
  "rating": number (0-5),
  "reviews": number
}]`;

      const result = await model.generateContent(prompt);
      const response = await result.response.text();

      let enhancedProducts: ProductDetail[] = [];
      try {
        enhancedProducts = JSON.parse(response.trim());
      } catch (error) {
        const jsonMatch = response?.match(/\`\`\`json\n([\s\S]*?)\`\`\`/);
        if (jsonMatch) {
          enhancedProducts = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error("Invalid JSON response");
        }
      }

      if (!Array.isArray(enhancedProducts) || !enhancedProducts.length) {
        throw new Error("No valid product details found");
      }

      // Validate and enhance products
      const validatedProducts = enhancedProducts
  .filter((product) => {
    // More robust validation
    const price = extractPriceFromText(product.price);
    const numericPrice = price ? parseFloat(price.replace(/[₹,]/g, '')) : null;
    
    return price !== null && 
           numericPrice !== null && 
           numericPrice > 0 && 
           numericPrice < 1000000;
  })
  .map((product) => {
    const searchResult = searchResults.find(
      (r) => r.link === product.link
    );
    
    const extractedPrice = extractPriceFromText(product.price);
    
    return {
      ...product,
      price: extractedPrice || product.price,
      image: searchResult
        ? extractImageFromResult(searchResult)
        : undefined,
      availability: determineAvailability(searchResult?.snippet || ""),
      rating: Math.min(5, Math.max(1, Number(product.rating) || 4)),
      reviews: Math.max(0, Number(product.reviews) || 100),
    };
  });

      if (validatedProducts.length === 0) {
        throw new Error("No products with valid prices found");
      }

      setProductDetails(validatedProducts);
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze product prices");
    } finally {
      setLoading(false);
    }
  }, [searchResults, query]);

  useEffect(() => {
    if (searchResults.length > 0) {
      analyzeProducts();
    }
  }, [searchResults, analyzeProducts]);

  const filteredProducts = selectedPlatform
    ? productDetails.filter((p) => p.platform === selectedPlatform)
    : productDetails;

  return (
    <div className="w-full bg-gray-900 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin mb-4 text-blue-400" size={40} />
            <span className="text-gray-300 text-lg">Analyzing product prices...</span>
            <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
          </div>
        )}

        {!loading && productDetails.length > 0 && (
          <>
            <PriceAnalyzer products={productDetails} />
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-start gap-3">
              <Info className="text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-gray-100 mb-2">Price Analysis Results</h2>
                <p className="text-gray-300">
                  We've analyzed prices for "{query}" across multiple e-commerce platforms.
                  Use the filters below to compare prices and find the best deals.
                </p>
                <p className="bg-gradient-to-br from-red-600 to-red-700 text-transparent bg-clip-text font-bold text-lg p-3 rounded-md border border-[#1f2937] bg-red-50/10">
                  ⚠️ Note: Prices can vary; we recommend viewing the product for the best price.
                </p>

              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ShoppingBag size={24} className="text-blue-400" />
                <span className="font-medium text-gray-100 text-lg">
                  Found {productDetails.length} products
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-black">
                {Object.entries(PLATFORM_DETAILS).map(([platform, details]) => (
                  <Button
                    key={platform}
                    onClick={() =>
                      setSelectedPlatform(
                        selectedPlatform === platform ? null : platform
                      )
                    }
                    variant={selectedPlatform === platform ? "secondary" : "outline"}
                    className="rounded-full transition-all duration-200 flex items-center gap-2"
                  >
                    <img
                      src={details.logo}
                      alt={details.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    {details.name}
                  </Button>
                ))}
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={index} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <AlertCircle size={40} className="mb-4" />
                <p className="text-lg font-medium">No products found for the selected platform</p>
                <p className="text-sm mt-2">Try selecting a different platform or modifying your search</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AIChecker;

