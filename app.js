let currentSlide = 0;
let currentStep = 0;
let totalSlides = 0;
let slides = [];
let slide41bInterval = null;
let slide41bLogIndex = 0;
const slide41bLogs = [
    '<div class="text-amber-400 font-bold">[WARN] Open CORS wildcard \'*\' detected!</div>',
    '<div class="text-red-400 font-bold">[ERR] Runaway loop on /api/chat (1,240 calls/sec)</div>',
    '<div class="text-rose-400 font-bold">[ALERT] Hardcoded secret API key leaked in commits!</div>',
    '<div class="text-amber-400 font-bold">[WARN] Unthrottled payment endpoint called 500x/sec</div>',
    '<div class="text-red-500 font-bold">[FATAL] DB pool exhausted! (N+1 query blast)</div>',
    '<div class="text-rose-500 font-black animate-pulse">[CRITICAL] Budget Drain: Credit threshold met!</div>',
    '<div class="text-amber-500 font-bold">[BILL] OpenAI API monthly cap reached! Suspending...</div>'
];

// Initialize slide deck
function initDeck() {
    slides = document.querySelectorAll('.slide');
    totalSlides = slides.length;
    
    // Populate slide selector dropdown
    const select = document.getElementById('slideSelect');
    if (select) {
        select.innerHTML = '';
        slides.forEach((slide, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = `${idx + 1}`;
            select.appendChild(opt);
        });
    }
    const totalCountEl = document.getElementById('total-slides-count');
    if (totalCountEl) {
        totalCountEl.textContent = `/ ${totalSlides}`;
    }

    // Check URL hash for starting slide (e.g. #slide-15 starts on slide index 14)
    const hash = window.location.hash;
    if (hash && hash.startsWith('#slide-')) {
        const slideIndex = parseInt(hash.replace('#slide-', '')) - 1;
        if (slideIndex >= 0 && slideIndex < totalSlides) {
            currentSlide = slideIndex;
        }
    }

    // Initialize scaling
    resizeDeck();
    window.addEventListener('resize', resizeDeck);

    // Initial slide display
    goToSlide(currentSlide);

    // Setup Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Fit 1920x1080 slide deck inside browser window while keeping aspect ratio
function resizeDeck() {
    const deck = document.getElementById('deck');
    if (!deck) return;

    const baseWidth = 1920;
    const baseHeight = 1080;
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Maintain a small padding margin
    const padding = 20;
    const availableWidth = windowWidth - padding;
    const availableHeight = windowHeight - padding;
    
    const scaleX = availableWidth / baseWidth;
    const scaleY = availableHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY);
    
    deck.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

// Navigation Handler
function goToSlide(index, direction = 'next') {
    if (index < 0 || index >= totalSlides) return;
    
    // Deactivate current slide
    const oldSlideEl = slides[currentSlide];
    if (oldSlideEl) {
        oldSlideEl.classList.remove('active');
    }

    // Set new slide index
    currentSlide = index;
    const newSlideEl = slides[currentSlide];
    newSlideEl.classList.add('active');

    // Get build steps inside new slide
    const steps = newSlideEl.querySelectorAll('.build-step');
    
    if (direction === 'prev') {
        // If going backward, we reveal all build steps by default and let user hide them
        currentStep = steps.length;
        steps.forEach(step => {
            step.classList.add('revealed');
        });
    } else {
        // If going forward, we hide all build steps and let user reveal them one by one
        currentStep = 0;
        steps.forEach(step => {
            step.classList.remove('revealed');
        });
    }

    // Special slide interactive initializations
    initInteractiveSlide(currentSlide);

    // Update global Navigation indicators (handled by dropdown selection value)

    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const percent = ((currentSlide + 1) / totalSlides) * 100;
        progressBar.style.width = `${percent}%`;
    }

    const select = document.getElementById('slideSelect');
    if (select) {
        select.value = currentSlide;
    }

    // Sync window location hash
    window.location.hash = `slide-${currentSlide + 1}`;
}

// Slide Build-Step Controller
function next() {
    const activeSlideEl = slides[currentSlide];
    const steps = activeSlideEl.querySelectorAll('.build-step');

    if (currentStep < steps.length) {
        // Reveal next sequential element in the active slide
        const nextStepEl = steps[currentStep];
        nextStepEl.classList.add('revealed');
        
        // Custom animation handlers inside diagrams on step reveal
        handleStepReveal(currentSlide, currentStep);
        
        currentStep++;
    } else {
        // No more steps on this slide, advance to next slide
        if (currentSlide < totalSlides - 1) {
            goToSlide(currentSlide + 1, 'next');
        }
    }
}

function prev() {
    const activeSlideEl = slides[currentSlide];
    const steps = activeSlideEl.querySelectorAll('.build-step');

    if (currentStep > 0) {
        // Hide the last revealed element
        currentStep--;
        const prevStepEl = steps[currentStep];
        prevStepEl.classList.remove('revealed');
        
        // Custom animation handlers inside diagrams on step hide
        handleStepHide(currentSlide, currentStep);
    } else {
        // No active steps remaining, go to previous slide
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1, 'prev');
        }
    }
}

// Slide-Specific Animations Triggered on Slide Entry
function initInteractiveSlide(slideIdx) {
    const slide = slides[slideIdx];
    if (!slide) return;
    const slideId = slide.id;

    // Slide 9 (Attention) initial state
    if (slideId === 'slide-9') {
        const attnCat = document.getElementById('attn-cat');
        const attnIt = document.getElementById('attn-it');
        const path = document.querySelector('#slide-9 .connection-path');
        if (attnCat) attnCat.className = 'px-2 py-1 rounded font-bold transition-all duration-500 text-slate-800';
        if (attnIt) attnIt.className = 'px-2 py-1 rounded font-bold transition-all duration-500 text-slate-800';
        if (path) path.classList.remove('revealed');
    }
    // Slide 30: Embeddings Scatter Plot Initial state (Unclustered)
    else if (slideId === 'slide-30') { 
        resetScatterPlot(false);
    }
    // Slide 31: Embeddings Query Matching initial state
    else if (slideId === 'slide-31') {
        resetScatterPlot(true);
    }
    // Slide 10: Concentric rings initial state sync
    else if (slideId === 'slide-10') {
        const rAI = document.getElementById('ring-ai');
        const rML = document.getElementById('ring-ml');
        const rDL = document.getElementById('ring-dl');
        const rGen = document.getElementById('ring-genai');
        if (rAI) rAI.classList.toggle('active-ring', currentStep >= 1);
        if (rML) rML.classList.toggle('active-ring', currentStep >= 2);
        if (rDL) rDL.classList.toggle('active-ring', currentStep >= 3);
        if (rGen) rGen.classList.toggle('active-ring', currentStep >= 4);
    }
    
    // Slide 41b: Runaway Costs & Security threat loops
    if (slideId === 'slide-41b') {
        if (slide41bInterval) clearInterval(slide41bInterval);
        
        const billEl = document.getElementById('live-api-bill');
        const termEl = document.getElementById('live-sec-terminal');
        
        let currentBill = 0.00;
        slide41bLogIndex = 0;
        
        if (billEl) billEl.textContent = '$0.00';
        if (termEl) {
            termEl.innerHTML = `
                <div class="text-slate-500">[SYSTEM] Initiating server check...</div>
                <div class="text-slate-500">[SYSTEM] Deploying build-v1.0...</div>
            `;
        }
        
        slide41bInterval = setInterval(() => {
            // Count up bills rapidly
            currentBill += Math.random() * 8.50 + 4.50;
            if (billEl) billEl.textContent = `$${currentBill.toFixed(2)}`;
            
            // Randomly append logs
            if (Math.random() < 0.25 && termEl) {
                const nextLog = slide41bLogs[slide41bLogIndex % slide41bLogs.length];
                slide41bLogIndex++;
                termEl.innerHTML += nextLog;
                
                // Keep only last 5 lines for scrolling effect
                const children = Array.from(termEl.children);
                if (children.length > 5) {
                    children[0].remove();
                }
            }
        }, 150);
    } else {
        // Clear interval when leaving Slide 41b
        if (slide41bInterval) {
            clearInterval(slide41bInterval);
            slide41bInterval = null;
        }
    }
}

// Slide-Specific Custom Step Animations (On Forward Build)
function handleStepReveal(slideIdx, stepIdx) {
    const slide = slides[slideIdx];
    if (!slide) return;
    const slideId = slide.id;

    // Slide 9: Attention line draws and words highlight on first step
    if (slideId === 'slide-9' && stepIdx === 0) {
        const attnCat = document.getElementById('attn-cat');
        const attnIt = document.getElementById('attn-it');
        const path = document.querySelector('#slide-9 .connection-path');
        if (attnCat) attnCat.className = 'bg-teal-100 text-teal-800 px-2 py-1 rounded font-bold transition-all duration-500';
        if (attnIt) attnIt.className = 'bg-teal-100 text-teal-800 px-2 py-1 rounded font-bold transition-all duration-500';
        if (path) path.classList.add('revealed');
    }
    // Slide 30: Clustered Dots on Step 1 Reveal
    if (slideId === 'slide-30' && stepIdx === 0) {
        clusterDots();
    }
    // Slide 31: Question Query placement and line connections
    if (slideId === 'slide-31') {
        if (stepIdx === 0) {
            showQueryDot();
        } else if (stepIdx === 1) {
            drawQueryConnections();
        }
    }
    // Slide 10: concentric rings reveal step-by-step
    else if (slideId === 'slide-10') {
        if (stepIdx === 0) {
            const el = document.getElementById('ring-ai');
            if (el) el.classList.add('active-ring');
        } else if (stepIdx === 1) {
            const el = document.getElementById('ring-ml');
            if (el) el.classList.add('active-ring');
        } else if (stepIdx === 2) {
            const el = document.getElementById('ring-dl');
            if (el) el.classList.add('active-ring');
        } else if (stepIdx === 3) {
            const el = document.getElementById('ring-genai');
            if (el) el.classList.add('active-ring');
        }
    }
}

// Slide-Specific Custom Step Animations (On Backward Step)
function handleStepHide(slideIdx, stepIdx) {
    const slide = slides[slideIdx];
    if (!slide) return;
    const slideId = slide.id;

    // Slide 9: Reset highlights and hide line
    if (slideId === 'slide-9' && stepIdx === 0) {
        const attnCat = document.getElementById('attn-cat');
        const attnIt = document.getElementById('attn-it');
        const path = document.querySelector('#slide-9 .connection-path');
        if (attnCat) attnCat.className = 'px-2 py-1 rounded font-bold transition-all duration-500 text-slate-800';
        if (attnIt) attnIt.className = 'px-2 py-1 rounded font-bold transition-all duration-500 text-slate-800';
        if (path) path.classList.remove('revealed');
    }
    if (slideId === 'slide-30' && stepIdx === 0) {
        resetScatterPlot(false);
    }
    if (slideId === 'slide-31') {
        if (stepIdx === 0) {
            resetScatterPlot(true);
        } else if (stepIdx === 1) {
            clearQueryConnections();
        }
    }
    // Slide 10: concentric rings hide step-by-step
    else if (slideId === 'slide-10') {
        if (stepIdx === 0) {
            const el = document.getElementById('ring-ai');
            if (el) el.classList.remove('active-ring');
        } else if (stepIdx === 1) {
            const el = document.getElementById('ring-ml');
            if (el) el.classList.remove('active-ring');
        } else if (stepIdx === 2) {
            const el = document.getElementById('ring-dl');
            if (el) el.classList.remove('active-ring');
        } else if (stepIdx === 3) {
            const el = document.getElementById('ring-genai');
            if (el) el.classList.remove('active-ring');
        }
    }
}

// Embeddings scatter plot visual helper functions
function resetScatterPlot(includeQuery) {
    const plot = document.querySelector(`#slide-${includeQuery ? 31 : 30} .scatter-plot`);
    if (!plot) return;

    // Remove existing dots and lines
    plot.querySelectorAll('.scatter-dot, .connection-line').forEach(el => el.remove());

    // Generate unclustered scattered dots with real-world category labels
    const dotsData = [
        // Cluster A: Fruits
        { label: '🍎 Apple', cls: 'cluster-a' },
        { label: '🍌 Banana', cls: 'cluster-a' },
        { label: '🍊 Orange', cls: 'cluster-a' },
        { label: '🍇 Grape', cls: 'cluster-a' },
        { label: '🥭 Mango', cls: 'cluster-a' },
        // Cluster B: Tech Devices
        { label: '💻 Laptop', cls: 'cluster-b' },
        { label: '📱 iPhone', cls: 'cluster-b' },
        { label: '⌨️ Keyboard', cls: 'cluster-b' },
        { label: '📟 Tablet', cls: 'cluster-b' },
        { label: '🖥️ Monitor', cls: 'cluster-b' }
    ];

    dotsData.forEach((d, i) => {
        const dot = document.createElement('div');
        dot.className = `scatter-dot ${d.cls}`;
        dot.id = `dot-${includeQuery ? 's31' : 's30'}-${i}`;
        
        // Spread them randomly first
        dot.style.left = `${15 + Math.random() * 70}%`;
        dot.style.top = `${15 + Math.random() * 70}%`;
        
        // Label overlay (dark theme styled tags)
        const label = document.createElement('span');
        const isClusterA = d.cls === 'cluster-a';
        label.className = `absolute text-[12px] font-bold text-white whitespace-nowrap -mt-6 -ml-5 pointer-events-none bg-slate-950/85 border ${isClusterA ? 'border-purple-500/40 text-purple-300' : 'border-sky-500/40 text-sky-300'} px-2 py-0.5 rounded shadow-lg transition-all duration-500`;
        label.textContent = d.label;
        dot.appendChild(label);
        
        plot.appendChild(dot);
    });

    if (includeQuery) {
        // Pre-cluster for Slide 31 (since it starts clustered)
        setTimeout(() => clusterDotsOnPlot(plot, includeQuery), 50);
    }
}

function clusterDots() {
    const plot = document.querySelector('#slide-30 .scatter-plot');
    if (plot) clusterDotsOnPlot(plot, false);
}

function clusterDotsOnPlot(plot, isSlide31) {
    // Define clustered coordinates mapping Fruits left, Tech right
    const clusters = {
        'cluster-a': [
            { x: 25, y: 30 }, { x: 30, y: 22 }, { x: 22, y: 38 }, { x: 35, y: 33 }, { x: 15, y: 25 }
        ],
        'cluster-b': [
            { x: 64, y: 55 }, { x: 80, y: 78 }, { x: 83, y: 58 }, { x: 88, y: 70 }, { x: 60, y: 74 }
        ]
    };

    let aIdx = 0;
    let bIdx = 0;

    plot.querySelectorAll('.scatter-dot').forEach(dot => {
        if (dot.classList.contains('cluster-a')) {
            const coord = clusters['cluster-a'][aIdx++];
            dot.style.left = `${coord.x}%`;
            dot.style.top = `${coord.y}%`;
        } else {
            const coord = clusters['cluster-b'][bIdx++];
            dot.style.left = `${coord.x}%`;
            dot.style.top = `${coord.y}%`;
        }
    });
}

function showQueryDot() {
    const plot = document.querySelector('#slide-31 .scatter-plot');
    if (!plot) return;

    // Create Red Query Dot near the Tech Cluster B
    const qDot = document.createElement('div');
    qDot.className = 'scatter-dot query-dot';
    qDot.style.left = '72%';
    qDot.style.top = '63%';
    qDot.style.opacity = '0';
    qDot.style.transform = 'translate(-50%, -50%) scale(0.1)';
    qDot.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    // Add Query Label
    const label = document.createElement('span');
    label.className = 'absolute text-[13px] font-extrabold text-rose-300 whitespace-nowrap -mt-8 -ml-8 pointer-events-none bg-rose-950/90 border border-rose-500/60 px-2.5 py-1 rounded shadow-lg z-30 animate-pulse';
    label.textContent = '🔍 Query: "MacBook"';
    qDot.appendChild(label);
    
    plot.appendChild(qDot);

    // Animate zoom in
    setTimeout(() => {
        qDot.style.opacity = '1';
        qDot.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 50);
}

function drawQueryConnections() {
    const plot = document.querySelector('#slide-31 .scatter-plot');
    if (!plot) return;

    const qDot = plot.querySelector('.query-dot');
    if (!qDot) return;

    // Connect specifically to nearby Cluster B (Tech) dots
    const bDots = Array.from(plot.querySelectorAll('.scatter-dot.cluster-b'));
    
    // Draw SVG connecting lines
    let svg = plot.querySelector('.drawing-lines-svg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'absolute top-0 left-0 w-full h-full pointer-events-none drawing-lines-svg');
        plot.appendChild(svg);
    }

    const qRect = qDot.getBoundingClientRect();
    const plotRect = plot.getBoundingClientRect();
    const qX = qRect.left - plotRect.left + qRect.width / 2;
    const qY = qRect.top - plotRect.top + qRect.height / 2;

    // Connect to 3 nearest tech dots (Laptop, iPhone, Keyboard)
    bDots.slice(0, 3).forEach((dot, index) => {
        const dRect = dot.getBoundingClientRect();
        const dX = dRect.left - plotRect.left + dRect.width / 2;
        const dY = dRect.top - plotRect.top + dRect.height / 2;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', qX);
        line.setAttribute('y1', qY);
        line.setAttribute('x2', qX);
        line.setAttribute('y2', qY);
        line.setAttribute('stroke', '#EF4444');
        line.setAttribute('stroke-width', '2.5');
        line.setAttribute('stroke-dasharray', '5');
        line.setAttribute('class', 'connection-line');
        line.style.transition = 'all 0.5s ease-out';
        line.style.transitionDelay = `${index * 0.15}s`;
        svg.appendChild(line);

        // Highlight matching dots
        setTimeout(() => {
            line.setAttribute('x2', dX);
            line.setAttribute('y2', dY);
            dot.style.transform = 'translate(-50%, 50%) scale(1.3)';
            dot.querySelector('span').className = 'absolute text-[13px] font-extrabold text-sky-400 whitespace-nowrap -mt-7 -ml-6 pointer-events-none bg-sky-950/90 border border-sky-500/50 px-1.5 py-0.5 rounded shadow-lg';
        }, 50);
    });
}

function clearQueryConnections() {
    const plot = document.querySelector('#slide-31 .scatter-plot');
    if (plot) {
        plot.querySelectorAll('.drawing-lines-svg').forEach(el => el.remove());
        plot.querySelectorAll('.scatter-dot.cluster-b').forEach(dot => {
            dot.style.transform = 'translate(-50%, 50%) scale(1)';
            const span = dot.querySelector('span');
            if (span) {
                span.className = 'absolute text-[12px] font-bold text-slate-700 whitespace-nowrap -mt-6 -ml-5 pointer-events-none bg-white/80 border border-slate-200/50 px-1.5 py-0.5 rounded shadow-sm';
            }
        });
    }
}

// Fullscreen Toggle
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Keyboard Navigation Bindings
window.addEventListener('keydown', (e) => {
    // Ignore keyboard events if user is interacting with form controls (if any)
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter') {
        e.preventDefault();
        next();
    } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
    } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullScreen();
    }
});

// Touch swipe navigation for mobile/tablet presentation preview
let touchStartX = 0;
let touchEndX = 0;

window.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

window.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const threshold = 50; // pixels
    if (touchStartX - touchEndX > threshold) {
        // Swiped left (Next)
        next();
    } else if (touchEndX - touchStartX > threshold) {
        // Swiped right (Prev)
        prev();
    }
}

// Auto-initialize when window loads
window.addEventListener('load', initDeck);
