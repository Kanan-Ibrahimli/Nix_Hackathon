const express = require('express');
const app = express();

const PORT = process.env.PORT || 8000;

app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: "OK"
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});