// Generate a suggested design name from style & room type
export const generateDesignTitle = (style?: string, roomType?: string): string => {
  const styleTitles: Record<string, string[]> = {
    "modern-minimal": ["Clean Lines Retreat", "Minimal Serenity", "Modern Calm"],
    "bohemian-eclectic": ["Bohemian Dream", "Eclectic Oasis", "Free Spirit Haven"],
    "glam-luxe": ["Luxe Elegance", "Golden Hour Suite", "Glamorous Escape"],
    "rustic-nature": ["Nature's Embrace", "Rustic Warmth", "Woodland Comfort"],
    "mediterranean": ["Mediterranean Breeze", "Coastal Warmth", "Sun-Kissed Villa"],
    "classic-historical": ["Timeless Grandeur", "Heritage Charm", "Classic Revival"],
  };
  const roomLabels: Record<string, string> = {
    "living-room": "Living Room",
    bedroom: "Bedroom",
    kitchen: "Kitchen",
    bathroom: "Bathroom",
    office: "Home Office",
  };
  const styleKey = style?.replace(/_/g, "-") || "";
  const options = styleTitles[styleKey] || ["Inspired Design"];
  const pick = options[Math.floor(Math.random() * options.length)];
  const room = roomLabels[roomType || ""] || "Room";
  return `${pick} – ${room}`;
};
