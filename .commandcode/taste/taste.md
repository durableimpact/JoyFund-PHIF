# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# UI/UX Patterns
- For "view all" of large lists (300+ items): Use shadcn Dialog/Modal with infinite scroll inside, not inline expansion. Include CTA in modal footer. Confidence: 0.75
- For campaign detail pages on desktop: Use a 2-column grid layout (main content + sidebar), not a single-column vertical layout. Confidence: 0.85

# workflow
- Only apply styling or UI changes that are explicitly requested; do not add extra background colors, borders, or unsolicited design elements without the user asking for them. Confidence: 0.65

# charts
- Use LineChart (Line) from recharts instead of BarChart (Bar) for donation trend visualizations. Confidence: 0.70
- Backend chart aggregation API must fill missing date ranges with zero-value entries so the chart always has a complete series for any period. Confidence: 0.70

# date-format
- Display dates in human-friendly/readable format (e.g., 'Jan 15, 2026') instead of numeric/US format (e.g., '6/24/2026') on donation displays. Confidence: 0.65

