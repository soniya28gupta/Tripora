const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Basic .env parser (zero external dependencies)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    });
  } catch (e) {
    console.warn('Could not parse .env file:', e.message);
  }
}

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp'
};

/* ===================================================================
   TRIPORA PLATFORM KNOWLEDGE BASE FOR NOVA AI
   =================================================================== */
const TRIPORA_KNOWLEDGE = {
  destinations: [
    { name: 'Bali', country: 'Indonesia', desc: 'Rice terraces, sacred temple coasts, surf breaks and tranquil mornings by the sea.', season: 'Apr–Oct', basePrice: 540, tags: ['beach', 'relaxation', 'budget', 'culture', 'tropical'] },
    { name: 'Kyoto', country: 'Japan', desc: 'Lantern-lit lanes, serene tea houses, bamboo groves and maple valleys.', season: 'Mar–May, Oct–Nov', basePrice: 920, tags: ['culture', 'food', 'heritage', 'autumn', 'spring'] },
    { name: 'Santorini', country: 'Greece', desc: 'Whitewashed cliffside villages, caldera views and unforgettable Aegean sunsets.', season: 'May–Oct', basePrice: 850, tags: ['romantic', 'luxury', 'beach', 'sunset', 'islands'] },
    { name: 'Zermatt', country: 'Switzerland', desc: 'Matterhorn views, glacier express rail, car-free alpine village and world-class trails.', season: 'Jun–Sep, Dec–Mar', basePrice: 1350, tags: ['adventure', 'mountains', 'luxury', 'skiing', 'hiking'] },
    { name: 'Amalfi Coast', country: 'Italy', desc: 'Pastel cliffside fishing towns, lemon-scented terraces and scenic sea drives.', season: 'May–Sep', basePrice: 1100, tags: ['romantic', 'coastal', 'food', 'scenic', 'luxury'] },
    { name: 'Banff', country: 'Canada', desc: 'Turquoise glacial lakes, dramatic Rocky Mountain peaks, pine forests and wildlife.', season: 'Jun–Sep', basePrice: 750, tags: ['adventure', 'nature', 'hiking', 'mountains', 'family'] }
  ],
  hotels: [
    { title: 'Grand Luxe Oia Suites', loc: 'Santorini, Greece', rate: 320, rating: 4.9, tags: 'Infinity pool · Sea view · Spa' },
    { title: 'Roku Zen Resort & Spa', loc: 'Kyoto, Japan', rate: 410, rating: 4.8, tags: 'Onsen · Traditional garden · Fine dining' },
    { title: 'The Azure Amalfi Hotel', loc: 'Amalfi, Italy', rate: 290, rating: 4.7, tags: 'Beachfront · Private sunlit terraces' }
  ],
  packages: [
    { title: 'Santorini & Mykonos Dream', duration: '7 days, 6 nights', rate: 1450, type: 'Romantic', highlights: 'Sunset catamaran cruise, cliffside boutique stays' },
    { title: 'Alpine Majesty & Swiss Rail', duration: '8 days, 7 nights', rate: 1890, type: 'Adventure', highlights: 'Glacier Express panoramic ride, Matterhorn viewing platform' },
    { title: 'Kyoto Heritage & Tokyo Lights', duration: '9 days, 8 nights', rate: 2100, type: 'Cultural', highlights: 'Tea ceremony with Zen master, bullet train pass, skyline dinner' }
  ],
  flights: [
    { airline: 'Emirates', code: 'EK-202', route: 'JFK → DXB', price: 780, type: 'Non-stop' },
    { airline: 'Singapore Airlines', code: 'SQ-026', route: 'JFK → SIN', price: 940, type: '1 stop' },
    { airline: 'Lufthansa', code: 'LH-401', route: 'JFK → FRA', price: 560, type: 'Non-stop' }
  ]
};

/* ===================================================================
   INTELLIGENT CONVERSATIONAL ENGINE (DEMO & BACKEND LOGIC)
   =================================================================== */
function handleNovaConversation(messages, context = {}) {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const userText = (lastUserMsg ? lastUserMsg.content : '').trim().toLowerCase();
  const userName = context.userName ? context.userName.split(' ')[0] : 'traveller';

  // Gather conversational memory across turns
  let matchedDest = null;
  for (const d of TRIPORA_KNOWLEDGE.destinations) {
    if (messages.some(m => m.content && m.content.toLowerCase().includes(d.name.toLowerCase()))) {
      matchedDest = d;
    }
  }

  // Check specific intent keywords in user's query
  const isGreeting = /^(hi|hello|hey|greetings|good\s(morning|afternoon|evening))/i.test(userText);
  const wantsItinerary = /(plan|itinerary|schedule|day-by-day|3-day|5-day|7-day|routine|what to do)/i.test(userText);
  const wantsBudget = /(budget|cost|price|expense|estimate|how much|under|cheap|affordable)/i.test(userText);
  const wantsHotels = /(hotel|stay|resort|accommodation|room|villa)/i.test(userText);
  const wantsRomantic = /(romantic|couple|honeymoon|anniversary)/i.test(userText);
  const wantsAdventure = /(adventure|hiking|mountain|trekking|thrill|nature)/i.test(userText);
  const wantsFlights = /(flight|airline|fly|plane|ticket)/i.test(userText);

  let replyText = '';
  let cards = [];
  let followUps = [];

  // 1. GREETING INTENT
  if (isGreeting && userText.length < 25) {
    replyText = `Hello ${userName}! 👋 I'm **Nova AI**, your personal Tripora travel planner.\n\nWhether you're dreaming of a peaceful seaside getaway, a bustling cultural expedition, or an alpine adventure, I'm here to curate your itinerary, budget, and stays.\n\nWhere would you like to travel next, or should I suggest a destination based on your style?`;
    followUps = [
      'Find my perfect destination',
      'Plan a 3-day romantic trip',
      'Suggest budget-friendly holidays',
      'Show top rated hotels'
    ];
    return { role: 'assistant', content: replyText, cards, followUps, mode: 'smart-engine' };
  }

  // 2. ROMANTIC / HONEYMOON INTENT
  if (wantsRomantic) {
    const santorini = TRIPORA_KNOWLEDGE.destinations.find(d => d.name === 'Santorini');
    replyText = `For a deeply romantic escape, I highly recommend **Santorini (Greece)** or the **Amalfi Coast (Italy)**! 🌅\n\n- **Santorini**: Renowned for sunset caldera views, private cliffside plunge pools, and intimate Aegean catamaran dinner cruises.\n- **Amalfi Coast**: Picture-perfect pastel villages perched over sapphire seas with lemon grove walks and candlelit terrace dining.\n\nBoth destinations offer curated stays directly in Tripora's inventory:`;
    cards = [
      { type: 'destination', title: 'Santorini, Greece', desc: santorini.desc, badge: 'Top Romantic Choice', action: 'explore_dest', target: 'Santorini' },
      { type: 'hotel', title: 'Grand Luxe Oia Suites', desc: '★ 4.9 · Infinity pool, Caldera view, Luxury Spa', rate: '$320 / night', action: 'view_hotels' },
      { type: 'package', title: 'Santorini & Mykonos Dream', desc: '7 days, 6 nights · Sunset Catamaran & Boutique Stays', rate: '$1,450 / person', action: 'view_holidays' }
    ];
    followUps = ['Plan a 4-day Santorini itinerary', 'What is the estimated budget for Santorini?', 'Show flights to Greece'];
    return { role: 'assistant', content: replyText, cards, followUps, mode: 'smart-engine' };
  }

  // 3. ADVENTURE / NATURE INTENT
  if (wantsAdventure) {
    const zermatt = TRIPORA_KNOWLEDGE.destinations.find(d => d.name === 'Zermatt');
    const banff = TRIPORA_KNOWLEDGE.destinations.find(d => d.name === 'Banff');
    replyText = `If high-adrenaline trails and stunning natural vistas are what you crave, explore **Zermatt (Switzerland)** or **Banff (Canada)**! 🏔️\n\n- **Zermatt**: Stand beneath the mighty Matterhorn, ride the panoramic Glacier Express, and hike scenic alpine passes in a car-free wonderland.\n- **Banff**: Paddle turquoise glacier lakes like Lake Louise and Moraine Lake, with scenic drives through the Canadian Rockies.\n\nHere are matched Tripora packages and stays for adventure seekers:`;
    cards = [
      { type: 'destination', title: 'Zermatt, Switzerland', desc: zermatt.desc, badge: 'Alpine Wonder', action: 'explore_dest', target: 'Zermatt' },
      { type: 'destination', title: 'Banff, Canada', desc: banff.desc, badge: 'Rocky Mountain Escape', action: 'explore_dest', target: 'Banff' },
      { type: 'package', title: 'Alpine Majesty & Swiss Rail', desc: '8 days, 7 nights · Glacier Express & Matterhorn Chalets', rate: '$1,890 / person', action: 'view_holidays' }
    ];
    followUps = ['Plan a 3-day Swiss Alps itinerary', 'What is the best season for Banff?', 'Check budget for Zermatt'];
    return { role: 'assistant', content: replyText, cards, followUps, mode: 'smart-engine' };
  }

  // 4. ITINERARY PLANNING (e.g. "Plan a 3-day trip to Kyoto" or "Plan an itinerary")
  if (wantsItinerary) {
    const targetDest = matchedDest || TRIPORA_KNOWLEDGE.destinations[1]; // Kyoto by default
    const days = userText.includes('5') ? 5 : userText.includes('7') ? 7 : 3;

    replyText = `Here is a curated **${days}-Day Itinerary for ${targetDest.name} (${targetDest.country})** designed for a balanced and immersive experience! 🗺️\n\n` +
      `📅 **Day 1: Arrival, Ancient Quarters & Sunset Dining**\n` +
      `• *Morning*: Check into your stay and take an introductory stroll through historic alleys.\n` +
      `• *Afternoon*: Visit key landmarks, heritage shrines, and local artisan markets.\n` +
      `• *Evening*: Enjoy a traditional culinary tasting dinner along lantern-lit canals.\n\n` +
      `📅 **Day 2: Cultural Immersion & Scenic Nature**\n` +
      `• *Morning*: Early morning bamboo forest or temple garden walk to beat crowds.\n` +
      `• *Afternoon*: Authentic tea ceremony or local guided culinary workshop.\n` +
      `• *Evening*: Sunset panoramic viewpoint followed by local nightlife & dessert cafes.\n\n` +
      `📅 **Day 3: Hidden Gems, Shopping & Farewell Views**\n` +
      `• *Morning*: Scenic mountain tram or coastal walk followed by souvenir shopping.\n` +
      `• *Afternoon*: Art museum or local craft studios; relaxed lunch.\n` +
      `• *Evening*: Celebratory farewell dinner at a rooftop or waterfront venue.\n\n` +
      `💡 *Estimated Daily Budget*: ~$180–$250/day per person for lodging, meals, and local transit.`;

    cards = [
      { type: 'destination', title: `${targetDest.name}, ${targetDest.country}`, desc: targetDest.desc, badge: `Best in ${targetDest.season}`, action: 'explore_dest', target: targetDest.name },
      { type: 'hotel', title: targetDest.name === 'Kyoto' ? 'Roku Zen Resort & Spa' : 'Grand Luxe Oia Suites', desc: 'Top verified Tripora partner stay', rate: 'Available to book', action: 'view_hotels' }
    ];
    followUps = [`Find flights to ${targetDest.name}`, `What are the best hotels in ${targetDest.name}?`, 'How much does this trip cost in total?'];
    return { role: 'assistant', content: replyText, cards, followUps, mode: 'smart-engine' };
  }

  // 5. BUDGET PLANNING INTENT
  if (wantsBudget) {
    const targetDest = matchedDest || TRIPORA_KNOWLEDGE.destinations[0]; // Bali
    replyText = `Here is a realistic **Budget Breakdown for ${targetDest.name}** (based on sample estimates for 5 days / 2 travellers): 💰\n\n` +
      `• 🏨 **Accommodation**: $300 – $650 (Boutique hotel / resort)\n` +
      `• ✈️ **Flights / Transit**: $450 – $800 (Economy round-trip sample)\n` +
      `• 🍜 **Food & Dining**: $180 – $300 (Mix of local bistros & signature dinners)\n` +
      `• 🎟️ **Activities & Sightseeing**: $100 – $220 (Guided tours, temple entries, boat rides)\n` +
      `• 🚕 **Local Transport**: $60 – $110 (Chauffeur transfers / taxis)\n\n` +
      `📊 **Estimated Total**: **~$1,090 – $2,080** for two travellers.\n\n` +
      `*Note: These figures are sample guidelines and depend on travel season and booking window.*`;

    cards = [
      { type: 'destination', title: `${targetDest.name}, ${targetDest.country}`, desc: `Base package from $${targetDest.basePrice}`, badge: 'Budget Friendly', action: 'explore_dest', target: targetDest.name },
      { type: 'package', title: `${targetDest.name} Curated Package`, desc: 'Includes hotel, breakfast & airport transfers', rate: 'Check availability', action: 'view_holidays' }
    ];
    followUps = [`Plan a budget 3-day itinerary for ${targetDest.name}`, 'Recommend budget hotels', 'Show flights with lowest prices'];
    return { role: 'assistant', content: replyText, cards, followUps, mode: 'smart-engine' };
  }

  // 6. HOTELS & STAYS INTENT
  if (wantsHotels) {
    replyText = `Here are top-rated accommodations currently featured in **Tripora's curated hotel collection**: 🏨\n\nEvery property is partner-verified with authentic reviews, flexible cancellation, and exclusive amenities:`;
    cards = TRIPORA_KNOWLEDGE.hotels.map(h => ({
      type: 'hotel',
      title: h.title,
      desc: `${h.loc} · ${h.tags}`,
      rate: `$${h.rate} / night · ★ ${h.rating}`,
      action: 'view_hotels'
    }));
    followUps = ['How do I book these hotels?', 'Plan an itinerary around Roku Zen Resort', 'Show budget hotel alternatives'];
    return { role: 'assistant', content: replyText, cards, followUps, mode: 'smart-engine' };
  }

  // 7. FLIGHTS INTENT
  if (wantsFlights) {
    replyText = `Tripora offers flight comparisons across premier global airlines. Here are sample available airline routes: ✈️\n\n• **Emirates (EK-202)**: JFK → DXB · Non-stop (12h 15m) · from $780\n• **Singapore Airlines (SQ-026)**: JFK → SIN · 1 stop · from $940\n• **Lufthansa (LH-401)**: JFK → FRA · Non-stop (7h 55m) · from $560\n\nYou can search live dates and passenger counts directly using the Flights search tab on Tripora.`;
    cards = [
      { type: 'flight', title: 'Emirates · JFK to DXB', desc: 'Departs 08:30 AM · Economy Non-stop', rate: '$780', action: 'view_flights' },
      { type: 'flight', title: 'Lufthansa · JFK to FRA', desc: 'Departs 04:00 PM · Economy Non-stop', rate: '$560', action: 'view_flights' }
    ];
    followUps = ['Search flights from my city', 'Do packages include flights?', 'Recommend hotels at destination'];
    return { role: 'assistant', content: replyText, cards, followUps, mode: 'smart-engine' };
  }

  // 8. SPECIFIC DESTINATION MATCH (e.g. "Tell me about Bali" or "Kyoto")
  const directDestMatch = TRIPORA_KNOWLEDGE.destinations.find(d => userText.includes(d.name.toLowerCase()));
  if (directDestMatch) {
    replyText = `**${directDestMatch.name} (${directDestMatch.country})** is an extraordinary travel destination! 🌟\n\n` +
      `• **Overview**: ${directDestMatch.desc}\n` +
      `• **Best Travel Window**: ${directDestMatch.season}\n` +
      `• **Sample Starting Package**: From ~$${directDestMatch.basePrice} per person\n\n` +
      `Would you like me to build a day-by-day itinerary, estimate a total trip budget, or show matched hotel stays for ${directDestMatch.name}?`;
    cards = [
      { type: 'destination', title: `${directDestMatch.name}, ${directDestMatch.country}`, desc: directDestMatch.desc, badge: `Best in ${directDestMatch.season}`, action: 'explore_dest', target: directDestMatch.name },
      { type: 'package', title: `${directDestMatch.name} Explorer Package`, desc: 'Stay, transfers and curated sightseeing', rate: `$${directDestMatch.basePrice}`, action: 'view_holidays' }
    ];
    followUps = [`Plan a 5-day itinerary for ${directDestMatch.name}`, `Budget breakdown for ${directDestMatch.name}`, `Find hotels in ${directDestMatch.name}`];
    return { role: 'assistant', content: replyText, cards, followUps, mode: 'smart-engine' };
  }

  // 9. GENERAL DESTINATION DISCOVERY / DEFAULT
  replyText = `I can help you find the ideal destination based on your preferences! Here are three top recommendations across distinct travel styles: 🌍\n\n` +
    `1. 🏝️ **Bali, Indonesia** — Tropical coastlines, sacred temples, and slow-paced beach relaxation (Best: Apr–Oct).\n` +
    `2. 🍁 **Kyoto, Japan** — Timeless culture, bamboo groves, lantern lanes, and world-class culinary mastery (Best: Mar–May, Oct–Nov).\n` +
    `3. 🏔️ **Zermatt, Switzerland** — Majestic alpine trails and iconic Matterhorn views from a tranquil village (Best: Jun–Sep, Dec–Mar).\n\n` +
    `Tell me: What kind of trip are you envisioning, and what is your approximate budget or timeline?`;

  cards = TRIPORA_KNOWLEDGE.destinations.slice(0, 3).map(d => ({
    type: 'destination',
    title: `${d.name}, ${d.country}`,
    desc: d.desc,
    badge: `Best: ${d.season}`,
    action: 'explore_dest',
    target: d.name
  }));

  followUps = [
    'Plan a 3-day trip',
    'Find romantic destinations',
    'Suggest trips under $1,000',
    'Recommend family-friendly places'
  ];

  return { role: 'assistant', content: replyText, cards, followUps, mode: 'smart-engine' };
}

/* ===================================================================
   EXTERNAL LLM FORWARDER (GEMINI / OPENAI API)
   =================================================================== */
function callExternalLLM(messages, context, callback) {
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    // Graceful fallback to smart engine
    const demoResp = handleNovaConversation(messages, context);
    return callback(null, demoResp);
  }

  const model = process.env.AI_MODEL || 'gemini-1.5-flash';
  const systemPrompt = `You are Nova AI, the intelligent travel-planning assistant for Tripora.
Your job is to help users discover destinations, plan itineraries, estimate budgets, and explore available travel services.
Be friendly, accurate, concise, and practical.
Ask relevant follow-up questions when destination, dates, budget, or traveler information is necessary.
Use the available Tripora destination and listing data whenever possible:
Tripora destinations: Bali (Indonesia), Kyoto (Japan), Santorini (Greece), Zermatt (Switzerland), Amalfi Coast (Italy), Banff (Canada).
Tripora hotels: Grand Luxe Oia Suites (Santorini), Roku Zen Resort & Spa (Kyoto), The Azure Amalfi Hotel (Amalfi).
Tripora packages: Santorini & Mykonos Dream (7d/6n), Alpine Majesty & Swiss Rail (8d/7n), Kyoto Heritage & Tokyo Lights (9d/8n).
Tripora flights: Emirates (JFK->DXB), Singapore Airlines (JFK->SIN), Lufthansa (JFK->FRA).
Never fabricate live availability, current prices, hotel details, booking confirmations, payment status, or reservations.
Clearly distinguish estimated costs from verified prices.
If information is unavailable, explain the limitation honestly.
Do not claim that a reservation has been completed unless the existing booking system confirms it.
Do not request payment card details, passwords, or unnecessary sensitive information in the chat.`;

  // Determine provider: Gemini vs OpenAI
  const isGemini = !process.env.AI_API_BASE_URL || process.env.AI_API_BASE_URL.includes('googleapis.com') || apiKey.startsWith('AIza');

  if (isGemini) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') }] }
      ]
    });

    const urlObj = new URL(endpoint);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 10000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
            const reply = parsed.candidates[0].content.parts[0].text;
            const smartHelper = handleNovaConversation(messages, context);
            return callback(null, {
              role: 'assistant',
              content: reply,
              cards: smartHelper.cards || [],
              followUps: smartHelper.followUps || [],
              mode: 'live-gemini'
            });
          }
          return callback(null, handleNovaConversation(messages, context));
        } catch (e) {
          return callback(null, handleNovaConversation(messages, context));
        }
      });
    });

    req.on('error', () => callback(null, handleNovaConversation(messages, context)));
    req.on('timeout', () => { req.destroy(); callback(null, handleNovaConversation(messages, context)); });
    req.write(payload);
    req.end();
  } else {
    // OpenAI or compatible format
    const baseUrl = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
    const endpoint = `${baseUrl}/chat/completions`;
    const payload = JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages]
    });

    const urlObj = new URL(endpoint);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
            const reply = parsed.choices[0].message.content;
            const smartHelper = handleNovaConversation(messages, context);
            return callback(null, {
              role: 'assistant',
              content: reply,
              cards: smartHelper.cards || [],
              followUps: smartHelper.followUps || [],
              mode: 'live-openai'
            });
          }
          return callback(null, handleNovaConversation(messages, context));
        } catch (e) {
          return callback(null, handleNovaConversation(messages, context));
        }
      });
    });

    req.on('error', () => callback(null, handleNovaConversation(messages, context)));
    req.on('timeout', () => { req.destroy(); callback(null, handleNovaConversation(messages, context)); });
    req.write(payload);
    req.end();
  }
}

/* ===================================================================
   HTTP SERVER REQUEST HANDLER
   =================================================================== */
const server = http.createServer((req, res) => {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlParts = req.url.split('?');
  const pathname = decodeURI(urlParts[0]);

  // 1. DEDICATED NOVA AI CHAT ENDPOINT
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50000) { // Limit request size to prevent abuse
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large.' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const messages = Array.isArray(data.messages) ? data.messages : [];
        const context = data.context || {};

        if (!messages.length) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Messages array is required.' }));
          return;
        }

        callExternalLLM(messages, context, (err, response) => {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(response));
        });
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON request format.' }));
      }
    });
    return;
  }

  // 2. NOVA STATUS & CONFIG ENDPOINT
  if (pathname === '/api/chat/status' && req.method === 'GET') {
    const hasKey = Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY !== 'your_api_key_here');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      provider: hasKey ? 'live' : 'smart-demo-engine',
      model: hasKey ? (process.env.AI_MODEL || 'gemini-1.5-flash') : 'Tripora Nova Engine v2.4'
    }));
    return;
  }

  // 3. STATIC FILE SERVING
  let reqPath = pathname === '/' || pathname === '' ? '/index.html' : pathname;
  const safePath = path.normalize(path.join(ROOT, reqPath));

  // Security check to prevent directory traversal
  if (!safePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routes
      const indexPath = path.join(ROOT, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(safePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.log(`Port ${PORT} is in use, trying port ${nextPort}...`);
    server.listen(nextPort);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  const actualPort = server.address().port;
  const hasKey = Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY !== 'your_api_key_here');
  console.log('\n======================================================');
  console.log('   ✈️  TRIPORA + NOVA AI TRAVEL SERVER RUNNING');
  console.log('======================================================');
  console.log(`  > Local:   http://localhost:${actualPort}/`);
  console.log(`  > Network: http://127.0.0.1:${actualPort}/`);
  console.log(`  > Nova AI: ${hasKey ? '⚡ Connected to Live LLM' : '🤖 Running in Smart Demo Engine mode'}`);
  console.log('======================================================');
  console.log('  Press Ctrl + C in terminal to stop the server\n');
});
