import { defineStore } from 'pinia'
import { ref } from 'vue'

interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  fontSize: number
  lineHeight: number
  sidebarWidth: number
  showToc: boolean
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({
    theme: 'light',
    fontSize: 16,
    lineHeight: 1.75,
    sidebarWidth: 240,
    showToc: true,
  })

  function updateSettings(newSettings: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...newSettings }
    // Persist to storage
    saveSettings()
  }

  function saveSettings() {
    // Will use Tauri store plugin when ready
    localStorage.setItem('md-reader-settings', JSON.stringify(settings.value))
  }

  function loadSettings() {
    const saved = localStorage.getItem('md-reader-settings')
    if (saved) {
      settings.value = { ...settings.value, ...JSON.parse(saved) }
    }
  }

  return {
    settings,
    updateSettings,
    loadSettings,
  }
})