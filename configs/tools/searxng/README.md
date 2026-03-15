# SearxNG Search Tool for Opencode (TypeScript Version)

This tool provides a simple command-line interface to perform web searches using the SearxNG meta-search engine. It is implemented in TypeScript and uses `node-fetch` for HTTP requests.

## Installation

### Prerequisites
- Node.js 18+ and npm
- TypeScript (`npm install -g typescript`) (optional, for compilation)
- `ts-node` (installed via project dependencies)

### Steps
1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/llm_server.git
   cd llm_server/tools
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the tool**
   - Copy the example configuration:
     ```bash
     cp example_opencode.json config.json
     ```
   - Edit `config.json` to specify your preferred SearxNG instance URL and any custom settings.

4. **Test the installation**
   ```bash
   npm run search "test query"
   ```
   You should see JSON-formatted search results.

## Usage

You can run the tool directly using `ts-node` (no compilation required):

```bash
npm run search "<your query>"
```

Alternatively, compile the TypeScript file and run the resulting JavaScript:

```bash
# Compile
npx tsc searxng_search.ts --outDir dist

# Run the compiled version
node dist/searxng_search.js "<your query>"
```

The tool reads its configuration from `config.json` and outputs search results as formatted JSON.

## Configuration

The SearxNG instance URL and other settings are defined in `config.json`:

```json
{
  "searxng_url": "https://searx.be",
  "default_language": "en",
  "safe_search": true,
  "limit_per_page": 10,
  "allowed_filters": ["language", "country", "topic"]
}
```

- `searxng_url`: Base URL of the SearxNG instance.
- `default_language`: Default language for searches.
- `safe_search`: Enable safe search filtering.
- `limit_per_page`: Number of results per page.
- `allowed_filters`: Available filter categories.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run search "<query>"` | Execute the search with the provided query |
| `npm run build` | Compile TypeScript to JavaScript (`outDir: dist`) |
| `npm run start` | Run the compiled JavaScript file |

## License

MIT

## Adding This Tool to Opencode

1. **Create the custom tools directory**  
   Opencode looks for user‑provided tools in the `.opencode/tools/` folder (or in a global config path). Create the directory if it does not exist:  
   ```bash
   mkdir -p ~/.opencode/tools
   ```

2. **Copy the tool files**  
   Copy the entire contents of this `searxng` folder into the Opencode tools directory:  
   ```bash
   cp -r /home/jon/git/llm_server/tools/searxng ~/.opencode/tools/
   ```

3. **Register the tool**  
   Opencode automatically discovers any executable TypeScript/JavaScript file that exports a `tool` definition, or any file ending in `.ts` that follows the naming convention `<tool-name>.ts`. Because this folder contains `searxng_search.ts`, Opencode will expose it as the `searxng_search` tool. No additional registration is required.

4. **Configure the tool (optional)**  
   If you need to adjust the SearxNG instance URL or other settings, edit the `config.json` file located in the same directory (`~/.opencode/tools/searxng/config.json`). Changes take effect after you restart the Opencode server or reload the tool list.

5. **Test the integration**  
   From any Opencode session, invoke the tool using its name:  
   ```bash
   opencode run searxng_search "opencode"
   ```  
   The command will return the search results in JSON format.

6. **Troubleshooting**  
   - **Permission denied**: Ensure the copied files are readable (`chmod -R 755 ~/.opencode/tools/searxng`).  
   - **Module not found**: Verify that all dependencies (`node-fetch`, `ts-node`, etc.) are installed. Run `npm install` inside `~/.opencode/tools/searxng`.  
   - **403 or SSL errors**: Follow the configuration steps in this README to enable JSON output and bypass certificate checks.

By following these steps, the searxng search functionality becomes a first‑class tool within Opencode, callable just like any built‑in tool.