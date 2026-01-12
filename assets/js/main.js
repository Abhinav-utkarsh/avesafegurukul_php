/* 
  Av_eSAFE Gurukul - Core Logic
  Handles Components, Navigation, and Animations
*/

// Global State
window.curriculum = {}; // Will be populated by fetch
window.tutorialData = {}; // Will be populated by fetch

// --- FOLDER NAME CONFIGURATION ---
// Maps course IDs to exact folder names (Case Sensitive for GitHub Pages)
window.COURSE_FOLDERS = {
    'html': 'html',
    'css': 'css',
    'js': 'js',
    'python': 'python',       // Changed to lowercase
    'react': 'react',
    'sql': 'sql',             // Changed to lowercase
    'java': 'java',
    'git': 'git',
    'methodologies': 'methodologies' // Changed to lowercase & plural
};

// Helper for user-specific storage
window.getUserKey = function(baseKey) {
    if (window.currentUserEmail) return `${window.currentUserEmail}_${baseKey}`;
    return baseKey;
};

document.addEventListener('DOMContentLoaded', () => {
    // Detect course type from URL
    const path = window.location.pathname.toLowerCase();
    let courseType = '';
    if (path.includes('/html/')) courseType = 'html';
    else if (path.includes('/css/')) courseType = 'css';
    else if (path.includes('/js/')) courseType = 'js';
    else if (path.includes('/python/')) courseType = 'python';
    else if (path.includes('/react/')) courseType = 'react';
    else if (path.includes('/sql/')) courseType = 'sql';
    else if (path.includes('/java/')) courseType = 'java';
    else if (path.includes('/git/')) courseType = 'git';
    else if (path.includes('/methodologies/') || path.includes('/methodology/')) courseType = 'methodologies';

    // --- ENSURE FIREBASE AUTH LOADS ---
    // Dynamically inject firebase-auth.js if not present, to ensure auth works on all pages
    if (!document.querySelector('script[src*="firebase-auth.js"]')) {
        const root = path.includes('/tutorials/') ? '../../' : '';
        const script = document.createElement('script');
        script.type = 'module';
        script.src = root + 'auth/firebase-auth.js?v=' + new Date().getTime();
        document.head.appendChild(script);
    }

    // --- HANDLE LOGIN REDIRECTS & STATIC PAGE ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'login') {
        setTimeout(() => showLoginModal(), 500);
    }

    if (path.includes('login.html')) {
        const contentDiv = document.querySelector('.content') || document.body;
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="card" style="max-width: 400px; margin: 4rem auto; padding: 2rem; text-align: center;">
                    <h2 style="color: var(--primary); margin-top: 0;">Login</h2>
                    <div style="text-align: left;">
                        <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">Email</label>
                        <input type="email" id="pageEmail" placeholder="Enter email" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid var(--glass-border); border-radius: 6px; background: var(--bg-body); color: var(--text-main);">
                        <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">Password</label>
                        <input type="password" id="pagePassword" placeholder="Enter password" style="width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid var(--glass-border); border-radius: 6px; background: var(--bg-body); color: var(--text-main);">
                        <button onclick="handlePageLogin()" style="width: 100%; padding: 12px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-bottom: 15px;">Login</button>
                        <div style="display: flex; align-items: center; margin: 15px 0; color: var(--text-muted);"><div style="flex: 1; height: 1px; background: var(--glass-border);"></div><span style="padding: 0 10px; font-size: 0.85rem;">OR</span><div style="flex: 1; height: 1px; background: var(--glass-border);"></div></div>
                        <button onclick="handleGoogleLogin()" style="width: 100%; padding: 12px; background: white; color: #333; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width: 20px;"> Sign in with Google</button>
                        <p style="margin-top: 1.5rem; font-size: 0.9rem;">Don't have an account? <a href="register.html" style="color: var(--primary);">Sign Up</a></p>
                    </div>
                </div>
            `;
        }
    }

    // Fetch Data if we are in a course
    if (courseType) {
        fetch(`../../${courseType}.json`)
            .then(res => res.json())
            .then(data => {
                processCourseData(courseType, data);
                loadComponents();
                initVisuals();
                loadPageContent();
                initAnimations();
                initUI();
            })
            .catch(err => {
                console.error("Failed to load course data", err);
                const content = document.querySelector('.content');
                if (content) content.innerHTML = `<div class="info-box" style="border-color: #ef4444; color: #ef4444; padding: 2rem; text-align: center;"><h3>Error Loading Course</h3><p>Could not load course data. Please check your connection or try again later.</p></div>`;
                loadComponents();
                initUI();
            });
    } else {
        loadComponents();
        initVisuals();
        loadCourses();
        initAnimations();
        initUI();
    }
    
    function initUI() {
        initSearch();
        initDarkMode();
        initCopyButtons();
        initModal();
        injectDynamicStyles();
        checkSession();
    }

    window.resetProgress = resetProgress;
    window.logout = logout;
    window.openAdminCertificate = openAdminCertificate;
    window.resetQuiz = resetQuiz;
    window.resetCurrentCourse = resetCurrentCourse;
    window.startAssessment = startAssessment;
    window.showAdminButtons = showAdminButtons;
    window.completeAllProgress = completeAllProgress;
    window.passExamForTesting = passExamForTesting;
    window.resetExamForTesting = resetExamForTesting;
    window.renderSidebar = renderSidebar;

    // --- Global Navigation & Event Handlers ---
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href) return;

        // --- Primary Assessment Navigation Guard ---
        if (window.assessmentTimer) {
            if (link.hash && link.pathname === window.location.pathname) return;
            if (link.hasAttribute('download')) return;

            e.preventDefault();

            showModal("Assessment in Progress", "Navigating away will automatically submit your exam. Are you sure you want to proceed?", [
                { text: 'Submit & Leave', class: 'danger', action: () => {
                    const form = document.getElementById('assessmentForm');
                    if (form) {
                        const courseType = form.dataset.course;
                        const total = parseInt(form.dataset.total);
                        submitAssessment(courseType, total);
                    }
                }},
                { text: 'Cancel', class: 'secondary', action: () => closeModal() }
            ]);
            return;
        }

        // --- SPA Navigation for Tutorial Pages ---
        if (link.href.includes('?topic=') && link.closest('.tutorial-container')) {
            const linkUrl = new URL(link.href);
            if (linkUrl.pathname === window.location.pathname) {
                e.preventDefault();
                window.history.pushState({}, '', linkUrl);
                loadPageContent();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    });

    window.addEventListener('popstate', loadPageContent);

    // --- Assessment Anti-Cheat: Tab/Window Switch Detection ---
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && window.assessmentTimer && !window.isSubmitting) {
            if (!window.tabSwitchWarningGiven) {
                window.tabSwitchWarningGiven = true;
                showModal("⚠️ Warning: Anti-Cheat Detected", "You navigated away from the assessment page. <br><br><strong>If you switch tabs or minimize the window again, your exam will be submitted automatically.</strong>", [{ text: 'I Understand', action: () => closeModal() }]);
            } else {
                window.isSubmitting = true;
                showModal("Exam Submitted", "You navigated away again. As per the anti-cheat policy, your exam has been submitted automatically.", [{ text: 'OK', action: () => {
                    const form = document.getElementById('assessmentForm');
                    if (form) {
                        const courseType = form.dataset.course;
                        const total = parseInt(form.dataset.total);
                        submitAssessment(courseType, total);
                    } else {
                        closeModal();
                    }
                }}]);
            }
        }
    });
});

// --- Custom Modal System ---
function initModal() {
    if (document.querySelector('.custom-modal-overlay')) return;
    
    const modalHTML = `
        <div class="custom-modal-overlay" id="customModalOverlay">
            <div class="custom-modal">
                <h3 id="customModalTitle">Title</h3>
                <p id="customModalMessage">Message</p>
                <div id="customModalButtons" class="custom-modal-buttons"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const style = document.createElement('style');
    style.textContent = `
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2000; display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; backdrop-filter: blur(5px); }
        .custom-modal-overlay.active { opacity: 1; pointer-events: all; }
        .custom-modal { background: var(--glass-bg); border: 1px solid var(--glass-border); padding: 2rem; border-radius: var(--radius); max-width: 400px; width: 90%; text-align: center; transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
        .custom-modal-overlay.active .custom-modal { transform: scale(1); }
        .custom-modal h3 { margin-top: 0; color: var(--primary); font-size: 1.5rem; margin-bottom: 1rem; }
        .custom-modal p { color: var(--text-muted); margin-bottom: 2rem; font-size: 1.05rem; line-height: 1.5; }
        .custom-modal-buttons { display: flex; justify-content: center; gap: 1rem; }
        .custom-modal-buttons button { color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600; transition: 0.2s; }
        .custom-modal-buttons button:hover { transform: translateY(-2px); }
        .custom-modal-buttons button.primary { background: var(--primary); box-shadow: 0 4px 15px var(--primary-glow); }
        .custom-modal-buttons button.secondary { background: var(--text-muted); }
        .custom-modal-buttons button.danger { background: #ef4444; }
    `;
    document.head.appendChild(style);
}

window.showModal = function(title, message, buttons) {
    document.getElementById('customModalTitle').textContent = title;
    document.getElementById('customModalMessage').innerHTML = message;
    const buttonContainer = document.getElementById('customModalButtons');
    buttonContainer.innerHTML = '';

    if (!buttons || buttons.length === 0) {
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.className = 'primary';
        okButton.onclick = () => closeModal();
        buttonContainer.appendChild(okButton);
    } else {
        buttons.forEach(btnInfo => {
            const button = document.createElement('button');
            button.textContent = btnInfo.text;
            button.className = btnInfo.class || 'primary';
            button.onclick = () => btnInfo.action();
            buttonContainer.appendChild(button);
        });
    }
    document.getElementById('customModalOverlay').classList.add('active');
};

window.closeModal = function() {
    document.getElementById('customModalOverlay').classList.remove('active');
};

// --- Data Processor ---
function processCourseData(courseType, data) {
    window.currentCourseTitle = data.title;
    const pageName = courseType === 'html' ? 'intro.html' : 'index.html';
    const folderName = window.COURSE_FOLDERS[courseType] || courseType;
    window.curriculum[courseType] = data.modules.map(mod => ({
        title: mod.title,
        items: mod.lessons.map(lesson => ({
            name: lesson.title,
            url: `tutorials/${folderName}/${pageName}?topic=${lesson.id}`
        }))
    }));
    data.modules.forEach(mod => {
        mod.lessons.forEach(lesson => {
            window.tutorialData[lesson.id] = {
                title: lesson.title,
                content: `<h1>${lesson.title}</h1><p>${lesson.theory}</p>`,
                theory: lesson.theory,
                code: lesson.code || '',
                quiz: lesson.quiz,
                type: lesson.type,
                questions: lesson.questions
            };
        });
    });
}

// --- Component System ---
function loadComponents() {
    const isTutorial = window.location.pathname.toLowerCase().includes('/tutorials/');
    const root = isTutorial ? '../../' : '';
    const authLink = `<div style="position: relative; display: flex; gap: 6px; align-items: center; margin-left: 0.5rem;">
             <div id="loginBtn" style="display: none;"></div>
             <div id="profileIcon" style="display: flex; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid var(--primary); align-items: center; justify-content: center; background: var(--glass-bg); font-size: 1.2rem; overflow: hidden;">👤</div>
             <div id="profileMenu" style="display: none; position: absolute; top: 120%; right: 0; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.5rem; min-width: 160px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 1000; backdrop-filter: blur(10px); flex-direction: column; gap: 5px;">
                <!-- Default Logged Out State -->
                <button onclick="showLoginModal()" class="profile-menu-item" style="text-align:left; background:none; border:none; padding: 0.6rem 1rem; color: var(--text-main); cursor:pointer; font-size: 0.9rem; width:100%; font-family: inherit;">Login</button>
                <a href="${root}register.html" class="profile-menu-item" style="display: block; padding: 0.6rem 1rem; color: var(--text-main); text-decoration: none; border-radius: 4px; font-size: 0.9rem;">Sign Up</a>
             </div>
           </div>`;

    const headerHTML = `
        <a href="${root}index.html" class="brand" style="display: flex; align-items: center; gap: 10px;">
            <img src="${root}images/India.png" alt="Logo" style="height: 35px; width: auto;">
            <div>Av_eSAFE <span>Gurukul</span></div>
        </a>
        <nav class="nav-links">
            <a href="${root}index.html">Home</a>
            <a href="${root}roadmap.html">Roadmap</a>
            <a href="${root}tutorials/${window.COURSE_FOLDERS.html}/intro.html">HTML</a>
            <a href="${root}tutorials/${window.COURSE_FOLDERS.css}/index.html">CSS</a>
            <a href="${root}tutorials/${window.COURSE_FOLDERS.js}/index.html">JavaScript</a>
            <a href="${root}tutorials/${window.COURSE_FOLDERS.java}/index.html">Java</a>
            <a href="${root}tutorials/${window.COURSE_FOLDERS.python}/index.html">Python</a>
            <a href="${root}tutorials/${window.COURSE_FOLDERS.react}/index.html">React</a>
            <a href="${root}tutorials/${window.COURSE_FOLDERS.sql}/index.html">SQL</a>
            <a href="${root}tutorials/${window.COURSE_FOLDERS.git}/index.html">Git</a>
            <a href="${root}tutorials/${window.COURSE_FOLDERS.methodologies}/index.html">Methodologies</a>
        </nav>
        <div class="header-controls">
            <div class="search-container"><input type="text" id="searchInput" placeholder="Search tutorials..."></div>
            <button class="theme-toggle" title="Toggle Dark Mode">🌙</button>
            ${authLink}
            <div class="menu-toggle" onclick="toggleSidebar()">☰</div>
        </div>
    `;
    
    const header = document.querySelector('header');
    if(header) header.innerHTML = headerHTML;

    if (isTutorial) {
        const progressBarHTML = `<div class="progress-container"><div id="progressBar" class="progress-bar"></div></div>`;
        header.insertAdjacentHTML('afterend', progressBarHTML);
    }

    // Add sidebar overlay for mobile tutorial pages
    if (isTutorial) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = () => toggleSidebar();
        document.body.appendChild(overlay);
    }

    renderSidebar();

    let footer = document.querySelector('footer');
    if (!footer) {
        footer = document.createElement('footer');
        document.body.appendChild(footer);
    }

    const adminSectionHTML = `
        <div id="adminAccessContainer" style="margin-top: 1rem; text-align: center;">
            <button onclick="showAdminButtons()" class="btn-small" style="background: #64748b; margin-top: 0; border: none; cursor: pointer;">Admin Access</button>
        </div>
        <div id="testButtonsContainer" style="display: none; margin-top: 1rem; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button onclick="resetProgress()" class="btn-small" style="background: #ef4444; margin-top: 0; border: none; cursor: pointer;">Reset Progress</button>
            <button onclick="completeAllProgress()" class="btn-small" style="background: #10b981; margin-top: 0; border: none; cursor: pointer;">Complete All</button>
            <button onclick="openAdminCertificate('${root}')" class="btn-small" style="background: #3b82f6; margin-top: 0; border: none; cursor: pointer;">Admin Certificate</button>
            <button onclick="passExamForTesting()" class="btn-small" style="background: #8b5cf6; margin-top: 0; border: none; cursor: pointer;">Pass Exam (Test)</button>
            <button onclick="resetExamForTesting()" class="btn-small" style="background: #f59e0b; margin-top: 0; border: none; cursor: pointer;">Reset Exam (Test)</button>
        </div>
    `;

    // Inject Nav-Bar Style Footer
    if (!document.getElementById('footer-styles')) {
        const footerStyle = document.createElement('style');
        footerStyle.id = 'footer-styles';
        footerStyle.textContent = `
            footer {
                background: var(--glass-bg);
                border-top: 1px solid var(--glass-border);
                padding: 1rem 2rem;
                backdrop-filter: blur(10px);
                margin-top: auto;
                position: relative;
                z-index: 10;
            }
            .footer-nav-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: 1200px;
                margin: 0 auto;
                gap: 2rem;
                flex-wrap: wrap;
            }
            .footer-nav-bar .brand-box { display: flex; flex-direction: column; }
            .footer-nav-bar .brand { font-size: 1.2rem; font-weight: 800; color: var(--primary); flex-shrink: 0; }
            .footer-nav-bar .brand span { color: var(--text-main); }
            .footer-nav-bar .founder { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; font-weight: 500; }
            .footer-center-section { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; flex-grow: 1; }
            .footer-nav-bar .copyright { margin: 0; font-size: 0.9rem; color: var(--text-muted); text-align: center; }
            .footer-nav-bar .copyright a { color: inherit; text-decoration: none; font-weight: 600; }
            .footer-nav-bar .copyright a:hover { color: var(--primary); }
            .made-in-india { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
            .made-in-india img { width: 24px; height: auto; }
            .footer-nav-bar .footer-links { display: flex; flex-direction: column; gap: 0.5rem; flex-shrink: 0; text-align: right; }
            .footer-nav-bar .footer-links a { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; color: var(--text-muted); text-decoration: none; font-weight: 500; font-size: 0.85rem; transition: color 0.2s; }
            .footer-nav-bar .footer-links a:hover { color: var(--primary); }
            .footer-nav-bar .footer-links svg { width: 14px; height: 14px; fill: currentColor; }
            #adminAccessContainer, #testButtonsContainer { max-width: 1200px; margin: 1rem auto 0; padding: 0 2rem; }

            @media (max-width: 768px) {
                .footer-nav-bar {
                    flex-direction: column;
                    gap: 1rem;
                    justify-content: center;
                    text-align: center;
                }
                .footer-nav-bar .brand-box { align-items: center; }
                .footer-center-section { order: 3; } /* Move to bottom on mobile */
                .footer-nav-bar .footer-links { align-items: center; text-align: center; }
                .footer-nav-bar .footer-links a { justify-content: center; }
            }
        `;
        document.head.appendChild(footerStyle);
    }

    footer.innerHTML = `
        <div class="footer-nav-bar">
            <div class="brand-box">
                <div class="brand">Av_eSAFE <span>Gurukul</span></div>
                <div class="founder">Founder: Abhinav Utkarsh</div>
            </div>
            <div class="footer-center-section">
                <p class="copyright">&copy; ${new Date().getFullYear()} All rights reserved <a href="https://abhinav-utkarsh.github.io/Av_eSAFE_officials/" target="_blank">Av_eSAFE</a></p>
                <div class="made-in-india">
                    <img src="${root}images/India.png" alt="Indian Flag"> Made with ❤️ in India
                </div>
            </div>
            <div class="footer-links">
                <a href="${root}privacy.html">
                    <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                    <span>Privacy Policy</span>
                </a>
                <a href="${root}terms.html">
                    <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                    <span>Terms of Service</span>
                </a>
                <a href="${root}contact.html">
                    <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    <span>Contact Us</span>
                </a>
            </div>
        </div>
        ${adminSectionHTML}
    `;
}

function loadPageContent() {
    const params = new URLSearchParams(window.location.search);
    let topic = params.get('topic');

    if (window.assessmentTimer) {
        clearInterval(window.assessmentTimer);
        window.assessmentTimer = null;
    }
    
    const path = window.location.pathname.toLowerCase();
    let courseType = '';
    if (path.includes('/html/')) courseType = 'html';
    else if (path.includes('/css/')) courseType = 'css';
    else if (path.includes('/js/')) courseType = 'js';
    else if (path.includes('/python/')) courseType = 'python';
    else if (path.includes('/react/')) courseType = 'react';
    else if (path.includes('/sql/')) courseType = 'sql';
    else if (path.includes('/java/')) courseType = 'java';
    else if (path.includes('/git/')) courseType = 'git';
    else if (path.includes('/methodologies/') || path.includes('/methodology/')) courseType = 'methodologies';

    if (!topic) {
        if (courseType && window.curriculum[courseType]) {
            const firstModule = window.curriculum[courseType][0];
            if (firstModule && firstModule.items.length > 0) {
                const firstUrl = firstModule.items[0].url;
                const urlParams = new URLSearchParams(firstUrl.split('?')[1]);
                topic = urlParams.get('topic');
                const newUrl = `${window.location.pathname}?topic=${topic}`;
                window.history.replaceState(null, '', newUrl);
            }
        }
    }
    
    if (!topic) return;

    const data = window.tutorialData[topic];
    const contentDiv = document.querySelector('.content');

    if (data && data.type === 'assessment') {
        renderAssessment(data, topic);
        return;
    }

    if (data && contentDiv) {
        const escapeHtml = (text) => {
            if (typeof text !== 'string') return text;
            return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        };

        let newHTML = `
            <div class="course-progress-circle" id="courseProgressCircle" style="--progress: 0%;">
                <span>0%</span>
            </div>
        `;
        newHTML += data.content || '';
        
        if (data.code) {
            newHTML += `<pre><code>${escapeHtml(data.code)}</code><button class="copy-btn">Copy</button></pre>`;
        }

        if (data.code) {
            const currentPath = window.location.pathname.toLowerCase();
            if (currentPath.includes('/git/') || currentPath.includes('/methodologies/')) {
                newHTML += `<div class="info-box"><h4>Theory Lesson</h4><p>This lesson covers theoretical concepts. No code execution is required.</p></div>`;
            } else {
                let runAction = 'onclick="runCode()"';
                let editorCode = data.code;
                const upperCode = data.code.toUpperCase().trim();
                if (currentPath.includes('/sql/') && !upperCode.startsWith('SELECT')) {
                    editorCode = 'SELECT * FROM Customers;';
                }
                let extraControls = '';
                if (currentPath.includes('/sql/')) {
                    runAction = 'onclick="runSqlCode()"';
                    extraControls = '<button id="view-schema-btn" onclick="toggleSchema()" class="btn-small" style="margin-top: 0; background: #6b7280; border: none; cursor: pointer;">View Schema</button>';
                }
                newHTML += `
                    <h2>Try It Yourself</h2>
                    <div class="editor-container">
                        <div class="editor-header">
                            <span>Live Editor</span>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                ${extraControls}
                                <button class="run-btn" ${runAction}>Run ▶</button>
                            </div>
                        </div>
                        <div class="editor-body">
                            <textarea id="code-html" class="code-input" spellcheck="false">${escapeHtml(editorCode)}</textarea>
                            <iframe id="preview-frame" class="preview-frame"></iframe>
                        </div>
                    </div>
                `;
            }
        }

        contentDiv.innerHTML = newHTML;
        
        if (window.runCode && data.code) {
            window.runCode();
        }

        if (data.quiz && Array.isArray(data.quiz.options)) {
            const quiz = data.quiz;
            const originalOptions = [...quiz.options];
            const correctAnswerText = originalOptions[quiz.answer];
            for (let i = originalOptions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [originalOptions[i], originalOptions[j]] = [originalOptions[j], originalOptions[i]];
            }
            const shuffledOptions = originalOptions;
            const newCorrectIndex = shuffledOptions.findIndex(option => option === correctAnswerText);
            const quizHTML = `
                <div class="quiz-container">
                    <h2>Knowledge Check</h2>
                    <p>${quiz.question}</p>
                    <div class="quiz-options">
                        ${shuffledOptions.map((opt, index) =>
                            `<button class="quiz-option" onclick="checkQuiz(this, ${index}, ${newCorrectIndex}, '${topic}')">${escapeHtml(opt)}</button>`
                        ).join('')}
                    </div>
                    <p id="quiz-result" style="margin-top: 1rem; font-weight: bold;"></p>
                </div>
            `;
            contentDiv.insertAdjacentHTML('beforeend', quizHTML);
        }

        markPageAsVisited();
        updateCourseProgressUI(courseType);
        renderSidebar();
        addNavigationButtons();
    }
}

// --- Assessment Logic ---
window.renderAssessment = function(data, topicId) {
    const contentDiv = document.querySelector('.content');
    if (!contentDiv) return;

    const path = window.location.pathname.toLowerCase();
    let courseType = '';
    if (path.includes('/html/')) courseType = 'html';
    else if (path.includes('/css/')) courseType = 'css';
    else if (path.includes('/js/')) courseType = 'js';
    else if (path.includes('/python/')) courseType = 'python';
    else if (path.includes('/react/')) courseType = 'react';
    else if (path.includes('/sql/')) courseType = 'sql';
    else if (path.includes('/java/')) courseType = 'java';
    else if (path.includes('/git/')) courseType = 'git';
    else if (path.includes('/methodologies/') || path.includes('/methodology/')) courseType = 'methodologies';

    const attemptsKey = window.getUserKey(`attempts_${courseType}`);
    const attempts = parseInt(localStorage.getItem(attemptsKey) || '0');
    const maxAttempts = 3;
    const passedKey = window.getUserKey(`passed_assessment_${courseType}`);
    const isPassed = localStorage.getItem(passedKey) === 'true';

    const escapeHtml = (text) => {
        if (typeof text !== 'string') return text;
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    };

    let html = `
        <div class="course-progress-circle" id="courseProgressCircle" style="--progress: 0%;">
            <span>0%</span>
        </div>
        <h1>${data.title}</h1>
    `;
    html += `<div class="info-box" style="margin-bottom: 2rem;">${data.theory || data.content}</div>`;

    if (isPassed) {
        html += `
            <div class="info-box" style="border-color: #10b981; background: rgba(16, 185, 129, 0.1); text-align: center; padding: 2rem;">
                <h2 style="color: #065f46; margin-top: 0;">Assessment Passed! 🎉</h2>
                <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 1rem;">
                    <img src="../../images/India.png" alt="Made in India" style="height: 32px; width: auto;">
                </div>
                <p>You have successfully completed this course.</p>
                <p>Your certificate is now unlocked.</p>
                <button onclick="window.location.href='../../certificate.html?course=${courseType}'" class="btn-small" style="background: #10b981; border: none; font-size: 1.1rem; margin-top: 1rem;">View Certificate</button>
            </div>
        `;
    } else if (attempts >= maxAttempts) {
        html += `
            <div class="info-box" style="border-color: #ef4444; background: rgba(239, 68, 68, 0.1); text-align: center; padding: 2rem;">
                <h2 style="color: #991b1b; margin-top: 0;">Maximum Attempts Reached</h2>
                <p>You have used all ${maxAttempts} attempts. Please review the course material and try again later.</p>
                <button onclick="resetCurrentCourse('${courseType}')" class="btn-small" style="background: #ef4444; border: none; margin-top: 1rem;">Reset Course Progress</button>
            </div>
        `;
    } else {
        const startTimeKey = window.getUserKey(`assessment_start_${courseType}`);
        let startTime = localStorage.getItem(startTimeKey);

        if (!startTime) {
            html += `
                <div class="info-box" style="text-align: center; padding: 3rem; background: var(--glass-bg); border: 1px solid var(--glass-border);">
                    <h2 style="margin-top: 0; color: var(--primary);">Final Assessment</h2>
                    <p style="font-size: 1.1rem; margin-bottom: 2rem;">You are about to start the final assessment. You have <strong>60 minutes</strong> to complete <strong>${data.questions.length} questions</strong>.</p>
                    <div style="margin-bottom: 2rem; display: flex; justify-content: center; gap: 2rem;">
                        <div><strong>Passing Score</strong><br>80%</div>
                        <div><strong>Attempts Remaining</strong><br>${maxAttempts - attempts}</div>
                    </div>
                    <button onclick="startAssessment('${courseType}')" class="btn-small" style="background: var(--primary); border: none; font-size: 1.2rem; padding: 0.8rem 2rem; cursor: pointer; box-shadow: 0 4px 15px var(--primary-glow);">Start Assessment</button>
                </div>
            `;
            contentDiv.innerHTML = html;
            markPageAsVisited();
            updateCourseProgressUI(courseType);
            renderSidebar();
            addNavigationButtons();
            return;
        }

        html += `<div id="assessment-timer" style="position: sticky; top: 80px; background: var(--glass-bg); padding: 15px; border: 1px solid var(--glass-border); border-radius: var(--radius); margin-bottom: 20px; font-weight: 700; color: var(--primary); z-index: 90; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); backdrop-filter: blur(10px);">⏱️ Time Remaining: <span id="time-display" style="font-family: var(--font-code); font-size: 1.2rem;">--:--</span></div>`;
        html += `<p style="font-weight: bold; color: var(--primary);">Attempt ${attempts + 1} of ${maxAttempts}</p>`;
        html += `<form id="assessmentForm" data-course="${courseType}" data-total="${data.questions.length}">`;
        
        data.questions.forEach((q, index) => {
            html += `
                <div class="quiz-container" style="margin-top: 1.5rem;">
                    <p style="font-weight: 600; margin-bottom: 1rem; font-size: 1.1rem;">${index + 1}. ${q.q}</p>
                    <div class="quiz-options">
                        ${q.o.map((opt, optIndex) => `
                            <label class="quiz-option" style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer; padding: 1rem;">
                                <input type="radio" name="q${index}" value="${optIndex}" style="margin-top: 4px; flex-shrink: 0;">
                                <span style="line-height: 1.4;">${escapeHtml(opt)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        html += `<button type="button" onclick="submitAssessment('${courseType}', ${data.questions.length})" class="btn-small" style="background: var(--primary); border: none; margin-top: 2rem; width: 100%; font-size: 1.1rem;">Submit Assessment</button>`;
        html += `</form>`;
    }

    contentDiv.innerHTML = html;
    markPageAsVisited();
    updateCourseProgressUI(courseType);
    renderSidebar();
    addNavigationButtons();

    if (!isPassed && attempts < maxAttempts && localStorage.getItem(window.getUserKey(`assessment_start_${courseType}`))) {
        const duration = 60 * 60 * 1000;
        const startTimeKey = window.getUserKey(`assessment_start_${courseType}`);
        
        const updateTimer = () => {
            const startTime = parseInt(localStorage.getItem(startTimeKey));
            if (!startTime) return;

            const now = Date.now();
            const elapsed = now - startTime;
            const remaining = duration - elapsed;
            const display = document.getElementById('time-display');

            if (remaining <= 0) {
                clearInterval(window.assessmentTimer);
                if (display) display.textContent = "00:00";
                if (document.getElementById('assessmentForm')) {
                    showModal("Time's Up!", "Your assessment is being submitted automatically.", [{ text: 'OK', action: () => {
                        submitAssessment(courseType, data.questions.length);
                    }}]);
                }
                return;
            }

            if (display) {
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                let timeString = (hours > 0) 
                    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                display.textContent = timeString;

                if (remaining < 5 * 60 * 1000) {
                    display.parentElement.style.color = '#ef4444';
                    display.parentElement.style.borderColor = '#ef4444';
                    display.parentElement.style.background = 'rgba(239, 68, 68, 0.1)';
                }
            }
        };

        updateTimer();
        window.assessmentTimer = setInterval(updateTimer, 1000);
    }
};

window.startAssessment = function(courseType) {
    window.isSubmitting = false;
    window.tabSwitchWarningGiven = false;
    const startTimeKey = window.getUserKey(`assessment_start_${courseType}`);
    localStorage.setItem(startTimeKey, Date.now());
    loadPageContent();
};

window.updateCourseProgressUI = function(courseType) {
    const circle = document.getElementById('courseProgressCircle');
    if (!circle || !window.curriculum[courseType]) return;

    const allItems = [].concat(...window.curriculum[courseType].map(section => section.items));
    const total = allItems.length;
    
    const completedTopics = JSON.parse(localStorage.getItem(window.getUserKey('completedTopics'))) || [];
    const completedInCourse = allItems.filter(item => completedTopics.includes(item.url)).length;
    
    const percentage = total === 0 ? 0 : Math.round((completedInCourse / total) * 100);
    
    circle.style.setProperty('--progress', `${percentage}%`);
    circle.querySelector('span').textContent = `${percentage}%`;
    
    // Save standardized progress for Dashboard
    saveGlobalProgress(courseType);
};

function saveGlobalProgress(courseId) {
    if (!window.currentUserEmail) return;
    
    // READ EXISTING PROGRESS FROM DOM
    const progressElement = document.querySelector('#courseProgressCircle span');
    if (!progressElement) return;

    const progressText = progressElement.innerText || "0";
    const currentProgress = parseInt(progressText.replace('%', '').trim(), 10);

    if (isNaN(currentProgress)) return;

    const storageKey = 'avesafe_course_progress';
    const allProgress = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    if (!allProgress[window.currentUserEmail]) {
        allProgress[window.currentUserEmail] = {};
    }
    
    allProgress[window.currentUserEmail][courseId] = {
        courseName: window.currentCourseTitle || courseId.toUpperCase(),
        progress: currentProgress
    };
    
    localStorage.setItem(storageKey, JSON.stringify(allProgress));
};

function loadScript(src, callback) {
    if (document.querySelector(`script[src="${src}"]`)) {
        if (callback) callback();
        return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => { if (callback) callback(); };
    document.head.appendChild(script);
}

window.downloadAssessmentReport = function(courseType, score, total, reportData) {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js', () => {
        const date = new Date().toLocaleString();
        const percentage = ((score/total)*100).toFixed(1);
        const isPassed = percentage >= 80;
        const escapeHtml = (text) => {
            if (typeof text !== 'string') return text;
            return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        };

        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.left = '-10000px';
        wrapper.style.top = '0';
        document.body.appendChild(wrapper);

        const element = document.createElement('div');
        element.style.width = '700px';
        element.style.padding = '40px';
        element.style.backgroundColor = '#ffffff'; /* Fixed width container ensures alignment */
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.color = '#333333';
        wrapper.appendChild(element);

        const style = `
            <style>
                .pdf-header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 20px; }
                .pdf-brand { text-align: center; flex: 1; }
                .pdf-brand h1 { color: #6366f1; margin: 0; font-size: 24px; letter-spacing: 1px; }
                .pdf-brand p { color: #666; margin: 5px 0 0; font-size: 12px; }
                .pdf-logo-group { display: flex; align-items: center; }
                .pdf-logo-group img { height: 50px; width: auto; }
                .pdf-hologram { width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
                .pdf-status-banner { text-align: center; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; font-size: 16px; }
                .pdf-status-pass { background: #dcfce7; color: #166534; border: 1px solid #22c55e; }
                .pdf-status-fail { background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; }
                .pdf-summary { background: #f8fafc; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; margin-bottom: 30px; border: 1px solid #e2e8f0; }
                .pdf-summary div { text-align: center; }
                .pdf-summary strong { display: block; font-size: 16px; color: #1e293b; }
                .pdf-summary span { font-size: 11px; color: #64748b; text-transform: uppercase; }
                .pdf-question { margin-bottom: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; page-break-inside: avoid; }
                .pdf-q-title { font-weight: bold; margin-bottom: 5px; font-size: 13px; }
                .pdf-ans { padding: 6px; border-radius: 4px; font-size: 12px; margin-top: 4px; }
                .pdf-correct { background: #dcfce7; color: #166534; border-left: 3px solid #22c55e; }
                .pdf-wrong { background: #fee2e2; color: #991b1b; border-left: 3px solid #ef4444; }
                .pdf-expected { background: #eff6ff; color: #1e40af; border-left: 3px solid #3b82f6; margin-top: 4px; }
            </style>
        `;

        const hologramSVG = `
            <svg viewBox="0 0 100 100" width="60" height="60">
                <defs><path id="circlePath" d="M 50, 50 m -40, 0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0" /></defs>
                <circle cx="50" cy="50" r="48" fill="none" stroke="#6366f1" stroke-width="2" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" stroke-width="1" />
                <text font-size="10" font-weight="bold" fill="#6366f1" letter-spacing="1.2" text-anchor="middle"><textPath href="#circlePath" startOffset="25%">★ Digitally Verified ★</textPath></text>
                <text x="50" y="55" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle">Av_eSAFE</text>
            </svg>
        `;

        const statusMessage = isPassed ? "🎉 Congratulations! You have successfully passed the assessment." : "⚠️ Better luck next time! Keep learning and try again.";
        const statusClass = isPassed ? "pdf-status-pass" : "pdf-status-fail";

        let html = style + `
            <div class="pdf-header-container">
                <div class="pdf-hologram">${hologramSVG}</div>
                <div class="pdf-brand"><h1>Av_eSAFE Gurukul</h1><p>Assessment Performance Report</p></div>
                <div class="pdf-logo-group">
                    <img src="../../images/India.png" alt="Made in India" style="height: 40px; width: auto; margin-right: 10px;">
                    <img src="../../images/msme.png" alt="MSME">
                </div>
            </div>
            <div class="pdf-status-banner ${statusClass}">${statusMessage}</div>
            <div class="pdf-summary">
                <div><span>Course</span><br><strong>${escapeHtml(courseType.toUpperCase())}</strong></div>
                <div><span>Date</span><br><strong>${date}</strong></div>
                <div><span>Score</span><br><strong>${score}/${total} (${percentage}%)</strong></div>
            </div>
        `;

        reportData.forEach((item, index) => {
            const isCorrect = item.status === "Correct";
            html += `
                <div class="pdf-question">
                    <div class="pdf-q-title">Q${index + 1}: ${escapeHtml(item.question)}</div>
                    <div class="pdf-ans ${isCorrect ? 'pdf-correct' : 'pdf-wrong'}"><strong>Your Answer:</strong> ${escapeHtml(item.userAnswer)}</div>
                    ${!isCorrect ? `<div class="pdf-ans pdf-expected"><strong>Correct Answer:</strong> ${escapeHtml(item.correctAnswer)}</div>` : ''}
                </div>
            `;
        });

        element.innerHTML = html;

        html2pdf().from(element).set({ 
            margin: 10, 
            filename: `${courseType}_assessment_report.pdf`, 
            image: { type: 'jpeg', quality: 0.98 }, 
            html2canvas: { scale: 2, useCORS: true, scrollY: 0 }, 
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
        }).save().then(() => {
            document.body.removeChild(wrapper);
        }).catch(err => {
            console.error(err);
            document.body.removeChild(wrapper);
            showModal('PDF Error', 'PDF generation failed. Downloading text version instead.');
            let content = `Av_eSAFE Gurukul - Assessment Report\nCourse: ${courseType.toUpperCase()}\nDate: ${date}\nScore: ${score}/${total}\n\n`;
            reportData.forEach((item, index) => {
                content += `Q${index + 1}: ${item.question}\nYour Answer: ${item.userAnswer}\nCorrect Answer: ${item.correctAnswer}\nResult: ${item.status}\n\n`;
            });
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${courseType}_assessment_report.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    });
};

window.submitAssessment = function(courseType, totalQuestions) {
    const form = document.getElementById('assessmentForm');
    const formData = new FormData(form);
    let score = 0;
    let reportData = [];
    
    window.isSubmitting = true;
    if (window.assessmentTimer) clearInterval(window.assessmentTimer);
    window.assessmentTimer = null;
    localStorage.removeItem(window.getUserKey(`assessment_start_${courseType}`));

    const params = new URLSearchParams(window.location.search);
    const topic = params.get('topic');
    const data = window.tutorialData[topic];

    if (!data || !data.questions) return;

    data.questions.forEach((q, index) => {
        const selected = formData.get(`q${index}`);
        const isCorrect = selected && parseInt(selected) === q.a;
        if (isCorrect) score++;
        reportData.push({
            question: q.q,
            userAnswer: selected ? q.o[parseInt(selected)] : "No Answer",
            correctAnswer: q.o[q.a],
            status: isCorrect ? "Correct" : "Incorrect"
        });
    });
    
    const percentage = (score / totalQuestions) * 100;
    const attemptsKey = window.getUserKey(`attempts_${courseType}`);
    let attempts = parseInt(localStorage.getItem(attemptsKey) || '0');
    attempts++;
    localStorage.setItem(attemptsKey, attempts);

    const downloadAction = () => {
        downloadAssessmentReport(courseType, score, totalQuestions, reportData);
    };

    if (percentage >= 80) {
        localStorage.setItem(window.getUserKey(`passed_assessment_${courseType}`), 'true');
        localStorage.setItem(window.getUserKey(`badge_${courseType}`), 'true');
        localStorage.setItem(window.getUserKey(`score_${courseType}`), percentage.toFixed(1)); // Save the score
        showModal("Assessment Passed! 🎉", `Congratulations! You passed with a score of <strong>${score}/${totalQuestions}</strong> (${percentage.toFixed(1)}%).`, [
            { text: 'Download Report 📥', class: 'secondary', action: downloadAction },
            { text: 'OK', action: () => { closeModal(); loadPageContent(); } }
        ]);
    } else {
        showModal("Assessment Result", `You scored <strong>${score}/${totalQuestions}</strong> (${percentage.toFixed(1)}%).<br>You need 80% to pass.<br>Attempts used: ${attempts}/3.`, [
            { text: 'Download Report 📥', class: 'secondary', action: downloadAction },
            { text: 'OK', action: () => { closeModal(); loadPageContent(); } }
        ]);
    }
};

// --- Quiz Logic ---
window.checkQuiz = function(btn, selectedIndex, correctIndex, shortTopicId) {
    const parent = btn.parentElement;
    const result = parent.nextElementSibling;
    const buttons = parent.querySelectorAll('.quiz-option');
    
    buttons.forEach(b => b.disabled = true);

    if (selectedIndex === correctIndex) {
        btn.classList.add('correct');
        result.innerHTML = "Correct! 🎉";
        result.style.color = "#10b981";
        
        if (shortTopicId) {
            let fullTopicId = null;
            const path = window.location.pathname.toLowerCase();
            let courseType = '';
            if (path.includes('/html/')) courseType = 'html';
            else if (path.includes('/css/')) courseType = 'css';
            else if (path.includes('/js/')) courseType = 'js';
            else if (path.includes('/python/')) courseType = 'python';
            else if (path.includes('/react/')) courseType = 'react';
            else if (path.includes('/sql/')) courseType = 'sql';
            else if (path.includes('/java/')) courseType = 'java';
            else if (path.includes('/git/')) courseType = 'git';
            else if (path.includes('/methodologies/') || path.includes('/methodology/')) courseType = 'methodologies';

            if (window.curriculum && window.curriculum[courseType]) {
                window.curriculum[courseType].forEach(section => {
                    section.items.forEach(item => {
                        if (item.url.endsWith(`=${shortTopicId}`) || item.url.includes(`=${shortTopicId}&`)) {
                            fullTopicId = item.url;
                        }
                    });
                });
            }

            if (fullTopicId) {
                let passedQuizzes = JSON.parse(localStorage.getItem(window.getUserKey('passedQuizzes'))) || [];
                if (!passedQuizzes.includes(fullTopicId)) {
                    passedQuizzes.push(fullTopicId);
                    localStorage.setItem(window.getUserKey('passedQuizzes'), JSON.stringify(passedQuizzes));
                }
                
                let completedTopics = JSON.parse(localStorage.getItem(window.getUserKey('completedTopics'))) || [];
                if (!completedTopics.includes(fullTopicId)) {
                    completedTopics.push(fullTopicId);
                    localStorage.setItem(window.getUserKey('completedTopics'), JSON.stringify(completedTopics));
                    updateCourseProgressUI(courseType);
                }

                checkModuleCompletion(courseType, completedTopics);
                renderSidebar();
                addNavigationButtons();
            }
        }
    } else {
        btn.classList.add('wrong');
        result.innerHTML = `Incorrect. <button onclick="resetQuiz(this)" class="btn-small" style="background: #f59e0b; border: none; cursor: pointer; padding: 0.3rem 0.8rem; font-size: 0.8rem; margin-left: 10px; color: white;">Retry ↺</button>`;
        result.style.color = "#ef4444";
    }
};

// --- Reset Quiz Logic ---
function resetQuiz(retryBtn) {
    const resultP = retryBtn.parentElement;
    const quizContainer = resultP.parentElement;
    const buttons = quizContainer.querySelectorAll('.quiz-option');
    
    buttons.forEach(b => {
        b.disabled = false;
        b.classList.remove('correct', 'wrong');
    });
    
    resultP.innerHTML = '';
    resultP.style.color = '';
};

// --- Visual Effects Engine ---
function initVisuals() {
    const blobContainer = document.createElement('div');
    blobContainer.className = 'blob-container';
    blobContainer.innerHTML = `<div class="blob blob-1"></div><div class="blob blob-2"></div><div class="blob blob-3"></div>`;
    document.body.prepend(blobContainer);

    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--x', `${x}px`);
            card.style.setProperty('--y', `${y}px`);
        });
    });
}

// --- Animation Engine ---
function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    const cards = document.querySelectorAll('.grid-container .card');
    cards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 100}ms`;
        observer.observe(card);
    });

    document.querySelectorAll('.reveal:not(.card)').forEach(el => observer.observe(el));
}

// --- Mobile Sidebar Toggle ---
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const nav = document.querySelector('.nav-links');
    const overlay = document.querySelector('.sidebar-overlay');

    if(sidebar) { // This is for tutorial pages
        const isOpen = sidebar.classList.toggle('open');
        if (overlay) overlay.style.opacity = isOpen ? '1' : '0';
        if (overlay) overlay.style.pointerEvents = isOpen ? 'auto' : 'none';
    }
    else if (nav) nav.classList.toggle('nav-active'); // This is for the homepage dropdown
}

// --- Search Logic ---
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const isHomePage = document.querySelector('.sidebar') === null;
        if (isHomePage) filterHomepageCards(query);
        else filterSidebarLinks(query);
    });
}

function filterHomepageCards(query) {
    const cards = document.querySelectorAll('.grid-container .card');
    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const description = card.querySelector('p')?.textContent.toLowerCase() || '';
        const isVisible = title.includes(query) || description.includes(query);
        card.style.display = isVisible ? 'block' : 'none';
    });
}

function filterSidebarLinks(query) {
    const sections = document.querySelectorAll('.sidebar h4');
    const links = document.querySelectorAll('.sidebar a, .sidebar .sidebar-link');

    links.forEach(link => {
        if (link.textContent.includes('Back to Home')) return;
        const linkText = link.textContent.toLowerCase();
        const isVisible = linkText.includes(query);
        
        if (isVisible) {
            // Restore display based on element type (A=block, DIV.locked=flex)
            link.style.display = link.tagName === 'A' ? 'block' : 'flex';
        } else {
            link.style.display = 'none';
        }
    });

    sections.forEach(section => {
        let nextElement = section.nextElementSibling;
        let hasVisibleLink = false;
        // Iterate until next section header or end of sidebar
        while(nextElement && nextElement.tagName !== 'H4') {
            if (nextElement.style.display !== 'none') {
                hasVisibleLink = true;
                break;
            }
            nextElement = nextElement.nextElementSibling;
        }
        section.style.display = hasVisibleLink ? 'block' : 'none';
    });
}

// --- Navigation Buttons Logic ---
function addNavigationButtons() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const path = window.location.pathname.toLowerCase();
    let courseType = '';
    if (path.includes('/html/')) courseType = 'html';
    else if (path.includes('/css/')) courseType = 'css';
    else if (path.includes('/js/')) courseType = 'js';
    else if (path.includes('/python/')) courseType = 'python';
    else if (path.includes('/react/')) courseType = 'react';
    else if (path.includes('/sql/')) courseType = 'sql';
    else if (path.includes('/java/')) courseType = 'java';
    else if (path.includes('/git/')) courseType = 'git';
    else if (path.includes('/methodologies/') || path.includes('/methodology/')) courseType = 'methodologies';

    if (!courseType || !window.curriculum || !window.curriculum[courseType]) return;

    const allItems = [].concat(...window.curriculum[courseType].map(section => section.items));
    const currentFullUrl = decodeURI(window.location.pathname + window.location.search);
    let currentIndex = allItems.findIndex(item => currentFullUrl.toLowerCase().endsWith(item.url.toLowerCase()));

    if (currentIndex === -1) return;

    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const progressPercentage = ((currentIndex + 1) / allItems.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }

    const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
    const nextItem = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;
    const contentDiv = document.querySelector('.content');
    const root = window.location.pathname.includes('/tutorials/') ? '../../' : '';

    const existingNav = contentDiv.querySelector('.nav-buttons');
    if (existingNav) existingNav.remove();

    const navDiv = document.createElement('div');
    navDiv.className = 'nav-buttons';
    navDiv.style.cssText = "margin-top: 4rem; display: flex; justify-content: space-between; border-top: 1px solid var(--glass-border); padding-top: 2rem;";

    if (prevItem) {
        const url = root + (prevItem.url.startsWith('/') ? prevItem.url.substring(1) : prevItem.url);
        navDiv.innerHTML += `<a href="${url}" class="btn-small" style="text-decoration:none; margin-top:0;">&larr; Previous</a>`;
    } else {
        navDiv.innerHTML += `<div></div>`;
    }

    if (nextItem) {
        const passedQuizzes = JSON.parse(localStorage.getItem(window.getUserKey('passedQuizzes'))) || [];
        const completedTopics = JSON.parse(localStorage.getItem(window.getUserKey('completedTopics'))) || [];
        const currentUrl = allItems[currentIndex].url;
        const currentTopicId = currentUrl.split('?topic=')[1];
        const isTheory = window.tutorialData[currentTopicId] && !window.tutorialData[currentTopicId].quiz;

        if (passedQuizzes.includes(currentUrl) || (isTheory && completedTopics.includes(currentUrl))) {
            const url = root + (nextItem.url.startsWith('/') ? nextItem.url.substring(1) : nextItem.url);
            navDiv.innerHTML += `<a href="${url}" class="btn-small" style="text-decoration:none; margin-top:0;">Next &rarr;</a>`;
        }
    }
    contentDiv.appendChild(navDiv);

    if (currentIndex === allItems.length - 1) {
        const existingCertContainer = contentDiv.querySelector('.cert-container');
        if (existingCertContainer) existingCertContainer.remove();

        const currentTopicId = allItems[currentIndex].url.split('?topic=')[1];
        if (currentTopicId && window.tutorialData[currentTopicId] && window.tutorialData[currentTopicId].type === 'assessment') {
             return;
        }

        let isCourseComplete = false;
        const completedTopics = JSON.parse(localStorage.getItem(window.getUserKey('completedTopics'))) || [];
        const passedQuizzes = JSON.parse(localStorage.getItem(window.getUserKey('passedQuizzes'))) || [];
        const completedInCourse = completedTopics.filter(url => url.includes(`/tutorials/${courseType}/`)).length;

        const hasAssessment = window.curriculum[courseType].some(mod => mod.items.some(item => window.tutorialData[item.url.split('?topic=')[1]]?.type === 'assessment'));

        if (allItems.length > 0 && completedInCourse === allItems.length) {
            let allQuizzesPassed = allItems.every(item => {
                const topicId = item.url.split('?topic=')[1];
                return !window.tutorialData[topicId]?.quiz || passedQuizzes.includes(item.url);
            });
            if (allQuizzesPassed) {
                if (hasAssessment) {
                    if (localStorage.getItem(window.getUserKey(`passed_assessment_${courseType}`)) === 'true') {
                        isCourseComplete = true;
                    }
                } else {
                    isCourseComplete = true;
                }
            }
        }
        
        const certContainer = document.createElement('div');
        certContainer.className = 'cert-container';
        certContainer.style.cssText = "margin-top: 3rem; padding: 2rem; text-align: center; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: var(--radius); box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05);";
        
        if (isCourseComplete) {
            certContainer.innerHTML = `
                <h2 style="color: var(--primary); margin-bottom: 1rem;">🎉 Congratulations!</h2>
                <p style="margin-bottom: 1.5rem; color: var(--text-muted);">You have successfully completed the <strong>${courseType.toUpperCase()}</strong> curriculum.</p>
                <a href="${root}certificate.html?course=${courseType}" class="btn-small" style="background: var(--accent); color: white; text-decoration: none; font-size: 1.1rem; padding: 0.8rem 1.5rem; display: inline-block; border: none; cursor: pointer;">Get Your Certificate 🏆</a>
            `;
        } else {
            certContainer.innerHTML = `
                <h3 style="color: var(--text-muted); margin-bottom: 0.5rem;">Certificate Locked 🔒</h3>
                <p style="color: var(--text-muted); margin-bottom: 1rem;">Complete all topics and quizzes in this course to unlock your certificate.</p>
                <button disabled class="btn-small" style="background: var(--text-muted); cursor: not-allowed; opacity: 0.5; border: none; padding: 0.8rem 1.5rem; color: white;">Download Certificate</button>
            `;
        }
        contentDiv.appendChild(certContainer);
    }
}

// --- Dark Mode Logic ---
function initDarkMode() {
    const toggle = document.querySelector('.theme-toggle');
    const body = document.body;
    
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        if(toggle) toggle.textContent = '☀️';
    } else {
        if(toggle) toggle.textContent = '🌙';
    }

    if(toggle) {
        toggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            toggle.textContent = isDark ? '☀️' : '🌙';
            if (typeof runCode === 'function' && document.getElementById('code-html')) {
                runCode();
            }
        });
    }
}

// --- Copy Button Logic ---
function initCopyButtons() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-btn')) {
            const codeBlock = e.target.previousElementSibling;
            if (codeBlock) {
                navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                    const originalText = e.target.textContent;
                    e.target.textContent = 'Copied!';
                    setTimeout(() => e.target.textContent = originalText, 2000);
                });
            }
        }
    });
}

// --- Progress Tracking ---
function markPageAsVisited() {
    const params = new URLSearchParams(window.location.search);
    const currentTopic = params.get('topic');
    
    if (!window.location.pathname.includes('/tutorials/') || !currentTopic) return;

    if (window.tutorialData[currentTopic] && window.tutorialData[currentTopic].quiz) return;

    let topicId = null;
    let courseType = '';
    
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/html/')) courseType = 'html';
    else if (path.includes('/css/')) courseType = 'css';
    else if (path.includes('/js/')) courseType = 'js';
    else if (path.includes('/python/')) courseType = 'python';
    else if (path.includes('/react/')) courseType = 'react';
    else if (path.includes('/sql/')) courseType = 'sql';
    else if (path.includes('/java/')) courseType = 'java';
    else if (path.includes('/git/')) courseType = 'git';
    else if (path.includes('/methodologies/') || path.includes('/methodology/')) courseType = 'methodologies';

    if (window.curriculum && window.curriculum[courseType]) {
        window.curriculum[courseType].forEach(section => {
            section.items.forEach(item => {
                if (item.url.endsWith(`=${currentTopic}`) || item.url.includes(`=${currentTopic}&`)) {
                    topicId = item.url;
                }
            });
        });
    }

    if (topicId) {
        let completed = JSON.parse(localStorage.getItem(window.getUserKey('completedTopics'))) || [];
        if (!completed.includes(topicId)) {
            completed.push(topicId);
            localStorage.setItem(window.getUserKey('completedTopics'), JSON.stringify(completed));
            checkModuleCompletion(courseType, completed);
        }
    }
}

function checkModuleCompletion(courseType, completed) {
    if (!window.curriculum[courseType]) return;

    const hasAssessment = window.curriculum[courseType].some(mod => mod.items.some(item => window.tutorialData[item.url.split('?topic=')[1]]?.type === 'assessment'));
    if (hasAssessment) return;

    const allItems = [].concat(...window.curriculum[courseType].map(section => section.items));
    const completedInCourse = completed.filter(url => url.includes(`/tutorials/${courseType}/`)).length;

    if (allItems.length > 0 && completedInCourse === allItems.length) {
        const passedQuizzes = JSON.parse(localStorage.getItem(window.getUserKey('passedQuizzes'))) || [];
        let allQuizzesPassed = allItems.every(item => {
            const topicId = item.url.split('?topic=')[1];
            return !window.tutorialData[topicId]?.quiz || passedQuizzes.includes(item.url);
        });

        if (allQuizzesPassed) {
            const badgeId = window.getUserKey(`badge_${courseType}`);
            if (!localStorage.getItem(badgeId)) {
                showModal("Module Completed! 🏅", `Congratulations! You've completed the <strong>${courseType.toUpperCase()}</strong> module and earned a badge!`);
                localStorage.setItem(badgeId, 'true');
            }
        }
    }
}

// --- Reset Progress ---
function resetProgress() {
    if (!window.currentUserEmail) {
        alert("Authentication not ready. Please wait a moment or refresh.");
        return;
    }

    if (confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
        localStorage.removeItem(window.getUserKey('completedTopics'));
        localStorage.removeItem(window.getUserKey('passedQuizzes'));
        
        // Force clear unprefixed keys to prevent race condition fallback
        localStorage.removeItem('completedTopics');
        localStorage.removeItem('passedQuizzes');
        
        // Clear Dashboard Progress (avesafe_course_progress)
        if (window.currentUserEmail) {
            const storageKey = 'avesafe_course_progress';
            const allProgress = JSON.parse(localStorage.getItem(storageKey) || '{}');
            if (allProgress[window.currentUserEmail]) {
                delete allProgress[window.currentUserEmail];
                localStorage.setItem(storageKey, JSON.stringify(allProgress));
            }
        }

        const prefixes = ['badge_', 'cert_name_', 'cert_id_', 'passed_assessment_', 'attempts_', 'assessment_start_', 'score_'].map(p => window.getUserKey(p));
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (prefixes.some(prefix => key.startsWith(prefix))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        showModal("Success", "Progress has been reset.", [{ text: 'OK', action: () => location.reload() }]);
    }
}

function openAdminCertificate(root) {
    window.location.href = root + 'certificate.html?course=html&admin=true';
}

// --- Admin Testing Functions ---
function completeAllProgress() {
    if (!window.currentUserEmail) {
        alert("Authentication not ready. Please wait a moment.");
        return;
    }

    if (!confirm("Are you sure you want to mark ALL courses as completed?")) return;

    const root = window.location.pathname.toLowerCase().includes('/tutorials/') ? '../../' : '';
    
    // Optimized for InfinityFree: Use PHP proxy to avoid 502 (Entry Process Limit) from concurrent fetches
    fetch(`${root}api/admin_actions.php?action=complete_all`)
        .then(res => res.json())
        .then(results => {
            if (results.error) throw new Error(results.error);
            
            // Filter out failed fetches
            const validResults = results.filter(r => r !== null && r.courseId);
            
            if (validResults.length === 0) {
                showModal("Warning", "No valid course data found.", [{ text: 'OK', action: () => closeModal() }]);
                return;
            }

            let allTopics = [];
            let passedQuizzes = [];
            const storageKey = 'avesafe_course_progress';
            const allProgress = JSON.parse(localStorage.getItem(storageKey) || '{}');
            
            if (!allProgress[window.currentUserEmail]) {
                allProgress[window.currentUserEmail] = {};
            }

            validResults.forEach(data => {
                const courseId = data.courseId;
                if (!courseId) return;

                const pageName = courseId === 'html' ? 'intro.html' : 'index.html';
                const folderName = window.COURSE_FOLDERS[courseId] || courseId;

                // Set flags
                localStorage.setItem(window.getUserKey(`badge_${courseId}`), 'true');
                localStorage.setItem(window.getUserKey(`passed_assessment_${courseId}`), 'true');
                localStorage.setItem(window.getUserKey(`score_${courseId}`), '100.0');

                // Collect topics
                if (data.modules) {
                    data.modules.forEach(mod => {
                        mod.lessons.forEach(lesson => {
                            const url = `tutorials/${folderName}/${pageName}?topic=${lesson.id}`;
                            allTopics.push(url);
                            // Always add to passedQuizzes for Admin Complete All to ensure sidebar unlocks everything
                            passedQuizzes.push(url);
                        });
                    });
                }

                // Update dashboard progress
                allProgress[window.currentUserEmail][courseId] = {
                    courseName: data.title,
                    progress: 100
                };
            });

            localStorage.setItem(window.getUserKey('completedTopics'), JSON.stringify(allTopics));
            localStorage.setItem(window.getUserKey('passedQuizzes'), JSON.stringify(passedQuizzes));
            localStorage.setItem(storageKey, JSON.stringify(allProgress));

            showModal("Success", `Marked ${validResults.length} courses as completed!`, [{ text: 'OK', action: () => location.reload() }]);
        })
        .catch(err => {
            console.error(err);
            showModal("Error", "Failed to complete courses. Check console.", [{ text: 'OK', action: () => closeModal() }]);
        });
}

function passExamForTesting() {
    if (!window.currentUserEmail) {
        alert("Authentication not ready.");
        return;
    }

    let course = prompt("Enter course ID to pass exam (e.g., html, css):", "html");
    if (!course) return;
    course = course.toLowerCase().trim();
    
    localStorage.setItem(window.getUserKey(`passed_assessment_${course}`), 'true');
    localStorage.setItem(window.getUserKey(`badge_${course}`), 'true');
    localStorage.setItem(window.getUserKey(`score_${course}`), '95.0');
    
    showModal("Success", `Exam passed for ${course}. Certificate unlocked.`, [{ text: 'OK', action: () => location.reload() }]);
}

function resetExamForTesting() {
    if (!window.currentUserEmail) {
        alert("Authentication not ready.");
        return;
    }

    let course = prompt("Enter course ID to reset exam (e.g., html, css):", "html");
    if (!course) return;
    course = course.toLowerCase().trim();

    const userKey = window.getUserKey;
    const keys = [`passed_assessment_${course}`, `attempts_${course}`, `assessment_start_${course}`, `badge_${course}`, `score_${course}`, `cert_name_${course}`, `cert_id_${course}`];
    keys.forEach(k => localStorage.removeItem(userKey(k)));

    showModal("Success", `Exam reset for ${course}. Lesson progress preserved.`, [{ text: 'OK', action: () => location.reload() }]);
}

function logout() {
    const root = window.location.pathname.toLowerCase().includes('/tutorials/') ? '../../' : '';
    fetch(root + 'api/logout.php')
        .then(() => {
            window.currentUserEmail = null;
            window.location.href = root + 'login.html';
        })
        .catch(err => console.error(err));
}

// --- Dynamic Typography Styles ---
function injectDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --primary: #6366f1;
            --primary-glow: rgba(99, 102, 241, 0.4);
            --accent: #f59e0b;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --bg-body: #f8fafc;
            --glass-bg: rgba(255, 255, 255, 0.9);
            --glass-border: rgba(226, 232, 240, 0.8);
            --card-bg: #ffffff;
            --sidebar-bg: rgba(255, 255, 255, 0.8);
            --radius: 12px;
            --font-code: 'Fira Code', monospace;
        }

        body.dark-mode {
            --primary: #818cf8;
            --primary-glow: rgba(129, 140, 248, 0.4);
            --accent: #fbbf24;
            --text-main: #f1f5f9;
            --text-muted: #94a3b8;
            --bg-body: #0f172a;
            --glass-bg: rgba(30, 41, 59, 0.95);
            --glass-border: rgba(255, 255, 255, 0.1);
            --card-bg: #1e293b;
            --sidebar-bg: rgba(15, 23, 42, 0.9);
        }

        body {
            background-color: var(--bg-body);
            color: var(--text-main);
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* UI Elements Visibility Fixes */
        .card, .info-box, .quiz-container, .cert-container, .custom-modal, .roadmap-step, .timeline-content {
            background: var(--card-bg);
            border-color: var(--glass-border);
            color: var(--text-main);
        }

        /* Buttons & Links Visibility */
        .btn-small, .btn, .run-btn, .copy-btn {
            background-color: var(--primary);
            color: #ffffff !important;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        
        .btn-small:hover, .btn:hover, .run-btn:hover, .copy-btn:hover {
            background-color: var(--accent);
            color: #ffffff !important;
        }

        .content a:not(.btn-small):not(.btn):not(.brand) {
            color: var(--primary);
        }

        /* Nav Buttons (Previous/Next) */
        .nav-buttons {
            background: transparent;
            border-color: var(--glass-border);
            color: var(--text-main);
        }
        .nav-buttons .btn-small {
            background: var(--primary);
            color: #ffffff;
        }

        /* Editor Output Visibility */
        .preview-frame {
            background-color: #ffffff;
        }

        .sidebar {
            background: var(--sidebar-bg);
            border-right: 1px solid var(--glass-border);
        }

        .sidebar a {
            color: var(--text-muted);
        }

        .sidebar a:hover, .sidebar a.active {
            color: var(--primary);
            background: rgba(99, 102, 241, 0.1);
        }

        body.dark-mode .sidebar a:hover, body.dark-mode .sidebar a.active {
            background: rgba(129, 140, 248, 0.15);
        }

        /* Inputs */
        input, textarea, select {
            background-color: var(--bg-body) !important;
            color: var(--text-main) !important;
            border-color: var(--glass-border) !important;
        }
        
        input::placeholder {
            color: var(--text-muted);
            opacity: 0.7;
        }

        /* Content Typography */
        .content h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1.5rem; color: var(--primary); line-height: 1.2; letter-spacing: -0.02em; }
        .content h2 { font-size: 2rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 1rem; color: var(--text-main); border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem; }
        .content h3 { font-size: 1.5rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: var(--text-main); }
        .content h4 { font-size: 1.2rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--primary); }
        .content p { margin-bottom: 1.2rem; line-height: 1.7; color: var(--text-muted); font-size: 1.05rem; }
        .content ul, .content ol { margin-bottom: 1.5rem; padding-left: 1.5rem; color: var(--text-muted); }
        .content li { margin-bottom: 0.5rem; line-height: 1.6; }
        .content strong { color: var(--text-main); font-weight: 600; }
        
        /* Code Blocks */
        pre, code {
            background: #1e293b;
            color: #e2e8f0;
            border-radius: 6px;
        }
        body.dark-mode pre, body.dark-mode code {
            background: #020617;
            border: 1px solid var(--glass-border);
        }

        /* Quiz Options */
        .quiz-option {
            background: var(--card-bg);
            color: var(--text-main);
            border: 1px solid var(--glass-border);
        }
        .quiz-option:hover {
            background: var(--glass-border);
        }
        
        /* Header & Footer adjustments */
        header, footer {
            background: var(--glass-bg);
            border-color: var(--glass-border);
        }

        /* Global Vertical Alignment Fix */
        .header-controls {
            display: flex;
            align-items: center;
        }
        .brand span { color: var(--text-main); }
        
        /* Modal */
        .custom-modal h3 { color: var(--primary); }
        .custom-modal p { color: var(--text-muted); }

        /* Mobile Navbar Alignment Fixes */
        @media (max-width: 768px) {
            .header-controls {
                display: flex;
                align-items: center;
                flex-wrap: nowrap;
            }
            
            /* Auth Wrapper (3rd child) */
            .header-controls > div:nth-child(3) {
                margin-left: 0 !important;
                display: flex;
                align-items: center;
                height: 32px;
            }
        }
    `;
    document.head.appendChild(style);
}

// --- Render Sidebar with Locking Logic ---
function renderSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    const path = window.location.pathname.toLowerCase();
    const root = path.includes('/tutorials/') ? '../../' : '';
    
    let courseType = '';
    if (path.includes('/html/')) courseType = 'html';
    else if (path.includes('/css/')) courseType = 'css';
    else if (path.includes('/js/')) courseType = 'js';
    else if (path.includes('/python/')) courseType = 'python';
    else if (path.includes('/react/')) courseType = 'react';
    else if (path.includes('/sql/')) courseType = 'sql';
    else if (path.includes('/java/')) courseType = 'java';
    else if (path.includes('/git/')) courseType = 'git';
    else if (path.includes('/methodologies/') || path.includes('/methodology/')) courseType = 'methodologies';

    let sidebarHTML = `<a href="${root}index.html" style="margin-bottom: 1rem; color: var(--primary); font-weight: 700; border: 1px solid var(--glass-border);">&larr; Back to Home</a>`;

    const links = window.curriculum[courseType] || [];
    const completedTopics = JSON.parse(localStorage.getItem(window.getUserKey('completedTopics'))) || [];
    const passedQuizzes = JSON.parse(localStorage.getItem(window.getUserKey('passedQuizzes'))) || [];
    
    const allItems = [].concat(...links.map(section => section.items));

    links.forEach(section => {
        sidebarHTML += `<h4>${section.title}</h4>`;
        section.items.forEach(link => {
            const topicId = link.url;
            const currentIndex = allItems.findIndex(item => item.url === topicId);
            
            let isUnlocked = (currentIndex === 0);
            if (!isUnlocked) {
                const prevItem = allItems[currentIndex - 1];
                const prevUrl = prevItem.url;
                if (passedQuizzes.includes(prevUrl)) {
                    isUnlocked = true;
                } else {
                    const prevTopicId = prevUrl.split('?topic=')[1];
                    if (window.tutorialData[prevTopicId] && !window.tutorialData[prevTopicId].quiz && completedTopics.includes(prevUrl)) {
                        isUnlocked = true;
                    }
                }
            }
            
            const currentPath = window.location.pathname;
            const currentSearch = window.location.search;
            const linkPath = link.url.split('?')[0];
            const linkSearch = '?' + (link.url.split('?')[1] || '');
            
            const isActive = (currentPath.endsWith(linkPath) && currentSearch === linkSearch) ? 'active' : '';
            const completedClass = completedTopics.includes(topicId) ? 'completed' : '';

            if (isUnlocked) {
                sidebarHTML += `<a href="${root + link.url}" class="${isActive} ${completedClass}">${link.name}</a>`;
            } else {
                sidebarHTML += `<div class="sidebar-link locked" style="padding: 0.6rem 1rem; margin-bottom: 0.4rem; color: var(--text-muted); cursor: not-allowed; opacity: 0.6; display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem;"><span>${link.name}</span><span style="font-size: 0.8rem;">🔒</span></div>`;
            }
        });
    });
    sidebar.innerHTML = sidebarHTML;
}

// --- Course Loader ---
function loadCourses() {
    const gridContainer = document.getElementById('course-grid');
    if (!gridContainer) return;

    const root = window.location.pathname.toLowerCase().includes('/tutorials/') ? '../../' : '';

    fetch(`${root}courses.json`)
        .then(response => response.json())
        .then(courses => {
            gridContainer.innerHTML = '';
            courses.forEach((course, index) => {
                const card = document.createElement('a');
                const linkUrl = course.link.startsWith('http') ? course.link : (root + course.link);
                card.href = linkUrl;
                card.className = 'card reveal';
                card.style.transitionDelay = `${index * 100}ms`;
                card.innerHTML = `<h3 style="color: ${course.color};">${course.title}</h3><p>${course.description}</p>`;
                gridContainer.appendChild(card);
            });
            initAnimations();
        })
        .catch(error => {
            console.error('Error loading courses:', error);
            gridContainer.innerHTML = '<p>Failed to load courses.</p>';
        });
}

// --- Editor Functions ---
window.runCode = function() {
    const codeInput = document.getElementById('code-html');
    const previewFrame = document.getElementById('preview-frame');
    if (!codeInput || !previewFrame) return;

    let code = codeInput.value;
    const path = window.location.pathname.toLowerCase();
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    
    doc.open();

    if (path.includes('/react/')) {
        code = code.replace(/import\s+.*?from\s+['"]react['"];?/g, '');
        code = code.replace(/import\s+.*?from\s+['"]react-dom\/client['"];?/g, '');
        code = code.replace(/import\s+.*?from\s+['"]react-dom['"];?/g, '');
        doc.write(`
            <!DOCTYPE html><html><head>
                <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
                <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
                <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                <style>body { font-family: 'Segoe UI', sans-serif; padding: 1rem; color: #333; }</style>
            </head><body>
                <div id="root"></div>
                <script type="text/babel">
                    const { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext } = React;
                    ${code}
                </script>
            </body></html>
        `);
    } else {
        doc.write(code);
    }
    doc.close();
};

window.runSqlCode = function() {
    const codeInput = document.getElementById('code-html');
    const previewFrame = document.getElementById('preview-frame');
    if (!codeInput || !previewFrame) return;

    const code = codeInput.value.trim();
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    
    doc.open();
    doc.write(`
        <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 1rem; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            .success { color: #10b981; font-weight: bold; } .info { color: #3b82f6; }
        </style>
    `);

    if (code.toUpperCase().startsWith('SELECT')) {
        doc.write('<div class="success">Query executed successfully.</div>');
        doc.write(`
            <table><thead><tr><th>ID</th><th>CustomerName</th><th>City</th><th>Country</th></tr></thead>
            <tbody>
                <tr><td>1</td><td>Alfreds Futterkiste</td><td>Berlin</td><td>Germany</td></tr>
                <tr><td>2</td><td>Ana Trujillo Emparedados</td><td>México D.F.</td><td>Mexico</td></tr>
                <tr><td>3</td><td>Antonio Moreno Taquería</td><td>México D.F.</td><td>Mexico</td></tr>
            </tbody></table>
            <p class="info"><em>* This is a simulation.</em></p>
        `);
    } else {
        doc.write('<div class="success">Command executed successfully.</div><p>Rows affected: 1</p><p class="info"><em>* Data modifications are simulated.</em></p>');
    }
    doc.close();
};

window.toggleSchema = function() {
    const previewFrame = document.getElementById('preview-frame');
    if (!previewFrame) return;
    
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    doc.open();
    doc.write(`
        <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 1rem; }
            .schema-table { border: 1px solid #ccc; border-radius: 4px; padding: 1rem; background: #f9f9f9; margin-bottom: 1rem; }
            h3 { margin-top: 0; color: #333; } ul { list-style: none; padding: 0; }
            li { padding: 4px 0; border-bottom: 1px solid #eee; font-family: monospace; }
            li:last-child { border-bottom: none; } .type { color: #666; font-size: 0.9em; float: right; }
        </style>
        <h2>Database Schema</h2>
        <div class="schema-table"><h3>Customers</h3><ul>
            <li>CustomerID <span class="type">INT PK</span></li>
            <li>CustomerName <span class="type">VARCHAR(255)</span></li>
            <li>City <span class="type">VARCHAR(255)</span></li>
            <li>Country <span class="type">VARCHAR(50)</span></li>
        </ul></div>
    `);
    doc.close();
};

function resetCurrentCourse(courseType) {
    showModal("Reset Course?", "This will reset your progress for this course so you can retake the assessment. Are you sure?", [
        { text: 'Yes, Reset', class: 'danger', action: () => {
            const userKey = window.getUserKey;
            
            // Clear Dashboard Progress for this specific course
            if (window.currentUserEmail) {
                const storageKey = 'avesafe_course_progress';
                const allProgress = JSON.parse(localStorage.getItem(storageKey) || '{}');
                if (allProgress[window.currentUserEmail] && allProgress[window.currentUserEmail][courseType]) {
                    delete allProgress[window.currentUserEmail][courseType];
                    localStorage.setItem(storageKey, JSON.stringify(allProgress));
                }
            }

            localStorage.removeItem(userKey(`attempts_${courseType}`));
            localStorage.removeItem(userKey(`passed_assessment_${courseType}`));
            localStorage.removeItem(userKey(`assessment_start_${courseType}`));
            localStorage.removeItem(userKey(`badge_${courseType}`));
            localStorage.removeItem(userKey(`cert_name_${courseType}`));
            localStorage.removeItem(userKey(`cert_id_${courseType}`));
            localStorage.removeItem(userKey(`score_${courseType}`)); // Remove the score

            let completed = JSON.parse(localStorage.getItem(userKey('completedTopics'))) || [];
            let passed = JSON.parse(localStorage.getItem(userKey('passedQuizzes'))) || [];

            const coursePathFragment = `/tutorials/${courseType}/`;
            completed = completed.filter(url => !url.includes(coursePathFragment));
            passed = passed.filter(url => !url.includes(coursePathFragment));

            localStorage.setItem(userKey('completedTopics'), JSON.stringify(completed));
            localStorage.setItem(userKey('passedQuizzes'), JSON.stringify(passed));

            if (window.curriculum[courseType] && window.curriculum[courseType][0] && window.curriculum[courseType][0].items.length > 0) {
                const firstUrl = window.curriculum[courseType][0].items[0].url;
                const root = window.location.pathname.toLowerCase().includes('/tutorials/') ? '../../' : '';
                const targetUrl = root + (firstUrl.startsWith('/') ? firstUrl.substring(1) : firstUrl);
                window.location.href = targetUrl;
            } else {
                location.reload();
            }
        }},
        { text: 'Cancel', class: 'secondary', action: () => closeModal() }
    ]);
}

function showAdminButtons() {
    document.getElementById('adminAccessContainer').style.display = 'none';
    document.getElementById('testButtonsContainer').style.display = 'flex';
}

// --- Login Modal Logic ---
window.showLoginModal = function() {
    const formHTML = `
        <div style="text-align: left; margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; color: var(--text-main);">Email</label>
            <input type="email" id="loginEmail" placeholder="Enter your email" style="width: 100%; padding: 10px; border: 1px solid var(--glass-border); border-radius: 6px; background: var(--bg-body); color: var(--text-main); margin-bottom: 15px; font-family: inherit;">
            
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem; color: var(--text-main);">Password</label>
            <input type="password" id="loginPassword" placeholder="Enter your password" style="width: 100%; padding: 10px; border: 1px solid var(--glass-border); border-radius: 6px; background: var(--bg-body); color: var(--text-main); margin-bottom: 20px; font-family: inherit;">
            
            <button onclick="handleEmailLogin()" style="width: 100%; padding: 12px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1rem; margin-bottom: 15px; transition: opacity 0.2s;">Login with Email</button>
            
            <div style="display: flex; align-items: center; margin: 15px 0; color: var(--text-muted); font-size: 0.85rem;">
                <div style="flex: 1; height: 1px; background: var(--glass-border);"></div>
                <span style="padding: 0 10px;">OR</span>
                <div style="flex: 1; height: 1px; background: var(--glass-border);"></div>
            </div>
            
            <button onclick="handleGoogleLogin()" style="width: 100%; padding: 12px; background: white; color: #333; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 500; font-size: 0.95rem; transition: background 0.2s;">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width: 20px; height: 20px;">
                Sign in with Google
            </button>
        </div>
    `;
    
    showModal("Welcome Back", formHTML, [{ text: 'Cancel', class: 'secondary', action: () => closeModal() }]);
};

// --- Secure Session Management ---
window.checkSession = function() {
    const root = window.location.pathname.toLowerCase().includes('/tutorials/') ? '../../' : '';
    fetch(root + 'api/session.php')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                window.currentUserEmail = data.email;
                window.currentUserName = data.displayName;
                updateAuthUI(true);
                
                // Handle Dashboard Logic if on dashboard page
                if (document.body.dataset.page === 'dashboard') {
                    initDashboard(data);
                }
            } else {
                    // Prevent overwriting Firebase state or redirecting while loading
                    if (window.currentUser || document.body.classList.contains('auth-loading') || document.querySelector('script[src*="firebase-auth.js"]')) {
                        return;
                    }

                updateAuthUI(false);
                if (document.body.dataset.page === 'dashboard') {
                    window.location.href = 'index.html?action=login';
                }
            }
        })
        .catch(err => console.error("Session check failed", err));
};

function initDashboard(user) {
    const welcomeHeader = document.getElementById('dashboardWelcome');
    if (welcomeHeader) {
        welcomeHeader.innerHTML = `
            <div style="display: flex; flex-direction: column; justify-content: center; line-height: 1.2;">
                <span style="font-size: 1.5rem; opacity: 0.9; margin-bottom: 4px; font-weight: 600;">Welcome back!</span>
                <span style="font-size: 1.8rem; font-weight: 700;">${user.displayName}</span>
                <span style="font-size: 0.9rem; opacity: 0.8; font-weight: normal; margin-top: 2px;">${user.email}</span>
            </div>
        `;
    }
    // Load data from localStorage (client-side progress)
    loadDashboardData(user);
}

function loadDashboardData(user) {
    const progressContainer = document.getElementById('courseProgressSection');
    const certContainer = document.getElementById('certificatesSection');
    
    if (!progressContainer || !certContainer) return;

    const root = window.location.pathname.toLowerCase().includes('/tutorials/') ? '../../' : '';

    fetch(root + 'courses.json')
        .then(res => res.json())
        .then(courses => {
            const storageKey = 'avesafe_course_progress';
            const allProgress = JSON.parse(localStorage.getItem(storageKey) || '{}');
            const userProgress = allProgress[user.email] || {};
            
            const hasStartedAny = Object.keys(userProgress).length > 0;

            if (!hasStartedAny) {
                progressContainer.innerHTML = `
                    <p style="color: var(--text-muted);">You haven't started any courses yet.</p>
                    <a href="index.html#courses" class="btn-small" style="background: var(--primary); border: none; text-decoration: none; margin-top: 1rem; display: inline-block;">Browse Courses</a>
                `;
                certContainer.innerHTML = `<p class="text-muted">No certificates earned yet.</p>`;
                return;
            }

            let progressHTML = '<div class="course-list">';
            let certHTML = '<div class="cert-grid">';
            let hasCertificates = false;

            courses.forEach(course => {
                const courseId = course.id;
                const progressData = userProgress[courseId];
                const percentage = progressData ? progressData.progress : 0;
                const isCompleted = percentage === 100;

                if (progressData) {
                    progressHTML += `
                        <div class="course-item">
                            <div class="course-header">
                                <span>${course.title}</span>
                                <span style="color: var(--text-muted); font-size: 0.85rem;">
                                    ${isCompleted ? '<span style="color:#10b981">Completed</span>' : `${percentage}% Complete`}
                                </span>
                            </div>
                            <div class="dash-progress-track">
                                <div class="dash-progress-fill ${isCompleted ? 'completed' : ''}" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    `;
                }

                if (isCompleted) {
                    hasCertificates = true;
                    certHTML += `
                        <div class="cert-card">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏆</div>
                            <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem;">${course.title}</h4>
                            <a href="certificate.html?course=${courseId}" class="btn-small" style="font-size: 0.8rem; padding: 0.4rem 0.8rem; background: var(--primary); color: white; text-decoration: none; display: inline-block;">View</a>
                        </div>
                    `;
                }
            });

            progressHTML += '</div>';
            certHTML += '</div>';

            progressContainer.innerHTML = progressHTML;

            if (!hasCertificates) {
                certContainer.innerHTML = `
                    <div style="text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.9rem;">
                        Complete a course to earn your certificate!
                    </div>`;
            } else {
                certContainer.innerHTML = certHTML;
            }
        })
        .catch(err => console.error("Error loading courses for dashboard:", err));
}

function updateAuthUI(isLoggedIn) {
    const loginBtn = document.getElementById('loginBtn');
    const profileIcon = document.getElementById('profileIcon');
    const menu = document.getElementById('profileMenu');
    
    // Always hide old login buttons container
    if(loginBtn) loginBtn.style.display = 'none';
    
    // Always show profile icon
    if(profileIcon) profileIcon.style.display = 'flex';

    if (menu) {
        const root = window.location.pathname.toLowerCase().includes('/tutorials/') ? '../../' : '';
        if (isLoggedIn) {
            menu.innerHTML = `
                <div class="profile-menu-header" style="padding: 0.5rem 1rem; font-weight:bold; border-bottom:1px solid var(--glass-border); margin-bottom:5px;">Hello! ${window.currentUserName || 'User'}</div>
                <a href="${root}index.html" style="display: block; padding: 0.6rem 1rem; color: var(--text-main); text-decoration: none; border-radius: 4px; font-size: 0.9rem; transition: background 0.2s;">Dashboard</a>
                <a href="#" id="signOutBtn" style="display: block; padding: 0.6rem 1rem; color: #ef4444; text-decoration: none; border-radius: 4px; font-size: 0.9rem; transition: background 0.2s;">Sign Out</a>
            `;
            const signOutBtn = document.getElementById('signOutBtn');
            if(signOutBtn) signOutBtn.onclick = (e) => { e.preventDefault(); logout(); };
        } else {
            menu.innerHTML = `
                <button onclick="showLoginModal()" class="profile-menu-item" style="text-align:left; background:none; border:none; padding: 0.6rem 1rem; color: var(--text-main); cursor:pointer; font-size: 0.9rem; width:100%; font-family: inherit;">Login</button>
                <a href="${root}register.html" class="profile-menu-item" style="display: block; padding: 0.6rem 1rem; color: var(--text-main); text-decoration: none; border-radius: 4px; font-size: 0.9rem;">Sign Up</a>
            `;
        }
    }
}

window.handleEmailLogin = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }
    
    const btn = document.querySelector('button[onclick="handleEmailLogin()"]');
    const originalText = btn ? btn.textContent : "Login";

    btn.textContent = "Logging in...";
    btn.disabled = true;

    const root = window.location.pathname.toLowerCase().includes('/tutorials/') ? '../../' : '';
    
    fetch(root + 'api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.currentUserEmail = data.email;
            updateAuthUI(true);
            closeModal();
        } else {
            alert(data.error || "Login failed");
            btn.textContent = originalText;
            btn.disabled = false;
        }
    })
    .catch(err => {
        console.error(err);
        alert("Connection error");
        btn.textContent = originalText;
        btn.disabled = false;
    });
};

window.handleGoogleLogin = function() {
    if (typeof window.loginWithGoogle === 'function') {
        window.loginWithGoogle()
            .then(() => {
                window.location.href = 'dashboard.html';
            })
            .catch(err => console.error("Google Login Error:", err));
    } else {
        alert("Google Login service is connecting... Please wait a moment and try again.");
    }
};

window.handlePageLogin = function() {
    const email = document.getElementById('pageEmail').value;
    const password = document.getElementById('pagePassword').value;
    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }
    const btn = document.querySelector('button[onclick="handlePageLogin()"]');
    const originalText = btn.textContent;
    btn.textContent = "Logging in...";
    btn.disabled = true;

    fetch('api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.location.href = 'index.html';
        } else {
            alert(data.error || "Login failed");
            btn.textContent = originalText;
            btn.disabled = false;
        }
    })
    .catch(err => {
        console.error(err);
        alert("Connection error");
        btn.textContent = originalText;
        btn.disabled = false;
    });
};
