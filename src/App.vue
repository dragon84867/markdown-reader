<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import AppHeader from './components/common/AppHeader.vue'
import AppSidebar from './components/common/AppSidebar.vue'
import MarkdownReader from './components/reader/MarkdownReader.vue'
import { useFileSystem, type FileNode } from './composables/useFileSystem'
import { useTheme } from './composables/useTheme'
import { useSettingsStore } from './stores/settingsStore'
import { useReaderStore } from './stores/readerStore'

const { fileTree, fileContent, currentFile, readFile, expandDirectory } = useFileSystem()
const { setTheme } = useTheme()
const settingsStore = useSettingsStore()
const readerStore = useReaderStore()

const sidebarCollapsed = ref(false)

let unlistenFileOpen: (() => void) | null = null

onMounted(async () => {
  settingsStore.loadSettings()
  readerStore.loadData()
  setTheme(settingsStore.settings.theme)

  try {
    unlistenFileOpen = await listen<string>('file-open-request', (event) => {
      const path = event.payload
      if (path.toLowerCase().endsWith('.md')) {
        readFile(path)
      }
    })
  } catch (e) {
    console.error('Failed to setup file-open listener:', e)
  }

  try {
    const path = await invoke<string | null>('get_pending_file')
    if (path) {
      readFile(path)
    }
  } catch (e) {
    console.error('Failed to get pending file:', e)
  }
})

onUnmounted(() => {
  if (unlistenFileOpen) unlistenFileOpen()
})

function handleFileSelect(path: string) {
  readFile(path)
}

async function handleExpand(path: string) {
  const children = await expandDirectory(path)
  if (children) {
    updateNodeChildren(fileTree.value, path, children)
  }
}

function updateNodeChildren(nodes: FileNode[], targetPath: string, newChildren: FileNode[]): boolean {
  for (const node of nodes) {
    if (node.path === targetPath) {
      node.children = newChildren
      node.loaded = true
      return true
    }
    if (node.children?.length) {
      if (updateNodeChildren(node.children, targetPath, newChildren)) {
        return true
      }
    }
  }
  return false
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="app-container">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    <div class="main-content">
      <AppSidebar
        :files="fileTree"
        :current-path="currentFile"
        :collapsed="sidebarCollapsed"
        @select="handleFileSelect"
        @expand="handleExpand"
      />
      <MarkdownReader
        :content="fileContent"
        :file-path="currentFile"
      />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg);
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>