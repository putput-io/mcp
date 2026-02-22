#!/usr/bin/env node

/**
 * PutPut MCP Server
 *
 * Standalone MCP server that exposes PutPut file upload tools via stdio transport.
 * Works with Claude Code, Cursor, and VS Code Copilot.
 *
 * Required env: PUTPUT_TOKEN
 * Optional env: PUTPUT_BASE_URL (defaults to https://putput.io)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── Configuration ───

const PUTPUT_TOKEN = process.env.PUTPUT_TOKEN;
const PUTPUT_BASE_URL = (process.env.PUTPUT_BASE_URL ?? "https://putput.io").replace(/\/+$/, "");

if (!PUTPUT_TOKEN) {
  process.stderr.write("Error: PUTPUT_TOKEN environment variable is required.\n");
  process.stderr.write("Get a token: curl -X POST https://putput.io/api/v1/auth/guest | jq .token\n");
  process.exit(1);
}

// ─── API Helper ───

async function apiRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${PUTPUT_TOKEN}`,
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${PUTPUT_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined;
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`);
    }
    return undefined;
  }

  if (!res.ok) {
    const err = json as { error?: { code?: string; message?: string; hint?: string } };
    const message = err?.error?.message ?? `API request failed with status ${res.status}`;
    const hint = err?.error?.hint;
    throw new Error(hint ? `${message} (${hint})` : message);
  }

  return json;
}

// ─── MCP Server ───

const server = new McpServer({
  name: "putput",
  version: "0.0.1",
});

// ─── Tool: upload_file ───

server.tool(
  "upload_file",
  "Upload a file from a URL to PutPut and get a CDN link back",
  {
    url: z.string().describe("URL of the file to upload"),
    filename: z.string().optional().describe("Optional filename override"),
    visibility: z.enum(["public", "private"]).optional().describe("File visibility (default: public)"),
    prefix: z.string().optional().describe("Optional path prefix for organization"),
  },
  async ({ url, filename, visibility, prefix }) => {
    try {
      const body: Record<string, unknown> = { url };
      if (filename) body.filename = filename;
      if (visibility) body.visibility = visibility;
      if (prefix) body.prefix = prefix;

      const result = (await apiRequest("POST", "/api/v1/upload/url", body)) as {
        file: {
          id: string;
          public_url: string | null;
          original_name: string;
          size_bytes: number;
        };
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              id: result.file.id,
              public_url: result.file.public_url,
              original_name: result.file.original_name,
              size_bytes: result.file.size_bytes,
            }),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: err instanceof Error ? err.message : "Upload failed",
          },
        ],
      };
    }
  },
);

// ─── Tool: list_files ───

server.tool(
  "list_files",
  "List uploaded files",
  {
    prefix: z.string().optional().describe("Filter by prefix"),
    limit: z.number().optional().describe("Max results (default: 50, max: 100)"),
    cursor: z.string().optional().describe("Pagination cursor"),
  },
  async ({ prefix, limit, cursor }) => {
    try {
      const params = new URLSearchParams();
      if (prefix) params.set("prefix", prefix);
      if (limit) params.set("limit", String(limit));
      if (cursor) params.set("cursor", cursor);
      const qs = params.toString();
      const path = `/api/v1/files${qs ? `?${qs}` : ""}`;

      const result = (await apiRequest("GET", path)) as {
        files: Array<{
          id: string;
          original_name: string;
          public_url: string | null;
          size_bytes: number;
          created_at: string;
        }>;
        cursor: string | null;
        has_more: boolean;
      };

      const files = result.files.map((f) => ({
        id: f.id,
        original_name: f.original_name,
        public_url: f.public_url,
        size_bytes: f.size_bytes,
        created_at: f.created_at,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              files,
              cursor: result.cursor,
              has_more: result.has_more,
            }),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: err instanceof Error ? err.message : "Failed to list files",
          },
        ],
      };
    }
  },
);

// ─── Tool: delete_file ───

server.tool(
  "delete_file",
  "Delete an uploaded file",
  {
    id: z.string().describe("File ID to delete"),
  },
  async ({ id }) => {
    try {
      await apiRequest("DELETE", `/api/v1/files/${encodeURIComponent(id)}`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ deleted: true, id }),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: err instanceof Error ? err.message : "Failed to delete file",
          },
        ],
      };
    }
  },
);

// ─── Tool: get_file_info ───

server.tool(
  "get_file_info",
  "Get details about an uploaded file",
  {
    id: z.string().describe("File ID to look up"),
  },
  async ({ id }) => {
    try {
      const encodedId = encodeURIComponent(id);

      // Fetch stats and download URL in parallel
      const [stats, download] = await Promise.all([
        apiRequest("GET", `/api/v1/files/${encodedId}/stats`) as Promise<{
          id: string;
          download_count: number;
          size_bytes: number;
          visibility: string;
          created_at: string;
        }>,
        apiRequest("GET", `/api/v1/files/${encodedId}/download`) as Promise<{
          download_url: string;
          expires_at?: string;
        }>,
      ]);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              id: stats.id,
              size_bytes: stats.size_bytes,
              visibility: stats.visibility,
              download_count: stats.download_count,
              created_at: stats.created_at,
              download_url: download.download_url,
            }),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: err instanceof Error ? err.message : "Failed to get file info",
          },
        ],
      };
    }
  },
);

// ─── Start ───

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
