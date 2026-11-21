/* Shared helpers for the client page and the builder. */
(function () {
  const C = window.AW_CONFIG || { API_URL: '', advisor: {} };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d) => { const n = parseInt(v, 10); return isNaN(n) ? d : n; };
  const parseD = s => { if (!s) return null; const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return y ? new Date(y, m - 1, d) : null; };
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dayDate = (t, n) => { const s = parseD(t.start); if (!s) return null; const d = new Date(s); d.setDate(d.getDate() + n - 1); return d; };
  const fmt = (d, o) => d ? d.toLocaleDateString('en-US', o || { weekday: 'short', month: 'short', day: 'numeric' }) : '';
  const t12 = s => { if (!s) return ''; let [h, m] = s.split(':').map(Number); if (isNaN(h)) return s; const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}:${String(m || 0).padStart(2, '0')} ${ap}`; };
  const byTime = (a, b) => (a.time || '99').localeCompare(b.time || '99');

  const KINDS = { park: 'Theme park', cruise: 'Cruise', beach: 'Beach / all-inclusive', city: 'City / Europe', road: 'Road trip', snow: 'Ski / snow', adventure: 'Adventure', other: 'Other' };
  const TEMPLATES = {
    base: ['Travel documents', ['Photo ID for every adult', 'Passports (if leaving the U.S.)', 'Credit cards + a little cash', 'Insurance cards', 'Medications in carry-on']],
    tech: ['Tech', ['Phone chargers', 'Portable battery', 'Headphones']],
    clothes: ['Clothes', ['Outfits for each day + extras', 'Pajamas', 'Comfortable walking shoes', 'Light jacket or sweater']],
    park: ['Park day bag', ['Ponchos', 'Sunscreen', 'Hats and sunglasses', 'Refillable water bottles', 'Cooling towels', 'Wipes and hand sanitizer', 'Snacks']],
    cruise: ['Cruise', ['Cruise documents + luggage tags', 'Dressy outfit for formal night', 'Swimsuits + cover-ups', 'Lanyards for room cards', 'Motion sickness remedies', 'Day bag for ports']],
    beach: ['Beach', ['Swimsuits + cover-ups', 'Reef-safe sunscreen', 'Sunglasses and hats', 'Sandals', 'Aloe / after-sun', 'Waterproof phone pouch']],
    city: ['City days', ['Small crossbody bag', 'Power adapter', 'Umbrella', 'Scarf or layer for churches', 'Comfortable shoes for cobblestones']],
    road: ['Car', ['Car chargers', 'Cooler with drinks and snacks', 'Car seats / boosters', 'Trash bags', 'Pillows and blankets', 'Downloaded shows and music']],
    snow: ['Snow gear', ['Ski jackets and pants', 'Base layers', 'Gloves or mittens', 'Hats and neck gaiters', 'Goggles', 'Wool socks', 'Hand warmers']],
    adventure: ['Adventure gear', ['Broken-in hiking shoes', 'Rain shell', 'Quick-dry layers', 'Daypack', 'Bug spray', 'Reusable water bottle']]
  };
  function packingFor(kind) {
    const L = ([list, items]) => items.map(text => ({ id: uid(), list, text }));
    return [...L(TEMPLATES.base), ...(TEMPLATES[kind] ? L(TEMPLATES[kind]) : []), ...L(TEMPLATES.clothes), ...L(TEMPLATES.tech)];
  }

  // type: label, plural heading, whether it spans days, span labels, icon path
  const BTYPES = {
    flight: { one: 'Flight', many: 'Flights', span: false, icon: '<path transform="rotate(90 12 12)" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>' },
    stay: { one: 'Stay', many: 'Where you’re staying', span: true, from: 'Check-in', to: 'Check-out', icon: '<path d="M3 18V7M3 13h18v5M21 13a3 3 0 00-3-3h-7v3M7 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>' },
    car: { one: 'Rental car', many: 'Rental car', span: true, from: 'Pick-up', to: 'Drop-off', icon: '<path d="M5 16h14M3 16v-4l2-5h14l2 5v4M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM3 12h18"/>' },
    transfer: { one: 'Car service', many: 'Car service & transfers', span: false, icon: '<path d="M4 15h16l-2-6H6l-2 6zM4 15v3h3v-3M17 15v3h3v-3M9 6h6"/>' },
    cruise: { one: 'Cruise', many: 'Cruise', span: true, from: 'Embark', to: 'Disembark', icon: '<path d="M3 15l2 4h14l2-4H3zM6 15V9h12v6M9 9V5h6v4"/>' },
    ticket: { one: 'Reservation', many: 'Reservations & tickets', span: false, icon: '<path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4V8zM14 6v12"/>' },
    other: { one: 'Other', many: 'Other details', span: false, icon: '<path d="M12 3v18M3 12h18"/>' }
  };

  const blankTrip = (kind = 'park') => ({
    client: '', title: '', dest: '', kind, start: '', days: 5, status: 'Planning', message: '', privateNotes: '',
    travelers: [{ id: uid(), label: 'Travelers', who: '', count: 2, from: 1, to: 5 }],
    bookings: [], plan: {}, packing: packingFor(kind)
  });

  function sampleTrip() {
    const s = new Date(); s.setDate(s.getDate() + 47);
    return {
      id: 'demo', pin: '1234', sample: true, client: 'Kyle & Family', title: 'Walt Disney World', dest: 'Orlando, Florida', kind: 'park',
      start: iso(s), days: 9, status: 'Booked',
      message: 'I’m so excited for you all! Everything is booked, and this page has every detail in one place. Text me anytime, before or during the trip.',
      travelers: [
        { id: 'g1', label: 'Our family', who: 'Kyle, mom and the kids', count: 4, from: 1, to: 9 },
        { id: 'g2', label: 'Grandparents', who: 'In-laws', count: 2, from: 2, to: 5 },
        { id: 'g3', label: 'Family', who: 'Kyle’s side', count: 4, from: 5, to: 9 }],
      bookings: [
        { id: 'b1', type: 'flight', title: 'Newark (EWR) → Orlando (MCO)', conf: 'SAMPLE1', from: 1, time: '07:15', provider: 'United 1234 · lands 10:05 am', phone: '', addr: '', notes: 'Check in on the airline app 24 hours before.', link: '' },
        { id: 'b2', type: 'flight', title: 'Orlando (MCO) → Newark (EWR)', conf: 'SAMPLE2', from: 9, time: '16:40', provider: 'United 5678 · lands 7:20 pm', phone: '', addr: '', notes: '', link: '' },
        { id: 'b3', type: 'car', title: 'Minivan', conf: 'SAMPLE3', from: 1, to: 9, time: '10:30', provider: 'Alamo, Orlando Airport', phone: '407-555-0100', addr: 'Orlando International Airport, Orlando, FL', notes: 'Counter is on Level 1 of the terminal.', link: '' },
        { id: 'b4', type: 'stay', title: 'Disney’s Pop Century Resort', conf: 'SAMPLE4', from: 1, to: 3, time: '15:00', provider: 'Standard room, 2 queens', phone: '407-555-0101', addr: '1050 Century Dr, Orlando, FL 32830', notes: '', link: '' },
        { id: 'b5', type: 'stay', title: 'Disney’s Caribbean Beach Resort', conf: 'SAMPLE5', from: 3, to: 6, time: '15:00', provider: 'Preferred room, near the pool', phone: '407-555-0102', addr: '900 Cayman Way, Lake Buena Vista, FL 32830', notes: 'Connecting rooms requested for the grandparents.', link: '' },
        { id: 'b6', type: 'stay', title: 'Disney’s Art of Animation Resort', conf: 'SAMPLE6', from: 6, to: 9, time: '15:00', provider: 'Family suite, sleeps 6', phone: '407-555-0103', addr: '1850 Animation Way, Lake Buena Vista, FL 32830', notes: '', link: '' },
        { id: 'b7', type: 'ticket', title: 'Character breakfast', conf: 'SAMPLE7', from: 4, time: '08:30', provider: 'Party of 8', phone: '', addr: '', notes: 'Arrive 15 minutes early.', link: '' }],
      plan: {
        1: [{ id: 'p1', time: '10:05', text: 'Land in Orlando, pick up the car' }, { id: 'p2', time: '15:00', text: 'Check in, pool afternoon' }],
        2: [{ id: 'p3', time: '08:00', text: 'Magic Kingdom, rope drop' }, { id: 'p4', time: '', text: 'Grandparents arrive in the afternoon' }],
        3: [{ id: 'p5', time: '09:00', text: 'EPCOT' }],
        4: [{ id: 'p7', time: '10:30', text: 'Hollywood Studios' }],
        5: [{ id: 'p8', time: '', text: 'Rest day, the rest of the family arrives' }],
        6: [{ id: 'p9', time: '08:30', text: 'Animal Kingdom' }],
        7: [{ id: 'p10', time: '', text: 'Magic Kingdom with everyone' }],
        8: [{ id: 'p11', time: '', text: 'Disney Springs and souvenirs' }],
        9: [{ id: 'p12', time: '11:00', text: 'Check out, return the car by 2 pm' }]
      },
      packing: packingFor('park')
    };
  }

  async function api(body) {
    if (!C.API_URL) throw new Error('No API set');
    const r = await fetch(C.API_URL, { method: 'POST', body: JSON.stringify(body) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Something went wrong');
    return j;
  }
  async function apiGet(params) {
    const r = await fetch(C.API_URL + '?' + new URLSearchParams(params));
    return r.json();
  }
  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  window.AW = { C, uid, esc, num, parseD, iso, dayDate, fmt, t12, byTime, KINDS, TEMPLATES, packingFor, BTYPES, blankTrip, sampleTrip, api, apiGet, ls };
})();
