import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: "Fresh Start Product", price: 10.99 }
  ]);
});

app.listen(PORT, () => {
  console.log(`🚀 API is LIVE at http://localhost:${PORT}/api/products`);
});