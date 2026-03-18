UPDATE prompt_templates SET template = 'Analyze these interior design images and identify the dominant styles. For each detected style, provide:
1. Style name (e.g., "Modern & Minimal", "Bohemian Eclectic", "Mediterranean", "Classic Historical", "Rustic Nature", "Glam & Luxe")
2. Confidence score (0-1)
3. Brief description of why this style matches
4. 3-5 keywords that define this style

Also identify:
- Dominant colors (as hex codes)
- Overall moodboard description
- ALL visible room elements: every piece of furniture, wall treatment, flooring, lighting fixture, window treatment, rug, decorative item, and architectural feature. For each element provide a short label, a category, and a brief visual description (color, material, condition).

Respond in this exact JSON format:
{
  "styles": [
    {
      "styleName": "string",
      "confidence": number,
      "description": "string",
      "keywords": ["string"]
    }
  ],
  "dominantColors": ["#hex"],
  "moodboardDescription": "string",
  "roomElements": [
    {
      "label": "string (e.g. ''Gray fabric sofa'')",
      "category": "furniture | wall | flooring | lighting | window | rug | decor | architectural",
      "description": "string (brief visual description)"
    }
  ]
}', updated_at = now() WHERE template_key = 'analyze_style_room'