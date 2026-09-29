'use strict';
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
createApp().listen(PORT, () => console.log(`Task API running on http://localhost:${PORT}`));
