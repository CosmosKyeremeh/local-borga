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
    name: 'Premium White Gari', 
    price: 25.00, 
    category: 'GARI', 
    description: 'Crispy, dry, and perfectly fermented.',
    image: '/images/white-gari.jpg' 
  },
  { 
    id: 2, 
    name: 'Yellow Gari (Fiber Rich)', 
    price: 30.00, 
    category: 'GARI', 
    description: 'Processed with organic palm oil.',
    image: '/images/yellow-gari.jpg'
  },
  { 
    id: 3, 
    name: 'Hausa Koko Mix', 
    price: 15.00, 
    category: 'FLOUR', 
    description: 'Spiced millet porridge mix.',
    image: '/images/hausa-koko.jpg'
  },
  { 
    id: 4, 
    name: 'Corn Dough (Fermented)', 
    price: 20.00, 
    category: 'DOUGH', 
    description: 'Freshly ground for Banku or Kenkey.',
    image: '/images/corn-dough.jpg'
  },
  { 
    id: 5, 
    name: 'Ripened Plantain (Bunch)', 
    price: 45.00, 
    category: 'STAPLES', 
    description: 'Sweet, yellow plantains perfect for Kelewele or boiling.',
    image: '/images/plantain.jpg' 
  },
  { 
    id: 6, 
    name: 'Puna Yam (Large)', 
    price: 35.00, 
    category: 'STAPLES', 
    description: 'High-quality Puna yam with a floury texture, ideal for boiling or frying.',
    image: '/images/yam.jpg'
  },
  { 
    id: 7, 
    name: 'Palm Nut Pulp', 
    price: 22.00, 
    category: 'SOUP BASE', 
    description: 'Freshly extracted and concentrated palm nut pulp for authentic soup.',
    image: '/images/palm-nut.jpg'
  }
];

// Routes
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.listen(PORT, () => {
  console.log(`🚀 API is LIVE at http://localhost:${PORT}/api/products`);
});