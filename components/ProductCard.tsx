import React from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { ProductDetail } from '../types';
import { PLATFORM_DETAILS } from '../utils/constants';
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ProductCardProps {
  product: ProductDetail;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const platform = PLATFORM_DETAILS[product.platform];

  return (
    <Card className="overflow-hidden bg-gray-800 border-gray-700 hover:shadow-xl transition-shadow duration-300">
      {product.image && (
        <div className="relative h-48 bg-gray-900">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <Badge className="absolute top-2 right-2 bg-blue-600 text-white">
            {platform.name}
          </Badge>
        </div>
      )}
      <CardContent className="p-6 space-y-4">
        <h3 className="font-semibold text-gray-100 text-lg line-clamp-2 h-14">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-blue-400">
            {product.price}
          </span>
          <Badge variant={product.availability ? "secondary" : "destructive"}>
            {product.availability ? 'In Stock' : 'Out of Stock'}
          </Badge>
        </div>

        {(product.rating || product.reviews) && (
          <div className="flex items-center gap-4">
            {product.rating && (
              <div className="flex items-center gap-1">
                <Star
                  size={18}
                  className="text-yellow-400 fill-current"
                />
                <span className="text-sm font-medium text-gray-300">
                  {product.rating.toFixed(1)}
                </span>
              </div>
            )}
            {product.reviews && (
              <span className="text-sm text-gray-400">
                {product.reviews.toLocaleString()} reviews
              </span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button
          asChild
          variant="secondary"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            <ExternalLink size={18} />
            View on {platform.name}
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;

