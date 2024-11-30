import { SearchResult } from '../types';

export const extractPriceFromText = (text: string): string | null => {
  const patterns = [
    // More precise regex for different price formats
    /(?:₹|Rs\.?)\s*([\d,]+(?:\.\d{2})?)/i,  // ₹1,234.56 or Rs. 1,234.56
    /\b([\d,]+(?:\.\d{2})?)\s*(?:rupees|INR)\b/i,  // 1,234.56 rupees
    /price\s*:?\s*(?:₹|Rs\.?)\s*([\d,]+(?:\.\d{2})?)/i,  // Price: ₹1,234.56
    /MRP\s*:?\s*(?:₹|Rs\.?)\s*([\d,]+(?:\.\d{2})?)/i,  // MRP: ₹1,234.56
  ];

  for (const pattern of patterns) {
    const match = text?.match(pattern);
    if (match) {
      try {
        // Remove commas and parse the price
        const price = match[1].replace(/,/g, '');
        const numericPrice = parseFloat(price);

        // Validate price is reasonable (filter out extreme values)
        if (isNaN(numericPrice) || numericPrice <= 0 || numericPrice > 1000000) {
          continue;
        }

        // Format price with Indian number formatting
        const formattedPrice = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(numericPrice).replace('INR', '₹');

        return formattedPrice;
      } catch (error) {
        console.error('Price formatting error:', error);
        continue;
      }
    }
  }

  return null;
};

export const extractImageFromResult = (result: SearchResult): string | null => {
  const pagemap = (result as any).pagemap;
  if (pagemap?.cse_image?.[0]?.src) {
    return pagemap.cse_image[0].src;
  }
  if (pagemap?.cse_thumbnail?.[0]?.src) {
    return pagemap.cse_thumbnail[0].src;
  }
  return null;
};

export const determineAvailability = (text: string): boolean => {
  const unavailableTerms = ['out of stock', 'currently unavailable', 'sold out'];
  return !unavailableTerms.some(term => text?.toLowerCase().includes(term));
};