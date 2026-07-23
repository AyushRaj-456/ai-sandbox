"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProjectFile, CompilerLog } from '../types';
import { loadWorkspace, saveWorkspace, clearWorkspace } from '../utils/storage';

interface ProjectContextType {
  files: ProjectFile[];
  activeFileId: string | null;
  openTabs: string[];
  logs: CompilerLog[];
  createFile: (name: string, content?: string, parentId?: string | null) => void;
  createFolder: (name: string, parentId?: string | null) => void;
  updateFile: (id: string, content: string) => void;
  deleteFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
  duplicateFile: (id: string) => void;
  duplicateNode: (id: string) => void;
  moveFileOrFolder: (id: string, newParentId: string | null) => void;
  setActiveFile: (id: string) => void;
  closeTab: (id: string) => void;
  addLog: (type: CompilerLog['type'], message: string) => void;
  clearLogs: () => void;
  loadProjectFiles: (newFiles: ProjectFile[]) => void;
}

const DEFAULT_FILES: ProjectFile[] = [
  {
    id: 'root-main',
    name: 'main.dex',
    type: 'file',
    content: `presentation {
    title: "Dextranic V2 Demo"
}

import "slides/intro.dex"
import "slides/architecture.dex"
import "slides/typography.dex"
`,
    parentId: null
  },
  {
    id: 'folder-slides',
    name: 'slides',
    type: 'folder',
    content: '',
    parentId: null
  },
  {
    id: 'file-intro',
    name: 'intro.dex',
    type: 'file',
    content: `slide {
    title: "Welcome to V2"
    bullets {
        "Multi-file projects"
        "Real IDE experience"
        "Advanced compiler"
    }
}
`,
    parentId: 'folder-slides'
  },
  {
    id: 'file-architecture',
    name: 'architecture.dex',
    type: 'file',
    content: `slide {
    title: "System Architecture"
    diagram flowchart {
        "Lexer & Parser" -> "Semantic Analyzer"
        "Semantic Analyzer" -> "PPTX Compiler"
    }
}
`,
    parentId: 'folder-slides'
  },
  {
    id: 'file-typography',
    name: 'typography.dex',
    type: 'file',
    content: `slide {
    title: "\\bold{Dextranic} \\color{F43F5E}{Rich Typography}"
    
    text {
        content: "Power of LaTeX + PowerPoint + Apple Keynote combined"
        font: "Poppins"
        size: "24"
        color: "#38BDF8"
        align: "center"
        shadow: "true"
    }

    bullets {
        "Dextranic supports standard **Markdown Shorthand** syntaxes!"
        "Easily write *italicized text*, **bold text**, or \`inline code\` interchangeably."
    }

    equation {
        formula: "E = mc^2"
    }

    code {
        language: "python"
        content: "def animate_slide():\\n    print('Beautiful presentation programmed!')"
    }
}
`,
    parentId: 'folder-slides'
  }
];

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<ProjectFile[]>(DEFAULT_FILES);
  const [activeFileId, setActiveFileId] = useState<string | null>('root-main');
  const [openTabs, setOpenTabs] = useState<string[]>(['root-main']);
  const [logs, setLogs] = useState<CompilerLog[]>([]);

  // Load from storage on mount
  useEffect(() => {
    const initWorkspace = async () => {
      let loaded = false;
      try {
        const state = await loadWorkspace();
        if (state && Array.isArray(state.files) && state.files.length > 0) {
          setFiles(state.files);
          setActiveFileId(state.activeFileId);
          setOpenTabs(state.openTabs || []);
          if (state.logs && state.logs.length > 0) {
            setLogs(state.logs);
          }
          loaded = true;
        }
      } catch (err) {
        console.error('IndexedDB load failed, falling back...', err);
      }

      if (!loaded) {
        const savedFiles = localStorage.getItem('dextranic_files_v2');
        if (savedFiles) {
          try {
            const parsed = JSON.parse(savedFiles);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFiles(parsed);
              const firstFile = parsed.find(f => f.type === 'file');
              if (firstFile) {
                setActiveFileId(firstFile.id);
                setOpenTabs([firstFile.id]);
              }
              loaded = true;
            }
          } catch (e) {}
        }
      }

      if (!loaded) {
        setFiles(DEFAULT_FILES);
        setActiveFileId('root-main');
        setOpenTabs(['root-main']);
      }
      
      addLog('info', 'Dextranic Presentation IDE Workspace initialized.');
    };
    initWorkspace();
  }, []);

  // Save to IndexedDB when files, tabs, or logs change
  useEffect(() => {
    if (files === DEFAULT_FILES) return;
    const saveState = async () => {
      await saveWorkspace({
        files,
        activeFileId,
        openTabs,
        logs
      });
      // Fallback mirror to localStorage for extra redundancy
      localStorage.setItem('dextranic_files_v2', JSON.stringify(files));
    };
    saveState();
  }, [files, activeFileId, openTabs, logs]);

  // Hydrate files tree on external workspace restore trigger (ZIP uploads)
  useEffect(() => {
    const handleRestore = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && Array.isArray(customEvent.detail.files)) {
        const newFiles = customEvent.detail.files;
        setFiles(newFiles);
        const mainOrFirstCode = newFiles.find((f: any) => f.type === 'file' && f.name === 'main.dex') || newFiles.find((f: any) => f.type === 'file');
        if (mainOrFirstCode) {
          setActiveFileId(mainOrFirstCode.id);
          setOpenTabs([mainOrFirstCode.id]);
        } else {
          setActiveFileId(null);
          setOpenTabs([]);
        }
        addLog('success', `Hydrated project workspace with ${newFiles.length} items from ZIP package!`);
      }
    };
    window.addEventListener('ide-restore-workspace-files', handleRestore);
    return () => window.removeEventListener('ide-restore-workspace-files', handleRestore);
  }, []);

  const createFile = (name: string, content: string = '', parentId: string | null = null) => {
    const hasExtension = name.includes('.');
    const finalName = hasExtension ? name : `${name}.dex`;
    const newFile: ProjectFile = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: finalName,
      content,
      type: 'file',
      parentId
    };
    setFiles(prev => [...prev, newFile]);
    setOpenTabs(prev => [...prev, newFile.id]);
    setActiveFileId(newFile.id);
    addLog('success', `Created file: ${finalName}`);
  };

  const createFolder = (name: string, parentId: string | null = null) => {
    const newFolder: ProjectFile = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name,
      content: '',
      type: 'folder',
      parentId
    };
    setFiles(prev => [...prev, newFolder]);
    addLog('success', `Created folder: ${name}`);
  };

  const updateFile = (id: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));
  };

  const deleteFile = (id: string) => {
    const fileToDelete = files.find(f => f.id === id);
    if (!fileToDelete) return;

    if (fileToDelete.type === 'folder') {
      // Recursively delete all children
      const deleteRecursive = (folderId: string, allFiles: ProjectFile[]): string[] => {
        let idsToDelete = [folderId];
        const children = allFiles.filter(f => f.parentId === folderId);
        children.forEach(child => {
          if (child.type === 'folder') {
            idsToDelete.push(...deleteRecursive(child.id, allFiles));
          } else {
            idsToDelete.push(child.id);
          }
        });
        return idsToDelete;
      };

      const allIdsToDelete = deleteRecursive(id, files);
      setFiles(prev => prev.filter(f => !allIdsToDelete.includes(f.id)));
      allIdsToDelete.forEach(childId => closeTab(childId));
      addLog('warning', `Deleted folder "${fileToDelete.name}" and all of its contents.`);
    } else {
      setFiles(prev => prev.filter(f => f.id !== id));
      closeTab(id);
      addLog('warning', `Deleted file: ${fileToDelete.name}`);
    }
  };

  const renameFile = (id: string, newName: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        const adjustedName = f.type === 'file' 
          ? (newName.endsWith('.dex') ? newName : `${newName}.dex`)
          : newName;
        return { ...f, name: adjustedName };
      }
      return f;
    }));
    addLog('info', `Renamed node to: ${newName}`);
  };

  // Deprecated in favor of duplicateNode but kept for interface compatibility
  const duplicateFile = (id: string) => {
    duplicateNode(id);
  };

  const duplicateNode = (id: string) => {
    const node = files.find(f => f.id === id);
    if (!node) return;

    const duplicateRecursive = (originalNode: ProjectFile, newParentId: string | null): ProjectFile[] => {
      const newId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      const clonedNode: ProjectFile = {
        ...originalNode,
        id: newId,
        name: originalNode.type === 'file' 
          ? originalNode.name.replace(/\.dex$/, '') + '_copy.dex'
          : originalNode.name + '_copy',
        parentId: newParentId
      };

      let clones = [clonedNode];
      if (originalNode.type === 'folder') {
        const children = files.filter(f => f.parentId === originalNode.id);
        children.forEach(child => {
          clones.push(...duplicateRecursive(child, newId));
        });
      }
      return clones;
    };

    const clones = duplicateRecursive(node, node.parentId || null);
    setFiles(prev => [...prev, ...clones]);
    
    const firstClonedFile = clones.find(f => f.type === 'file');
    if (firstClonedFile) {
      setOpenTabs(prev => [...prev, firstClonedFile.id]);
      setActiveFileId(firstClonedFile.id);
    }
    
    addLog('success', `Duplicated "${node.name}"`);
  };

  const moveFileOrFolder = (id: string, newParentId: string | null) => {
    // Avoid cyclic parenting
    if (id === newParentId) return;
    
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, parentId: newParentId };
      }
      return f;
    }));
    addLog('info', `Moved item inside folder.`);
  };

  const setActiveFile = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file && file.type === 'folder') return; // Cannot open folders as tabs

    if (!openTabs.includes(id)) {
      setOpenTabs(prev => [...prev, id]);
    }
    setActiveFileId(id);
  };

  const closeTab = (id: string) => {
    setOpenTabs(prev => {
      const newTabs = prev.filter(t => t !== id);
      if (activeFileId === id) {
        setActiveFileId(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
      }
      return newTabs;
    });
  };

  const addLog = (type: CompilerLog['type'], message: string) => {
    setLogs(prev => [...prev, { id: Date.now().toString() + Math.random(), type, message, timestamp: Date.now() }]);
  };

  const clearLogs = () => setLogs([]);

  const loadProjectFiles = (newFiles: ProjectFile[]) => {
    setFiles(newFiles);
    const mainOrFirstCode = newFiles.find(f => f.type === 'file' && f.name === 'main.dex') || newFiles.find(f => f.type === 'file');
    if (mainOrFirstCode) {
      setActiveFileId(mainOrFirstCode.id);
      setOpenTabs([mainOrFirstCode.id]);
    } else {
      setActiveFileId(null);
      setOpenTabs([]);
    }
  };

  return (
    <ProjectContext.Provider value={{
      files, activeFileId, openTabs, logs,
      createFile, createFolder, updateFile, deleteFile, renameFile, duplicateFile, duplicateNode, moveFileOrFolder, setActiveFile, closeTab, addLog, clearLogs, loadProjectFiles
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectProvider");
  return context;
};
