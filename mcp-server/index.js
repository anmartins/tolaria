#!/usr/bin/env node
/**
 * Laputa MCP Server — provides vault operation tools for AI assistants.
 *
 * Usage:
 *   VAULT_PATH=/path/to/vault node index.js
 *
 * Tools:
 *   - open_note: Open and read a note by path
 *   - read_note: Read note content (alias for consistency)
 *   - create_note: Create a new note with title and optional frontmatter
 *   - search_notes: Search notes by title or content
 *   - append_to_note: Append text to an existing note
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { readNote, createNote, searchNotes, appendToNote } from './vault.js'

const VAULT_PATH = process.env.VAULT_PATH || process.env.HOME + '/Laputa'

const TOOLS = [
  {
    name: 'open_note',
    description: 'Open and read a note from the vault by its relative path',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path to the note (e.g. "project/my-project.md")' },
      },
      required: ['path'],
    },
  },
  {
    name: 'read_note',
    description: 'Read the full content of a note',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path to the note' },
      },
      required: ['path'],
    },
  },
  {
    name: 'create_note',
    description: 'Create a new note in the vault with a title and optional frontmatter',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path for the new note (e.g. "note/my-idea.md")' },
        title: { type: 'string', description: 'Title of the note' },
        is_a: { type: 'string', description: 'Entity type (Project, Note, Experiment, etc.)' },
      },
      required: ['path', 'title'],
    },
  },
  {
    name: 'search_notes',
    description: 'Search notes in the vault by title or content',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query string' },
        limit: { type: 'number', description: 'Maximum number of results (default: 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'append_to_note',
    description: 'Append text to the end of an existing note',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path to the note' },
        text: { type: 'string', description: 'Text to append' },
      },
      required: ['path', 'text'],
    },
  },
]

const TOOL_HANDLERS = {
  open_note: handleReadNote,
  read_note: handleReadNote,
  create_note: handleCreateNote,
  search_notes: handleSearchNotes,
  append_to_note: handleAppendToNote,
}

async function handleReadNote(args) {
  const content = await readNote(VAULT_PATH, args.path)
  return { content: [{ type: 'text', text: content }] }
}

async function handleCreateNote(args) {
  const frontmatter = {}
  if (args.is_a) frontmatter.is_a = args.is_a
  const absPath = await createNote(VAULT_PATH, args.path, args.title, frontmatter)
  return { content: [{ type: 'text', text: `Created note at ${absPath}` }] }
}

async function handleSearchNotes(args) {
  const results = await searchNotes(VAULT_PATH, args.query, args.limit)
  const text = results.length === 0
    ? 'No matching notes found.'
    : results.map(r => `**${r.title}** (${r.path})\n${r.snippet}`).join('\n\n')
  return { content: [{ type: 'text', text }] }
}

async function handleAppendToNote(args) {
  await appendToNote(VAULT_PATH, args.path, args.text)
  return { content: [{ type: 'text', text: `Appended text to ${args.path}` }] }
}

// --- Server setup ---

const server = new Server(
  { name: 'laputa-mcp-server', version: '0.1.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const handler = TOOL_HANDLERS[name]
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`)
  }
  try {
    return await handler(args)
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error(`Laputa MCP server running (vault: ${VAULT_PATH})`)
}

main().catch(console.error)
