/**
 * Fallback style data for the Generate page: style matches, profile text,
 * default materials, colours and accent furniture per style. Pure functions,
 * moved out of Generate.tsx.
 */
import type { QuizData } from "@/contexts/QuizContext";
import type { StyleMatch } from "./types";

export const buildStyleMatches = (primaryStyle?: string, analysis?: Record<string, unknown> | null): StyleMatch[] => {
  const styleColors: Record<string, string> = {
    "modern-minimal": "#64748B",
    "classic-historical": "#92400E",
    "bohemian-eclectic": "#7C3AED",
    "rustic-nature": "#059669",
    "mediterranean": "#0891B2",
    "glam-luxe": "#BE185D",
  };

  const primary = primaryStyle || "modern-minimal";
  
  // Calculate percentages based on primary style
  const matches: StyleMatch[] = [];
  
  // Primary style gets highest percentage
  matches.push({
    style: primary,
    percentage: 45,
    color: styleColors[primary] || "#64748B",
  });

  // Add complementary styles based on the primary
  const complementaryMap: Record<string, string[]> = {
    "modern-minimal": ["rustic-nature", "mediterranean"],
    "classic-historical": ["glam-luxe", "mediterranean"],
    "bohemian-eclectic": ["rustic-nature", "glam-luxe"],
    "rustic-nature": ["bohemian-eclectic", "mediterranean"],
    "mediterranean": ["rustic-nature", "modern-minimal"],
    "glam-luxe": ["classic-historical", "modern-minimal"],
  };

  const complementary = complementaryMap[primary] || ["rustic-nature", "modern-minimal"];
  matches.push({
    style: complementary[0],
    percentage: 30,
    color: styleColors[complementary[0]] || "#059669",
  });
  matches.push({
    style: complementary[1],
    percentage: 25,
    color: styleColors[complementary[1]] || "#0891B2",
  });

  return matches;
};

export const generateStyleProfile = (matches: StyleMatch[], quiz: QuizData): { matches: StyleMatch[]; name: string; description: string } => {
  const primary = matches[0]?.style || "modern-minimal";
  const secondary = matches[1]?.style;
  
  const profileNames: Record<string, string> = {
    "modern-minimal": "Contemporary Zen",
    "classic-historical": "Timeless Elegance",
    "bohemian-eclectic": "Creative Spirit",
    "rustic-nature": "Organic Harmony",
    "mediterranean": "Coastal Serenity",
    "glam-luxe": "Modern Luxe",
  };

  const blendDescriptions: Record<string, string> = {
    "modern-minimal+rustic-nature": "Your style blends clean contemporary lines with organic natural textures, creating spaces that feel both refined and grounded in nature.",
    "modern-minimal+mediterranean": "You gravitate toward crisp minimalism softened by coastal warmth—airy spaces with natural light and calming blue accents.",
    "classic-historical+glam-luxe": "Your aesthetic marries traditional elegance with glamorous touches—rich materials, ornate details, and luxurious finishes.",
    "bohemian-eclectic+rustic-nature": "You embrace a collected, personal style where global artisan pieces meet earthy organic elements in a warm, layered space.",
    "rustic-nature+mediterranean": "Your spaces feel like a countryside retreat—natural materials, earthy tones, and a relaxed Mediterranean ease.",
  };

  const blendKey = `${primary}+${secondary}`;
  const description = blendDescriptions[blendKey] || 
    `Your unique style combines ${matches.map(m => m.style.replace(/-/g, " ")).join(", ")} influences, creating a personalized aesthetic for your ${quiz.roomType || "space"}.`;

  return {
    matches,
    name: profileNames[primary] || "Personalized Style",
    description,
  };
};

export const getMaterialsForStyle = (style?: string): string[] => {
  const materialsMap: Record<string, string[]> = {
    "modern-minimal": ["oak wood", "linen", "concrete", "brushed steel"],
    "classic-historical": ["mahogany", "velvet", "marble", "brass"],
    "bohemian-eclectic": ["rattan", "woven textiles", "terracotta", "macramé"],
    "rustic-nature": ["reclaimed wood", "jute", "natural stone", "raw linen"],
    "mediterranean": ["whitewashed wood", "terracotta", "wrought iron", "cotton"],
    "glam-luxe": ["lacquer", "velvet", "mirror", "gold leaf"],
  };
  return materialsMap[style || "modern-minimal"] || materialsMap["modern-minimal"];
};

export const getDefaultColors = (palette?: string): string[] => {
  const colorMaps: Record<string, string[]> = {
    neutral: ["#F5F5DC", "#D4C4A8", "#8B7355", "#5D4E37", "#2F2F2F"],
    cool: ["#E3F2FD", "#90CAF9", "#42A5F5", "#1976D2", "#0D47A1"],
    warm: ["#FFF3E0", "#FFCC80", "#FF9800", "#E65100", "#BF360C"],
    bold: ["#F3E5F5", "#BA68C8", "#7B1FA2", "#4A148C", "#1A237E"],
    monochrome: ["#FAFAFA", "#BDBDBD", "#757575", "#424242", "#212121"],
  };
  return colorMaps[palette || "neutral"] || colorMaps.neutral;
};

export const getDefaultAccentFurniture = (style?: string): string => {
  const furnitureMap: Record<string, string> = {
    "modern-minimal": "Sculptural Lounge Chair",
    "classic-historical": "Antique Armoire",
    "bohemian-eclectic": "Rattan Peacock Chair",
    "rustic-nature": "Live Edge Wood Table",
    "mediterranean": "Wrought Iron Daybed",
    "glam-luxe": "Velvet Statement Sofa",
  };
  return furnitureMap[style || "modern-minimal"] || "Designer Accent Chair";
};
