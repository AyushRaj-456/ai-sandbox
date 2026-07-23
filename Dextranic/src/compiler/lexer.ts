export enum TokenType {
  IDENTIFIER = 'IDENTIFIER',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  COLON = 'COLON',
  ARROW = 'ARROW',
  STRING = 'STRING',
  VALUE = 'VALUE',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export class Lexer {
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(private input: string) {}

  public tokenize(): Token[] {
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];

      if (char === '\n') {
        this.line++;
        this.column = 1;
        this.pos++;
        continue;
      }

      if (/\s/.test(char)) {
        this.pos++;
        this.column++;
        continue;
      }

      if (char === '{') {
        this.addToken(TokenType.LBRACE, '{');
        this.pos++;
        this.column++;
        continue;
      }

      if (char === '}') {
        this.addToken(TokenType.RBRACE, '}');
        this.pos++;
        this.column++;
        continue;
      }

      if (char === ':') {
        this.addToken(TokenType.COLON, ':');
        this.pos++;
        this.column++;
        continue;
      }

      if (char === '-' && this.pos + 1 < this.input.length && this.input[this.pos + 1] === '>') {
        this.addToken(TokenType.ARROW, '->');
        this.pos += 2;
        this.column += 2;
        continue;
      }

      if (char === '"') {
        let str = '';
        this.pos++;
        this.column++;
        while (this.pos < this.input.length && this.input[this.pos] !== '"') {
          str += this.input[this.pos];
          this.pos++;
          this.column++;
        }
        if (this.input[this.pos] === '"') {
          this.pos++;
          this.column++;
        }
        this.addToken(TokenType.STRING, str);
        continue;
      }

      // Identifiers or unquoted values
      if (/[a-zA-Z0-9_\-%/\.]/.test(char)) {
        let val = '';
        while (this.pos < this.input.length && /[a-zA-Z0-9_\-%/\.]/.test(this.input[this.pos])) {
          val += this.input[this.pos];
          this.pos++;
          this.column++;
        }
        // If the next character is whitespace or a structural token, we decide if it's an IDENTIFIER or VALUE.
        // A simple rule: if we are right after a COLON, it's a VALUE. Otherwise, an IDENTIFIER.
        // Actually, we'll just emit IDENTIFIER and let the parser figure it out based on context.
        this.addToken(TokenType.IDENTIFIER, val);
        continue;
      }

      // Unknown character, just skip for now (or throw error in a real compiler)
      this.pos++;
      this.column++;
    }

    this.addToken(TokenType.EOF, '');
    return this.tokens;
  }

  private addToken(type: TokenType, value: string) {
    this.tokens.push({ type, value, line: this.line, column: this.column - value.length });
  }
}
