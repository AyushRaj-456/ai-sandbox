import { Lexer, Token, TokenType } from './lexer';
import { ASTNode, PresentationNode, SlideNode, ThemeNode, TextNode, ImageNode, VideoNode, BulletsNode, SlideElementNode } from './ast';

export class Parser {
  private tokens: Token[] = [];
  private pos: number = 0;

  constructor(private input: string) {
    const lexer = new Lexer(input);
    this.tokens = lexer.tokenize();
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    return this.tokens[this.pos++];
  }

  private match(type: TokenType): boolean {
    if (this.peek().type === type) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(type: TokenType, errorMessage: string): Token {
    if (this.peek().type === type) {
      return this.advance();
    }
    throw new Error(`Parse Error at line ${this.peek().line}, col ${this.peek().column}: ${errorMessage}. Found ${this.peek().type}`);
  }

  public parse(): PresentationNode {
    const root: PresentationNode = {
      type: 'Presentation',
      properties: {},
      children: []
    };

    while (this.peek().type !== TokenType.EOF) {
      const token = this.peek();

      if (token.type === TokenType.IDENTIFIER && token.value === 'presentation') {
        this.advance();
        this.expect(TokenType.LBRACE, "Expected '{' after presentation");
        root.properties = this.parseProperties();
      } else if (token.type === TokenType.IDENTIFIER && token.value === 'theme') {
        this.advance();
        this.expect(TokenType.LBRACE, "Expected '{' after theme");
        root.children.push({
          type: 'Theme',
          properties: this.parseProperties()
        });
      } else if (token.type === TokenType.IDENTIFIER && token.value === 'import') {
        this.advance();
        const path = this.expect(TokenType.STRING, "Expected string path after import").value;
        root.children.push({ type: 'Import', path });
      } else if (token.type === TokenType.IDENTIFIER && token.value === 'component') {
        this.advance();
        const name = this.expect(TokenType.IDENTIFIER, "Expected component name").value;
        this.expect(TokenType.LBRACE, "Expected '{' after component name");
        root.children.push({
          type: 'ComponentDef',
          name,
          children: this.parseSlideElements()
        });
      } else if (token.type === TokenType.IDENTIFIER && token.value === 'slide') {
        this.advance();
        this.expect(TokenType.LBRACE, "Expected '{' after slide");
        const slideElements = this.parseSlideElements();
        
        // Extract properties (like title) from elements to put in slide properties, if we want to keep it simple,
        // Actually, slide properties are mixed with children. Let's separate them.
        const properties: Record<string, string> = {};
        const children: SlideElementNode[] = [];
        
        slideElements.forEach(el => {
           if ((el as any).isProperty) {
             properties[(el as any).key] = (el as any).value;
           } else {
             children.push(el);
           }
        });

        root.children.push({ type: 'Slide', properties, children });
      } else {
        // Skip unknown top-level tokens for now to avoid crashing
        this.advance();
      }
    }

    return root;
  }

  private parseProperties(): Record<string, string> {
    const props: Record<string, string> = {};
    while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
      const key = this.expect(TokenType.IDENTIFIER, "Expected property key").value;
      this.expect(TokenType.COLON, "Expected ':' after property key");
      
      const valToken = this.advance();
      if (valToken.type === TokenType.STRING || valToken.type === TokenType.IDENTIFIER) {
        props[key] = valToken.value;
      } else {
        throw new Error(`Parse Error: Expected value after ':', found ${valToken.type}`);
      }
    }
    this.expect(TokenType.RBRACE, "Expected '}' to close block");
    return props;
  }

  private parseSlideElements(): any[] {
    const elements: any[] = [];

    while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
      const token = this.peek();
      
      if (token.type === TokenType.IDENTIFIER) {
        const key = token.value;
        this.advance();

        if (key === 'use') {
          const name = this.expect(TokenType.IDENTIFIER, "Expected component name after use").value;
          elements.push({ type: 'Use', name });
          continue;
        }

        if (key === 'diagram') {
          const diagramType = this.expect(TokenType.IDENTIFIER, "Expected diagram type").value;
          this.expect(TokenType.LBRACE, "Expected '{' after diagram type");
          elements.push(this.parseDiagram(diagramType));
          continue;
        }

        // If next is a colon, it's a slide property (like title: "Intro")
        if (this.match(TokenType.COLON)) {
          const valToken = this.advance();
          elements.push({ isProperty: true, key, value: valToken.value });
        } 
        // If next is '{', it's a nested block (like image { ... } or bullets { ... })
        else if (this.match(TokenType.LBRACE)) {
          if (key === 'image') {
            elements.push(this.parseImage());
          } else if (key === 'video') {
            elements.push(this.parseVideo());
          } else if (key === 'bullets') {
            elements.push(this.parseBullets());
          } else if (key === 'text') {
            const props = this.parseProperties();
            elements.push({ type: 'Text', text: props.content || '', properties: props });
          } else if (key === 'code') {
            elements.push({ type: 'Code', properties: this.parseProperties() });
          } else if (key === 'equation') {
            elements.push({ type: 'Equation', properties: this.parseProperties() });
          } else if (key === 'table') {
            elements.push({ type: 'Table', properties: this.parseProperties() });
          } else if (key === 'chart') {
            elements.push({ type: 'Chart', properties: this.parseProperties() });
          } else {
            // unknown block, skip it
            this.parseProperties(); // generic property parsing consumes until RBRACE
          }
        }
      } else {
        this.advance(); // error recovery
      }
    }

    this.expect(TokenType.RBRACE, "Expected '}' to close block");
    return elements;
  }

  private parseDiagram(diagramType: string): any {
    const edges = [];
    while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
      let fromToken = this.advance();
      if (fromToken.type !== TokenType.STRING && fromToken.type !== TokenType.IDENTIFIER) {
        continue;
      }
      this.expect(TokenType.ARROW, "Expected '->' in diagram");
      let toToken = this.advance();
      if (toToken.type !== TokenType.STRING && toToken.type !== TokenType.IDENTIFIER) {
        continue;
      }
      edges.push({ from: fromToken.value, to: toToken.value });
    }
    this.expect(TokenType.RBRACE, "Expected '}' to close diagram block");
    return { type: 'Diagram', diagramType, edges };
  }

  private parseImage(): ImageNode {
    const props = this.parseProperties();
    return {
      type: 'Image',
      src: props.src || '',
      properties: props
    };
  }

  private parseVideo(): VideoNode {
    const props = this.parseProperties();
    return {
      type: 'Video',
      src: props.src || '',
      properties: props
    };
  }

  private parseBullets(): BulletsNode {
    const items: string[] = [];
    while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
      const token = this.advance();
      if (token.type === TokenType.STRING || token.type === TokenType.IDENTIFIER) {
        items.push(token.value);
      }
    }
    this.expect(TokenType.RBRACE, "Expected '}' to close bullets block");
    return { type: 'Bullets', items };
  }
}
