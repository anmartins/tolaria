/**
 * Vault operations — file I/O for Laputa markdown vault.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Recursively find all .md files under a directory.
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
export async function findMarkdownFiles(dir) {
  const results = []
  const items = await fs.readdir(dir, { withFileTypes: true })
  for (const item of items) {
    if (item.name.startsWith('.')) continue
    const full = path.join(dir, item.name)
    if (item.isDirectory()) {
      results.push(...await findMarkdownFiles(full))
    } else if (item.name.endsWith('.md')) {
      results.push(full)
    }
  }
  return results
}

/**
 * Read a note's content by path (absolute or relative to vault).
 * @param {string} vaultPath
 * @param {string} notePath
 * @returns {Promise<string>}
 */
export async function readNote(vaultPath, notePath) {
  const absPath = path.isAbsolute(notePath) ? notePath : path.join(vaultPath, notePath)
  return fs.readFile(absPath, 'utf-8')
}

/**
 * Create a new note with optional frontmatter.
 * @param {string} vaultPath
 * @param {string} relativePath
 * @param {string} title
 * @param {Record<string, string>} [frontmatter]
 * @returns {Promise<string>} The absolute path of the created file.
 */
export async function createNote(vaultPath, relativePath, title, frontmatter = {}) {
  const absPath = path.join(vaultPath, relativePath)
  await fs.mkdir(path.dirname(absPath), { recursive: true })

  const fmEntries = { title, ...frontmatter }
  const fmLines = Object.entries(fmEntries)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const content = `---\n${fmLines}\n---\n\n# ${title}\n\n`
  await fs.writeFile(absPath, content, 'utf-8')
  return absPath
}

/**
 * Search notes by title or content substring.
 * @param {string} vaultPath
 * @param {string} query
 * @param {number} [limit=10]
 * @returns {Promise<Array<{path: string, title: string, snippet: string}>>}
 */
export async function searchNotes(vaultPath, query, limit = 10) {
  const files = await findMarkdownFiles(vaultPath)
  const q = query.toLowerCase()
  const results = []

  for (const filePath of files) {
    if (results.length >= limit) break
    const content = await fs.readFile(filePath, 'utf-8')
    const filename = path.basename(filePath, '.md')

    const titleMatch = extractTitle(content, filename)
    const matches = titleMatch.toLowerCase().includes(q) || content.toLowerCase().includes(q)

    if (matches) {
      const snippet = extractSnippet(content, q)
      results.push({
        path: path.relative(vaultPath, filePath),
        title: titleMatch,
        snippet,
      })
    }
  }

  return results
}

/**
 * Append text to the end of a note.
 * @param {string} vaultPath
 * @param {string} notePath
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function appendToNote(vaultPath, notePath, text) {
  const absPath = path.isAbsolute(notePath) ? notePath : path.join(vaultPath, notePath)
  const current = await fs.readFile(absPath, 'utf-8')
  const separator = current.endsWith('\n') ? '\n' : '\n\n'
  await fs.writeFile(absPath, current + separator + text + '\n', 'utf-8')
}

// --- Helpers ---

/**
 * Extract title from markdown content (first H1 or frontmatter title).
 * @param {string} content
 * @param {string} fallback
 * @returns {string}
 */
function extractTitle(content, fallback) {
  const h1Match = content.match(/^#\s+(.+)$/m)
  if (h1Match) return h1Match[1].trim()

  const titleMatch = content.match(/^title:\s*(.+)$/m)
  if (titleMatch) return titleMatch[1].trim()

  return fallback
}

/**
 * Extract a snippet around the query match.
 * @param {string} content
 * @param {string} query
 * @returns {string}
 */
function extractSnippet(content, query) {
  const body = content.replace(/^---[\s\S]*?---\n?/, '').trim()
  const idx = body.toLowerCase().indexOf(query)
  if (idx === -1) return body.slice(0, 120)
  const start = Math.max(0, idx - 40)
  const end = Math.min(body.length, idx + query.length + 80)
  return (start > 0 ? '...' : '') + body.slice(start, end) + (end < body.length ? '...' : '')
}
