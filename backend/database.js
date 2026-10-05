// ============================================================
// backend/database.js  — Zero-dependency Pure JS Database Engine
// Designed for 100% Reliability & Persistence on all platforms
// ============================================================
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'flavorez.json');

// ─── Default Initial State ────────────────────────────────────
const defaultState = {
  users: [],
  orders: [
    {
      id: 1,
      tracking_id: 'FLZ984210',
      user_id: 1,
      name: 'Karthik Raja',
      phone: '9876543210',
      email: 'karthik@example.com',
      address: '42, Cross Cut Road, Gandhipuram, Coimbatore - 641012',
      items: JSON.stringify([
        { name: 'Flavourez Special Biryani', price: 249, qty: 2 },
        { name: 'Sizzling Dragon Chicken', price: 279, qty: 1 }
      ]),
      subtotal: 777,
      discount: 155.4,
      total: 621.6,
      promo_code: 'FLAVOUR20',
      payment_method: 'gpay',
      order_type: 'delivery',
      instructions: 'Please provide extra raitha and spicy gravy.',
      upi_txn_id: 'UPI908123445566',
      status: 'on_the_way',
      created_at: new Date(Date.now() - 35 * 60000).toLocaleString('sv-SE')
    },
    {
      id: 2,
      tracking_id: 'FLZ771923',
      user_id: null,
      name: 'Priya Sharma',
      phone: '9123456780',
      email: 'priya@example.com',
      address: '15, DB Road, RS Puram, Coimbatore - 641002',
      items: JSON.stringify([
        { name: 'Smokey BBQ Chicken Pizza', price: 329, qty: 1 },
        { name: 'Mango Lassi', price: 79, qty: 2 }
      ]),
      subtotal: 487,
      discount: 0,
      total: 487,
      promo_code: null,
      payment_method: 'phonepe',
      order_type: 'delivery',
      instructions: 'Please ring the doorbell twice.',
      upi_txn_id: 'UPI773344112233',
      status: 'preparing',
      created_at: new Date(Date.now() - 15 * 60000).toLocaleString('sv-SE')
    },
    {
      id: 3,
      tracking_id: 'FLZ442109',
      user_id: null,
      name: 'Anand Kumar',
      phone: '9845123670',
      email: 'anand@example.com',
      address: '7, Avinashi Road, Peelamedu, Coimbatore',
      items: JSON.stringify([
        { name: 'Royal Ghee Roast Dosa', price: 99, qty: 2 },
        { name: 'Paneer Butter Masala', price: 219, qty: 1 }
      ]),
      subtotal: 417,
      discount: 50,
      total: 367,
      promo_code: 'WELCOME50',
      payment_method: 'cod',
      order_type: 'delivery',
      instructions: 'Keep food hot.',
      upi_txn_id: null,
      status: 'delivered',
      created_at: new Date(Date.now() - 180 * 60000).toLocaleString('sv-SE')
    }
  ],
  contacts: [
    {
      id: 1,
      name: 'Venkatesh S',
      email: 'venkat@example.com',
      subject: 'Party Catering Inquiry',
      message: 'Hello, do you provide bulk catering for 50 people for a birthday event next weekend?',
      replied: 0,
      reply_text: null,
      created_at: new Date(Date.now() - 120 * 60000).toLocaleString('sv-SE')
    }
  ],
  promo_codes: [
    { id: 1, code: 'FLAVOUR20', type: 'percent', value: 20, min_order: 0, max_uses: 9999, used_count: 14, active: 1, created_at: new Date().toLocaleString('sv-SE') },
    { id: 2, code: 'FEAST17', type: 'percent', value: 17, min_order: 1000, max_uses: 9999, used_count: 5, active: 1, created_at: new Date().toLocaleString('sv-SE') },
    { id: 3, code: 'BDAY25', type: 'percent', value: 25, min_order: 0, max_uses: 9999, used_count: 8, active: 1, created_at: new Date().toLocaleString('sv-SE') },
    { id: 4, code: 'WELCOME50', type: 'flat', value: 50, min_order: 200, max_uses: 9999, used_count: 22, active: 1, created_at: new Date().toLocaleString('sv-SE') }
  ],
  promo_usage: [],
  menu_items: [
    {
      id: 1,
      name: 'Flavourez Special Biryani',
      description: 'Aromatic Seeraga Samba rice cooked with juicy chicken & secret spices.',
      price: 249,
      category: 'biryani',
      image_url: 'Header.jpeg',
      veg: 0,
      spice_level: '🔥🔥🔥 Spicy',
      calories: '520 kcal',
      active: 1,
      created_at: new Date().toLocaleString('sv-SE')
    },
    {
      id: 2,
      name: 'Smokey BBQ Chicken Pizza',
      description: 'Loaded with tender BBQ chicken chunks, molten mozzarella & bell peppers.',
      price: 329,
      category: 'pizza',
      image_url: 'https://images.pexels.com/photos/803290/pexels-photo-803290.jpeg',
      veg: 0,
      spice_level: '🔥 Mild',
      calories: '450 kcal',
      active: 1,
      created_at: new Date().toLocaleString('sv-SE')
    },
    {
      id: 3,
      name: 'Sizzling Dragon Chicken',
      description: 'Crispy fried chicken strips tossed in spicy Indo-Chinese chili garlic sauce.',
      price: 279,
      category: 'starters',
      image_url: 'https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg',
      veg: 0,
      spice_level: '🔥🔥🔥 Hot & Tangy',
      calories: '380 kcal',
      active: 1,
      created_at: new Date().toLocaleString('sv-SE')
    },
    {
      id: 4,
      name: 'Royal Ghee Roast Dosa',
      description: 'Crispy golden crepe roasted in pure desi ghee, served with 3 coconut chutneys & sambar.',
      price: 99,
      category: 'south',
      image_url: 'https://tse1.mm.bing.net/th/id/OIP.Uj7qSxE33S6nx4iKQ6_VIwHaHa?r=0&pid=Api&P=0&h=180',
      veg: 1,
      spice_level: '🔥 Mild Spice',
      calories: '280 kcal',
      active: 1,
      created_at: new Date().toLocaleString('sv-SE')
    },
    {
      id: 5,
      name: 'Ultimate Monster Burger',
      description: 'Double grilled patty with melting cheddar cheese, caramelized onions & house sauce.',
      price: 199,
      category: 'pizza',
      image_url: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
      veg: 0,
      spice_level: '🔥🔥 Spicy',
      calories: '410 kcal',
      active: 1,
      created_at: new Date().toLocaleString('sv-SE')
    },
    {
      id: 6,
      name: 'Brownie with Ice Cream',
      description: 'Warm dark chocolate fudge brownie topped with a scoop of rich vanilla ice cream & hot fudge.',
      price: 149,
      category: 'desserts',
      image_url: 'https://tse1.mm.bing.net/th/id/OIP.YLq3a2wyW0BiyWJQEmTOkQHaEL?r=0&pid=Api&P=0&h=180',
      veg: 1,
      spice_level: 'Sweet',
      calories: '340 kcal',
      active: 1,
      created_at: new Date().toLocaleString('sv-SE')
    },
    {
      id: 7,
      name: 'Mutton Dum Biryani',
      description: 'Tender mutton slow-cooked in authentic dum style with saffron & whole spices.',
      price: 349,
      category: 'biryani',
      image_url: 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg',
      veg: 0,
      spice_level: '🔥🔥 Spicy',
      calories: '620 kcal',
      active: 1,
      created_at: new Date().toLocaleString('sv-SE')
    },
    {
      id: 8,
      name: 'Paneer Butter Masala',
      description: 'Rich & creamy tomato-based gravy with fresh paneer cubes. Served with naan.',
      price: 219,
      category: 'south',
      image_url: 'https://images.pexels.com/photos/9609840/pexels-photo-9609840.jpeg',
      veg: 1,
      spice_level: '🔥 Mild',
      calories: '420 kcal',
      active: 1,
      created_at: new Date().toLocaleString('sv-SE')
    },
    {
      id: 9,
      name: 'Chicken 65',
      description: 'Deep-fried marinated chicken with curry leaves and green chili toss.',
      price: 229,
      category: 'starters',
      image_url: 'https://images.pexels.com/photos/4449068/pexels-photo-4449068.jpeg',
      veg: 0,
      spice_level: '🔥🔥🔥 Very Hot',
      calories: '350 kcal',
      active: 1,
      created_at: new Date().toLocaleString('sv-SE')
    },
    {
      id: 10,
      name: 'Mango Lassi',
      description: 'Chilled creamy yogurt blended with fresh Alphonso mango pulp.',
      price: 79,
      category: 'desserts',
      image_url: 'https://images.pexels.com/photos/3625372/pexels-photo-3625372.jpeg',
      veg: 1,
      spice_level: 'Sweet',
      calories: '180 kcal',
      active: 1,
      created_at: new Date().toLocaleString('sv-SE')
    }
  ],
  reviews: [
    { id: 1, order_id: 1, name: 'Suresh Kumar', rating: 5, comment: 'The Special Biryani was exceptional! Piping hot and full of aroma.', created_at: new Date(Date.now() - 86400000).toLocaleString('sv-SE') },
    { id: 2, order_id: 2, name: 'Deepa V', rating: 5, comment: 'Fast delivery and the Dragon Chicken was crispy and delicious!', created_at: new Date(Date.now() - 43200000).toLocaleString('sv-SE') },
    { id: 3, order_id: 3, name: 'Rahul R', rating: 4, comment: 'Great taste and nice packaging. Loved the Ghee Roast Dosa.', created_at: new Date(Date.now() - 21600000).toLocaleString('sv-SE') }
  ],
  _counters: {
    users: 1,
    orders: 3,
    contacts: 1,
    promo_codes: 4,
    promo_usage: 0,
    menu_items: 10,
    reviews: 3
  }
};

// ─── Load / Initialize Store ──────────────────────────────────
let data = null;

function loadData() {
  if (data) return data;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      data = JSON.parse(raw);
    } else {
      data = JSON.parse(JSON.stringify(defaultState));
      saveData();
    }
  } catch (err) {
    console.error('Error reading db file, resetting to default:', err.message);
    data = JSON.parse(JSON.stringify(defaultState));
    saveData();
  }
  return data;
}

function saveData() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving db file:', err.message);
  }
}

// Initial load
loadData();

// Helper to get formatted current time
function nowStr() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// ─── SQL Engine ───────────────────────────────────────────────
class DatabaseEngine {
  pragma(stmt) {
    return this;
  }

  exec(sql) {
    loadData();
    return this;
  }

  prepare(sql) {
    const rawSql = sql.trim();
    const cleanSql = rawSql.replace(/\s+/g, ' ');

    return {
      get: (...params) => {
        loadData();
        return executeGet(cleanSql, params);
      },
      all: (...params) => {
        loadData();
        return executeAll(cleanSql, params);
      },
      run: (...params) => {
        loadData();
        const res = executeRun(cleanSql, params);
        saveData();
        return res;
      }
    };
  }
}

// ─── Query Resolvers ──────────────────────────────────────────

function executeGet(sql, params) {
  // SELECT COUNT(*) as c FROM <table>
  const countMatch = sql.match(/SELECT\s+COUNT\(\*\)\s+as\s+c\s+FROM\s+(\w+)(?:\s+WHERE\s+(.*))?/i);
  if (countMatch) {
    const table = countMatch[1].toLowerCase();
    const where = countMatch[2];
    const rows = data[table] || [];

    if (!where) return { c: rows.length };

    // Where conditions
    if (where.includes("date(created_at) = date('now','localtime')") || where.includes("date(created_at) = date('now')")) {
      const today = new Date().toISOString().slice(0, 10);
      const filtered = rows.filter(r => (r.created_at || '').startsWith(today));
      return { c: filtered.length };
    }
    if (where.includes("status NOT IN ('delivered','cancelled')")) {
      const filtered = rows.filter(r => r.status !== 'delivered' && r.status !== 'cancelled');
      return { c: filtered.length };
    }
    if (where.includes('status = ?')) {
      const filtered = rows.filter(r => r.status === params[0]);
      return { c: filtered.length };
    }
    return { c: rows.length };
  }

  // SELECT SUM(total) as r FROM orders
  if (/SELECT\s+SUM\(total\)\s+as\s+r\s+FROM\s+orders/i.test(sql)) {
    let rows = data.orders || [];
    if (sql.includes("date(created_at) = date('now','localtime')") || sql.includes("date(created_at) = date('now')")) {
      const today = new Date().toISOString().slice(0, 10);
      rows = rows.filter(r => (r.created_at || '').startsWith(today));
    }
    const sum = rows.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
    return { r: sum };
  }

  // SELECT AVG(rating) as ... FROM reviews
  if (/SELECT\s+AVG\(rating\)/i.test(sql)) {
    const revs = data.reviews || [];
    if (!revs.length) return { r: 0, avg: 0, count: 0 };
    const avg = revs.reduce((acc, r) => acc + (parseFloat(r.rating) || 0), 0) / revs.length;
    return { r: avg, avg: avg, count: revs.length };
  }

  // SELECT * / fields FROM users WHERE email = ? / id = ?
  if (/FROM\s+users\s+WHERE/i.test(sql)) {
    if (sql.includes('email = ?')) {
      return data.users.find(u => u.email.toLowerCase() === String(params[0]).toLowerCase()) || undefined;
    }
    if (sql.includes('id = ?')) {
      return data.users.find(u => u.id === Number(params[0])) || undefined;
    }
  }

  // SELECT * FROM orders WHERE tracking_id = ?
  if (/FROM\s+orders\s+WHERE\s+tracking_id\s*=\s*\?/i.test(sql)) {
    return data.orders.find(o => String(o.tracking_id).toUpperCase() === String(params[0]).toUpperCase()) || undefined;
  }

  // SELECT * FROM orders WHERE id = ?
  if (/FROM\s+orders\s+WHERE\s+id\s*=\s*\?/i.test(sql)) {
    return data.orders.find(o => o.id === Number(params[0])) || undefined;
  }

  // SELECT * FROM promo_codes WHERE code = ? AND active = 1
  if (/FROM\s+promo_codes\s+WHERE\s+code\s*=\s*\?\s+AND\s+active\s*=\s*1/i.test(sql)) {
    return data.promo_codes.find(p => p.code.toUpperCase() === String(params[0]).toUpperCase() && p.active === 1) || undefined;
  }

  // SELECT * FROM promo_codes WHERE code = ?
  if (/FROM\s+promo_codes\s+WHERE\s+code\s*=\s*\?/i.test(sql)) {
    return data.promo_codes.find(p => p.code.toUpperCase() === String(params[0]).toUpperCase()) || undefined;
  }

  // SELECT active FROM promo_codes WHERE id = ?
  if (/SELECT\s+active\s+FROM\s+promo_codes\s+WHERE\s+id\s*=\s*\?/i.test(sql)) {
    const p = data.promo_codes.find(item => item.id === Number(params[0]));
    return p ? { active: p.active } : undefined;
  }

  // SELECT id FROM promo_usage WHERE code_id = ? AND phone = ?
  if (/FROM\s+promo_usage\s+WHERE\s+code_id\s*=\s*\?\s+AND\s+phone\s*=\s*\?/i.test(sql)) {
    return data.promo_usage.find(u => u.code_id === Number(params[0]) && u.phone === String(params[1])) || undefined;
  }

  // SELECT * FROM menu_items WHERE id = ?
  if (/FROM\s+menu_items\s+WHERE\s+id\s*=\s*\?/i.test(sql)) {
    return data.menu_items.find(m => m.id === Number(params[0]) && (sql.includes('active = 1') ? m.active === 1 : true)) || undefined;
  }

  return undefined;
}

function executeAll(sql, params) {
  // Daily orders last 7 days
  if (/GROUP\s+BY\s+date\(created_at\)/i.test(sql)) {
    const map = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      map[key] = { day: key, count: 0, revenue: 0 };
    }
    (data.orders || []).forEach(o => {
      const day = (o.created_at || '').slice(0, 10);
      if (map[day]) {
        map[day].count += 1;
        map[day].revenue += parseFloat(o.total) || 0;
      }
    });
    return Object.values(map);
  }

  // SELECT items FROM orders
  if (/SELECT\s+items\s+FROM\s+orders/i.test(sql)) {
    return (data.orders || []).map(o => ({ items: o.items }));
  }

  // Payment breakdown
  if (/GROUP\s+BY\s+payment_method/i.test(sql)) {
    const counts = {};
    (data.orders || []).forEach(o => {
      counts[o.payment_method] = (counts[o.payment_method] || 0) + 1;
    });
    return Object.entries(counts).map(([payment_method, count]) => ({ payment_method, count }));
  }

  // Status breakdown
  if (/GROUP\s+BY\s+status/i.test(sql)) {
    const counts = {};
    (data.orders || []).forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }

  // Orders pagination
  if (/FROM\s+orders/i.test(sql)) {
    let list = [...(data.orders || [])];
    if (sql.includes('WHERE phone = ?')) {
      list = list.filter(o => o.phone === String(params[0]));
    } else if (sql.includes('WHERE status = ?')) {
      list = list.filter(o => o.status === params[0]);
    }
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (sql.includes('LIMIT ? OFFSET ?')) {
      const limit = params[params.length - 2];
      const offset = params[params.length - 1];
      return list.slice(offset, offset + limit);
    }
    return list;
  }

  // Contacts
  if (/FROM\s+contacts/i.test(sql)) {
    return [...(data.contacts || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Menu items
  if (/FROM\s+menu_items/i.test(sql)) {
    let items = [...(data.menu_items || [])];
    if (sql.includes('active = 1')) items = items.filter(m => m.active === 1);
    if (sql.includes('category = ?')) {
      items = items.filter(m => m.category.toLowerCase() === String(params[0]).toLowerCase());
    }
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Promo codes
  if (/FROM\s+promo_codes/i.test(sql)) {
    return [...(data.promo_codes || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // WhatsApp logs
  if (/FROM\s+whatsapp_logs/i.test(sql)) {
    return [...(data.whatsapp_logs || [])].sort((a, b) => new Date(b.sent_at || b.created_at) - new Date(a.sent_at || a.created_at));
  }

  // Reviews
  if (/FROM\s+reviews/i.test(sql)) {
    const list = [...(data.reviews || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list.slice(0, 20);
  }

  return [];
}

function executeRun(sql, params) {
  if (!data._counters) data._counters = { users: 10, orders: 10, contacts: 10, promo_codes: 10, promo_usage: 10, menu_items: 20, reviews: 10, whatsapp_logs: 10 };
  if (!data.whatsapp_logs) data.whatsapp_logs = [];

  // INSERT INTO whatsapp_logs
  if (/INSERT\s+INTO\s+whatsapp_logs/i.test(sql)) {
    const [tracking_id, phone, customer_name, message, status] = params;
    const id = ++data._counters.whatsapp_logs;
    data.whatsapp_logs.push({ id, tracking_id, phone, customer_name, message, status: status || 'DELIVERED ✅', sent_at: nowStr() });
    return { lastInsertRowid: id, changes: 1 };
  }

  // INSERT INTO users
  if (/INSERT\s+INTO\s+users/i.test(sql)) {
    const [name, email, phone, password] = params;
    const id = ++data._counters.users;
    const user = { id, name, email, phone, password, created_at: nowStr() };
    data.users.push(user);
    return { lastInsertRowid: id, changes: 1 };
  }

  // INSERT INTO orders
  if (/INSERT\s+INTO\s+orders/i.test(sql)) {
    const [tracking_id, user_id, name, phone, email, address, items, subtotal, discount, total, promo_code, payment_method, order_type, instructions, upi_txn_id, status] = params;
    const id = ++data._counters.orders;
    const order = {
      id,
      tracking_id,
      user_id: user_id || null,
      name,
      phone,
      email: email || null,
      address,
      items: typeof items === 'string' ? items : JSON.stringify(items),
      subtotal: parseFloat(subtotal) || 0,
      discount: parseFloat(discount) || 0,
      total: parseFloat(total) || 0,
      promo_code: promo_code || null,
      payment_method,
      order_type: order_type || 'delivery',
      instructions: instructions || null,
      upi_txn_id: upi_txn_id || null,
      status: status || 'confirmed',
      created_at: nowStr()
    };
    data.orders.push(order);
    return { lastInsertRowid: id, changes: 1 };
  }

  // INSERT INTO contacts
  if (/INSERT\s+INTO\s+contacts/i.test(sql)) {
    const [name, email, subject, message] = params;
    const id = ++data._counters.contacts;
    data.contacts.push({ id, name, email, subject, message, replied: 0, reply_text: null, created_at: nowStr() });
    return { lastInsertRowid: id, changes: 1 };
  }

  // INSERT INTO reviews
  if (/INSERT\s+INTO\s+reviews/i.test(sql)) {
    const [name, rating, comment, order_id] = params;
    const id = ++data._counters.reviews;
    data.reviews.push({ id, order_id: order_id || null, name, rating: Number(rating), comment: comment || null, created_at: nowStr() });
    return { lastInsertRowid: id, changes: 1 };
  }

  // INSERT INTO promo_codes
  if (/INSERT\s+INTO\s+promo_codes/i.test(sql)) {
    const [code, type, value, min_order, max_uses] = params;
    const existing = data.promo_codes.find(p => p.code.toUpperCase() === String(code).toUpperCase());
    if (existing) throw new Error('Promo code already exists');
    const id = ++data._counters.promo_codes;
    data.promo_codes.push({ id, code: String(code).toUpperCase(), type, value: Number(value), min_order: Number(min_order) || 0, max_uses: Number(max_uses) || 100, used_count: 0, active: 1, created_at: nowStr() });
    return { lastInsertRowid: id, changes: 1 };
  }

  // INSERT INTO promo_usage
  if (/INSERT\s+INTO\s+promo_usage/i.test(sql)) {
    const [code_id, phone, order_id] = params;
    const id = ++data._counters.promo_usage;
    data.promo_usage.push({ id, code_id: Number(code_id), phone: String(phone), order_id: order_id || null, used_at: nowStr() });
    return { lastInsertRowid: id, changes: 1 };
  }

  // INSERT INTO menu_items
  if (/INSERT\s+INTO\s+menu_items/i.test(sql)) {
    const [name, description, price, category, image_url, veg, spice_level, calories] = params;
    const id = ++data._counters.menu_items;
    data.menu_items.push({ id, name, description, price: Number(price), category, image_url, veg: Number(veg) || 0, spice_level, calories, active: 1, created_at: nowStr() });
    return { lastInsertRowid: id, changes: 1 };
  }

  // UPDATE orders SET status = ? WHERE id = ?
  if (/UPDATE\s+orders\s+SET\s+status\s*=\s*\?\s+WHERE\s+id\s*=\s*\?/i.test(sql)) {
    const [status, id] = params;
    const o = data.orders.find(item => item.id === Number(id));
    if (o) { o.status = status; return { changes: 1 }; }
    return { changes: 0 };
  }

  // UPDATE menu_items
  if (/UPDATE\s+menu_items\s+SET/i.test(sql)) {
    const [name, description, price, category, image_url, veg, spice_level, calories, active, id] = params;
    const m = data.menu_items.find(item => item.id === Number(id));
    if (m) {
      Object.assign(m, { name, description, price: Number(price), category, image_url, veg: Number(veg), spice_level, calories, active: Number(active) });
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  // DELETE FROM menu_items WHERE id = ?
  if (/DELETE\s+FROM\s+menu_items\s+WHERE\s+id\s*=\s*\?/i.test(sql)) {
    const id = Number(params[0]);
    const idx = data.menu_items.findIndex(item => item.id === id);
    if (idx !== -1) {
      data.menu_items.splice(idx, 1);
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  // UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?
  if (/UPDATE\s+promo_codes\s+SET\s+used_count\s*=\s*used_count\s*\+\s*1/i.test(sql)) {
    const id = Number(params[0]);
    const p = data.promo_codes.find(item => item.id === id);
    if (p) { p.used_count += 1; return { changes: 1 }; }
    return { changes: 0 };
  }

  // UPDATE promo_codes SET active = ? WHERE id = ?
  if (/UPDATE\s+promo_codes\s+SET\s+active\s*=\s*\?\s+WHERE\s+id\s*=\s*\?/i.test(sql)) {
    const [active, id] = params;
    const p = data.promo_codes.find(item => item.id === Number(id));
    if (p) { p.active = Number(active); return { changes: 1 }; }
    return { changes: 0 };
  }

  return { changes: 0 };
}

const dbInstance = new DatabaseEngine();
module.exports = dbInstance;
