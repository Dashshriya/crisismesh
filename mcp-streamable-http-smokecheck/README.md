# MCP Streamable HTTP Smokecheck

A small, open-source CLI for developers who want to verify that a Model Context Protocol (MCP) server is reachable over Streamable HTTP, completes session initialization, and advertises tools through `tools/list`. It can optionally call one discovered tool so a developer can inspect the returned result.

This is an independent developer utility. It is not an official MCP or Amazon tool and does not require an Alexa+ device.

## What it checks

1. Opens a Streamable HTTP connection to the supplied endpoint.
2. Initializes an MCP session and prints protocol/server metadata where available.
3. Calls `tools/list` and prints each advertised tool and input schema.
4. Optionally calls one tool only if it appears in the discovered tool list.
5. Prints connection errors with a basic troubleshooting hint and returns a non-zero exit code on failure.

## Requirements

- Python 3.10+
- An MCP Python SDK-compatible Streamable HTTP endpoint

Install the dependency:

```bash
python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

## Usage

Read-only connection and tool discovery:

```bash
python smokecheck.py --url http://127.0.0.1:8000/mcp
```

Optional tool call (may mutate the server, depending on the tool):

```bash
python smokecheck.py --url http://127.0.0.1:8000/mcp --call list_open_tasks
```

Pass JSON arguments when a tool requires them:

```bash
python smokecheck.py --url http://127.0.0.1:8000/mcp --call get_task --arguments '{"task_id":"demo-1"}'
```

The example tool names and argument names are illustrative; use the names and schema returned by your own server. Do not call a mutating tool on a production server unless you understand its effects.

## Exit codes

- `0`: initialization and tool discovery succeeded; optional tool call did not report an error.
- `1`: connection, initialization, or unexpected runtime failure.
- `2`: invalid arguments, requested tool was not advertised, or the tool call reported an error.

## Why it exists

MCP integrations can look correct in configuration but still fail at transport, initialization, or tool discovery. This smokecheck makes those first protocol steps visible before a developer debugs the application built on top of them.

## License

MIT. See `LICENSE`.
