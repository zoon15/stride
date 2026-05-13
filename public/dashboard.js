// =================================
// DASHBOARD - WITH BACKEND API
// =================================

const API_URL = window.location.origin;
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Get DOM elements
const profileCircle = document.getElementById('profileCircle');
const profileDropdown = document.getElementById('profileDropdown');
const viewProfileBtn = document.getElementById('viewProfileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const profileModal = document.getElementById('profileModal');
const closeModal = document.querySelector('.close-modal');
const userNameSpan = document.getElementById('userName');
const userGreetingSpan = document.getElementById('userGreeting');
const profileNameSpan = document.getElementById('profileName');
const profileEmailSpan = document.getElementById('profileEmail');

// Check if user is logged in
if (!currentUser) {
    window.location.href = 'index.html';
}

// Update UI based on login state
function updateUI() {
    if (currentUser) {
        userNameSpan.textContent = currentUser.name || currentUser.email.split('@')[0];
        userGreetingSpan.textContent = `Hello, ${currentUser.name || currentUser.email.split('@')[0]}`;
        profileNameSpan.textContent = currentUser.name || 'Not set';
        profileEmailSpan.textContent = currentUser.email;
    } else {
        userNameSpan.textContent = 'Guest';
        userGreetingSpan.textContent = 'Hello, Guest';
        profileNameSpan.textContent = '-';
        profileEmailSpan.textContent = '-';
    }
}

// Toggle dropdown
profileCircle.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!profileCircle.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('show');
    }
});

// View Profile
viewProfileBtn.addEventListener('click', () => {
    profileDropdown.classList.remove('show');
    if (currentUser) {
        profileModal.classList.add('show');
    } else {
        alert('Please login first');
        window.location.href = 'index.html';
    }
});

// Close modal
closeModal.addEventListener('click', () => {
    profileModal.classList.remove('show');
});

// Close modal when clicking outside
profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        profileModal.classList.remove('show');
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    currentUser = null;
    updateUI();
    profileDropdown.classList.remove('show');
    alert('You have been logged out successfully!');
    window.location.href = 'index.html';
});

// Initialize
updateUI();

// =================================
// CALENDAR FUNCTIONALITY
// =================================

let currentDate = new Date();

// Render calendar
async function renderCalendar() {
    if (!currentUser) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const currentDay = today.getDate();
    
    // Fetch events from backend
    const monthNum = (month + 1).toString();
    const response = await fetch(`${API_URL}/api/events/${currentUser.id}/${year}/${monthNum}`);
    const events = await response.json();
    
    for (let i = 0; i < 42; i++) {
        const dayNumber = i - startingDayOfWeek + 1;
        let cellDate = new Date(year, month, dayNumber);
        let isOtherMonth = false;
        let displayDay = dayNumber;
        
        if (dayNumber <= 0) {
            const prevMonthDays = prevMonthLastDate + dayNumber;
            displayDay = prevMonthDays;
            cellDate = new Date(year, month - 1, prevMonthDays);
            isOtherMonth = true;
        } else if (dayNumber > daysInMonth) {
            const nextMonthDay = dayNumber - daysInMonth;
            displayDay = nextMonthDay;
            cellDate = new Date(year, month + 1, nextMonthDay);
            isOtherMonth = true;
        }
        
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        if (isOtherMonth) cell.classList.add('other-month');
        if (isCurrentMonth && displayDay === currentDay && !isOtherMonth) cell.classList.add('today');
        
        const dateString = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(displayDay).padStart(2, '0')}`;
        const dayEvents = events.filter(event => event.event_date === dateString);
        
        cell.innerHTML = `
            <div class="day-number">${displayDay}</div>
            <div class="day-events">
                ${dayEvents.slice(0, 3).map(event => `
                    <div class="event-item" data-event-id="${event.id}" onclick="editEvent('${event.id}')">
                        ${event.is_all_day ? '📅 ' : '⏰ '}${event.title}
                    </div>
                `).join('')}
                ${dayEvents.length > 3 ? `<div class="event-item" style="background:#84C5B1;">+${dayEvents.length - 3} more</div>` : ''}
            </div>
        `;
        
        cell.onclick = (e) => {
            if (!e.target.classList.contains('event-item')) {
                openAddEventModal(dateString);
            }
        };
        
        calendarGrid.appendChild(cell);
    }
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;
    updateYearDropdown(year);
}

function updateYearDropdown(currentYear) {
    const yearSelect = document.getElementById('yearSelect');
    yearSelect.innerHTML = '';
    for (let year = 2024; year <= 2035; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }
}

async function openAddEventModal(date) {
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('eventModalTitle');
    const deleteBtn = document.getElementById('deleteEventBtn');
    
    modalTitle.textContent = 'Add Event';
    deleteBtn.style.display = 'none';
    
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDate').value = date;
    document.getElementById('eventStartTime').value = '';
    document.getElementById('eventEndTime').value = '';
    document.getElementById('allDayEvent').checked = false;
    
    delete document.getElementById('eventForm').dataset.editingEventId;
    modal.classList.add('show');
}

window.editEvent = async function(eventId) {
    const response = await fetch(`${API_URL}/api/events/${currentUser.id}/${currentDate.getFullYear()}/${currentDate.getMonth() + 1}`);
    const events = await response.json();
    const event = events.find(e => e.id == eventId);
    if (!event) return;
    
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('eventModalTitle');
    const deleteBtn = document.getElementById('deleteEventBtn');
    
    modalTitle.textContent = 'Edit Event';
    deleteBtn.style.display = 'block';
    
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDate').value = event.event_date;
    document.getElementById('eventStartTime').value = event.start_time || '';
    document.getElementById('eventEndTime').value = event.end_time || '';
    document.getElementById('allDayEvent').checked = event.is_all_day;
    
    document.getElementById('eventForm').dataset.editingEventId = eventId;
    modal.classList.add('show');
}

async function saveEvent(eventData) {
    const data = {
        userId: currentUser.id,
        id: eventData.id,
        date: eventData.date,
        title: eventData.title,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        allDay: eventData.allDay
    };
    
    await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    renderCalendar();
}

async function deleteEventById(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        await fetch(`${API_URL}/api/events/${currentUser.id}/${eventId}`, { method: 'DELETE' });
        renderCalendar();
        closeEventModal();
    }
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('show');
}

// =================================
// JOURNAL & MOOD TRACKER
// =================================

let selectedMood = null;
let currentEditingDate = null;

function getTodayDate() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

async function loadTodayEntry() {
    if (!currentUser) return;
    
    const today = getTodayDate();
    document.getElementById('currentDateInfo').textContent = `Today: ${today}`;
    
    const response = await fetch(`${API_URL}/api/journal/${currentUser.id}/${today}`);
    const entry = await response.json();
    
    if (entry) {
        document.getElementById('journalEntry').value = entry.content || '';
        selectedMood = entry.mood;
        updateMoodSelection(selectedMood);
    } else {
        document.getElementById('journalEntry').value = '';
        selectedMood = null;
        updateMoodSelection(null);
    }
}

function updateMoodSelection(mood) {
    document.querySelectorAll('.mood-emoji').forEach(emoji => {
        if (emoji.getAttribute('data-mood') === mood) {
            emoji.classList.add('selected');
        } else {
            emoji.classList.remove('selected');
        }
    });
}

async function saveJournalEntry() {
    const today = getTodayDate();
    const journalText = document.getElementById('journalEntry').value;
    
    if (!selectedMood && !journalText) {
        alert('Please select a mood or write something about your day!');
        return;
    }
    
    await fetch(`${API_URL}/api/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: currentUser.id,
            date: today,
            mood: selectedMood || null,
            content: journalText || ''
        })
    });
    
    alert('Journal entry saved successfully! ✓');
}

async function showPreviousEntries() {
    const response = await fetch(`${API_URL}/api/journal/all/${currentUser.id}`);
    const entries = await response.json();
    const entriesList = document.getElementById('entriesList');
    
    if (entries.length === 0) {
        entriesList.innerHTML = '<div style="text-align:center; padding:2rem;">No journal entries yet. Start writing today!</div>';
    } else {
        entriesList.innerHTML = entries.map(entry => `
            <div class="entry-item" onclick="openEditEntry('${entry.entry_date}')">
                <div class="entry-date">${formatDate(entry.entry_date)}</div>
                <div class="entry-mood">${entry.mood || 'No mood selected'}</div>
                <div class="entry-preview">${(entry.content || '').substring(0, 100)}${(entry.content || '').length > 100 ? '...' : ''}</div>
            </div>
        `).join('');
    }
    
    document.getElementById('entriesModal').classList.add('show');
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
}

window.openEditEntry = async function(date) {
    const response = await fetch(`${API_URL}/api/journal/${currentUser.id}/${date}`);
    const entry = await response.json();
    
    if (!entry) return;
    
    currentEditingDate = date;
    document.getElementById('editEntryDate').textContent = formatDate(date);
    document.getElementById('editJournalText').value = entry.content || '';
    
    document.querySelectorAll('#editMoodSelector .mood-emoji').forEach(emoji => {
        emoji.classList.remove('selected');
        if (emoji.getAttribute('data-edit-mood') === entry.mood) {
            emoji.classList.add('selected');
        }
    });
    
    document.getElementById('editEntryModal').classList.add('show');
    document.getElementById('entriesModal').classList.remove('show');
}

async function updateEntry() {
    const updatedText = document.getElementById('editJournalText').value;
    const updatedMood = document.querySelector('#editMoodSelector .mood-emoji.selected')?.getAttribute('data-edit-mood') || null;
    
    await fetch(`${API_URL}/api/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: currentUser.id,
            date: currentEditingDate,
            mood: updatedMood,
            content: updatedText
        })
    });
    
    if (currentEditingDate === getTodayDate()) {
        loadTodayEntry();
    }
    
    alert('Entry updated successfully! ✓');
    closeEditModal();
    showPreviousEntries();
}

async function deleteEntry() {
    if (confirm('Are you sure you want to delete this journal entry?')) {
        await fetch(`${API_URL}/api/journal/${currentUser.id}/${currentEditingDate}`, { method: 'DELETE' });
        
        if (currentEditingDate === getTodayDate()) {
            loadTodayEntry();
        }
        
        alert('Entry deleted successfully!');
        closeEditModal();
        showPreviousEntries();
    }
}

function closeEntriesModal() {
    document.getElementById('entriesModal').classList.remove('show');
}

function closeEditModal() {
    document.getElementById('editEntryModal').classList.remove('show');
}

// =================================
// CHECKLIST FUNCTIONALITY
// =================================

let currentChecklistDate = getTodayDate();

async function loadTasksForDate(date) {
    if (!currentUser) return;
    
    currentChecklistDate = date;
    const response = await fetch(`${API_URL}/api/checklist/${currentUser.id}/${date}`);
    const tasks = await response.json();
    currentTasks = tasks.map(task => ({
        id: task.id,
        text: task.task_text,
        completed: task.is_completed === 1
    }));
    renderTasks();
}

let currentTasks = [];

function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    
    if (currentTasks.length === 0) {
        tasksList.innerHTML = '<div style="text-align:center; padding:1rem; color:#744577; font-family:Inter; font-size:0.8rem;">No tasks yet. Add your first task above!</div>';
        return;
    }
    
    tasksList.innerHTML = currentTasks.map((task, index) => `
        <div class="task-item" data-task-index="${index}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${index})">
            <span class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span>
            <button class="btn-delete-task" onclick="deleteTask(${index})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function addTask() {
    const input = document.getElementById('newTaskInput');
    const taskText = input.value.trim();
    
    if (taskText === '') {
        alert('Please enter a task');
        return;
    }
    
    currentTasks.push({
        text: taskText,
        completed: false
    });
    
    await saveChecklist();
    renderTasks();
    input.value = '';
}

async function saveChecklist() {
    const tasksToSave = currentTasks.map(task => ({
        text: task.text,
        completed: task.completed
    }));
    
    await fetch(`${API_URL}/api/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: currentUser.id,
            date: currentChecklistDate,
            tasks: tasksToSave
        })
    });
}

window.toggleTask = async function(index) {
    currentTasks[index].completed = !currentTasks[index].completed;
    await saveChecklist();
    renderTasks();
}

window.deleteTask = async function(index) {
    if (confirm('Delete this task?')) {
        currentTasks.splice(index, 1);
        await saveChecklist();
        renderTasks();
    }
}

// =================================
// EVENT LISTENERS
// =================================

document.addEventListener('DOMContentLoaded', async function() {
    if (!currentUser) return;
    
    await renderCalendar();
    await loadTodayEntry();
    await loadTasksForDate(getTodayDate());
    
    // Navigation buttons
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('todayBtn').addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });
    
    document.getElementById('yearSelect').addEventListener('change', (e) => {
        currentDate.setFullYear(parseInt(e.target.value));
        renderCalendar();
    });
    
    // Modal close buttons
    document.querySelector('.close-event-modal').addEventListener('click', closeEventModal);
    document.querySelector('.close-entries-modal').addEventListener('click', closeEntriesModal);
    document.querySelector('.close-edit-modal').addEventListener('click', closeEditModal);
    
    // Event form submission
    document.getElementById('eventForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const allDay = document.getElementById('allDayEvent').checked;
        const eventData = {
            id: document.getElementById('eventForm').dataset.editingEventId,
            date: document.getElementById('eventDate').value,
            title: document.getElementById('eventTitle').value,
            startTime: allDay ? null : document.getElementById('eventStartTime').value,
            endTime: allDay ? null : document.getElementById('eventEndTime').value,
            allDay: allDay
        };
        
        if (!eventData.title) {
            alert('Please enter an event title');
            return;
        }
        
        await saveEvent(eventData);
        closeEventModal();
    });
    
    document.getElementById('deleteEventBtn').addEventListener('click', () => {
        const eventId = document.getElementById('eventForm').dataset.editingEventId;
        if (eventId) deleteEventById(eventId);
    });
    
    // Journal events
    document.querySelectorAll('.mood-emoji').forEach(emoji => {
        emoji.addEventListener('click', function() {
            const mood = this.getAttribute('data-mood');
            selectedMood = mood;
            updateMoodSelection(mood);
        });
    });
    
    document.getElementById('saveJournalBtn').addEventListener('click', saveJournalEntry);
    document.getElementById('viewEntriesBtn').addEventListener('click', showPreviousEntries);
    
    document.querySelectorAll('#editMoodSelector .mood-emoji').forEach(emoji => {
        emoji.addEventListener('click', function() {
            document.querySelectorAll('#editMoodSelector .mood-emoji').forEach(e => e.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    document.getElementById('updateEntryBtn').addEventListener('click', updateEntry);
    document.getElementById('deleteEntryBtn').addEventListener('click', deleteEntry);
    
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('entriesModal')) closeEntriesModal();
        if (e.target === document.getElementById('editEntryModal')) closeEditModal();
        if (e.target === document.getElementById('eventModal')) closeEventModal();
    });
    
    // Checklist events
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('newTaskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
});

// Make functions global
window.editEvent = editEvent;
window.openEditEntry = openEditEntry;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;