import { SearchResult } from '../types';

export const extractPriceFromText = (text: string): string | null => {
  const patterns = [
    /₹\s*([\d,]+(?:\.\d{2})?)/,  // ₹1,234.56
    /Rs\.?\s*([\d,]+(?:\.\d{2})?)/i,  // Rs. 1,234.56
    /INR\s*([\d,]+(?:\.\d{2})?)/i,  // INR 1,234.56
    /([\d,]+(?:\.\d{2})?)\s*rupees/i,  // 1,234.56 rupees
    /price:?\s*₹\s*([\d,]+(?:\.\d{2})?)/i,  // Price: ₹1,234.56
    /MRP:?\s*₹\s*([\d,]+(?:\.\d{2})?)/i,  // MRP: ₹1,234.56
  ];

  for (const pattern of patterns) {
    const match = text?.match(pattern);
    if (match) {
      const price = match[1].replace(/,/g, '');
      const formattedPrice = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(parseFloat(price));
      return formattedPrice.replace('INR', '₹');
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