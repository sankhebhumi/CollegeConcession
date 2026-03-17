// Check authentication status
function checkAuth(roleRequired) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '/index.html';
        return null;
    }
    
    const user = JSON.parse(userStr);
    
    // Check if wrong role is trying to access pages
    if (roleRequired && user.role !== roleRequired) {
        if (user.role === 'admin') window.location.href = '/admin.html';
        else window.location.href = '/dashboard.html';
        return null;
    }
    
    return user;
}

// Log out
function logout() {
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

// Show Toast
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) translateX(0)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Fetch API Wrapper
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`/api${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return { success: false, message: 'Server connection failed.' };
    }
}

// Dark Mode Toggle Logic
function setupThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeBtn.innerHTML = '☀️';
    }
    
    themeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeBtn.innerHTML = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeBtn.innerHTML = '☀️';
        }
    });
}
