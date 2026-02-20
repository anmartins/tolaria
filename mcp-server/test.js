import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { readNote, createNote, searchNotes, appendToNote, findMarkdownFiles } from './vault.js'

let tmpDir

before(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'laputa-mcp-test-'))

  // Create test vault structure
  await fs.mkdir(path.join(tmpDir, 'project'), { recursive: true })
  await fs.mkdir(path.join(tmpDir, 'note'), { recursive: true })

  await fs.writeFile(path.join(tmpDir, 'project', 'test-project.md'), `---
title: Test Project
is_a: Project
status: Active
---

# Test Project

This is a test project for the MCP server.
`)

  await fs.writeFile(path.join(tmpDir, 'note', 'daily-log.md'), `---
title: Daily Log
is_a: Note
---

# Daily Log

Today I worked on the MCP server implementation.
`)
})

after(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('findMarkdownFiles', () => {
  it('should find all .md files recursively', async () => {
    const files = await findMarkdownFiles(tmpDir)
    assert.equal(files.length, 2)
    assert.ok(files.some(f => f.endsWith('test-project.md')))
    assert.ok(files.some(f => f.endsWith('daily-log.md')))
  })
})

describe('readNote', () => {
  it('should read a note by relative path', async () => {
    const content = await readNote(tmpDir, 'project/test-project.md')
    assert.ok(content.includes('Test Project'))
    assert.ok(content.includes('is_a: Project'))
  })

  it('should throw for missing notes', async () => {
    await assert.rejects(
      () => readNote(tmpDir, 'nonexistent.md'),
      { code: 'ENOENT' }
    )
  })
})

describe('createNote', () => {
  it('should create a note with frontmatter', async () => {
    const absPath = await createNote(tmpDir, 'note/new-note.md', 'My New Note', { is_a: 'Note' })
    assert.ok(absPath.endsWith('new-note.md'))

    const content = await fs.readFile(absPath, 'utf-8')
    assert.ok(content.includes('title: My New Note'))
    assert.ok(content.includes('is_a: Note'))
    assert.ok(content.includes('# My New Note'))
  })

  it('should create parent directories', async () => {
    const absPath = await createNote(tmpDir, 'deep/nested/dir/note.md', 'Deep Note')
    const content = await fs.readFile(absPath, 'utf-8')
    assert.ok(content.includes('# Deep Note'))
  })
})

describe('searchNotes', () => {
  it('should find notes matching title', async () => {
    const results = await searchNotes(tmpDir, 'Test Project')
    assert.ok(results.length >= 1)
    assert.equal(results[0].title, 'Test Project')
  })

  it('should find notes matching content', async () => {
    const results = await searchNotes(tmpDir, 'MCP server')
    assert.ok(results.length >= 1)
  })

  it('should return empty for no matches', async () => {
    const results = await searchNotes(tmpDir, 'xyzzy-nonexistent-12345')
    assert.equal(results.length, 0)
  })

  it('should respect limit', async () => {
    const results = await searchNotes(tmpDir, 'note', 1)
    assert.ok(results.length <= 1)
  })
})

describe('appendToNote', () => {
  it('should append text to a note', async () => {
    await appendToNote(tmpDir, 'note/daily-log.md', '## Evening Update\nFinished testing.')
    const content = await readNote(tmpDir, 'note/daily-log.md')
    assert.ok(content.includes('## Evening Update'))
    assert.ok(content.includes('Finished testing.'))
  })
})
