<script lang="ts">
import { ref, h, defineComponent, PropType, VNode, computed } from 'vue'
import type { FileNode } from '../../composables/useFileSystem'
import { useSettingsStore } from '../../stores/settingsStore'
import ResizeHandle from './ResizeHandle.vue'

// 递归树节点组件
const TreeNode = defineComponent({
  name: 'TreeNode',
  props: {
    node: { type: Object as PropType<FileNode>, required: true },
    currentPath: { type: [String, null] as PropType<string | null>, default: null },
    expandedPaths: { type: Object as PropType<Set<string>>, required: true },
    depth: { type: Number, default: 0 }
  },
  emits: ['select', 'expand'],
  setup(props, { emit }): () => VNode {
    const handleClick = () => {
      if (props.node.isDir) {
        if (props.expandedPaths.has(props.node.path)) {
          props.expandedPaths.delete(props.node.path)
        } else {
          props.expandedPaths.add(props.node.path)
          if (!props.node.loaded && !props.node.children?.length) {
            emit('expand', props.node.path)
          }
        }
      } else {
        emit('select', props.node.path)
      }
    }

    const getFileIcon = (): string => {
      if (props.node.isDir) {
        return props.expandedPaths.has(props.node.path) ? '📂' : '📁'
      }
      // 根据文件扩展名返回不同图标
      const ext = props.node.name.toLowerCase().split('.').pop() || ''
      const iconMap: Record<string, string> = {
        'md': '📝',
        'markdown': '📝',
        'txt': '📄',
        'json': '📋',
        'yaml': '⚙️',
        'yml': '⚙️',
        'xml': '📄',
        'html': '🌐',
        'css': '🎨',
        'js': '📜',
        'ts': '📘',
        'vue': '💚',
        'py': '🐍',
        'rs': '🦀',
        'go': '🔷',
        'java': '☕',
        'c': '🔧',
        'cpp': '🔧',
        'h': '🔧',
        'sh': '💻',
        'bash': '💻',
        'zsh': '💻',
        'conf': '⚙️',
        'cfg': '⚙️',
        'ini': '⚙️',
        'log': '📋',
        'csv': '📊',
        'toml': '⚙️',
        'sql': '🗃️',
        'env': '🔐',
        'gitignore': '🙈',
        'dockerignore': '🐳'
      }
      return iconMap[ext] || '📄'
    }

    const isLoading = (): boolean => {
      return props.node.isDir && !props.node.loaded && !props.node.children?.length
    }

    return (): VNode => {
      const isExpanded = props.expandedPaths.has(props.node.path)
      const hasChildren = props.node.isDir && isExpanded && props.node.children?.length

      const children: VNode[] = []

      if (hasChildren) {
        children.push(
          h('ul', { class: 'children' },
            props.node.children!.map((child: FileNode) =>
              h(TreeNode, {
                key: child.path,
                node: child,
                currentPath: props.currentPath,
                expandedPaths: props.expandedPaths,
                depth: props.depth + 1,
                onSelect: (path: string) => emit('select', path),
                onExpand: (path: string) => emit('expand', path)
              })
            )
          )
        )
      }

      return h('li', { class: 'tree-node' }, [
        h('div', {
          class: ['node-item', {
            active: props.currentPath === props.node.path,
            'is-dir': props.node.isDir,
            'is-file': !props.node.isDir
          }],
          'data-depth': props.depth,
          onClick: handleClick
        }, [
          h('span', { class: ['expand-icon', { placeholder: !props.node.isDir }] },
            isLoading() ? '⏳' : (props.node.isDir ? (isExpanded ? '▼' : '▶') : '')
          ),
          h('span', { class: 'node-icon' }, getFileIcon()),
          h('span', { class: 'node-name' }, props.node.name)
        ]),
        ...children
      ])
    }
  }
})

export default {
  components: { TreeNode, ResizeHandle },
  props: {
    files: { type: Array as PropType<FileNode[]>, default: () => [] },
    currentPath: { type: [String, null] as PropType<string | null>, default: null },
    collapsed: { type: Boolean, default: false }
  },
  emits: ['select', 'expand'],
  setup() {
    const expandedPaths = ref<Set<string>>(new Set())
    const settingsStore = useSettingsStore()

    const sidebarWidth = computed({
      get: () => settingsStore.settings.sidebarWidth,
      set: (value) => settingsStore.updateSettings({ sidebarWidth: value })
    })

    return { expandedPaths, sidebarWidth }
  }
}
</script>

<template>
  <aside
    class="sidebar"
    :class="{ collapsed }"
    :style="{ width: collapsed ? '48px' : `${sidebarWidth}px` }"
  >
    <ResizeHandle
      v-if="!collapsed"
      v-model="sidebarWidth"
      :min-width="180"
      :max-width="400"
    />

    <div v-if="collapsed" class="sidebar-collapsed">
      <div class="collapsed-icon">📁</div>
    </div>

    <template v-else>
      <div class="sidebar-header">
        <span class="sidebar-title">文件目录</span>
      </div>

      <div class="sidebar-content">
        <div v-if="files.length === 0" class="empty-state">
          <div class="empty-icon">📁</div>
          <p>点击 📁 打开文件夹</p>
        </div>

        <ul v-else class="file-tree">
          <TreeNode
            v-for="node in files"
            :key="node.path"
            :node="node"
            :current-path="currentPath"
            :expanded-paths="expandedPaths"
            @select="$emit('select', $event)"
            @expand="$emit('expand', $event)"
          />
        </ul>
      </div>
    </template>
  </aside>
</template>

<style scoped>
.sidebar {
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: width 0.2s ease;
  position: relative;
  min-width: var(--sidebar-min-width);
  max-width: var(--sidebar-max-width);
}

.sidebar.collapsed {
  width: 48px;
  min-width: 48px;
  max-width: 48px;
}

.sidebar-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 1rem;
}

.collapsed-icon {
  font-size: 1.5rem;
  opacity: 0.5;
}

.sidebar-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.sidebar-title {
  font-weight: 600;
  font-size: var(--sidebar-title-size);
  color: var(--color-text);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: var(--sidebar-item-size);
  margin: 0;
}

.file-tree,
.children {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tree-node {
  margin: 2px 0;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

/* 使用 data-depth 属性实现缩进 */
.node-item[data-depth="0"] { padding-left: var(--sidebar-base-padding); }
.node-item[data-depth="1"] { padding-left: calc(var(--sidebar-base-padding) + var(--sidebar-indent-unit)); }
.node-item[data-depth="2"] { padding-left: calc(var(--sidebar-base-padding) + var(--sidebar-indent-unit) * 2); }
.node-item[data-depth="3"] { padding-left: calc(var(--sidebar-base-padding) + var(--sidebar-indent-unit) * 3); }
.node-item[data-depth="4"] { padding-left: calc(var(--sidebar-base-padding) + var(--sidebar-indent-unit) * 4); }
.node-item[data-depth="5"] { padding-left: calc(var(--sidebar-base-padding) + var(--sidebar-indent-unit) * 5); }

.node-item:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.node-item.active {
  background: var(--color-primary);
  color: white;
}

.node-item.active .node-name {
  color: white;
}

.node-item.is-dir {
  font-weight: 600;
}

.node-item.is-file {
  font-weight: 400;
}

.node-item.is-dir .node-name,
.node-item.is-file .node-name {
  color: var(--color-text-secondary);
}

.expand-icon {
  font-size: var(--sidebar-expand-icon-size);
  width: 0.8rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.expand-icon.placeholder {
  visibility: hidden;
}

.node-icon {
  font-size: var(--sidebar-icon-size);
  flex-shrink: 0;
  width: 1.25rem;
  text-align: center;
}

.node-name {
  font-size: var(--sidebar-item-size);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>