import type MarkdownIt from 'markdown-it'
import MarkdownItConstructor from 'markdown-it'
import hljs from 'highlight.js'

let mdInstance: MarkdownIt | null = null

// 统一的 ID 生成函数
function generateHeadingId(text: string, index: number): string {
  // 移除 Markdown 格式符号（链接、加粗等）
  let cleanText = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接
    .replace(/[*_`~#]+/g, '') // 格式符号
    .trim()

  // 生成 base ID：保留中文、字母、数字、连字符
  let baseId = cleanText
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5-]/g, '-') // 非有效字符替换为连字符
    .replace(/-+/g, '-') // 多个连字符合并
    .replace(/^-|-$/g, '') // 移除首尾连字符
    .trim()

  // 如果为空，使用索引
  if (!baseId) {
    baseId = `heading-${index}`
  }

  return baseId
}

export function useMarkdown() {
  if (!mdInstance) {
    mdInstance = new MarkdownItConstructor({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true,
      highlight: (str: string, lang: string) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            const highlighted = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
            return `<pre class="hljs"><code class="language-${lang}">${highlighted}</code></pre>`
          } catch {
            // Fall through to default
          }
        }
        return `<pre class="hljs"><code>${mdInstance?.utils.escapeHtml(str) || str}</code></pre>`
      }
    })

    // Enable linkify for auto-linking URLs
    mdInstance.linkify.set({ fuzzyLink: false })

    // 添加 heading_open 规则为标题添加 ID
    const defaultHeadingOpen = mdInstance.renderer.rules.heading_open || function (tokens, idx, options, _env, self) {
      return self.renderToken(tokens, idx, options)
    }

    // 用于跟踪已使用的 ID（处理重复）
    const usedIds = new Map<string, number>()

    mdInstance.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
      const token = tokens[idx]

      // 获取标题内容：查找下一个 inline token
      let headingText = ''
      for (let i = idx + 1; i < tokens.length; i++) {
        if (tokens[i].type === 'inline') {
          headingText = tokens[i].content || ''
          break
        }
        if (tokens[i].type === 'heading_close') break
      }

      // 生成唯一 ID
      const baseId = generateHeadingId(headingText, idx)
      const count = usedIds.get(baseId) || 0
      const uniqueId = count === 0 ? baseId : `${baseId}-${count + 1}`

      usedIds.set(baseId, count + 1)
      token.attrSet('id', uniqueId)

      return defaultHeadingOpen(tokens, idx, options, env, self)
    }

    // 在每次渲染前重置 ID 计数
    const originalRender = mdInstance.render.bind(mdInstance)
    mdInstance.render = function (src: string, env?: unknown) {
      usedIds.clear()
      return originalRender(src, env)
    }
  }

  function render(content: string): string {
    if (!mdInstance) return ''
    return mdInstance.render(content)
  }

  function renderInline(content: string): string {
    if (!mdInstance) return ''
    return mdInstance.renderInline(content)
  }

  // 提取标题用于 TOC（使用与渲染相同的 ID 生成逻辑）
  function extractHeadings(content: string): Array<{ level: number; text: string; id: string }> {
    const headings: Array<{ level: number; text: string; id: string }> = []
    const regex = /^(#{1,6})\s+(.+)$/gm
    let match

    const usedIds = new Map<string, number>()

    while ((match = regex.exec(content)) !== null) {
      const level = match[1].length
      const rawText = match[2].trim()

      // 清理文本中的格式符号
      const text = rawText
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_`~#]+/g, '')
        .trim()

      // 生成唯一 ID（与渲染器逻辑一致）
      const baseId = generateHeadingId(rawText, match.index)
      const count = usedIds.get(baseId) || 0
      const uniqueId = count === 0 ? baseId : `${baseId}-${count + 1}`

      usedIds.set(baseId, count + 1)
      headings.push({ level, text, id: uniqueId })
    }

    return headings
  }

  return {
    render,
    renderInline,
    extractHeadings,
  }
}