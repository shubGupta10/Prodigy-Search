import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CX = process.env.GOOGLE_SEARCH_CX;

const searchGoogle = async (query: string) => {
  const url = `https://www.googleapis.com/customsearch/v1?q=${query}&key=${GOOGLE_API_KEY}&cx=${CX}`;

  try {
    const response = await axios.get(url);
    return response.data.items || []; // Returning the search results
  } catch (error) {
    console.error('Error with Google Search:', error);
    return [];
  }
};

// Named export for GET method
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  try {
    const results = await searchGoogle(query);

    if (results.length === 0) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Error:', error);  // Log any unexpected errors
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}
