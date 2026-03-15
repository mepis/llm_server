const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the built VuePress documentation
app.use(express.static(path.join(__dirname, '..', 'docs', '.vuepress', 'dist')));

# Handle all other routes by serving index.html (for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'docs', '.vuepress', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Docs server running at http://localhost:${PORT}`);
});