export interface RichTextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  color?: string; // Hex color string
  fontFace?: string;
  fontSize?: number;
}

/**
 * Parses inline LaTeX-style typography control sequences (e.g. \bold{text}, \color{FF0000}{text})
 * and returns styled text runs for PPTX and HTML live preview renderers.
 */
const convertMarkdownToLatex = (input: string): string => {
  let result = input;
  // Double asterisks (bold) -> \bold{...}
  result = result.replace(/\*\*([^*]+)\*\*/g, '\\bold{$1}');
  // Single asterisks (italic) -> \italic{...}
  result = result.replace(/\*([^*]+)\*/g, '\\italic{$1}');
  // Backticks (inline monospace code) -> \font{Courier New}{$1}
  result = result.replace(/`([^`]+)`/g, '\\font{Courier New}{$1}');
  return result;
};

export const parseRichText = (rawStr: string): RichTextRun[] => {
  const str = convertMarkdownToLatex(rawStr);
  const runs: RichTextRun[] = [];
  
  interface StyleContext {
    bold?: boolean;
    italic?: boolean;
    color?: string;
    fontFace?: string;
    fontSize?: number;
  }

  const stack: StyleContext[] = [{}]; // Base default style context
  let currentText = '';
  let i = 0;

  const pushCurrentRun = () => {
    if (currentText.length > 0) {
      const activeStyle = stack[stack.length - 1];
      runs.push({
        text: currentText,
        ...activeStyle
      });
      currentText = '';
    }
  };

  while (i < str.length) {
    // Check for LaTeX control sequence starting with backslash
    if (str[i] === '\\' && i + 1 < str.length) {
      const remaining = str.substring(i + 1);
      
      // 1. Bold: \bold{
      if (remaining.startsWith('bold{')) {
        pushCurrentRun();
        const active = stack[stack.length - 1];
        stack.push({ ...active, bold: true });
        i += 6; // Move past "\bold{"
        continue;
      }
      
      // 2. Italic: \italic{
      if (remaining.startsWith('italic{')) {
        pushCurrentRun();
        const active = stack[stack.length - 1];
        stack.push({ ...active, italic: true });
        i += 8; // Move past "\italic{"
        continue;
      }

      // 3. Color: \color{HEX}{
      const colorMatch = remaining.match(/^color\{([A-Fa-f0-9]{6})\}\{/);
      if (colorMatch) {
        pushCurrentRun();
        const hex = colorMatch[1];
        const active = stack[stack.length - 1];
        stack.push({ ...active, color: hex });
        i += colorMatch[0].length + 1; // Move past "\color{HEX}{"
        continue;
      }

      // 4. Font: \font{FontFace}{
      const fontMatch = remaining.match(/^font\{([A-Za-z0-9\s_-]+)\}\{/);
      if (fontMatch) {
        pushCurrentRun();
        const fontName = fontMatch[1];
        const active = stack[stack.length - 1];
        stack.push({ ...active, fontFace: fontName });
        i += fontMatch[0].length + 1; // Move past "\font{FontFace}{"
        continue;
      }

      // 5. Size: \size{Number}{
      const sizeMatch = remaining.match(/^size\{([0-9]+)\}\{/);
      if (sizeMatch) {
        pushCurrentRun();
        const pointSize = parseInt(sizeMatch[1], 10);
        const active = stack[stack.length - 1];
        stack.push({ ...active, fontSize: pointSize });
        i += sizeMatch[0].length + 1; // Move past "\size{Number}{"
        continue;
      }
    }

    // Check for closing brace to exit a style context
    if (str[i] === '}') {
      if (stack.length > 1) {
        pushCurrentRun();
        stack.pop();
        i++;
        continue;
      }
    }

    // Default: append standard character
    currentText += str[i];
    i++;
  }

  // Push final remaining run
  pushCurrentRun();

  // If no styled runs were created (e.g. standard flat string), return a single default run
  if (runs.length === 0 && str.length > 0) {
    return [{ text: str }];
  }

  return runs;
};
