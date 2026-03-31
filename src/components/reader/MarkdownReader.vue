<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useMarkdown } from '../../composables/useMarkdown'
import { useReaderStore } from '../../stores/readerStore'

interface Props {
  content: string
  filePath?: string | null
}

const props = defineProps<Props>()
const { render, extractHeadings } = useMarkdown()
const readerStore = useReaderStore()

const containerRef = ref<HTMLElement | null>(null)
const showToc = ref(true)

// 判断是否为 Markdown 文件
const isMarkdownFile = computed(() => {
  if (!props.filePath) return true // 默认当作 markdown 处理
  const ext = props.filePath.toLowerCase().split('.').pop()
  return ext === 'md' || ext === 'markdown'
})

// Markdown 文件提取标题，非 md 文件标题为空
const headings = computed(() => isMarkdownFile.value ? extractHeadings(props.content) : [])

const activeHeading = ref<string | null>(null)

// Markdown 文件渲染 HTML，非 md 文件显示原文本（包裹在 pre 中）
const renderedContent = computed(() => {
  if (isMarkdownFile.value) {
    return render(props.content)
  }
  // 非 md 文件返回纯文本，使用 <pre> 标签包裹
  return `<pre class="plain-text">${escapeHtml(props.content)}</pre>`
})

// HTML 转义函数
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

watch(() => props.filePath, async () => {
  if (props.filePath && containerRef.value) {
    await nextTick()
    const savedPosition = readerStore.getProgress(props.filePath)
    containerRef.value.scrollTop = savedPosition
  }
}, { immediate: true })

let scrollTimeout: ReturnType<typeof setTimeout> | null = null
function handleScroll() {
  if (scrollTimeout) clearTimeout(scrollTimeout)

  scrollTimeout = setTimeout(() => {
    if (!containerRef.value || !props.filePath) return

    readerStore.saveProgress(props.filePath, containerRef.value.scrollTop)
    updateActiveHeading()
  }, 50)
}

function updateActiveHeading() {
  if (!containerRef.value) return

  const headingElements = containerRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const offset = 100

  let current: string | null = null

  for (let i = 0; i < headingElements.length; i++) {
    const el = headingElements[i]
    if (!(el instanceof HTMLElement)) continue

    const rect = el.getBoundingClientRect()
    const containerRect = containerRef.value.getBoundingClientRect()

    if (rect.top <= containerRect.top + offset) {
      current = el.getAttribute('id')
    }
  }

  activeHeading.value = current
}

function scrollToHeading(id: string) {
  if (!containerRef.value) return

  let el = document.getElementById(id)

  if (!el) {
    const escapedId = id.replace(/([.#$%&'()*+,/\\:;<=>?@[\]^`{|}~])/g, '\\$1')
    el = containerRef.value.querySelector(`#${escapedId}`) as HTMLElement | null
  }

  if (el && containerRef.value) {
    const containerRect = containerRef.value.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const currentScroll = containerRef.value.scrollTop
    const targetScroll = currentScroll + elRect.top - containerRect.top - 60

    containerRef.value.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    })

    activeHeading.value = id
  }
}

function toggleToc() {
  showToc.value = !showToc.value
}
</script>

<template>
  <div class="reader-container">
    <!-- TOC Panel -->
    <aside v-if="headings.length > 0 && showToc" class="toc-panel">
      <div class="toc-header">
        <span>目录</span>
        <button class="toc-toggle" @click="toggleToc" title="隐藏目录">✕</button>
      </div>
      <ul class="toc-list">
        <li
          v-for="h in headings"
          :key="h.id"
          :class="['toc-item', `level-${h.level}`, { active: activeHeading === h.id }]"
          @click="scrollToHeading(h.id)"
        >
          {{ h.text }}
        </li>
      </ul>
    </aside>

    <!-- Toggle button when TOC is hidden -->
    <button v-if="headings.length > 0 && !showToc" class="toc-show-btn" @click="toggleToc" title="显示目录">
      ☰
    </button>

    <!-- Content -->
    <main ref="containerRef" class="content-area" @scroll="handleScroll">
      <div v-if="!content" class="empty-content">
        <div class="empty-icon">📚</div>
        <p class="empty-title">打开文件开始阅读</p>
        <p class="empty-hint">使用 📄 打开单个文件 或 📁 打开文件夹</p>
      </div>
      <article v-else class="markdown-body" v-html="renderedContent"></article>
    </main>
  </div>
</template>

<style scoped>
.reader-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  background: var(--color-bg);
}

.toc-panel {
  width: 220px;
  min-width: 180px;
  max-width: 280px;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: var(--sidebar-title-size);
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.toc-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.toc-toggle:hover {
  opacity: 1;
}

.toc-list {
  list-style: none;
  padding: 0.5rem;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.toc-item {
  font-size: var(--sidebar-item-size);
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 2px 0;
}

.toc-item:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.toc-item.active {
  background: var(--color-primary);
  color: white;
}

/* 使用 CSS 变量统一缩进 */
.toc-item.level-1 {
  font-weight: 600;
  padding-left: var(--sidebar-base-padding);
}
.toc-item.level-2 {
  padding-left: calc(var(--sidebar-base-padding) + var(--sidebar-indent-unit));
}
.toc-item.level-3 {
  padding-left: calc(var(--sidebar-base-padding) + var(--sidebar-indent-unit) * 2);
  font-size: var(--sidebar-item-size-sm);
}
.toc-item.level-4 {
  padding-left: calc(var(--sidebar-base-padding) + var(--sidebar-indent-unit) * 3);
  font-size: var(--sidebar-item-size-sm);
}
.toc-item.level-5 {
  padding-left: calc(var(--sidebar-base-padding) + var(--sidebar-indent-unit) * 4);
  font-size: 0.7rem;
}
.toc-item.level-6 {
  padding-left: calc(var(--sidebar-base-padding) + var(--sidebar-indent-unit) * 5);
  font-size: 0.7rem;
}

.toc-show-btn {
  position: fixed;
  left: 1rem;
  top: 70px;
  width: 32px;
  height: 32px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  color: var(--color-text-secondary);
  transition: all 0.2s;
  z-index: 10;
}

.toc-show-btn:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.1rem;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.empty-hint {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Plain text display for non-md files */
.markdown-body .plain-text {
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  padding: 1.5rem;
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  overflow-x: auto;
}
</style>