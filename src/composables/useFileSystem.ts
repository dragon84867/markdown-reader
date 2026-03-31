import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

export interface FileNode {
  name: string
  path: string
  isDir: boolean
  children?: FileNode[]
  loaded?: boolean // 标记子目录是否已加载
}

export interface SearchResult {
  path: string
  name: string
  snippet: string
  line: number
}

const currentFile = ref<string | null>(null)
const fileContent = ref<string>('')
const fileTree = ref<FileNode[]>([])
const currentFolder = ref<string | null>(null)
const isLoading = ref(false)
const loadedDirs = ref<Map<string, FileNode[]>>(new Map())

export function useFileSystem() {
  // Open a single file
  async function openFile(): Promise<void> {
    isLoading.value = true
    try {
      const selected = await open({
        multiple: false
      })

      if (selected && typeof selected === 'string') {
        currentFile.value = selected
        fileContent.value = await invoke<string>('read_file', { path: selected })
      }
    } catch (error) {
      console.error('Failed to open file:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Open a folder and scan for markdown files
  async function openFolder(): Promise<void> {
    isLoading.value = true
    try {
      const selected = await open({
        directory: true,
        multiple: false
      })

      if (selected === null) return

      if (typeof selected === 'string') {
        currentFolder.value = selected
        const tree = await invoke<FileNode[]>('scan_directory', { path: selected })
        if (tree && tree.length > 0) {
          fileTree.value = markLoaded(tree, false)
          loadedDirs.value.set(selected, fileTree.value)
        } else {
          fileTree.value = []
        }
      }
    } catch (error) {
      console.error('Failed to open folder:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Mark nodes as loaded or not
  function markLoaded(nodes: FileNode[], loaded: boolean): FileNode[] {
    return nodes.map(node => ({
      ...node,
      loaded: node.isDir ? loaded : true,
      children: node.isDir ? (loaded ? node.children : []) : undefined
    }))
  }

  // Expand a directory and load its contents
  async function expandDirectory(path: string): Promise<FileNode[] | null> {
    // Check if already loaded
    if (loadedDirs.value.has(path)) {
      return loadedDirs.value.get(path) || null
    }

    try {
      const children = await invoke<FileNode[]>('scan_directory', { path })
      const markedChildren = markLoaded(children, false)
      loadedDirs.value.set(path, markedChildren)
      return markedChildren
    } catch (error) {
      console.error('Failed to expand directory:', error)
      return null
    }
  }

  // Read file by path
  async function readFile(path: string): Promise<void> {
    isLoading.value = true
    try {
      currentFile.value = path
      fileContent.value = await invoke<string>('read_file', { path })
    } catch (error) {
      console.error('Failed to read file:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Search files
  async function searchFiles(query: string, directory?: string): Promise<SearchResult[]> {
    if (!query.trim()) return []

    try {
      return await invoke<SearchResult[]>('search_files', {
        query,
        directory: directory || currentFolder.value || null
      })
    } catch (error) {
      console.error('Search failed:', error)
      return []
    }
  }

  const fileName = computed(() => {
    if (!currentFile.value) return null
    return currentFile.value.split('/').pop() || currentFile.value
  })

  return {
    currentFile,
    fileContent,
    fileTree,
    currentFolder,
    isLoading,
    fileName,
    openFile,
    openFolder,
    readFile,
    searchFiles,
    expandDirectory,
  }
}