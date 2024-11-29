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

      const prompt = `Analyze these product search results for "${query}" and extract accurate product information. Focus on finding exact prices and details.

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

Instructions:
1. Extract for each product:
   - Exact current selling price (not MRP/list price)
   - Clean product name (remove site names/extra text)
   - Availability status
   - Rating and review count if present

2. Price Requirements:
   - Must be current selling price
   - Include ₹ symbol
   - Format as ₹XX,XXX or ₹XX,XXX.XX
   - No price ranges allowed
   - Verify price matches product

3. Critical Rules:
   - Only include products with clear prices
   - Keep original product URLs
   - No placeholder/fake data
   - Skip products without clear prices

Return Format (JSON array only):
[{
  "platform": "amazon"|"flipkart"|"myntra"|"snapdeal",
  "name": "Product Name",
  "price": "₹Exact Price",
  "link": "URL",
  "availability": true|false,
  "rating": number (1-5),
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
          const price = extractPriceFromText(product.price);
          return price !== null;
        })
        .map((product) => {
          const searchResult = searchResults.find(
            (r) => r.link === product.link
          );
          return {
            ...product,
            price: extractPriceFromText(product.price) || product.price,
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
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-start gap-3">
            <Info className="text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-gray-100 mb-2">Price Analysis Results</h2>
              <p className="text-gray-300">
                We've analyzed prices for "{query}" across multiple e-commerce platforms. 
                Use the filters below to compare prices and find the best deals.
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

