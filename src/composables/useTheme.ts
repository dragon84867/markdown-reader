import { ref, computed, watch } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

const theme = ref<Theme>('light')

// Get system preference
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Apply theme to document
function applyTheme(value: 'light' | 'dark') {
  if (typeof document === 'undefined') return

  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(value)
}

// Initialize theme
export function useTheme() {
  const effectiveTheme = computed(() => {
    return theme.value === 'system' ? getSystemTheme() : theme.value
  })

  // Watch for changes and apply
  watch(effectiveTheme, (value) => {
    applyTheme(value)
  }, { immediate: true })

  // Listen for system preference changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (theme.value === 'system') {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    })
  }

  function setTheme(newTheme: Theme) {
    theme.value = newTheme
  }

  function toggleTheme() {
    const current = effectiveTheme.value
    setTheme(current === 'light' ? 'dark' : 'light')
  }

  return {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
  }
}