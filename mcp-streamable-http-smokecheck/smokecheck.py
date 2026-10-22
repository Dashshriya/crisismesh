#!/usr/bin/env python3
"""Inspect a Streamable HTTP MCP server and optionally call one named tool."""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from typing import Any

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client


def _json_default(value: Any) -> str:
    if hasattr(value, "model_dump"):
        return value.model_dump(by_alias=True)
    return str(value)


async def inspect_server(url: str, tool_name: str | None, arguments: dict[str, Any]) -> int:
    """Initialize an MCP session, list tools, and optionally call one tool."""
    async with streamablehttp_client(url) as (read_stream, write_stream, _):
        async with ClientSession(read_stream, write_stream) as session:
            initialized = await session.initialize()
            server_info = getattr(initialized, "serverInfo", None)
            tools_result = await session.list_tools()
            tools = list(tools_result.tools)
            payload = {
                "url": url,
                "transport": "Streamable HTTP",
                "protocol_version": getattr(initialized, "protocolVersion", "unknown"),
                "server": {
                    "name": getattr(server_info, "name", "unknown"),
                    "version": getattr(server_info, "version", "unknown"),
                },
                "tool_count": len(tools),
                "tools": [
                    {
                        "name": tool.name,
                        "description": tool.description or "",
                        "input_schema": getattr(tool, "inputSchema", {}),
                    }
                    for tool in tools
                ],
            }
            print(json.dumps(payload, indent=2, default=_json_default))

            if tool_name:
                known_names = {tool.name for tool in tools}
                if tool_name not in known_names:
                    print(
                        f"\nError: '{tool_name}' was not advertised by tools/list. "
                        f"Available tools: {', '.join(sorted(known_names)) or '(none)'}",
                        file=sys.stderr,
                    )
                    return 2
                result = await session.call_tool(tool_name, arguments)
                call_payload = {
                    "called_tool": tool_name,
                    "is_error": bool(getattr(result, "isError", False)),
                    "content": [
                        getattr(item, "text", None) or str(item)
                        for item in getattr(result, "content", [])
                    ],
                }
                print("\nTool call result:")
                print(json.dumps(call_payload, indent=2, default=_json_default))
                if call_payload["is_error"]:
                    return 2
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check MCP Streamable HTTP initialization and tools/list."
    )
    parser.add_argument(
        "--url", required=True,
        help="Streamable HTTP MCP endpoint, e.g. http://127.0.0.1:8000/mcp",
    )
    parser.add_argument(
        "--call", dest="tool_name", default=None,
        help="Optional tool name to call after discovery (may change server state).",
    )
    parser.add_argument(
        "--arguments", default="{}",
        help="JSON object passed to --call; defaults to an empty object.",
    )
    return parser.parse_args()


async def main() -> int:
    args = parse_args()
    try:
        arguments = json.loads(args.arguments)
        if not isinstance(arguments, dict):
            raise ValueError("--arguments must decode to a JSON object")
    except (json.JSONDecodeError, ValueError) as exc:
        print(f"Invalid --arguments: {exc}", file=sys.stderr)
        return 2

    try:
        return await inspect_server(args.url, args.tool_name, arguments)
    except Exception as exc:
        print(
            f"MCP connection failed for {args.url}: {exc}\n"
            "Check that the endpoint is reachable and supports Streamable HTTP.",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
