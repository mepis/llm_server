import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
})

export function markdownToHtml(markdown) {
  if (!markdown || typeof markdown !== 'string') return ''
  const rawHtml = md.render(markdown)
  return DOMPurify.sanitize(rawHtml)
}
