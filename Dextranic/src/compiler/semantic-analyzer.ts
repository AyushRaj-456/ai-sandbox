import { PresentationNode, SlideNode, ThemeNode, ComponentDefNode, SlideElementNode } from './ast';
import { ProjectFile } from '../types';
import { Parser } from './parser';

export class SemanticAnalyzer {
  private componentRegistry = new Map<string, SlideElementNode[]>();
  private parsedFiles = new Set<string>();

  constructor(private allFiles: ProjectFile[]) {}

  public analyze(mainFileName: string, mainContent: string): PresentationNode {
    const rootAst = this.parseAndExtract(mainFileName, mainContent);
    return this.expandComponents(rootAst);
  }

  private parseAndExtract(fileName: string, content: string): PresentationNode {
    if (this.parsedFiles.has(fileName)) {
      throw new Error(`Circular import detected: ${fileName}`);
    }
    this.parsedFiles.add(fileName);

    const parser = new Parser(content);
    const ast = parser.parse();

    ast.children.forEach(child => {
      if (child.type === 'Slide') {
        child.sourceFile = fileName;
      }
    });

    const newChildren: any[] = [];

    ast.children.forEach(child => {
      if (child.type === 'Import') {
        // Resolve file full paths recursively
        const getFileFullPath = (file: ProjectFile, allFiles: ProjectFile[]): string => {
          const parts = [file.name];
          let curr = file;
          while (curr.parentId) {
            const parent = allFiles.find(f => f.id === curr.parentId);
            if (!parent) break;
            parts.unshift(parent.name);
            curr = parent;
          }
          return parts.join('/');
        };

        const importedFile = this.allFiles.find(f => getFileFullPath(f, this.allFiles) === child.path);
        if (!importedFile) {
          throw new Error(`Import Error: Could not find file '${child.path}'`);
        }
        // Recursively parse imported file
        const importedAst = this.parseAndExtract(importedFile.name, importedFile.content);
        // Merge theme and slides
        importedAst.children.forEach(c => newChildren.push(c));
      } else if (child.type === 'ComponentDef') {
        // Register component and do not add to final presentation children
        this.componentRegistry.set(child.name, child.children);
      } else {
        newChildren.push(child);
      }
    });

    ast.children = newChildren;
    return ast;
  }

  private expandComponents(ast: PresentationNode): PresentationNode {
    ast.children.forEach(child => {
      if (child.type === 'Slide') {
        const expandedElements: SlideElementNode[] = [];
        
        child.children.forEach(el => {
          if (el.type === 'Use') {
            const compChildren = this.componentRegistry.get(el.name);
            if (!compChildren) {
              throw new Error(`Semantic Error: Component '${el.name}' used but not defined`);
            }
            // Inject component children
            expandedElements.push(...compChildren);
          } else {
            expandedElements.push(el);
          }
        });

        child.children = expandedElements;
      }
    });

    return ast;
  }
}
