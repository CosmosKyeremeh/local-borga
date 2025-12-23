import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const PORT = 5000;

// 1. Create HTTP server for Socket.io to latch onto
const server = http.createServer(app);

// 2. Initialize the broadcaster
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Matches your web-client URL
    methods: ["GET", "POST", "PATCH"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Attach io to app for use in routes
app.set('socketio', io);

// Data Storage (In-memory for now)
let orders: any[] = []; 
const products = [
  { id: 1, name: 'Premium White Gari', price: 25.00, category: 'GARI', description: 'Crispy, dry, and perfectly fermented.', image: '/images/white-gari.jpg' },
  { id: 2, name: 'Yellow Gari (Fiber Rich)', price: 30.00, category: 'GARI', description: 'Processed with organic palm oil.', image: '/images/yellow-gari.jpg' },
  { id: 3, name: 'Hausa Koko Mix', price: 15.00, category: 'FLOUR', description: 'Spiced millet porridge mix.', image: '/images/hausa-koko.jpg' },
  { id: 4, name: 'Corn Dough (Fermented)', price: 20.00, category: 'DOUGH', description: 'Freshly ground for Banku or Kenkey.', image: '/images/corn-dough.jpg' },
  { id: 5, name: 'Ripened Plantain (Bunch)', price: 45.00, category: 'STAPLES', description: 'Sweet, yellow plantains.', image: '/images/plantain.jpg' },
  { id: 6, name: 'Puna Yam (Large)', price: 35.00, category: 'STAPLES', description: 'Ideal for boiling or frying.', image: '/images/yam.jpg' },
  { id: 7, name: 'Palm Nut Pulp', price: 22.00, category: 'SOUP BASE', description: 'Freshly extracted.', image: '/images/palm-nut.jpg' }
];

// --- Socket.io Events ---
io.on('connection', (socket) => {
  console.log('⚡ CEO BROADCASTER: Storefront client connected');
  socket.on('disconnect', () => console.log('Storefront client disconnected'));
});

// --- Routes ---

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: Date.now(),
    ...req.body,
    status: 'pending',
    createdAt: new Date()
  };

  orders.push(newOrder);
  console.log('✅ New Custom Order Received:', newOrder);

  res.status(201).json({ 
    message: 'Order created successfully', 
    order: newOrder 
  });
});

// UPDATED: Real-time broadcast happens here
app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const orderIndex = orders.findIndex(o => o.id === parseInt(id));
  
  if (orderIndex > -1) {
    orders[orderIndex].status = status;
    
    // BROADCAST: Signal the storefront to show a toast
    const broadcaster = req.app.get('socketio');
    broadcaster.emit('orderStatusUpdated', {
      orderId: id,
      itemName: orders[orderIndex].itemName || orders[orderIndex].name,
      status: status 
    });

    res.json({ message: 'Status updated and broadcasted', order: orders[orderIndex] });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

// NOTE: We now listen on 'server', not 'app'
server.listen(PORT, () => {
  console.log(`🚀 API BROADCASTER: LIVE at http://localhost:${PORT}`);
});