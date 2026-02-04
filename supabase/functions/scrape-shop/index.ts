import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapeRequest {
  shopUrl: string;
  userId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const { shopUrl, userId }: ScrapeRequest = await req.json();

    if (!shopUrl || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Shop URL and user ID are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Starting to scrape shop:", shopUrl);

    // Non-product path patterns to exclude
    const excludePatterns = [
      '/career', '/about', '/privacy', '/contact', '/b2b', '/affiliate',
      '/terms', '/imprint', '/faq', '/help', '/service', '/support',
      '/press', '/blog', '/magazine', '/looks', '/inspiration',
      '/account', '/login', '/register', '/cart', '/checkout', '/wishlist',
      '/search', '/filter', '/sort', '/category', '/collection',
      '/policy', '/shipping', '/returns', '/legal', '/cookie',
      '/sitemap', '/newsletter', '/subscribe', '/unsubscribe',
      '/product-care', '/care-guide', '/delivery', '/payment',
      '/gift', '/voucher', '/en/i/', '/en/p/product-care',
      '/brands/', '/campaign', '/new-products', '/sale', '/designservice'
    ];

    // Category page patterns (single-word paths that are likely categories, not products)
    const categoryPatterns = [
      '/sofas', '/chairs', '/tables', '/beds', '/storage', '/lighting',
      '/decor', '/rugs', '/outdoor', '/couchtische', '/sessel', '/stuhle',
      '/lampen', '/teppiche', '/kommoden', '/schranke', '/regale'
    ];

    // Step 1: Map the website to find all pages
    const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: shopUrl,
        limit: 300,
        includeSubdomains: false,
      }),
    });

    const mapData = await mapResponse.json();
    
    if (!mapResponse.ok) {
      console.error("Map failed:", mapData);
      throw new Error(mapData.error || "Failed to map website");
    }

    const allUrls = mapData.links || [];
    console.log(`Found ${allUrls.length} total URLs`);

    // Filter out non-product pages
    const productUrls = allUrls.filter((url: string) => {
      const urlLower = url.toLowerCase();
      
      // Skip excluded patterns
      if (excludePatterns.some(pattern => urlLower.includes(pattern))) {
        return false;
      }
      
      // Skip category pages (exact match at end of URL)
      const pathname = new URL(url).pathname;
      if (categoryPatterns.some(cat => pathname === cat || pathname === cat + '/')) {
        return false;
      }
      
      // Skip URLs ending with common non-product extensions
      if (urlLower.endsWith('.pdf') || urlLower.endsWith('.xml') || urlLower.endsWith('.txt')) {
        return false;
      }
      
      // Skip very short paths (usually category pages)
      if (pathname === '/' || pathname.split('/').filter(Boolean).length === 0) {
        return false;
      }
      
      // Prefer URLs with product IDs (numbers in the URL - common pattern)
      // This helps prioritize actual product pages
      return true;
    });

    // Sort to prioritize URLs with numbers (likely product IDs)
    const sortedUrls = productUrls.sort((a: string, b: string) => {
      const aHasNumber = /\d{4,}/.test(a);
      const bHasNumber = /\d{4,}/.test(b);
      if (aHasNumber && !bHasNumber) return -1;
      if (!aHasNumber && bHasNumber) return 1;
      return 0;
    });

    console.log(`Filtered to ${sortedUrls.length} potential product URLs`);

    if (sortedUrls.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No product pages found on this website. Try providing a direct link to a product category page.",
          products: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Scrape product pages (limit to 40 for ~30 products)
    const urlsToScrape = sortedUrls.slice(0, 40);
    const scrapedProducts: any[] = [];

    for (const url of urlsToScrape) {
      try {
        console.log("Scraping:", url);
        
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        const scrapeData = await scrapeResponse.json();
        
        if (scrapeResponse.ok && scrapeData.data?.markdown) {
          scrapedProducts.push({
            url,
            content: scrapeData.data.markdown,
            metadata: scrapeData.data.metadata || {},
          });
        }
      } catch (err) {
        console.error("Failed to scrape:", url, err);
      }
    }

    console.log(`Successfully scraped ${scrapedProducts.length} pages`);

    if (scrapedProducts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Could not extract product data from the website",
          products: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Use AI to extract structured product data
    const productsToExtract = scrapedProducts.map(p => 
      `URL: ${p.url}\nTitle: ${p.metadata.title || 'Unknown'}\nContent:\n${p.content.substring(0, 6000)}`
    ).join("\n\n---\n\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: `Extract product information from these scraped furniture/home decor pages. For each product found, extract:
- name: Product name
- description: Brief description (max 200 chars)
- category: One of: sofa, chair, table, bed, storage, lighting, decor, rug, outdoor, other
- style: One of: modern-minimal, bohemian-eclectic, glam-luxe, rustic-nature, mediterranean, classic-historical, or null if unclear
- price: Number only (no currency symbol), or null if not found
- source_url: The URL where this product was found
- image_url: Product image URL if found, or null
- ai_style_tags: Array of 3-5 style tags describing the aesthetic (e.g., ["minimalist", "scandinavian", "warm tones", "natural materials", "clean lines"])
- ai_image_description: A detailed visual description of the product for accessibility and AI matching (max 150 chars)

Return as JSON array:
{
  "products": [
    {
      "name": "Product Name",
      "description": "Brief description",
      "category": "category",
      "style": "style or null",
      "price": 123.45 or null,
      "source_url": "https://...",
      "image_url": "https://... or null",
      "ai_style_tags": ["tag1", "tag2", "tag3"],
      "ai_image_description": "Visual description of the product"
    }
  ]
}

Scraped pages:
${productsToExtract}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI extraction failed:", aiResponse.status);
      throw new Error("Failed to extract product data");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI extraction complete");

    // Parse the AI response
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const extracted = JSON.parse(jsonMatch[0]);
    const extractedProducts = extracted.products || [];

    console.log(`Extracted ${extractedProducts.length} products`);

    // Step 4: Save products to database
    const savedProducts: any[] = [];
    
    for (const product of extractedProducts) {
      if (!product.name || !product.category) continue;

      const { data, error } = await supabase
        .from("shop_products")
        .insert({
          shop_id: userId,
          name: product.name,
          description: product.description || null,
          category: product.category,
          style: product.style || null,
          price: product.price || null,
          source_url: product.source_url || null,
          image_urls: product.image_url ? [product.image_url] : [],
          is_active: true,
          ai_style_tags: product.ai_style_tags || [],
          ai_image_description: product.ai_image_description || null,
        })
        .select()
        .single();

      if (!error && data) {
        savedProducts.push(data);
      } else {
        console.error("Failed to save product:", error);
      }
    }

    console.log(`Saved ${savedProducts.length} products to database`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${savedProducts.length} products`,
        products: savedProducts,
        totalFound: productUrls.length,
        scraped: scrapedProducts.length,
        extracted: extractedProducts.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scrape shop error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to scrape shop",
        products: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
