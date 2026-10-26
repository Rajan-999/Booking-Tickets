const events = [
  { id: 1, title: 'The Midnight Sessions', category: 'Music', city: 'New York', venue: 'Elsewhere · Brooklyn', price: 38, dayOffset: 2, rating: 4.9, image: 'photo-1501386761578-eac5c94b800a', mapX: 27, mapY: 35 },
  { id: 2, title: 'A Table for Everyone', category: 'Food', city: 'Los Angeles', venue: 'Smorgasburg · Downtown', price: 24, dayOffset: 4, rating: 4.8, image: 'photo-1414235077428-338989a2e8c0', mapX: 42, mapY: 59 },
  { id: 3, title: 'Soft Focus: The Exhibition', category: 'Arts', city: 'Chicago', venue: 'The Modern Wing', price: 18, dayOffset: 1, rating: 4.7, image: 'photo-1577083552431-6e5fd01aa342', mapX: 61, mapY: 27 },
  { id: 4, title: 'Afterglow Rooftop Club', category: 'Nightlife', city: 'Miami', venue: 'Rosa Sky Rooftop', price: 32, dayOffset: 5, rating: 4.9, image: 'photo-1514933651103-005eec06c04b', mapX: 78, mapY: 47 },
  { id: 5, title: 'Golden Hour Run Club', category: 'Outdoors', city: 'Austin', venue: 'Lady Bird Lake Trail', price: 12, dayOffset: 3, rating: 4.6, image: 'photo-1530549387789-4c1017266635', mapX: 32, mapY: 75 },
  { id: 6, title: 'Jazz in the Garden', category: 'Music', city: 'New York', venue: 'Brooklyn Botanic Garden', price: 29, dayOffset: 6, rating: 4.9, image: 'photo-1516280440614-37939bbacd81', mapX: 53, mapY: 44 },
  { id: 7, title: 'Sunday Pasta Social', category: 'Food', city: 'Chicago', venue: 'Daisies · Logan Square', price: 45, dayOffset: 7, rating: 4.8, image: 'photo-1555396273-367ea4eb4db5', mapX: 72, mapY: 69 },
  { id: 8, title: 'Color Theory: Live', category: 'Arts', city: 'Los Angeles', venue: 'The Broad · Grand Ave', price: 21, dayOffset: 8, rating: 4.7, image: 'photo-1531058020387-3be344556be6', mapX: 87, mapY: 26 }
];

const imageUrl = (id, width = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;
const grid = document.querySelector('#eventsGrid');
const searchInput = document.querySelector('#searchInput');
const citySelect = document.querySelector('#citySelect');
const emptyState = document.querySelector('#emptyState');
const dialog = document.querySelector('#bookingDialog');
let activeCategory = 'All';
let dateMode = 'any';
let savedOnly = false;
let showAll = false;
let activeView = 'grid';
let sortMode = 'recommended';
let maxPrice = 100;
let selectedEvent = null;
let quantity = 1;
const savedEvents = new Set(JSON.parse(localStorage.getItem('tixly-saved') || '[]'));
let currentEvents = [...events];

function getDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return { day: date.getDate(), weekday: date.toLocaleDateString('en-US', { weekday: 'short' }), month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() };
}

function renderEvents() {
  const query = searchInput.value.trim().toLowerCase();
  const city = citySelect.value;
  const visibleEvents = events.filter((event) => {
    const matchesCategory = activeCategory === 'All' || event.category === activeCategory;
    const matchesSearch = !query || `${event.title} ${event.category} ${event.venue} ${event.city}`.toLowerCase().includes(query);
    const matchesCity = city === 'all' || city === event.city;
    const matchesDate = dateMode === 'any' || event.dayOffset <= Number(dateMode);
    const matchesSaved = !savedOnly || savedEvents.has(event.id);
    const matchesBudget = event.price <= maxPrice;
    return matchesCategory && matchesSearch && matchesCity && matchesDate && matchesSaved && matchesBudget;
  });

  const sorters = {
    recommended: (a, b) => b.rating - a.rating || a.dayOffset - b.dayOffset,
    soonest: (a, b) => a.dayOffset - b.dayOffset,
    'price-low': (a, b) => a.price - b.price,
    'price-high': (a, b) => b.price - a.price,
    popular: (a, b) => b.rating - a.rating
  };
  visibleEvents.sort(sorters[sortMode]);
  currentEvents = visibleEvents;

  grid.innerHTML = visibleEvents.slice(0, showAll ? undefined : 8).map((event) => {
    const date = getDate(event.dayOffset);
    const isSaved = savedEvents.has(event.id);
    return `<article class="event-card">
      <div class="event-image-wrap">
        <img class="event-image" src="${imageUrl(event.image)}" alt="${event.title}" loading="lazy">
        <div class="event-date"><span>${date.weekday.toUpperCase()}</span>${date.day}</div>
        <button class="favorite-button${isSaved ? ' is-favorite' : ''}" data-favorite="${event.id}" aria-label="${isSaved ? 'Remove' : 'Save'} ${event.title}" aria-pressed="${isSaved}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg></button>
      </div>
      <div class="event-info"><div class="card-meta"><span class="event-type">${event.category} · ${event.city}</span><span class="event-rating">★ ${event.rating}</span></div><h3 class="event-title" title="${event.title}">${event.title}</h3><p class="event-venue">${event.venue}</p><div class="event-bottom"><span class="event-price">$${event.price} <small> / person</small></span><button class="book-button" data-book="${event.id}">Get tickets</button></div></div>
    </article>`;
  }).join('');
  emptyState.hidden = visibleEvents.length > 0;
  document.querySelector('#browseMore').hidden = visibleEvents.length <= 8 || activeView !== 'grid';
  document.querySelector('#savedCount').textContent = savedEvents.size;
  document.querySelector('#resultCount').textContent = `${visibleEvents.length} ${visibleEvents.length === 1 ? 'experience' : 'experiences'}`;
  grid.hidden = activeView === 'map';
  document.querySelector('#eventsMap').hidden = activeView !== 'map';
  grid.classList.toggle('list-view', activeView === 'list');
  document.querySelector('#mapPins').innerHTML = visibleEvents.map((event) => `<button class="map-pin" style="left:${event.mapX}%;top:${event.mapY}%" data-map-book="${event.id}" aria-label="Open ${event.title}"><span>$${event.price}</span></button>`).join('');
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('visible'), 2800);
}

function updateBookingTotal() {
  document.querySelector('#quantityValue').textContent = quantity;
  document.querySelector('#serviceFee').textContent = `$${2 * quantity}`;
  document.querySelector('#bookingTotal').textContent = `$${(selectedEvent.price + 2) * quantity}`;
}

function openBooking(event) {
  selectedEvent = event;
  quantity = 1;
  const date = getDate(event.dayOffset);
  document.querySelector('#dialogImage').style.backgroundImage = `url("${imageUrl(event.image, 900)}")`;
  document.querySelector('#dialogCategory').textContent = `${event.category} · ${event.city}`;
  document.querySelector('#dialogTitle').textContent = event.title;
  document.querySelector('#dialogMeta').textContent = `${date.weekday}, ${date.day} ${date.month} · ${event.venue}`;
  document.querySelector('#ticketPrice').textContent = `$${event.price}`;
  updateBookingTotal();
  dialog.showModal();
}

grid.addEventListener('click', (event) => {
  const favoriteButton = event.target.closest('[data-favorite]');
  const bookButton = event.target.closest('[data-book]');
  if (favoriteButton) {
    const id = Number(favoriteButton.dataset.favorite);
    if (savedEvents.has(id)) savedEvents.delete(id);
    else savedEvents.add(id);
    localStorage.setItem('tixly-saved', JSON.stringify([...savedEvents]));
    renderEvents();
  }
  if (bookButton) openBooking(events.find((item) => item.id === Number(bookButton.dataset.book)));
});

document.querySelector('#categoryList').addEventListener('click', (event) => {
  const chip = event.target.closest('[data-category]');
  if (!chip) return;
  activeCategory = chip.dataset.category;
  document.querySelectorAll('.category-chip').forEach((item) => item.classList.toggle('selected', item === chip));
  renderEvents();
});

document.querySelector('#searchForm').addEventListener('submit', (event) => {
  event.preventDefault();
  renderEvents();
  document.querySelector('#popular').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
searchInput.addEventListener('input', renderEvents);
citySelect.addEventListener('change', renderEvents);

document.querySelector('#dateFilter').addEventListener('change', (event) => {
  dateMode = event.target.value;
  renderEvents();
});
document.querySelector('#sortSelect').addEventListener('change', (event) => {
  sortMode = event.target.value;
  renderEvents();
});
document.querySelector('#budgetRange').addEventListener('input', (event) => {
  maxPrice = Number(event.target.value);
  document.querySelector('#budgetValue').textContent = `$${maxPrice}`;
  renderEvents();
});
document.querySelector('.view-switch').addEventListener('click', (event) => {
  const button = event.target.closest('[data-view]');
  if (!button) return;
  activeView = button.dataset.view;
  document.querySelectorAll('.view-button').forEach((item) => item.classList.toggle('active', item === button));
  renderEvents();
});
document.querySelector('#surpriseButton').addEventListener('click', () => {
  if (!currentEvents.length) {
    showToast('No matches yet — try loosening your filters.');
    return;
  }
  openBooking(currentEvents[Math.floor(Math.random() * currentEvents.length)]);
});
document.querySelector('#eventsMap').addEventListener('click', (event) => {
  const pin = event.target.closest('[data-map-book]');
  if (pin) openBooking(events.find((item) => item.id === Number(pin.dataset.mapBook)));
});

document.querySelector('#savedShortcut').addEventListener('click', () => {
  savedOnly = !savedOnly;
  document.querySelector('#savedShortcut').classList.toggle('saved-active', savedOnly);
  document.querySelector('#popular').scrollIntoView({ behavior: 'smooth', block: 'start' });
  renderEvents();
  if (savedOnly && savedEvents.size === 0) showToast('Tap a heart to save events for later.');
});

document.querySelector('#resetFilters').addEventListener('click', () => {
  activeCategory = 'All';
  dateMode = 'any';
  savedOnly = false;
  maxPrice = 100;
  sortMode = 'recommended';
  searchInput.value = '';
  citySelect.value = 'all';
  document.querySelector('#dateFilter').value = 'any';
  document.querySelector('#sortSelect').value = 'recommended';
  document.querySelector('#budgetRange').value = '100';
  document.querySelector('#budgetValue').textContent = '$100';
  document.querySelector('#savedShortcut').classList.remove('saved-active');
  document.querySelectorAll('.category-chip').forEach((item) => item.classList.toggle('selected', item.dataset.category === 'All'));
  renderEvents();
});

document.querySelector('#browseMore').addEventListener('click', () => {
  showAll = !showAll;
  document.querySelector('#browseMore').innerHTML = showAll ? 'Show less <span>↑</span>' : 'Show me more <span>↓</span>';
  renderEvents();
});
document.querySelector('#quantityMinus').addEventListener('click', () => { quantity = Math.max(1, quantity - 1); updateBookingTotal(); });
document.querySelector('#quantityPlus').addEventListener('click', () => { quantity = Math.min(10, quantity + 1); updateBookingTotal(); });
document.querySelector('#dialogClose').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
document.querySelector('#confirmBooking').addEventListener('click', () => {
  const title = selectedEvent.title;
  const count = quantity;
  dialog.close();
  showToast(`${count} ${count === 1 ? 'ticket' : 'tickets'} reserved for ${title}!`);
});
document.querySelector('#newsletterForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.querySelector('#emailInput');
  showToast(`You're on the list, ${email.value.trim()}!`);
  email.value = '';
});

renderEvents();
