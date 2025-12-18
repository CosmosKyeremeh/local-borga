import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

const products = [
  { 
    id: 1, 
    name: "Premium White Gari", 
    price: 15.99, 
    category: "Gari",
    description: "Fine grained, crispy white gari."
  },
  { 
    id: 2, 
    name: "Yellow Gari (With Oil)", 
    price: 18.50, 
    category: "Gari",
    description: "Rich yellow gari processed with premium palm oil." 
  },
  { 
    id: 3, 
    name: "Hausa Koko Mix", 
    price: 12.00, 
    category: "Flour",
    description: "Spiced millet flour for authentic breakfast porridge."
  },
  { 
    id: 4, 
    name: "Fermented Corn Dough", 
    price: 10.50, 
    category: "Dough",
    description: "Perfectly aged for Banku or Kenkey."
  }
];

// Routes
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.listen(PORT, () => {
  console.log(`🚀 API is LIVE at http://localhost:${PORT}/api/products`);
});