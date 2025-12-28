import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PATCH"]
  }
});

app.use(cors());
app.use(express.json());
app.set('socketio', io);

let orders: any[] = []; 
const products = [
  { id: 1, name: 'Premium White Gari', price: 25.0, category: 'GARI', description: 'Crispy, dry, and perfectly fermented.', image: '/images/white-gari.jpg' },
  { id: 2, name: 'Yellow Gari (Fiber Rich)', price: 30.0, category: 'GARI', description: 'Processed with organic palm oil.', image: '/images/yellow-gari.jpg' },
  { id: 3, name: 'Hausa Koko Mix', price: 15.0, category: 'FLOUR', description: 'Spiced millet porridge mix.', image: '/images/hausa-koko.jpg' },
  { id: 4, name: 'Corn Dough (Fermented)', price: 20.0, category: 'DOUGH', description: 'Freshly ground for Banku or Kenkey.', image: '/images/corn-dough.jpg' },
  { id: 5, name: 'Ripened Plantain (Bunch)', price: 45.0, category: 'STAPLES', description: 'Sweet, yellow plantains.', image: '/images/plantain.jpg' },
  { id: 6, name: 'Puna Yam (Large)', price: 35.0, category: 'STAPLES', description: 'Ideal for boiling or frying.', image: '/images/yam.jpg' },
  { id: 7, name: 'Palm Nut Pulp', price: 22.0, category: 'SOUP BASE', description: 'Freshly extracted.', image: '/images/palm-nut.jpg' },
  // Add these to the products array in server/src/index.ts
{ 
  id: 8, 
  name: 'Organic Shito (Black Pepper Sauce)', 
  price: 18.00, 
  category: 'PRESERVES', 
  description: 'Slow-cooked with smoked shrimp and ginger. The executive choice for any meal.',
  image: '/images/shito.jpg' 
},
{ 
  id: 9, 
  name: 'Aged Ghanaian Forest Honey', 
  price: 28.00, 
  category: 'PREMIUM', 
  description: 'Wild-harvested, raw, and unfiltered honey from the Ashanti region.',
  image: '/images/honey.jpg' 
},
{ 
  id: 10, 
  name: 'Pre-Peeled Cassava (Vacuum Sealed)', 
  price: 12.00, 
  category: 'STAPLES', 
  description: 'Cleaned, peeled, and ready for boiling or frying. Maximum convenience.',
  image: '/images/cassava-sealed.jpg' 
},
{ 
  id: 11, 
  name: 'Authentic Spiced Ginger Base', 
  price: 14.00, 
  category: 'PREP', 
  description: 'Freshly crushed ginger and garlic blend for professional-grade seasoning.',
  image: '/images/ginger-base.jpg' 
}
];

io.on('connection', (socket) => {
  console.log('⚡ Storefront linked to Broadcaster');
});

// AUTHENTICATION GATE
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPass = process.env.ADMIN_PASSWORD || "borga123";
  if (password === adminPass) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    return res.json({ success: true, token });
  }
  res.status(401).json({ success: false, message: 'Unauthorized Access' });
});

// TRACKING ENDPOINT (#17)
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === parseInt(id));
  if (order) return res.json(order);
  res.status(404).json({ message: 'Order Not Found' });
});

app.get('/api/products', (req, res) => res.json(products));
app.get('/api/orders', (req, res) => res.json(orders));

app.post('/api/orders', (req, res) => {
  const newOrder = { id: Date.now(), ...req.body, status: 'pending', createdAt: new Date() };
  orders.push(newOrder);
  res.status(201).json({ message: 'Order created', order: newOrder });
});

app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const index = orders.findIndex(o => o.id === parseInt(id));
  if (index > -1) {
    orders[index].status = status;
    const broadcaster = req.app.get('socketio');
    broadcaster.emit('orderStatusUpdated', { 
        orderId: id, 
        itemName: orders[index].itemName || orders[index].name, 
        status 
    });
    res.json({ message: 'Status broadcasted', order: orders[index] });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 API BROADCASTER: LIVE at http://localhost:${PORT}`);
});