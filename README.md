# @putput/mcp

File uploads for AI agents. Upload, list, and manage files from Claude Code, Cursor, Windsurf, and VS Code Copilot — no signup required.

## Quick Start

Get a free API token (no signup):

```bash
curl -X POST https://putput.io/api/v1/auth/guest | jq .token
```

### Claude Code

```bash
claude mcp add putput -- npx @putput/mcp -e PUTPUT_TOKEN=pp_your_token
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "putput": {
      "command": "npx",
      "args": ["@putput/mcp"],
      "env": {
        "PUTPUT_TOKEN": "pp_your_token"
      }
    }
  }
}
```

### VS Code Copilot

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "putput": {
      "command": "npx",
      "args": ["@putput/mcp"],
      "env": {
        "PUTPUT_TOKEN": "pp_your_token"
      }
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "putput": {
      "command": "npx",
      "args": ["@putput/mcp"],
      "env": {
        "PUTPUT_TOKEN": "pp_your_token"
      }
    }
  }
}
```

### Remote (Streamable HTTP)

If your client supports remote MCP servers:

```
https://putput.io/api/v1/mcp
```

Pass your token as a Bearer token in the Authorization header.

## Tools

| Tool | Description |
|------|-------------|
| `upload_file` | Upload a file from a URL to PutPut and get a CDN link back |
| `list_files` | List uploaded files with optional prefix filter and pagination |
| `delete_file` | Delete a file by ID |
| `get_file_info` | Get file details, stats, and download URL |

## How It Works

1. Your AI agent calls `upload_file` with a URL
2. PutPut uploads the file to Cloudflare R2
3. You get back a CDN URL — done

No AWS, no config, no deploy step. Files are served from 300+ edge locations with $0 egress.

## Pricing

- **Guest:** 1 GB free, no signup, 14-day expiry
- **Free:** 10 GB free, requires account
- **Pro:** From $9/mo for 50 GB, unlimited bandwidth, $0 egress

## Links

- **Website:** https://putput.io
- **API Docs:** https://docs.putput.io
- **SDK:** `npm install @putput/sdk`
- **CLI:** `npx @putput/cli upload <file>`
- **GitHub:** https://github.com/putput-io
