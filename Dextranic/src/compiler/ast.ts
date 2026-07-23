export type NodeType = 'Presentation' | 'Theme' | 'Slide' | 'Text' | 'Image' | 'Video' | 'Bullets' | 'Import' | 'ComponentDef' | 'Use' | 'Diagram' | 'Code' | 'Equation' | 'Table' | 'Chart';

export interface ASTNode {
  type: NodeType;
}

export interface PresentationNode extends ASTNode {
  type: 'Presentation';
  properties: Record<string, string>;
  children: (ThemeNode | SlideNode | ImportNode | ComponentDefNode)[];
}

export interface ImportNode extends ASTNode {
  type: 'Import';
  path: string;
}

export interface ComponentDefNode extends ASTNode {
  type: 'ComponentDef';
  name: string;
  children: SlideElementNode[];
}

export interface ThemeNode extends ASTNode {
  type: 'Theme';
  properties: Record<string, string>;
}

export interface SlideNode extends ASTNode {
  type: 'Slide';
  properties: Record<string, string>;
  children: SlideElementNode[];
  sourceFile?: string;
}

export type SlideElementNode = TextNode | ImageNode | VideoNode | BulletsNode | UseNode | DiagramNode | CodeNode | EquationNode | TableNode | ChartNode;

export interface UseNode extends ASTNode {
  type: 'Use';
  name: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
}

export interface DiagramNode extends ASTNode {
  type: 'Diagram';
  diagramType: string;
  edges: DiagramEdge[];
}

export interface TextNode extends ASTNode {
  type: 'Text';
  text: string;
  properties: Record<string, string>;
}

export interface ImageNode extends ASTNode {
  type: 'Image';
  src: string;
  properties: Record<string, string>;
}

export interface VideoNode extends ASTNode {
  type: 'Video';
  src: string;
  properties: Record<string, string>;
}

export interface BulletsNode extends ASTNode {
  type: 'Bullets';
  items: string[];
}

export interface CodeNode extends ASTNode {
  type: 'Code';
  properties: Record<string, string>;
}

export interface EquationNode extends ASTNode {
  type: 'Equation';
  properties: Record<string, string>;
}

export interface TableNode extends ASTNode {
  type: 'Table';
  properties: Record<string, string>;
}

export interface ChartNode extends ASTNode {
  type: 'Chart';
  properties: Record<string, string>;
}
