export interface SearchResult {
    link: string;
    title: string;
    snippet: string;
  }
  
  export interface ProductDetail {
    platform: 'amazon' | 'flipkart' | 'myntra' | 'snapdeal';
    name: string;
    price: string;
    link: string;
    availability: boolean;
    rating?: number | null;
    reviews?: number | null;
    image?: string | null;
  }