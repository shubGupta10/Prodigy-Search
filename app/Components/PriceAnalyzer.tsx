import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductDetail } from "@/types/index";

interface AnalyzerProps {
  products: ProductDetail[];
}

const PriceAnalyzer: React.FC<AnalyzerProps> = ({ products }) => {
  const priceAnalysis = useMemo(() => {
    if (products.length === 0) return null;

    // Enhanced price extraction with more robust parsing
    const extractNumericPrice = (priceStr: string): number => {
      const cleanedPrice = priceStr.replace(/[₹,]/g, '');
      const numericPrice = parseFloat(cleanedPrice);
      return isNaN(numericPrice) ? 0 : numericPrice;
    };

    // Extract numeric prices
    const numericPrices = products
      .map(product => extractNumericPrice(product.price))
      .filter(price => price > 0);

    if (numericPrices.length === 0) return null;

    return {
      minPrice: Math.min(...numericPrices),
      maxPrice: Math.max(...numericPrices),
      averagePrice: numericPrices.reduce((a, b) => a + b, 0) / numericPrices.length,
      minPriceProduct: products.find(
        p => extractNumericPrice(p.price) === Math.min(...numericPrices)
      ),
      maxPriceProduct: products.find(
        p => extractNumericPrice(p.price) === Math.max(...numericPrices)
      ),
      totalProducts: products.length,
      availableProducts: products.filter(p => p.availability).length,
      platformBreakdown: products.reduce((acc, product) => {
        acc[product.platform] = (acc[product.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [products]);

  if (!priceAnalysis) return null;

  const priceVariance = (priceAnalysis.maxPrice - priceAnalysis.minPrice) / priceAnalysis.averagePrice * 100;

  // Format price with Indian number formatting
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price).replace('₹', '₹');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full px-4">
      {/* Price Overview Card */}
      <Card className="bg-gray-800 border-gray-700 w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Price Overview</CardTitle>
          <DollarSign className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-blue-400">
            {formatPrice(priceAnalysis.averagePrice)}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Average Price Across {priceAnalysis.totalProducts} Products
          </p>
          <div className="flex items-center mt-2">
            {priceVariance > 20 ? (
              <>
                <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-xs text-red-400">
                  High Price Variance: {priceVariance.toFixed(2)}%
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-400">
                  Moderate Price Variance: {priceVariance.toFixed(2)}%
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Range Card */}
      <Card className="bg-gray-800 border-gray-700 w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Price Range</CardTitle>
          <AlertCircle className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="w-1/2">
              <p className="text-sm text-gray-400">Lowest Price</p>
              <div className="text-lg md:text-xl font-bold text-green-400">
                {formatPrice(priceAnalysis.minPrice)}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {priceAnalysis.minPriceProduct?.name}
              </p>
            </div>
            <div className="w-1/2 text-right">
              <p className="text-sm text-gray-400">Highest Price</p>
              <div className="text-lg md:text-xl font-bold text-red-400">
                {formatPrice(priceAnalysis.maxPrice)}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {priceAnalysis.maxPriceProduct?.name}
              </p>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <Badge variant="secondary">
              Range: {formatPrice(priceAnalysis.maxPrice - priceAnalysis.minPrice)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Platform Distribution Card */}
      <Card className="bg-gray-800 border-gray-700 w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Platform Distribution</CardTitle>
          <DollarSign className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(priceAnalysis.platformBreakdown).map(([platform, count]) => (
              <div key={platform} className="flex justify-between items-center">
                <span className="text-sm text-gray-300 truncate">{platform}</span>
                <Badge variant="outline" className='text-blue-200'>
                  {count} Product{count !== 1 ? 's' : ''}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center text-xs text-blue-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            Total Available: {priceAnalysis.availableProducts} / {priceAnalysis.totalProducts}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceAnalyzer;