import { app } from './firebase-init.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

console.log("🔥 firebase-auth.js EXECUTED");
console.log("firebase-auth.js loaded");

// Initialize Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: "select_account"
});

// --- EXPOSE AUTH FUNCTIONS GLOBALLY ---
window.loginWithGoogle = () => {
    return signInWithPopup(auth, provider);
};

window.loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

// --- AUTH LOADING STATE ---
// Inject styles to hide UI until auth resolves
const style = document.createElement('style');
style.textContent = `
    body.auth-loading #loginBtn { display: none !important; }
    .profile-menu {
        position: fixed;
        background: var(--glass-bg, #fff);
        border: 1px solid var(--glass-border, #ccc);
        border-radius: 8px;
        padding: 0.5rem;
        min-width: 160px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        z-index: 9999;
        backdrop-filter: blur(10px);
        flex-direction: column;
        gap: 5px;
    }
    .profile-menu-item {
        display: block; padding: 0.6rem 1rem; color: var(--text-main, #333); text-decoration: none; border-radius: 4px; font-size: 0.9rem; cursor: pointer; transition: background 0.2s;
    }
    .profile-menu-item:hover { background: rgba(0,0,0,0.05); }
    .profile-menu-header { padding: 0.5rem 1rem; font-weight: bold; border-bottom: 1px solid var(--glass-border, #ccc); margin-bottom: 5px; font-size: 0.9rem; }
    .profile-menu-item.danger { color: #ef4444; }
    .dashboard-avatar {
        width: 100px; height: 100px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid var(--primary, #6366f1);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        flex-shrink: 0;
    }
    @media (max-width: 600px) {
        .dashboard-avatar { width: 70px; height: 70px; }
    }
`;
document.head.appendChild(style);
document.body.classList.add('auth-loading');
let isAuthResolved = false;

// Safety timeout: Remove loading state after 3s even if auth is slow
setTimeout(() => { document.body.classList.remove('auth-loading'); }, 3000);

let currentUser = null;
let listenersAttached = false;
let observer; // Define observer at top level to avoid ReferenceError

// --- 1. FORCE CREATE PROFILE MENU ---
function createProfileMenu() {
    // Remove duplicate from header if main.js injected it (avoids ID conflicts)
    const headerMenu = document.querySelector('header #profileMenu');
    if (headerMenu) headerMenu.remove();

    // Check if our body-attached menu exists
    let menu = document.querySelector('body > #profileMenu');
    
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'profileMenu';
        menu.className = 'profile-menu';
        menu.style.display = 'none'; // Initial state
        document.body.appendChild(menu);
    }

    const isTutorial = window.location.pathname.includes('/tutorials/');
    const root = isTutorial ? '../../' : '';

    if (currentUser) {
        let firstName = "User";
        if (currentUser.displayName) {
            firstName = currentUser.displayName.split(' ')[0];
        }
        menu.innerHTML = `
            <div class="profile-menu-header">Hello! ${firstName}</div>
            <a href="${root}dashboard.html" id="dashboardBtn" class="profile-menu-item">Dashboard</a>
            <div id="signOutBtn" class="profile-menu-item danger">Sign Out</div>
        `;
    } else {
        menu.innerHTML = `
            <div id="loginBtnMenu" class="profile-menu-item">Login</div>
            <a href="${root}register.html" class="profile-menu-item">Sign Up</a>
        `;
    }
}

function handleOutsideClick(e) {
    const menu = document.querySelector('body > #profileMenu');
    const icon = document.getElementById('profileIcon');

    if (menu && menu.style.display === 'flex') {
        // Close if click is NOT inside menu AND NOT on icon
        if (!menu.contains(e.target) && e.target !== icon && (!icon || !icon.contains(e.target))) {
            menu.style.display = 'none';
        }
    }
}

function handleProfileClick(e) {
    e.stopPropagation();
    const menu = document.querySelector('body > #profileMenu');
    const icon = document.getElementById('profileIcon');

    if (!menu || !icon) return;

    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        const rect = icon.getBoundingClientRect();
        const menuWidth = menu.offsetWidth || 160;
        
        let leftPos = rect.right - menuWidth;
        if (leftPos < 10) leftPos = 10;
        
        menu.style.top = (rect.bottom + 10) + 'px';
        menu.style.left = leftPos + 'px';
        menu.style.display = 'flex';
    }
}

function updateUI() {
    // Disconnect observer temporarily to prevent infinite loops
    if (typeof observer !== 'undefined' && observer) observer.disconnect();

    const loginBtn = document.getElementById('loginBtn');
    const profileIcon = document.getElementById('profileIcon');
    
    const headerMenu = document.querySelector('header #profileMenu');
    if (headerMenu) headerMenu.remove();

    // Always hide old login buttons
    if (loginBtn) {
        loginBtn.style.display = 'none';
        loginBtn.innerHTML = ''; // Force clear any residual buttons from cached HTML
    }
    
    // Always show profile icon
    if (profileIcon) {
        profileIcon.style.display = 'flex';
        if (currentUser && currentUser.photoURL) {
            profileIcon.innerHTML = `<img src="${currentUser.photoURL}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            profileIcon.innerHTML = '👤';
        }
    }

    createProfileMenu();
    
    // Reconnect observer
    if (typeof observer !== 'undefined' && observer) observer.observe(document.body, { childList: true, subtree: true });
}

function init() {
    document.body.addEventListener('click', (e) => {
        // Profile Icon Click
        if (e.target.matches('#profileIcon') || e.target.closest('#profileIcon')) {
            handleProfileClick(e);
            return;
        }
        
        // Sign Out Click
        if (e.target.matches('#signOutBtn') || e.target.closest('#signOutBtn')) {
            e.preventDefault();
            signOut(auth).then(() => {
                const isTutorial = window.location.pathname.includes('/tutorials/');
                const root = isTutorial ? '../../' : '';
                window.location.href = root + 'index.html';
            });
            return;
        }

        // Login Click (from menu)
        if (e.target.matches('#loginBtnMenu') || e.target.closest('#loginBtnMenu')) {
             if (typeof window.showLoginModal === 'function') {
                 window.showLoginModal();
             }
             const menu = document.querySelector('body > #profileMenu');
             if(menu) menu.style.display = 'none';
             return;
        }
        
        // Outside Click
        handleOutsideClick(e);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle Google Login
const googleBtn = document.getElementById('googleLoginBtn');
if (googleBtn) {
    googleBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submission if inside a form
        signInWithPopup(auth, provider)
            .then((result) => {
                const user = result.user;
                console.log("User Display Name:", user.displayName);
                console.log("User Email:", user.email);
                console.log("User UID:", user.uid);
                window.location.replace('dashboard.html');
            })
            .catch((error) => console.error("Google Login Error:", error));
    });
}

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    // Expose email globally for main.js to scope data
    window.currentUserEmail = user ? user.email : null;
    window.currentUser = user;

    // Retry saving progress if on a tutorial page (handles case where auth loads after content)
    if (user && window.location.pathname.includes('/tutorials/')) {
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
        else if (path.includes('/methodologies/')) courseType = 'methodologies';

        // Only save if we are NOT in a reset state (check if progress circle is 0%)
        const circle = document.querySelector('#courseProgressCircle span');
        const currentVisualProgress = circle ? parseInt(circle.innerText) : 0;

        if (courseType && typeof window.saveGlobalProgress === 'function' && currentVisualProgress > 0) {
            // Attempt to save progress now that we have the user's email
            // We use a small timeout to ensure the DOM (progress circle) is ready if it was racing
            setTimeout(() => window.saveGlobalProgress(courseType), 500);
        }

        // FORCE UI REFRESH: Re-render sidebar now that we have the user context
        // This fixes the issue where sidebar renders as "locked" before auth finishes
        if (typeof window.renderSidebar === 'function') {
            window.renderSidebar();
        }
        
        // Update the progress circle visual
        if (courseType && typeof window.updateCourseProgressUI === 'function') {
            window.updateCourseProgressUI(courseType);
        }
    }

    // FORCE CERTIFICATE REFRESH: If we are on certificate page, re-run logic now that we have user
    if (typeof window.initCertificatePage === 'function') {
        window.initCertificatePage(user);
    }

    const page = document.body.dataset.page;

    if (user && (page === "login" || window.location.pathname.includes('login.html'))) {
        window.location.replace('dashboard.html');
    }

    // Dashboard Protection & Welcome Message
    if (page === "dashboard") {
        if (!user) {
            window.location.replace('index.html?action=login');
        } else {
            const welcomeHeader = document.getElementById('dashboardWelcome');
            if (welcomeHeader && user.displayName) {
                const photoURL = user.photoURL || 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/person.svg';
                
                welcomeHeader.style.display = 'flex';
                welcomeHeader.style.alignItems = 'center';
                welcomeHeader.style.gap = '1.5rem';
                welcomeHeader.innerHTML = `
                    <img src="${photoURL}" alt="Profile" class="dashboard-avatar">
                    <div style="display: flex; flex-direction: column; justify-content: center; line-height: 1.2;">
                        <span style="font-size: 1.5rem; opacity: 0.9; margin-bottom: 4px; font-weight: 600;">Welcome back!</span>
                        <span style="font-size: 1.8rem; font-weight: 700;">${user.displayName}</span>
                        <span style="font-size: 0.9rem; opacity: 0.8; font-weight: normal; margin-top: 2px;">${user.email}</span>
                    </div>
                `;
            }
            loadDashboardData(user);
        }
    }
    
    updateUI();

    // --- ADMIN UI VISIBILITY ---
    const isAdmin = user && user.email === 'abhinavutkarsh3@gmail.com';
    
    if (user) {
        if (isAdmin) console.log("Admin logged in via Google");
        else console.log("User logged in via Google");
    }

    const adminContainer = document.getElementById('adminAccessContainer');
    if (adminContainer) {
        adminContainer.style.display = isAdmin ? 'block' : 'none';
        // Also hide test buttons if not admin
        if (!isAdmin) {
            const testBtns = document.getElementById('testButtonsContainer');
            if (testBtns) testBtns.style.display = 'none';
        }
    }

    if (!isAuthResolved) {
        isAuthResolved = true;
        document.body.classList.remove('auth-loading');
    }
});

// Observe DOM changes (e.g., main.js injecting header) to keep UI in sync
observer = new MutationObserver(updateUI);
observer.observe(document.body, { childList: true, subtree: true });

function loadDashboardData(user) {
    const progressContainer = document.getElementById('courseProgressSection');
    const certContainer = document.getElementById('certificatesSection');
    
    if (!progressContainer || !certContainer) return;

    fetch('courses.json')
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
