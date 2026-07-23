export type FileType = 'file' | 'folder';

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  type: FileType;
  parentId?: string | null;
}

export interface CompilerLog {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: number;
}

export const isBinaryFile = (fileName: string): boolean => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'mp4', 'webm', 'ttf', 'otf', 'woff', 'woff2'].includes(ext || '');
};
