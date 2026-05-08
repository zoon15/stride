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

// Get logged in user from localStorage (set during login)
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

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
        window.location.href = 'login.html';
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
    
    // Show logout message and redirect to welcome page
    alert('You have been logged out successfully!');
    window.location.href = 'index.html';
});

// Check if user is logged in, if not on dashboard but trying to access, redirect
function checkAuth() {
    if (!currentUser) {
        // Optional: Uncomment to force login
        // window.location.href = 'login.html';
    }
}

// Initialize
updateUI();
checkAuth();
// =================================
// CALENDAR FUNCTIONALITY
// =================================

let currentDate = new Date();
let currentUserEvents = [];

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Load events for current user
function loadEvents() {
    const user = getCurrentUser();
    if (user) {
        const allEvents = JSON.parse(localStorage.getItem('calendarEvents')) || {};
        currentUserEvents = allEvents[user.email] || [];
    } else {
        currentUserEvents = [];
    }
}

// Save events for current user
function saveEvents() {
    const user = getCurrentUser();
    if (user) {
        const allEvents = JSON.parse(localStorage.getItem('calendarEvents')) || {};
        allEvents[user.email] = currentUserEvents;
        localStorage.setItem('calendarEvents', JSON.stringify(allEvents));
    }
}
// =================================
// CHECKLIST FUNCTIONALITY
// =================================

let currentChecklistDate = getTodayDate();
let currentTasks = [];

// Get checklist for current user and date
function getChecklist(date) {
    const user = getCurrentUser();
    if (user) {
        const allChecklists = JSON.parse(localStorage.getItem('checklists')) || {};
        const userChecklists = allChecklists[user.email] || {};
        return userChecklists[date] || [];
    }
    return [];
}

// Save checklist for current user and date
function saveChecklist(date, tasks) {
    const user = getCurrentUser();
    if (user) {
        const allChecklists = JSON.parse(localStorage.getItem('checklists')) || {};
        if (!allChecklists[user.email]) {
            allChecklists[user.email] = {};
        }
        allChecklists[user.email][date] = tasks;
        localStorage.setItem('checklists', JSON.stringify(allChecklists));
    }
}

// Load tasks for current date
function loadTasksForDate(date) {
    currentChecklistDate = date;
    const tasks = getChecklist(date);
    currentTasks = tasks;
    renderTasks();
}

// Render tasks list
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

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add new task
function addTask() {
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
    
    saveChecklist(currentChecklistDate, currentTasks);
    renderTasks();
    input.value = '';
}

// Toggle task completion
function toggleTask(index) {
    currentTasks[index].completed = !currentTasks[index].completed;
    saveChecklist(currentChecklistDate, currentTasks);
    renderTasks();
}

// Delete task
function deleteTask(index) {
    if (confirm('Delete this task?')) {
        currentTasks.splice(index, 1);
        saveChecklist(currentChecklistDate, currentTasks);
        renderTasks();
    }
}

// Listen for calendar date clicks to load that day's checklist
// Add this to the calendar cell click handler
// Modify the existing calendar click handler in renderCalendar function
// Find where cell.onclick is set and update it

// Also update loadTodayEntry to load today's checklist
// Add this to the existing loadTodayEntry function
// Render calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Get days from previous month
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    
    // Get current date for highlighting
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const currentDay = today.getDate();
    
    // Populate calendar cells
    for (let i = 0; i < 42; i++) {
        const dayNumber = i - startingDayOfWeek + 1;
        let cellDate = new Date(year, month, dayNumber);
        let isOtherMonth = false;
        let displayDay = dayNumber;
        
        if (dayNumber <= 0) {
            // Previous month days
            const prevMonthDays = prevMonthLastDate + dayNumber;
            displayDay = prevMonthDays;
            cellDate = new Date(year, month - 1, prevMonthDays);
            isOtherMonth = true;
        } else if (dayNumber > daysInMonth) {
            // Next month days
            const nextMonthDay = dayNumber - daysInMonth;
            displayDay = nextMonthDay;
            cellDate = new Date(year, month + 1, nextMonthDay);
            isOtherMonth = true;
        }
        
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        if (isOtherMonth) cell.classList.add('other-month');
        if (isCurrentMonth && displayDay === currentDay && !isOtherMonth) cell.classList.add('today');
        
        // Format date string for comparison
        const dateString = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(displayDay).padStart(2, '0')}`;
        
        // Get events for this day
        const dayEvents = currentUserEvents.filter(event => event.date === dateString);
        
        cell.innerHTML = `
            <div class="day-number">${displayDay}</div>
            <div class="day-events">
                ${dayEvents.slice(0, 3).map(event => `
                    <div class="event-item" data-event-id="${event.id}" onclick="editEvent('${event.id}')">
                        ${event.allDay ? '📅 ' : '⏰ '}${event.title}${!event.allDay && event.startTime ? ` (${event.startTime})` : ''}
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
    
    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    // Update year dropdown
    updateYearDropdown(year);
}

// Update year dropdown
function updateYearDropdown(currentYear) {
    const yearSelect = document.getElementById('yearSelect');
    const currentYearSelected = currentYear;
    
    yearSelect.innerHTML = '';
    for (let year = 2024; year <= 2035; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYearSelected) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
}

// Open add event modal
function openAddEventModal(date) {
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
    
    // Remove any stored editing event ID
    delete document.getElementById('eventForm').dataset.editingEventId;
    
    modal.classList.add('show');
}

// Edit existing event
function editEvent(eventId) {
    const event = currentUserEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('eventModalTitle');
    const deleteBtn = document.getElementById('deleteEventBtn');
    
    modalTitle.textContent = 'Edit Event';
    deleteBtn.style.display = 'block';
    
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventStartTime').value = event.startTime || '';
    document.getElementById('eventEndTime').value = event.endTime || '';
    document.getElementById('allDayEvent').checked = event.allDay || false;
    
    document.getElementById('eventForm').dataset.editingEventId = eventId;
    
    modal.classList.add('show');
}

// Save event
function saveEvent(eventData) {
    if (eventData.id) {
        // Update existing event
        const index = currentUserEvents.findIndex(e => e.id === eventData.id);
        if (index !== -1) {
            currentUserEvents[index] = eventData;
        }
    } else {
        // Add new event
        eventData.id = Date.now().toString();
        currentUserEvents.push(eventData);
    }
    
    saveEvents();
    renderCalendar();
}

// Delete event
function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        currentUserEvents = currentUserEvents.filter(e => e.id !== eventId);
        saveEvents();
        renderCalendar();
        closeEventModal();
    }
}

// Close event modal
function closeEventModal() {
    document.getElementById('eventModal').classList.remove('show');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize calendar
    loadEvents();
    renderCalendar();
    
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
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('eventModal');
        if (e.target === modal) closeEventModal();
    });
    
    // Event form submission
    document.getElementById('eventForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const allDay = document.getElementById('allDayEvent').checked;
        const eventData = {
            id: document.getElementById('eventForm').dataset.editingEventId,
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            startTime: allDay ? null : document.getElementById('eventStartTime').value,
            endTime: allDay ? null : document.getElementById('eventEndTime').value,
            allDay: allDay
        };
        
        if (!eventData.title) {
            alert('Please enter an event title');
            return;
        }
        
        saveEvent(eventData);
        closeEventModal();
    });
    
    // Delete event button
    document.getElementById('deleteEventBtn').addEventListener('click', () => {
        const eventId = document.getElementById('eventForm').dataset.editingEventId;
        if (eventId) deleteEvent(eventId);
    });
});

// Make editEvent available globally
window.editEvent = editEvent;
// =================================
// JOURNAL & MOOD TRACKER
// =================================

let selectedMood = null;
let currentEditingDate = null;

// Get journal entries for current user
function getJournalEntries() {
    const user = getCurrentUser();
    if (user) {
        const allJournals = JSON.parse(localStorage.getItem('journalEntries')) || {};
        return allJournals[user.email] || {};
    }
    return {};
}

// Save journal entries for current user
function saveJournalEntries(entries) {
    const user = getCurrentUser();
    if (user) {
        const allJournals = JSON.parse(localStorage.getItem('journalEntries')) || {};
        allJournals[user.email] = entries;
        localStorage.setItem('journalEntries', JSON.stringify(allJournals));
    }
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// Load today's entry into the form
function loadTodayEntry() {
    const today = getTodayDate();
    const entries = getJournalEntries();
    const todayEntry = entries[today];
    
    if (todayEntry) {
        document.getElementById('journalEntry').value = todayEntry.text || '';
        selectedMood = todayEntry.mood;
        updateMoodSelection(selectedMood);
    } else {
        document.getElementById('journalEntry').value = '';
        selectedMood = null;
        updateMoodSelection(null);
    }
    
    document.getElementById('currentDateInfo').textContent = `Today: ${today}`;
}

// Update mood selection UI
function updateMoodSelection(mood) {
    document.querySelectorAll('.mood-emoji').forEach(emoji => {
        if (emoji.getAttribute('data-mood') === mood) {
            emoji.classList.add('selected');
        } else {
            emoji.classList.remove('selected');
        }
    });
}

// Save journal entry for current date
function saveJournalEntry() {
    const today = getTodayDate();
    const journalText = document.getElementById('journalEntry').value;
    
    if (!selectedMood && !journalText) {
        alert('Please select a mood or write something about your day!');
        return;
    }
    
    const entries = getJournalEntries();
    entries[today] = {
        mood: selectedMood || null,
        text: journalText || '',
        date: today
    };
    
    saveJournalEntries(entries);
    alert('Journal entry saved successfully! ✓');
}

// Show all previous entries
function showPreviousEntries() {
    const entries = getJournalEntries();
    const entriesList = document.getElementById('entriesList');
    
    // Convert to array and sort by date (newest first)
    const entriesArray = Object.entries(entries).map(([date, data]) => ({
        date: date,
        mood: data.mood,
        text: data.text
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (entriesArray.length === 0) {
        entriesList.innerHTML = '<div style="text-align:center; padding:2rem;">No journal entries yet. Start writing today!</div>';
    } else {
        entriesList.innerHTML = entriesArray.map(entry => `
            <div class="entry-item" onclick="openEditEntry('${entry.date}')">
                <div class="entry-date">${formatDate(entry.date)}</div>
                <div class="entry-mood">${entry.mood || 'No mood selected'}</div>
                <div class="entry-preview">${entry.text.substring(0, 100)}${entry.text.length > 100 ? '...' : ''}</div>
            </div>
        `).join('');
    }
    
    document.getElementById('entriesModal').classList.add('show');
}

// Format date for display
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
}

// Open edit entry modal
function openEditEntry(date) {
    const entries = getJournalEntries();
    const entry = entries[date];
    
    if (!entry) return;
    
    currentEditingDate = date;
    document.getElementById('editEntryDate').textContent = formatDate(date);
    document.getElementById('editJournalText').value = entry.text || '';
    
    // Set up edit mood selector
    document.querySelectorAll('#editMoodSelector .mood-emoji').forEach(emoji => {
        emoji.classList.remove('selected');
        if (emoji.getAttribute('data-edit-mood') === entry.mood) {
            emoji.classList.add('selected');
        }
    });
    
    document.getElementById('editEntryModal').classList.add('show');
    document.getElementById('entriesModal').classList.remove('show');
}

// Update entry
function updateEntry() {
    const updatedText = document.getElementById('editJournalText').value;
    const updatedMood = document.querySelector('#editMoodSelector .mood-emoji.selected')?.getAttribute('data-edit-mood') || null;
    
    const entries = getJournalEntries();
    
    if (entries[currentEditingDate]) {
        entries[currentEditingDate] = {
            mood: updatedMood,
            text: updatedText,
            date: currentEditingDate
        };
        
        saveJournalEntries(entries);
        
        // If editing today's entry, refresh the main form
        if (currentEditingDate === getTodayDate()) {
            loadTodayEntry();
        }
        
        alert('Entry updated successfully! ✓');
        closeEditModal();
        showPreviousEntries(); // Refresh the list if it's open
    }
}

// Delete entry
function deleteEntry() {
    if (confirm('Are you sure you want to delete this journal entry?')) {
        const entries = getJournalEntries();
        delete entries[currentEditingDate];
        saveJournalEntries(entries);
        
        // If deleting today's entry, clear the main form
        if (currentEditingDate === getTodayDate()) {
            loadTodayEntry();
        }
        
        alert('Entry deleted successfully!');
        closeEditModal();
        showPreviousEntries(); // Refresh the list
    }
}

// Close modals
function closeEntriesModal() {
    document.getElementById('entriesModal').classList.remove('show');
}

function closeEditModal() {
    document.getElementById('editEntryModal').classList.remove('show');
}

// Event listeners for journal
document.addEventListener('DOMContentLoaded', function() {
    // Load today's entry
    loadTodayEntry();
    
    // Mood selection
    document.querySelectorAll('.mood-emoji').forEach(emoji => {
        emoji.addEventListener('click', function() {
            const mood = this.getAttribute('data-mood');
            selectedMood = mood;
            updateMoodSelection(mood);
        });
    });
    
    // Save button
    document.getElementById('saveJournalBtn').addEventListener('click', saveJournalEntry);
    
    // View entries button
    document.getElementById('viewEntriesBtn').addEventListener('click', showPreviousEntries);
    
    // Edit modal mood selection
    document.querySelectorAll('#editMoodSelector .mood-emoji').forEach(emoji => {
        emoji.addEventListener('click', function() {
            document.querySelectorAll('#editMoodSelector .mood-emoji').forEach(e => e.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Update and delete buttons
    document.getElementById('updateEntryBtn').addEventListener('click', updateEntry);
    document.getElementById('deleteEntryBtn').addEventListener('click', deleteEntry);
    
    // Close modal buttons
    document.querySelector('.close-entries-modal').addEventListener('click', closeEntriesModal);
    document.querySelector('.close-edit-modal').addEventListener('click', closeEditModal);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('entriesModal')) closeEntriesModal();
        if (e.target === document.getElementById('editEntryModal')) closeEditModal();
    });
});

// Make functions global for onclick
window.openEditEntry = openEditEntry;
// Add task button
document.getElementById('addTaskBtn').addEventListener('click', addTask);
document.getElementById('newTaskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});