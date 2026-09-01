const events = [
  {
    id: 'forest-table',
    title: 'The Forest Table',
    category: 'food',
    date: 'Fri, Sep 4',
    time: '6:30 PM',
    location: 'Hoyt Arboretum',
    price: '$48',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=82',
    alt: 'A seasonal dinner arranged on a rustic table',
    description: 'A long-table dinner under the trees with a menu shaped by nearby farms, wild herbs, and the first cool evenings of the season.'
  },
  {
    id: 'clay-morning',
    title: 'Clay Morning',
    category: 'arts',
    date: 'Sat, Sep 5',
    time: '10:00 AM',
    location: 'Notary Ceramics, Sellwood',
    price: '$32',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1000&q=82',
    alt: 'Hands shaping a piece of clay on a pottery wheel',
    description: 'Slow down at the wheel in this beginner-friendly studio session. Materials, firing, coffee, and patient instruction are included.'
  },
  {
    id: 'dawn-bird-walk',
    title: 'Dawn Bird Walk',
    category: 'outdoors',
    date: 'Sun, Sep 6',
    time: '7:15 AM',
    location: 'Oaks Bottom Wildlife Refuge',
    price: 'Free',
    image: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1000&q=82',
    alt: 'Small bird perched among green leaves',
    description: 'An easy two-mile loop with a local naturalist, timed for the morning chorus. A limited number of binoculars are available to borrow.'
  },
  {
    id: 'risograph-social',
    title: 'Risograph Social',
    category: 'arts',
    date: 'Sun, Sep 6',
    time: '2:00 PM',
    location: 'Outlet PDX, Montavilla',
    price: '$18',
    image: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1000&q=82',
    alt: 'Colorful prints and art materials on a studio table',
    description: 'Make a two-color print, trade editions with the room, and learn why this imperfect printing process inspires such devoted fans.'
  },
  {
    id: 'neighborhood-supper',
    title: 'Neighborhood Supper',
    category: 'community',
    date: 'Tue, Sep 8',
    time: '5:30 PM',
    location: 'Peninsula Park Commons',
    price: 'Free',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=82',
    alt: 'Friends sharing a relaxed outdoor meal',
    description: 'Bring one dish or simply bring yourself. Long tables, tableware, and a neighborhood playlist will be waiting in the rose garden.'
  },
  {
    id: 'city-by-bike',
    title: 'City by Bike',
    category: 'outdoors',
    date: 'Wed, Sep 9',
    time: '6:00 PM',
    location: 'Eastbank Esplanade',
    price: '$8',
    image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=1000&q=82',
    alt: 'Cyclist riding along a city path',
    description: 'A social twelve-mile ride tracing overlooked river paths and low-traffic streets, ending with cold drinks at a neighborhood patio.'
  }
];

const state = {
  category: 'all',
  query: '',
  saved: new Set(readStoredArray('fieldnote-saved')),
  attending: new Set(readStoredArray('fieldnote-attending'))
};

const eventGrid = document.querySelector('#event-grid');
const savedList = document.querySelector('#saved-list');
const savedCount = document.querySelector('#saved-count');
const emptyState = document.querySelector('#empty-state');
const searchInput = document.querySelector('#search-input');
const dialog = document.querySelector('#event-dialog');
const dialogContent = document.querySelector('#dialog-content');
const cardTemplate = document.querySelector('#event-card-template');
const saveNotice = document.querySelector('#save-notice');
const saveNoticeText = document.querySelector('#save-notice-text');
let saveNoticeTimeout;

function readStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function storeSet(key, value) {
  localStorage.setItem(key, JSON.stringify([...value]));
}

function filteredEvents() {
  const query = state.query.toLowerCase();
  return events.filter((event) => {
    const matchesCategory = state.category === 'all' || event.category === state.category;
    const searchable = `${event.title} ${event.location} ${event.category}`.toLowerCase();
    return matchesCategory && searchable.includes(query);
  });
}

function renderEvents() {
  eventGrid.replaceChildren();
  const visibleEvents = filteredEvents();
  emptyState.hidden = visibleEvents.length > 0;

  visibleEvents.forEach((event, index) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    card.style.animationDelay = `${index * 55}ms`;
    const image = card.querySelector('.event-image');
    image.src = event.image;
    image.alt = event.alt;
    card.querySelector('.event-category').textContent = event.category;
    card.querySelector('.event-date').textContent = `${event.date} · ${event.time}`;
    card.querySelector('.event-title').textContent = event.title;
    card.querySelector('.event-location').textContent = event.location;
    card.querySelector('.event-price').textContent = event.price;

    const saveButton = card.querySelector('.save-button');
    updateSaveButton(saveButton, event);
    saveButton.addEventListener('click', () => toggleSaved(event.id));
    card.querySelector('.details-button').addEventListener('click', () => openEvent(event.id));
    eventGrid.append(card);
  });
}

function updateSaveButton(button, event) {
  const isSaved = state.saved.has(event.id);
  button.classList.toggle('saved', isSaved);
  button.setAttribute('aria-label', `${isSaved ? 'Remove' : 'Save'} ${event.title}`);
  button.title = isSaved ? 'Remove from saved' : 'Save event';
}

function toggleSaved(id) {
  const event = events.find((item) => item.id === id);
  const isRemoving = state.saved.has(id);
  if (isRemoving) state.saved.delete(id);
  else state.saved.add(id);
  storeSet('fieldnote-saved', state.saved);
  renderEvents();
  renderSaved();
  showSaveNotice(`${event.title} ${isRemoving ? 'removed' : 'saved'}.`, !isRemoving);
}

function showSaveNotice(message, showLink) {
  clearTimeout(saveNoticeTimeout);
  saveNoticeText.textContent = message;
  saveNotice.querySelector('a').hidden = !showLink;
  saveNotice.hidden = false;
  saveNoticeTimeout = setTimeout(() => {
    saveNotice.hidden = true;
  }, 4000);
}

function renderSaved() {
  savedList.replaceChildren();
  const savedEvents = events.filter((event) => state.saved.has(event.id));
  savedCount.textContent = savedEvents.length;

  if (!savedEvents.length) {
    const placeholder = document.createElement('p');
    placeholder.className = 'saved-placeholder';
    placeholder.textContent = 'Nothing saved yet. Bookmark an event to start your shortlist.';
    savedList.append(placeholder);
    return;
  }

  savedEvents.forEach((event) => {
    const item = document.createElement('article');
    item.className = 'saved-item';
    item.innerHTML = `
      <img src="${event.image}" alt="" loading="lazy">
      <div><h3>${event.title}</h3><p>${event.date} · ${event.location}</p></div>
      <button class="remove-button icon-button" type="button" aria-label="Remove ${event.title}" title="Remove">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>`;
    item.querySelector('button').addEventListener('click', () => toggleSaved(event.id));
    savedList.append(item);
  });
}

function openEvent(id) {
  const event = events.find((item) => item.id === id);
  if (!event) return;
  const isAttending = state.attending.has(id);
  dialogContent.innerHTML = `
    <img class="dialog-image" src="${event.image}" alt="${event.alt}">
    <div class="dialog-body">
      <p class="eyebrow">${event.category}</p>
      <h2 id="dialog-title">${event.title}</h2>
      <p>${event.description}</p>
      <div class="dialog-meta">
        <div><span>When</span><strong>${event.date}, ${event.time}</strong></div>
        <div><span>Where</span><strong>${event.location}</strong></div>
        <div><span>Admission</span><strong>${event.price}</strong></div>
      </div>
      <button class="rsvp-button${isAttending ? ' confirmed' : ''}" type="button" aria-pressed="${isAttending}">${isAttending ? 'You are going' : 'Reserve a place'}</button>
    </div>`;
  dialogContent.querySelector('.rsvp-button').addEventListener('click', (clickEvent) => {
    const isCanceling = state.attending.has(id);
    if (isCanceling) state.attending.delete(id);
    else state.attending.add(id);
    storeSet('fieldnote-attending', state.attending);
    clickEvent.currentTarget.textContent = isCanceling ? 'Reserve a place' : 'You are going';
    clickEvent.currentTarget.classList.toggle('confirmed', !isCanceling);
    clickEvent.currentTarget.setAttribute('aria-pressed', String(!isCanceling));
    showSaveNotice(isCanceling ? `${event.title} reservation canceled.` : `You're going to ${event.title}.`, false);
  });
  dialog.showModal();
}

document.querySelector('#category-filters').addEventListener('click', (clickEvent) => {
  const button = clickEvent.target.closest('[data-category]');
  if (!button) return;
  state.category = button.dataset.category;
  document.querySelectorAll('[data-category]').forEach((item) => {
    const isActive = item === button;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-pressed', String(isActive));
  });
  renderEvents();
});

searchInput.addEventListener('input', () => {
  state.query = searchInput.value.trim();
  renderEvents();
});

document.querySelector('#clear-filters').addEventListener('click', () => {
  state.category = 'all';
  state.query = '';
  searchInput.value = '';
  document.querySelectorAll('[data-category]').forEach((item) => {
    const isAll = item.dataset.category === 'all';
    item.classList.toggle('active', isAll);
    item.setAttribute('aria-pressed', String(isAll));
  });
  renderEvents();
});

document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (clickEvent) => {
  if (clickEvent.target === dialog) dialog.close();
});
saveNotice.querySelector('a').addEventListener('click', () => {
  saveNotice.hidden = true;
});

const themeToggle = document.querySelector('#theme-toggle');
const preferredTheme = localStorage.getItem('fieldnote-theme');
if (preferredTheme) document.documentElement.dataset.theme = preferredTheme;

themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem('fieldnote-theme', nextTheme);
  themeToggle.setAttribute('aria-label', `Switch to ${nextTheme === 'dark' ? 'light' : 'dark'} theme`);
});

const today = new Date();
document.querySelector('#current-month').textContent = today.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
document.querySelector('#current-day').textContent = String(today.getDate()).padStart(2, '0');
document.querySelector('#current-weekday').textContent = today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
document.querySelector('#year').textContent = today.getFullYear();

renderEvents();
renderSaved();