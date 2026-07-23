/**
 * Dextranic DSL Auto-Formatter
 * Formats braces, colons, properties, and indentation.
 */
export const formatDextranicCode = (code: string): string => {
  const lines = code.split('\n');
  let indentLevel = 0;
  const indentSize = 4;
  const formattedLines: string[] = [];

  for (let line of lines) {
    let trimmed = line.trim();
    
    // If the line starts with a closing brace, decrease the indentation
    if (trimmed.startsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const currentIndent = ' '.repeat(indentLevel * indentSize);
    
    // Format colons for slide properties (e.g. key: "value")
    if (trimmed.includes(':') && !trimmed.startsWith('http') && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
      const firstColonIdx = trimmed.indexOf(':');
      const key = trimmed.substring(0, firstColonIdx).trim();
      const val = trimmed.substring(firstColonIdx + 1).trim();
      trimmed = `${key}: ${val}`;
    }

    if (trimmed) {
      formattedLines.push(currentIndent + trimmed);
    } else {
      // Keep empty lines, but only if we didn't just add a duplicate empty line to avoid excessive spacing
      if (formattedLines.length === 0 || formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
    }

    // If the line ends with an opening brace, increase the indentation for subsequent lines
    if (trimmed.endsWith('{')) {
      indentLevel++;
    }
  }

  // Remove final extra empty lines
  while (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] === '') {
    formattedLines.pop();
  }

  return formattedLines.join('\n');
};
