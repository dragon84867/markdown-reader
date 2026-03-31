<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  minWidth?: number
  maxWidth?: number
  modelValue: number
}

const props = withDefaults(defineProps<Props>(), {
  minWidth: 180,
  maxWidth: 400
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

function handleMouseDown(e: MouseEvent) {
  e.preventDefault()
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = props.modelValue
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function handleMouseMove(e: MouseEvent) {
  if (!isResizing.value) return

  const delta = e.clientX - startX.value
  const newWidth = Math.max(
    props.minWidth,
    Math.min(props.maxWidth, startWidth.value + delta)
  )

  emit('update:modelValue', Math.round(newWidth))
}

function handleMouseUp() {
  if (isResizing.value) {
    isResizing.value = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
}

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div
    class="resize-handle"
    :class="{ active: isResizing }"
    @mousedown="handleMouseDown"
  />
</template>

<style scoped>
.resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background-color 0.15s;
  z-index: 10;
}

.resize-handle:hover,
.resize-handle.active {
  background: var(--color-primary);
  opacity: 0.5;
}

.resize-handle.active {
  opacity: 1;
}
</style>