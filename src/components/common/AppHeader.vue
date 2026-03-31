<script setup lang="ts">
import { computed } from 'vue'
import { useFileSystem } from '../../composables/useFileSystem'
import { useTheme } from '../../composables/useTheme'

const emit = defineEmits<{
  toggleSidebar: []
}>()

const { openFile, openFolder, isLoading } = useFileSystem()
const { effectiveTheme, toggleTheme } = useTheme()

const themeIcon = computed(() => effectiveTheme.value === 'dark' ? '☀️' : '🌙')
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button class="icon-btn sidebar-toggle" @click="emit('toggleSidebar')" title="切换侧边栏">
        ☰
      </button>
      <span class="logo">📚 MD Reader</span>
    </div>

    <div class="header-right">
      <button class="icon-btn" @click="toggleTheme" title="切换主题">
        {{ themeIcon }}
      </button>
      <button class="icon-btn" @click="openFile" title="打开文件" :disabled="isLoading">
        📄
      </button>
      <button class="icon-btn" @click="openFolder" title="打开文件夹" :disabled="isLoading">
        📁
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  height: 48px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text);
}

.sidebar-toggle {
  font-size: 1.25rem;
  padding: 0.25rem 0.5rem;
  margin-right: 0.5rem;
}

.header-right {
  display: flex;
  gap: 0.25rem;
}

.icon-btn {
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  font-size: 1.1rem;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover:not(:disabled) {
  background: var(--color-border);
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>