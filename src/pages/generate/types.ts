/** Shapes used by the Generate page and its helpers. */

export interface GeneratedDesign {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  isFavorite: boolean;
  isLocked?: boolean;
}

export interface AngleImage {
  label: string;
  imageUrl: string;
}

export interface DesignHighlightsData {
  colorScheme: {
    colors: string[];
    description: string;
    visual?: string;
    materials?: string[];
  };
  accentFurniture: {
    name: string;
    description: string;
    visual?: string;
  };
  moodboard: {
    elements: string[];
    description: string;
    visual?: string;
  };
}

export interface StyleMatch {
  style: string;
  percentage: number;
  color: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesignItem {
  id: string;
  item_type: string;
  item_name: string;
  item_description: string;
  color?: string;
  hex_code?: string;
  material?: string;
  style?: string;
  priority: "essential" | "recommended" | "optional";
  matched_product_id?: string;
  google_shopping_url?: string;
  google_images_url?: string;
  bounding_box?: BoundingBox;
  product_photo_url?: string;
  wall_type?: string;
  matchedProduct?: {
    id: string;
    name: string;
    price?: number;
    currency?: string;
    image_urls?: string[];
    source_url?: string;
    ai_style_tags?: string[];
  };
}
