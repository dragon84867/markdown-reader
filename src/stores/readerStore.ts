import { defineStore } from 'pinia'
import { ref } from 'vue'

interface ReadingProgress {
  filePath: string
  scrollPosition: number
  lastReadTime: number
}

interface Annotation {
  id: string
  filePath: string
  text: string
  color: string
  note?: string
  createdAt: number
}

export const useReaderStore = defineStore('reader', () => {
  const progress = ref<Record<string, ReadingProgress>>({})
  const annotations = ref<Annotation[]>([])
  const bookmarks = ref<string[]>([])

  function saveProgress(filePath: string, scrollPosition: number) {
    progress.value[filePath] = {
      filePath,
      scrollPosition,
      lastReadTime: Date.now(),
    }
    persistProgress()
  }

  function getProgress(filePath: string): number {
    return progress.value[filePath]?.scrollPosition || 0
  }

  function addBookmark(filePath: string) {
    if (!bookmarks.value.includes(filePath)) {
      bookmarks.value.push(filePath)
      persistData()
    }
  }

  function removeBookmark(filePath: string) {
    bookmarks.value = bookmarks.value.filter(f => f !== filePath)
    persistData()
  }

  function addAnnotation(annotation: Annotation) {
    annotations.value.push(annotation)
    persistData()
  }

  function removeAnnotation(id: string) {
    annotations.value = annotations.value.filter(a => a.id !== id)
    persistData()
  }

  function persistProgress() {
    localStorage.setItem('md-reader-progress', JSON.stringify(progress.value))
  }

  function persistData() {
    localStorage.setItem('md-reader-annotations', JSON.stringify(annotations.value))
    localStorage.setItem('md-reader-bookmarks', JSON.stringify(bookmarks.value))
  }

  function loadData() {
    const savedProgress = localStorage.getItem('md-reader-progress')
    if (savedProgress) {
      progress.value = JSON.parse(savedProgress)
    }

    const savedAnnotations = localStorage.getItem('md-reader-annotations')
    if (savedAnnotations) {
      annotations.value = JSON.parse(savedAnnotations)
    }

    const savedBookmarks = localStorage.getItem('md-reader-bookmarks')
    if (savedBookmarks) {
      bookmarks.value = JSON.parse(savedBookmarks)
    }
  }

  return {
    progress,
    annotations,
    bookmarks,
    saveProgress,
    getProgress,
    addBookmark,
    removeBookmark,
    addAnnotation,
    removeAnnotation,
    loadData,
  }
})