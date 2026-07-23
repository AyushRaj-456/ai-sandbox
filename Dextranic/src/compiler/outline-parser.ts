export interface OutlineItem {
  id: string;
  name: string;
  type: 'slide' | 'component' | 'theme';
  line: number; // 1-indexed line number
  endLine?: number; // 1-indexed ending line number
}

/**
 * Parses Dextranic DSL code dynamically to extract layout structures
 * and return line numbers for interactive jumping.
 */
export const parseOutline = (code: string): OutlineItem[] => {
  const lines = code.split('\n');
  const items: OutlineItem[] = [];
  
  let currentSlideItem: OutlineItem | null = null;
  let slideIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const trimmed = lines[i].trim();

    // Check for theme block
    if (trimmed.match(/^theme\s*\{/)) {
      items.push({
        id: `outline-theme-${lineNum}`,
        name: 'Global Theme Configuration',
        type: 'theme',
        line: lineNum
      });
      continue;
    }

    // Check for component block
    const componentMatch = trimmed.match(/^component\s+([A-Za-z0-9_-]+)\s*\{/);
    if (componentMatch) {
      items.push({
        id: `outline-comp-${componentMatch[1]}-${lineNum}`,
        name: `Component: ${componentMatch[1]}`,
        type: 'component',
        line: lineNum
      });
      continue;
    }

    // Check for slide block starting
    if (trimmed.match(/^slide\s*\{/) || trimmed.match(/^\/\/ slide\s*\{/)) {
      currentSlideItem = {
        id: `outline-slide-${slideIndex}-${lineNum}`,
        name: `Slide ${slideIndex}`,
        type: 'slide',
        line: lineNum,
        endLine: lineNum
      };
      slideIndex++;
      
      // Lookahead to find title and end line inside this slide block
      let depth = 1;
      for (let j = i + 1; j < lines.length; j++) {
        const lookaheadTrimmed = lines[j].trim();
        
        // Match title property
        const titleMatch = lookaheadTrimmed.match(/^title:\s*"([^"]+)"/) || lookaheadTrimmed.match(/^\/\/\s*title:\s*"([^"]+)"/);
        if (titleMatch && currentSlideItem && currentSlideItem.name === `Slide ${slideIndex - 1}`) {
          currentSlideItem.name = titleMatch[1];
        }

        // Adjust nesting depth if braces open/close
        if (lookaheadTrimmed.includes('{')) depth++;
        if (lookaheadTrimmed.includes('}')) depth--;

        // If block finishes, track endLine and exit lookahead
        if (depth <= 0) {
          if (currentSlideItem) {
            currentSlideItem.endLine = j + 1;
          }
          break;
        }
      }

      items.push(currentSlideItem);
    }
  }

  return items;
};
