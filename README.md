# putput-mcp

Add file upload tools to Claude Code, Cursor, and VS Code Copilot.

## Setup

### Claude Code

```bash
claude mcp add putput-mcp -- npx putput-mcp
```

Set your token:
```bash
export PUTPUT_TOKEN=pp_your_token_here
```

### Cursor

Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "putput": {
      "command": "npx",
      "args": ["putput-mcp"],
      "env": {
        "PUTPUT_TOKEN": "pp_your_token_here"
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
      "args": ["putput-mcp"],
      "env": {
        "PUTPUT_TOKEN": "pp_your_token_here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `upload_file` | Upload a file from a URL and get a CDN link |
| `list_files` | List your uploaded files |
| `delete_file` | Delete a file by ID |
| `get_file_info` | Get file details and download URL |

## Get a Token

No signup required:
```bash
curl -X POST https://putput.io/api/v1/auth/guest | jq .token
```

Or sign up at https://putput.io for 10 GB free storage.

## Links

- Website: https://putput.io
- SDK: `npm install putput`
- CLI: `npx @putput/cli upload <file>`
