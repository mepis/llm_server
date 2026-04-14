# Basic Workflows

Practical examples demonstrating common API usage patterns and workflows.

## Workflow: Basic Page Visit

Visit a webpage and capture its content.

```bash
# Step 1: Create session
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{"browser": "chromium", "headless": true}')

SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.data.id')
echo "Session ID: $SESSION_ID"

# Step 2: Navigate to page
curl -X POST http://localhost:3000/sessions/$SESSION_ID/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Step 3: Wait for page to load
curl -X POST http://localhost:3000/sessions/$SESSION_ID/wait-for \
  -H "Content-Type: application/json" \
  -d '{"condition": {"type": "networkidle"}}'

# Step 4: Get page title
curl -X POST http://localhost:3000/sessions/$SESSION_ID/evaluate \
  -H "Content-Type: application/json" \
  -d '{"code": "document.title"}'

# Step 5: Get text content
curl http://localhost:3000/sessions/$SESSION_ID/text

# Step 6: Capture screenshot
curl -X POST http://localhost:3000/sessions/$SESSION_ID/screenshot \
  -H "Content-Type: application/json" \
  -d '{"fullPage": true}' \
  --output example-screenshot.png

# Step 7: Clean up
curl -X DELETE http://localhost:3000/sessions/$SESSION_ID
```

## Workflow: Multi-Step Navigation

Navigate through multiple pages and track URLs.

```bash
# Create session
SESSION_ID=$(curl -s -X POST http://localhost:3000/sessions \
  -d '{"browser": "chromium"}' | jq -r '.data.id')

# Navigate to homepage
curl -X POST http://localhost:3000/sessions/$SESSION_ID/navigate \
  -d '{"url": "https://example.com"}'

# Extract all links from homepage
LINKS=$(curl -X POST http://localhost:3000/sessions/$SESSION_ID/evaluate \
  -d '{"code": "[...document.querySelectorAll(\\"a\\")].map(a => a.href).slice(0, 5)"}')

echo "Found links: $LINKS"

# Navigate to first link (if valid)
FIRST_LINK=$(echo $LINKS | jq -r '.[0]')
if [[ $FIRST_LINK != "null" ]]; then
  curl -X POST http://localhost:3000/sessions/$SESSION_ID/navigate \
    -d "{\"url\": \"$FIRST_LINK\"}"

  # Get new page title
  TITLE=$(curl -s -X POST http://localhost:3000/sessions/$SESSION_ID/evaluate \
    -d '{"code": "document.title"}' | jq -r '.data.result')

  echo "Navigated to: $TITLE"
fi

# Go back to homepage
curl -X POST http://localhost:3000/sessions/$SESSION_ID/back

# Reload homepage
curl -X POST http://localhost:3000/sessions/$SESSION_ID/reload

# Clean up
curl -X DELETE http://localhost:3000/sessions/$SESSION_ID
```

## Workflow: Form Detection and Analysis

Detect form structure on a page.

```bash
SESSION_ID=$(curl -s -X POST http://localhost:3000/sessions \
  -d '{"browser": "chromium"}' | jq -r '.data.id')

# Navigate to page with form
curl -X POST http://localhost:3000/sessions/$SESSION_ID/navigate \
  -d '{"url": "https://example.com/contact"}'

# Wait for load
curl -X POST http://localhost:3000/sessions/$SESSION_ID/wait-for \
  -d '{"condition": {"type": "networkidle"}}'

# Count forms on page
FORM_COUNT=$(curl -s -X POST http://localhost:3000/sessions/$SESSION_ID/evaluate \
  -d '{"code": "document.querySelectorAll(\\"form\\").length"}' | jq -r '.data.result')

echo "Found $FORM_COUNT form(s)"

# Extract all form fields
FIELDS=$(curl -s -X POST http://localhost:3000/sessions/$SESSION_ID/evaluate \
  -d '{"code": "[...document.querySelectorAll(\\"form input, form textarea, form select\\")].map(el => ({
    name: el.name,
    type: el.type || \\"text\\",
    id: el.id,
    placeholder: el.placeholder || \\"\\"
  }))"}' | jq '.data.result')

echo "Form fields:"
echo $FIELDS | jq '.'

# Clean up
curl -X DELETE http://localhost:3000/sessions/$SESSION_ID
```

## Workflow: E-commerce Product Extraction

Extract product information from an e-commerce page.

```bash
SESSION_ID=$(curl -s -X POST http://localhost:3000/sessions \
  -d '{"browser": "chromium"}' | jq -r '.data.id')

# Navigate to product page
curl -X POST http://localhost:3000/sessions/$SESSION_ID/navigate \
  -d '{"url": "https://example.com/products"}'

# Wait for products to load
curl -X POST http://localhost:3000/sessions/$SESSION_ID/wait-for \
  -d '{"condition": {"type": "selector", "selector": ".product-card"}}'

# Extract product data
PRODUCTS=$(curl -s -X POST http://localhost:3000/sessions/$SESSION_ID/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "[...document.querySelectorAll(\\".product-card\\")].map(card => ({
      name: card.querySelector(\\".product-name\\")?.innerText || \\"\\",\n      price: card.querySelector(\\".price\\")?.innerText || \\"\\",\n      url: card.querySelector(\\"a\\")?.href || \\"\\"\n    }))"
  }' | jq '.data.result')

echo "Products found:"
echo $PRODUCTS | jq '.'

# Get product count
COUNT=$(echo $PRODUCTS | jq 'length')
echo "Total products: $COUNT"

# Capture screenshot
curl -X POST http://localhost:3000/sessions/$SESSION_ID/screenshot \
  -d '{"fullPage": true}' \
  --output products.png

# Clean up
curl -X DELETE http://localhost:3000/sessions/$SESSION_ID
```

## Workflow: Mobile Device Testing

Test website responsiveness on mobile devices.

```bash
SESSION_ID=$(curl -s -X POST http://localhost:3000/sessions \
  -d '{"browser": "chromium"}' | jq -r '.data.id')

# Set mobile viewport (iPhone 12)
curl -X POST http://localhost:3000/sessions/$SESSION_ID/set-viewport \
  -d '{"device": "iPhone 12"}'

# Set mobile user agent
curl -X POST http://localhost:3000/sessions/$SESSION_ID/set-user-agent \
  -d '{"userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"}'

# Navigate to site
curl -X POST http://localhost:3000/sessions/$SESSION_ID/navigate \
  -d '{"url": "https://example.com"}'

# Wait for mobile content
curl -X POST http://localhost:3000/sessions/$SESSION_ID/wait-for \
  -d '{"condition": {"type": "networkidle"}}'

# Check if mobile menu exists
MOBILE_MENU=$(curl -s -X POST http://localhost:3000/sessions/$SESSION_ID/evaluate \
  -d '{"code": "document.querySelector(\\".mobile-menu\\") !== null"}' | jq '.data.result')

echo "Mobile menu present: $MOBILE_MENU"

# Capture mobile screenshot
curl -X POST http://localhost:3000/sessions/$SESSION_ID/screenshot \
  -d '{"fullPage": true}' \
  --output mobile-view.png

# Test desktop view
curl -X POST http://localhost:3000/sessions/$SESSION_ID/set-viewport \
  -d '{"device": "Desktop"}'

curl -X POST http://localhost:3000/sessions/$SESSION_ID/reload

# Capture desktop screenshot
curl -X POST http://localhost:3000/sessions/$SESSION_ID/screenshot \
  -d '{"fullPage": true}' \
  --output desktop-view.png

# Clean up
curl -X DELETE http://localhost:3000/sessions/$SESSION_ID
```

## Workflow: Error Monitoring

Monitor page errors and warnings.

```bash
SESSION_ID=$(curl -s -X POST http://localhost:3000/sessions \
  -d '{"browser": "chromium"}' | jq -r '.data.id')

# Add custom logging script
curl -X POST http://localhost:3000/sessions/$SESSION_ID/add-init-script \
  -d '{"code": "window.onerror = function(msg, url, line) { console.error(\\"Page Error:\\", msg, url, line); return true; };"}'

# Navigate to page
curl -X POST http://localhost:3000/sessions/$SESSION_ID/navigate \
  -d '{"url": "https://example.com"}'

# Wait for load
curl -X POST http://localhost:3000/sessions/$SESSION_ID/wait-for \
  -d '{"condition": {"type": "networkidle"}}'

# Get error messages
ERRORS=$(curl -s "http://localhost:3000/sessions/$SESSION_ID/console-messages?level=error" | jq '.data.messages')

echo "Errors found:"
echo $ERRORS | jq '.'

# Get warning messages
WARNINGS=$(curl -s "http://localhost:3000/sessions/$SESSION_ID/console-messages?level=warn" | jq '.data.messages')

echo "Warnings found:"
echo $WARNINGS | jq '.'

# Clean up
curl -X DELETE http://localhost:3000/sessions/$SESSION_ID
```

## Workflow: Dynamic Content Waiting

Wait for dynamically loaded content.

```bash
SESSION_ID=$(curl -s -X POST http://localhost:3000/sessions \
  -d '{"browser": "chromium"}' | jq -r '.data.id')

# Navigate to SPA
curl -X POST http://localhost:3000/sessions/$SESSION_ID/navigate \
  -d '{"url": "https://example.com/dashboard"}'

# Wait for initial load
curl -X POST http://localhost:3000/sessions/$SESSION_ID/wait-for \
  -d '{"condition": {"type": "domcontentloaded"}}'

# Wait for dynamic data to load
curl -X POST http://localhost:3000/sessions/$SESSION_ID/wait-for \
  -H "Content-Type: application/json" \
  -d '{
    "condition": {
      "type": "function",
      "code": "() => new Promise(resolve => {\n  const check = () => {\n    const data = document.querySelector(\\".dashboard-data\\");\n    if (data && data.children.length > 0) resolve(true);\n    else setTimeout(check, 200);\n  };\n  check();\n})"
    },
    "timeout": 30000
  }'

# Verify data loaded
DATA_CHECK=$(curl -s -X POST http://localhost:3000/sessions/$SESSION_ID/evaluate \
  -d '{"code": "document.querySelector(\\".dashboard-data\\").children.length"}' | jq '.data.result')

echo "Data elements loaded: $DATA_CHECK"

# Extract loaded data
DATA=$(curl -s -X POST http://localhost:3000/sessions/$SESSION_ID/evaluate \
  -d '{"code": "[...document.querySelectorAll(\\".dashboard-item\\")].map(item => item.innerText)"}' | jq '.data.result')

echo "Dashboard items:"
echo $DATA | jq '.'

# Clean up
curl -X DELETE http://localhost:3000/sessions/$SESSION_ID
```

## Workflow: Batch Operations

Perform multiple operations efficiently.

```bash
# Create session
SESSION_ID=$(curl -s -X POST http://localhost:3000/sessions \
  -d '{"browser": "chromium"}' | jq -r '.data.id')

# Array of URLs to visit
URLS='["https://example.com/page1", "https://example.com/page2", "https://example.com/page3"]'

# Process each URL
echo $URLS | jq -r '.[]' | while read URL; do
  echo "Processing: $URL"

  # Navigate
  curl -s -X POST http://localhost:3000/sessions/$SESSION_ID/navigate \
    -d "{\"url\": \"$URL\"}" | jq -r '.data.url'

  # Wait for load
  curl -X POST http://localhost:3000/sessions/$SESSION_ID/wait-for \
    -d '{"condition": {"type": "networkidle"}}' > /dev/null

  # Extract title
  TITLE=$(curl -s -X POST http://localhost:3000/sessions/$SESSION_ID/evaluate \
    -d '{"code": "document.title"}' | jq -r '.data.result')

  echo "  Title: $TITLE"
done

# Clean up
curl -X DELETE http://localhost:3000/sessions/$SESSION_ID
```

## Workflow: API Integration Pattern

Complete API integration with error handling.

```bash
#!/bin/bash

# Function to make API call with error handling
api_call() {
  local method=$1
  local endpoint=$2
  local data=$3

  response=$(curl -s -w "\n%{http_code}" -X $method \
    http://localhost:3000$endpoint \
    -H "Content-Type: application/json" \
    -d "$data")

  # Extract body and status code
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)

  # Check success
  if [ "$status" -eq 200 ] || [ "$status" -eq 201 ]; then
    echo "$body"
    return 0
  else
    echo "Error: HTTP $status"
    echo "$body" | jq '.error'
    return 1
  fi
}

# Create session
session_response=$(api_call POST "/sessions" '{"browser": "chromium"}')
if [ $? -ne 0 ]; then
  echo "Failed to create session"
  exit 1
fi

SESSION_ID=$(echo $session_response | jq -r '.data.id')
echo "Created session: $SESSION_ID"

# Navigate with error handling
nav_response=$(api_call POST "/sessions/$SESSION_ID/navigate" '{"url": "https://example.com"}')
if [ $? -eq 0 ]; then
  echo "Navigation successful"

  # Extract content
  content_response=$(api_call GET "/sessions/$SESSION_ID/text" "")
  if [ $? -eq 0 ]; then
    TEXT=$(echo $content_response | jq -r '.data.text')
    echo "Page text length: ${#TEXT} characters"
  fi
else
  echo "Navigation failed"
fi

# Clean up (always)
api_call DELETE "/sessions/$SESSION_ID" ""

echo "Workflow complete"
```

## Best Practices

### Error Handling

Always check `success` field in responses:

```javascript
const response = await fetch('/sessions/:id/navigate', ...);
const data = await response.json();

if (!data.success) {
  console.error('Operation failed:', data.error);
  // Handle error - retry, abort, or recover
}
```

### Session Management

1. **Always delete sessions** after use
2. **Reuse sessions** for related operations
3. **Handle rate limits** with exponential backoff
4. **Set appropriate timeouts** for slow operations

### Selector Strategy

1. **Use specific selectors** that won't change
2. **Test selectors** before automation
3. **Combine multiple strategies** for reliability
4. **Use [[features/extraction.md]]** to inspect elements

### Performance

1. **Use `networkidle`** for reliable page readiness
2. **Set timeouts** based on expected load times
3. **Batch operations** when possible
4. **Capture screenshots** only when needed

## Related Documentation

- [[features/navigation.md]] - Navigation operations
- [[features/interaction.md]] - Interaction operations
- [[features/extraction.md]] - Data extraction
- [[features/form-handling.md]] - Form operations
- [[qa/research-task.md]] - Complete research workflow
- [[qa/form-submission.md]] - Form submission example

## Tags

`#qa` `#workflows` `#examples` `#practical` `#automation` `#integration` `#best-practices` `#error-handling`
