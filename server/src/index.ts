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

// server/src/index.ts (Add this route)

// In-memory storage for demonstration (Replace with DB calls like prisma.order.create)
let orders: any[] = []; 

app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: Date.now(),
    ...req.body,
    status: 'pending',
    createdAt: new Date()
  };

  orders.push(newOrder);
  console.log('✅ New Custom Order Received:', newOrder);

  // Respond with success
  res.status(201).json({ 
    message: 'Order created successfully', 
    order: newOrder 
  });
});

// Route to fetch all orders for the Admin Dashboard
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// Optional: Route to update order status (e.g., Mark as "In Production")
app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const orderIndex = orders.findIndex(o => o.id === parseInt(id));
  if (orderIndex > -1) {
    orders[orderIndex].status = status;
    res.json({ message: 'Status updated', order: orders[orderIndex] });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 API is LIVE at http://localhost:${PORT}/api/products`);
});