// Example 1: Create session and navigate
const createSession = async () => {
  const response = await fetch("http://localhost:3000/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      browser: "chromium",
      headless: true,
      viewport: { width: 1280, height: 720 },
    }),
  });

  const session = await response.json();
  console.log(`Session created: ${session.data.id}`);
  return session.data.id;
};

// Example 2: Complete research workflow
const researchWorkflow = async (sessionId, targetUrl) => {
  // Navigate to page
  await fetch(`http://localhost:3000/sessions/${sessionId}/navigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: targetUrl, waitUntil: "networkidle" }),
  });

  // Extract page content
  const contentResponse = await fetch(
    `http://localhost:3000/sessions/${sessionId}/content`,
  );
  const content = await contentResponse.json();

  // Extract visible text
  const textResponse = await fetch(
    `http://localhost:3000/sessions/${sessionId}/text`,
  );
  const text = await textResponse.json();

  // Capture screenshot
  const screenshotResponse = await fetch(
    `http://localhost:3000/sessions/${sessionId}/screenshot`,
    { method: "POST" },
  );
  const screenshot = await screenshotResponse.arrayBuffer();

  return {
    url: contentResponse.url,
    html: content.data.content,
    text: text.data.text,
    screenshot: Buffer.from(screenshot),
  };
};

// Example 3: Form submission workflow
const formSubmissionWorkflow = async (sessionId, formUrl, formData) => {
  // Navigate to form
  await fetch(`http://localhost:3000/sessions/${sessionId}/navigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: formUrl }),
  });

  // Fill form fields
  await fetch(`http://localhost:3000/sessions/${sessionId}/fill-form`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: formData }),
  });

  // Submit form
  const submitResponse = await fetch(
    `http://localhost:3000/sessions/${sessionId}/submit-form`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selector: "form", timeout: 10000 }),
    },
  );

  return submitResponse.json();
};

// Example 4: Dynamic content extraction with JavaScript
const dynamicExtraction = async (sessionId, extractionScript) => {
  await fetch(`http://localhost:3000/sessions/${sessionId}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: extractionScript }),
  });
};

// Example 5: Multi-step navigation with interaction
const multiStepWorkflow = async (sessionId, steps) => {
  for (const step of steps) {
    if (step.type === "navigate") {
      await fetch(`http://localhost:3000/sessions/${sessionId}/navigate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: step.url }),
      });
    } else if (step.type === "click") {
      await fetch(`http://localhost:3000/sessions/${sessionId}/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selector: step.selector }),
      });
    } else if (step.type === "type") {
      await fetch(`http://localhost:3000/sessions/${sessionId}/type`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selector: step.selector, text: step.text }),
      });
    } else if (step.type === "wait") {
      await fetch(`http://localhost:3000/sessions/${sessionId}/wait-for`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: step.condition || { type: "networkidle" },
        }),
      });
    }
  }
};

// Example 6: Mobile device emulation
const mobileEmulation = async (sessionId) => {
  // Set iPhone viewport and user agent
  await fetch(`http://localhost:3000/sessions/${sessionId}/set-viewport`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device: "iPhone 12" }),
  });

  // Navigate and extract
  await fetch(`http://localhost:3000/sessions/${sessionId}/navigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com" }),
  });

  const content = await fetch(
    `http://localhost:3000/sessions/${sessionId}/content`,
  ).then((r) => r.json());

  return content;
};

// Example 7: Error handling pattern for LLMs
const safeApiCall = async (url, options, maxRetries = 3) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw lastError;
};

// Example 8: Session lifecycle management
const sessionLifecycle = async () => {
  // Create session
  const createRes = await fetch("http://localhost:3000/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ browser: "chromium" }),
  });
  const session = await createRes.json();
  const sessionId = session.data.id;

  try {
    // Perform operations
    await fetch(`http://localhost:3000/sessions/${sessionId}/navigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com" }),
    });

    // Get content
    const content = await fetch(
      `http://localhost:3000/sessions/${sessionId}/content`,
    ).then((r) => r.json());

    return content;
  } finally {
    // Always clean up session
    await fetch(`http://localhost:3000/sessions/${sessionId}`, {
      method: "DELETE",
    });
  }
};

module.exports = {
  createSession,
  researchWorkflow,
  formSubmissionWorkflow,
  dynamicExtraction,
  multiStepWorkflow,
  mobileEmulation,
  safeApiCall,
  sessionLifecycle,
};
