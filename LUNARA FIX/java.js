function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Change navbar on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Smooth scroll only for internal anchor links (href starting with '#')
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href) return;
            // only intercept internal anchors
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(href);
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
            // otherwise allow default navigation (e.g., about.html)
        });
    });
}

// ========================================
// TABS
// ========================================
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and panels
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Show corresponding panel
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// ========================================
// DIARY FUNCTIONALITY
// ========================================
function initDiary() {
    const diaryForm = document.getElementById('diaryForm');
    const moodBtns = document.querySelectorAll('.mood-btn');

    // Mood selector
    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            moodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('selectedMood').value = btn.getAttribute('data-mood');
        });
    });

    // Form submission
    diaryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveDiaryEntry();
    });
}

function saveDiaryEntry() {
    const periodStart = document.getElementById('periodStart').value;
    const periodEnd = document.getElementById('periodEnd').value;
    const flowIntensity = document.getElementById('flowIntensity').value;
    const selectedMood = document.getElementById('selectedMood').value;
    const notes = document.getElementById('notes').value;

    // Get selected symptoms
    const symptoms = [];
    document.querySelectorAll('input[name="symptom"]:checked').forEach(checkbox => {
        symptoms.push(checkbox.value);
    });

    // Validate dates
    if (new Date(periodStart) > new Date(periodEnd)) {
        alert('Tanggal mulai tidak boleh lebih dari tanggal selesai!');
        return;
    }

    // Create entry object
    const entry = {
        id: Date.now(),
        periodStart,
        periodEnd,
        flowIntensity,
        symptoms,
        mood: selectedMood,
        notes,
        createdAt: new Date().toISOString()
    };

    // Get existing data
    let entries = JSON.parse(localStorage.getItem('femcare_diary')) || [];
    entries.push(entry);

    // Save to localStorage
    localStorage.setItem('femcare_diary', JSON.stringify(entries));

    // Reset form
    document.getElementById('diaryForm').reset();
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));

    // Reload history
    loadHistoryData();

    // Show success message
    alert('Catatan berhasil disimpan!');

    // Scroll to history
    document.querySelector('.diary-history-container').scrollIntoView({
        behavior: 'smooth'
    });
}

function loadHistoryData() {
    const historyList = document.getElementById('historyList');
    const entries = JSON.parse(localStorage.getItem('femcare_diary')) || [];

    if (entries.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-inbox"></i>
                <p>Belum ada catatan periode</p>
            </div>
        `;
        document.getElementById('avgCycle').textContent = '- hari';
        document.getElementById('avgDuration').textContent = '- hari';
        return;
    }

    // Sort entries by date (newest first)
    entries.sort((a, b) => new Date(b.periodStart) - new Date(a.periodStart));

    // Generate HTML for history items
    let html = '';
    entries.forEach(entry => {
        const startDate = new Date(entry.periodStart);
        const endDate = new Date(entry.periodEnd);
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        const symptomsText = entry.symptoms.map(s => {
            const symptomsMap = {
                'kram': 'Kram',
                'sakit_kepala': 'Sakit Kepala',
                'mood_berubah': 'Mood Berubah',
                'keletihan': 'Kelelahan',
                'pusing': 'Pusing'
            };
            return symptomsMap[s] || s;
        }).join(', ');

        html += `
            <div class="history-item">
                <div class="history-item-header">
                    <span class="history-item-date">${formatDate(entry.periodStart)} - ${formatDate(entry.periodEnd)}</span>
                    <span class="history-item-duration">${duration} hari</span>
                </div>
                <div class="history-item-symptoms">
                    ${entry.flowIntensity ? `<span class="symptom-tag">${entry.flowIntensity}</span>` : ''}
                    ${symptomsText ? `<span class="symptom-tag">${symptomsText}</span>` : ''}
                </div>
            </div>
        `;
    });

    historyList.innerHTML = html;

    // Calculate averages
    calculateAverages(entries);
}

function calculateAverages(entries) {
    if (entries.length < 2) {
        document.getElementById('avgCycle').textContent = '- hari';
        document.getElementById('avgDuration').textContent = '- hari';
        return;
    }

    let totalDuration = 0;
    let totalCycle = 0;

    // Calculate average duration
    entries.forEach(entry => {
        const start = new Date(entry.periodStart);
        const end = new Date(entry.periodEnd);
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        totalDuration += duration;
    });

    // Calculate average cycle (gap between period starts)
    for (let i = 0; i < entries.length - 1; i++) {
        const currentStart = new Date(entries[i].periodStart);
        const prevStart = new Date(entries[i + 1].periodStart);
        const cycle = Math.ceil((currentStart - prevStart) / (1000 * 60 * 60 * 24));
        if (cycle > 0) {
            totalCycle += cycle;
        }
    }

    const avgDuration = Math.round(totalDuration / entries.length);
    const avgCycle = Math.round(totalCycle / (entries.length - 1));

    document.getElementById('avgDuration').textContent = avgDuration + ' hari';
    document.getElementById('avgCycle').textContent = avgCycle > 0 ? avgCycle + ' hari' : '- hari';

    // Save average cycle to localStorage for prediction
    if (avgCycle > 0) {
        localStorage.setItem('femcare_avg_cycle', avgCycle);
    }
}

// ========================================
// PREDICTION FUNCTIONALITY
// ========================================
function initPrediction() {
    const predictionForm = document.getElementById('predictionForm');

    predictionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        calculatePrediction();
    });

    // Load last period date from diary if available
    loadLastPeriodDate();
}

function loadLastPeriodDate() {
    const entries = JSON.parse(localStorage.getItem('femcare_diary')) || [];
    if (entries.length > 0) {
        // Sort by date and get the most recent
        entries.sort((a, b) => new Date(b.periodStart) - new Date(a.periodStart));
        document.getElementById('lastPeriod').value = entries[0].periodStart;

        // Load average cycle
        const avgCycle = localStorage.getItem('femcare_avg_cycle');
        if (avgCycle) {
            document.getElementById('cycleLength').value = avgCycle;
        }
    }
}

function calculatePrediction() {
    const lastPeriod = document.getElementById('lastPeriod').value;
    const cycleLength = parseInt(document.getElementById('cycleLength').value);

    if (!lastPeriod || !cycleLength) {
        alert('Mohon lengkapi semua data!');
        return;
    }

    const lastDate = new Date(lastPeriod);
    const today = new Date();

    // Calculate next period date
    const nextPeriod = new Date(lastDate);
    nextPeriod.setDate(nextPeriod.getDate() + cycleLength);

    // Calculate ovulation date (approximately 14 days before next period)
    const ovulationDate = new Date(nextPeriod);
    ovulationDate.setDate(ovulationDate.getDate() - 14);

    // Calculate fertile window (5 days before ovulation to 1 day after)
    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(fertileStart.getDate() - 5);
    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(fertileEnd.getDate() + 1);

    // Calculate days until next period
    const daysUntil = Math.ceil((nextPeriod - today) / (1000 * 60 * 60 * 24));

    // Calculate period duration (average from diary)
    let periodDuration = 5; // default
    const entries = JSON.parse(localStorage.getItem('femcare_diary')) || [];
    if (entries.length > 0) {
        let totalDuration = 0;
        entries.forEach(entry => {
            const start = new Date(entry.periodStart);
            const end = new Date(entry.periodEnd);
            const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            totalDuration += duration;
        });
        periodDuration = Math.round(totalDuration / entries.length);
    }

    // Display results
    displayPredictionResult(nextPeriod, ovulationDate, daysUntil, periodDuration, fertileStart, fertileEnd);

    // Generate calendar
    generateCalendar(nextPeriod, ovulationDate, daysUntil, periodDuration, fertileStart, fertileEnd);
}

function displayPredictionResult(nextPeriod, ovulationDate, daysUntil, periodDuration, fertileStart, fertileEnd) {
    const resultContainer = document.getElementById('predictionResult');

    const countdownHtml = `
        <div class="countdown-container">
            <div class="countdown-item">
                <span class="countdown-number">${Math.max(0, daysUntil)}</span>
                <span class="countdown-label">Hari</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-number">${Math.floor(Math.max(0, daysUntil) / 7)}</span>
                <span class="countdown-label">Minggu</span>
            </div>
        </div>
    `;

    const resultHtml = `
        <div class="prediction-result">
            <h3>Hasil Prediksi</h3>
            ${countdownHtml}
            <div class="prediction-info">
                <div class="info-box highlight">
                    <div class="info-box-label">Periode Berikutnya</div>
                    <div class="info-box-value">${formatDate(nextPeriod.toISOString().split('T')[0])}</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">Perkiraan Durasi</div>
                    <div class="info-box-value">${periodDuration} hari</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">Tanggal Ovulasi</div>
                    <div class="info-box-value">${formatDate(ovulationDate.toISOString().split('T')[0])}</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">Periode Subur</div>
                    <div class="info-box-value">${formatDate(fertileStart.toISOString().split('T')[0])} - ${formatDate(fertileEnd.toISOString().split('T')[0])}</div>
                </div>
            </div>
        </div>
    `;

    resultContainer.innerHTML = resultHtml;
}

// ========================================
// CALENDAR
// ========================================
let currentCalendarDate = new Date();

function initCalendar() {
    generateCalendar();
}

function generateCalendar(nextPeriod, ovulationDate, daysUntil, periodDuration, fertileStart, fertileEnd) {
    const container = document.getElementById('calendarContainer');

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const weekdays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    let html = `
        <div class="calendar">
            <div class="calendar-header">
                <div class="calendar-month">${monthNames[month]} ${year}</div>
                <div class="calendar-nav">
                    <button onclick="changeMonth(-1)"><i class="fas fa-chevron-left"></i></button>
                    <button onclick="changeMonth(1)"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
            <div class="calendar-weekdays">
                ${weekdays.map(day => `<div>${day}</div>`).join('')}
            </div>
            <div class="calendar-days">
    `;

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${prevMonthLastDay - i}</div>`;
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const currentDate = new Date(year, month, day);
        const dateStr = currentDate.toISOString().split('T')[0];
        let classes = 'calendar-day';

        // Today
        if (currentDate.toDateString() === today.toDateString()) {
            classes += ' today';
        }

        // Period days (if predicted)
        if (nextPeriod && daysUntil > 0 && daysUntil <= periodDuration) {
            const periodStart = new Date(nextPeriod);
            periodStart.setDate(periodStart.getDate() - periodDuration + 1);
            if (currentDate >= periodStart && currentDate <= nextPeriod) {
                classes += ' period';
            }
        }

        // Predicted next period
        if (nextPeriod && currentDate.toDateString() === nextPeriod.toDateString()) {
            classes += ' predicted';
        }

        // Ovulation
        if (ovulationDate && currentDate.toDateString() === ovulationDate.toDateString()) {
            classes += ' ovulation';
        }

        // Fertile window
        if (fertileStart && fertileEnd) {
            if (currentDate >= fertileStart && currentDate <= fertileEnd) {
                classes += ' fertile';
            }
        }

        html += `<div class="${classes}">${day}</div>`;
    }

    // Next month days
    const remainingDays = 42 - (startingDay + totalDays);
    for (let i = 1; i <= remainingDays; i++) {
        html += `<div class="calendar-day other-month">${i}</div>`;
    }

    html += '</div></div>';

    container.innerHTML = html;
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    // Re-run prediction if there's saved data
    const lastPeriod = document.getElementById('lastPeriod').value;
    const cycleLength = parseInt(document.getElementById('cycleLength').value);
    if (lastPeriod && cycleLength) {
        calculatePrediction();
    } else {
        generateCalendar();
    }
}

// ========================================
// SCROLL TO TOP
// ========================================
function initScrollTop() {
    const scrollTopBtn = document.getElementById('scrollTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ========================================
// REVEAL ON SCROLL (fade-down when hero is out of view)
// ========================================
function initRevealOnScroll() {
    const hero = document.querySelector('.hero') || document.getElementById('home');
    const revealEls = document.querySelectorAll('.reveal-on-scroll');

    if (!hero || !revealEls.length) return;

    const observer = new IntersectionObserver((entries) => {
        const e = entries[0];
        if (e.isIntersecting) {
            // hero is visible: hide reveal elements
            revealEls.forEach(el => {
                el.classList.remove('show');
                el.style.transitionDelay = '';
            });
        } else {
            // hero not visible: show elements with optional stagger
            revealEls.forEach((el, i) => {
                const delay = el.dataset.delay ? parseInt(el.dataset.delay, 10) : i * 100;
                el.style.transitionDelay = delay + 'ms';
                el.classList.add('show');
            });
        }
    }, { root: null, threshold: 0, rootMargin: '0px' });

    observer.observe(hero);
}

// ========================================
// SCROLLSPY - set active nav-link based on visible section
// ========================================
function initScrollSpy() {
    const navLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
    if (!navLinks.length) return;

    const sections = navLinks
        .map(l => document.querySelector(l.getAttribute('href')))
        .filter(Boolean)
        // exclude sections explicitly marked to skip scrollspy
        .filter(s => !(s.dataset && (s.dataset.skipSpy === 'true' || s.dataset.skipSpy === '1')) && !s.classList.contains('no-scrollspy'));

    if (!sections.length) return;

    const clearActive = () => document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    let ticking = false;
    const offset = 90; // match navbar offset used in smooth scroll

    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const fromTop = window.scrollY + offset;
                let currentSection = null;

                for (let i = sections.length - 1; i >= 0; i--) {
                    const s = sections[i];
                    if (s.offsetTop <= fromTop) {
                        currentSection = s;
                        break;
                    }
                }

                clearActive();
                if (currentSection) {
                    const link = document.querySelector(`.nav-link[href="#${currentSection.id}"]`);
                    if (link) link.classList.add('active');
                }

                ticking = false;
            });
            ticking = true;
        }
    }

    // run once to set initial state
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                        'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

    return `${day} ${monthNames[month]} ${year}`;
}

// Initialize all modules when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        initNavbar();
        initTabs();
        initDiary();
        loadHistoryData();
        initPrediction();
        initCalendar();
        initScrollTop();
        initRevealOnScroll();
        initScrollSpy();
    } catch (err) {
        console.error('Initialization error:', err);
    }
});
