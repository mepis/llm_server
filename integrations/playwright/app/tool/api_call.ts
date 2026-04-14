import { tool } from "@opencode-ai/plugin";
import fetch from "node-fetch";
import configs from "../../../opencode/tools/configs.json"

const API_BASE_URL = configs.API_URL || "http://localhost:4000";

export default tool({
  description: `Use this tool to search the web or find information.
Call the LLM Assistance API for browser automation. 
Use this tool to browser the web, scrape web pages, create sessions, navigate websites, extract content, and interact with web pages. This tool interacts a headed PlayWright API. 

Common workflows:
1. Create a session first: api_call({ action: "create-session" })
2. Navigate: api_call({ sessionId: "<id>", action: "navigate", url: "https://example.com" })
3. Extract content: api_call({ sessionId: "<id>", action: "get-text" })
4. Clean up: api_call({ sessionId: "<id>", action: "delete-session" })

See API documentation for all available actions and parameters.`,
  args: {
    action: tool.schema
      .string()
      .describe(
        "API action to perform (create-session, get-session, delete-session, navigate, back, forward, reload, click, type, screenshot, get-content, get-text, get-attributes, evaluate, add-init-script, get-console-messages, fill-form, select-option, check, submit-form, wait-for, set-viewport, set-user-agent, set-extra-headers)",
      ),
    sessionId: tool.schema
      .string()
      .optional()
      .describe("Session ID from create-session (required for most actions)"),
    url: tool.schema.string().optional().describe("URL to navigate to"),
    browser: tool.schema
      .string()
      .optional()
      .default("chromium")
      .describe("Browser type: chromium, firefox, or webkit"),
    headless: tool.schema
      .boolean()
      .optional()
      .default(true)
      .describe("Run browser in headless mode"),
    viewportWidth: tool.schema.number().optional().describe("Viewport width"),
    viewportHeight: tool.schema.number().optional().describe("Viewport height"),
    selector: tool.schema
      .string()
      .optional()
      .describe("CSS selector for element"),
    text: tool.schema.string().optional().describe("Text to type into input"),
    fullPage: tool.schema
      .boolean()
      .optional()
      .describe("Capture full page screenshot"),
    code: tool.schema
      .string()
      .optional()
      .describe("JavaScript code to evaluate"),
    fields: tool.schema
      .record(tool.schema.string())
      .optional()
      .describe("Form fields to fill as object"),
    waitUntil: tool.schema
      .string()
      .optional()
      .describe(
        "Navigation wait condition: load, domcontentloaded, networkidle, commit",
      ),
    timeout: tool.schema
      .number()
      .optional()
      .describe("Timeout in milliseconds"),
  },
  async execute(args) {
    let url = `${API_BASE_URL}/sessions`;

    if (args.action === "create-session") {
      const body = {
        browser: args.browser || "chromium",
        headless: args.headless !== undefined ? args.headless : true,
        viewport:
          args.viewportWidth && args.viewportHeight
            ? { width: args.viewportWidth, height: args.viewportHeight }
            : undefined,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create session: ${error.error}`);
      }

      const result = await response.json();
      return `Session created successfully.\nID: ${result.data.id}\nBrowser: ${result.data.browser}\nStatus: ${result.data.status}`;
    } else if (args.sessionId) {
      url = `${API_BASE_URL}/sessions/${args.sessionId}`;

      switch (args.action) {
        case "get-session": {
          const response = await fetch(url, { method: "GET" });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to get session: ${error.error}`);
          }
          const result = await response.json();
          return `Session info:\nID: ${result.data.id}\nBrowser: ${result.data.browser}\nStatus: ${result.data.status}\nOptions: ${JSON.stringify(result.data.options, null, 2)}`;
        }

        case "delete-session": {
          const response = await fetch(url, { method: "DELETE" });
          if (!response.ok && response.status !== 204) {
            const error = await response.json();
            throw new Error(`Failed to delete session: ${error.error}`);
          }
          return "Session deleted successfully";
        }

        case "navigate": {
          if (!args.url) throw new Error("URL is required for navigate action");
          url = `${API_BASE_URL}/sessions/${args.sessionId}/navigate`;
          const body = {
            url: args.url,
            waitUntil: args.waitUntil || "networkidle",
            timeout: args.timeout || 30000,
          };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Navigation failed: ${error.error}`);
          }

          const result = await response.json();
          return `Navigated to: ${result.data.url}`;
        }

        case "back": {
          url = `${API_BASE_URL}/sessions/${args.sessionId}/back`;
          const response = await fetch(url, { method: "POST" });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Back failed: ${error.error}`);
          }
          const result = await response.json();
          return `Navigated back to: ${result.data.url}`;
        }

        case "forward": {
          url = `${API_BASE_URL}/sessions/${args.sessionId}/forward`;
          const response = await fetch(url, { method: "POST" });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Forward failed: ${error.error}`);
          }
          const result = await response.json();
          return `Navigated forward to: ${result.data.url}`;
        }

        case "reload": {
          url = `${API_BASE_URL}/sessions/${args.sessionId}/reload`;
          const response = await fetch(url, { method: "POST" });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Reload failed: ${error.error}`);
          }
          const result = await response.json();
          return `Page reloaded: ${result.data.url}`;
        }

        case "click": {
          if (!args.selector)
            throw new Error("Selector is required for click action");
          url = `${API_BASE_URL}/sessions/${args.sessionId}/click`;
          const body = { selector: args.selector };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Click failed: ${error.error}`);
          }

          const result = await response.json();
          return `Clicked element. Current URL: ${result.data.url}`;
        }

        case "type": {
          if (!args.selector || !args.text)
            throw new Error("Selector and text are required for type action");
          url = `${API_BASE_URL}/sessions/${args.sessionId}/type`;
          const body = {
            selector: args.selector,
            text: args.text,
            keyboard: args.keyboard !== undefined ? args.keyboard : true,
          };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Type failed: ${error.error}`);
          }

          const result = await response.json();
          return `Typed text into element. Current URL: ${result.data.url}`;
        }

        case "screenshot": {
          url = `${API_BASE_URL}/sessions/${args.sessionId}/screenshot`;
          const body = {
            fullPage: args.fullPage || false,
            type: "png",
            quality: 100,
          };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Screenshot failed: ${error.error}`);
          }

          const buffer = await response.buffer();
          const base64 = buffer.toString("base64");
          return `Screenshot captured (${buffer.length} bytes). Base64 data available for download`;
        }

        case "get-content": {
          url = `${API_BASE_URL}/sessions/${args.sessionId}/content`;
          const response = await fetch(url, { method: "GET" });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Content extraction failed: ${error.error}`);
          }
          const result = await response.json();
          return `Page content (${result.data.content.length} chars):\n${result.data.content.substring(0, 2000)}${result.data.content.length > 2000 ? "..." : ""}`;
        }

        case "get-text": {
          url = `${API_BASE_URL}/sessions/${args.sessionId}/text`;
          const response = await fetch(url, { method: "GET" });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Text extraction failed: ${error.error}`);
          }
          const result = await response.json();
          return `Page text content:\n${result.data.text}`;
        }

        case "get-attributes": {
          if (!args.selector)
            throw new Error("Selector is required for get-attributes action");
          url = `${API_BASE_URL}/sessions/${args.sessionId}/attributes/${encodeURIComponent(args.selector)}`;
          const response = await fetch(url, { method: "GET" });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Attributes extraction failed: ${error.error}`);
          }
          const result = await response.json();
          return `Element attributes:\n${JSON.stringify(result.data.attributes, null, 2)}`;
        }

        case "evaluate": {
          if (!args.code)
            throw new Error("Code is required for evaluate action");
          url = `${API_BASE_URL}/sessions/${args.sessionId}/evaluate`;
          const body = { code: args.code };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Evaluation failed: ${error.error}`);
          }

          const result = await response.json();
          return `JavaScript evaluation result:\n${result.data.result}\n(Type: ${result.data.type})`;
        }

        case "add-init-script": {
          if (!args.code)
            throw new Error("Code is required for add-init-script action");
          url = `${API_BASE_URL}/sessions/${args.sessionId}/add-init-script`;
          const body = { code: args.code };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Init script injection failed: ${error.error}`);
          }

          return "Init script added successfully";
        }

        case "get-console-messages": {
          url = `${API_BASE_URL}/sessions/${args.sessionId}/console-messages`;
          const response = await fetch(url, { method: "GET" });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(
              `Console messages retrieval failed: ${error.error}`,
            );
          }
          const result = await response.json();
          return `Console messages (${result.data.messages.length}):\n${JSON.stringify(result.data.messages, null, 2)}`;
        }

        case "fill-form": {
          if (!args.fields)
            throw new Error("Fields are required for fill-form action");
          url = `${API_BASE_URL}/sessions/${args.sessionId}/fill-form`;
          const body = { fields: args.fields };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Form fill failed: ${error.error}`);
          }

          const result = await response.json();
          return `Filled ${result.data.filled} form fields`;
        }

        case "select-option": {
          if (!args.selector)
            throw new Error("Selector is required for select-option action");
          url = `${API_BASE_URL}/sessions/${args.sessionId}/select-option`;
          const body = {
            selector: args.selector,
            value: args.value || args.selectedValue,
            multiple: args.multiple || false,
          };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Select option failed: ${error.error}`);
          }

          const result = await response.json();
          return `Selected option: ${JSON.stringify(result.data.selected)}`;
        }

        case "check": {
          if (!args.selector)
            throw new Error("Selector is required for check action");
          url = `${API_BASE_URL}/sessions/${args.sessionId}/check`;
          const body = {
            selector: args.selector,
            checked: args.checked !== undefined ? args.checked : true,
          };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Check action failed: ${error.error}`);
          }

          const result = await response.json();
          return `Checkbox checked: ${result.data.checked}`;
        }

        case "submit-form": {
          url = `${API_BASE_URL}/sessions/${args.sessionId}/submit-form`;
          const body = {
            selector: args.selector || "form",
            url: args.url,
            timeout: args.timeout || 10000,
          };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Form submission failed: ${error.error}`);
          }

          const result = await response.json();
          return `Form submitted. Navigated to: ${result.data.url}`;
        }

        case "wait-for": {
          if (!args.condition)
            throw new Error("Condition object is required for wait-for action");
          url = `${API_BASE_URL}/sessions/${args.sessionId}/wait-for`;
          const body = {
            condition: args.condition,
            timeout: args.timeout || 30000,
          };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Wait condition failed: ${error.error}`);
          }

          const result = await response.json();
          return `Wait condition met: ${result.data.condition}`;
        }

        case "set-viewport": {
          url = `${API_BASE_URL}/sessions/${args.sessionId}/set-viewport`;
          const body = {
            width: args.viewportWidth,
            height: args.viewportHeight,
            device: args.device || null,
          };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Set viewport failed: ${error.error}`);
          }

          const result = await response.json();
          return `Viewport set: ${JSON.stringify(result.data.viewport)}${result.data.device ? ` (Device: ${result.data.device})` : ""}`;
        }

        case "set-user-agent": {
          if (!args.userAgent)
            throw new Error("User agent is required for set-user-agent action");
          url = `${API_BASE_URL}/sessions/${args.sessionId}/set-user-agent`;
          const body = { userAgent: args.userAgent };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Set user agent failed: ${error.error}`);
          }

          const result = await response.json();
          return `User agent set: ${result.data.userAgent}`;
        }

        case "set-extra-headers": {
          if (!args.headers)
            throw new Error(
              "Headers object is required for set-extra-headers action",
            );
          url = `${API_BASE_URL}/sessions/${args.sessionId}/set-extra-headers`;
          const body = { headers: args.headers };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(`Set extra headers failed: ${error.error}`);
          }

          const result = await response.json();
          return `Extra headers set: ${JSON.stringify(result.data.headers, null, 2)}`;
        }

        default:
          throw new Error(
            `Unknown action: ${args.action}. Available actions: create-session, get-session, delete-session, navigate, back, forward, reload, click, type, screenshot, get-content, get-text, get-attributes, evaluate, add-init-script, get-console-messages, fill-form, select-option, check, submit-form, wait-for, set-viewport, set-user-agent, set-extra-headers`,
          );
      }
    } else {
      throw new Error(
        "Session ID is required for all actions except create-session",
      );
    }
  },
});
