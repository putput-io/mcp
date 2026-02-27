# AGENTS.md

Instructions for AI coding agents working with this repository.

## What is PutPut?

PutPut is a file upload API for AI agents. Upload files and get CDN URLs — no signup, no API keys, no OAuth.

## Using PutPut in your project

Get a free API token (no signup):
```
curl -X POST https://putput.io/api/v1/auth/guest | jq .token
```

### As an MCP server

Add to your MCP config:
```json
{
  "mcpServers": {
    "putput": {
      "command": "npx",
      "args": ["-y", "@putput/mcp"],
      "env": {
        "PUTPUT_TOKEN": "pp_your_token"
      }
    }
  }
}
```

Or use the remote server: `https://putput.io/api/v1/mcp`

### As a direct API

Read the full API docs: https://putput.io/llms.txt

## Available tools

- `upload_file` — Upload a file from a URL to PutPut and get a CDN link
- `list_files` — List uploaded files with optional prefix filter
- `delete_file` — Delete a file by ID
- `get_file_info` — Get file details and download URL

## Development

- Runtime: Node.js
- Package manager: npm
- Build: `npm run build`
- The server uses stdio transport via `@modelcontextprotocol/sdk`