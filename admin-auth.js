(function () {
    'use strict';

    const SESSION_KEY = 'dd_admin_v1';
    // SHA-256 of "DoubleD@Admin2024" — change via admin-login.html if needed
    const PW_HASH = 'ac36e02917a037bb19cb3468dbdc92b7421dd632bfa5f14d0581195c767a803a';

    async function sha256(text) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function injectAdminToolbar() {
        if (document.getElementById('admin-toolbar')) return;
        const toolbar = document.createElement('div');
        toolbar.id = 'admin-toolbar';
        toolbar.style.cssText = [
            'display:none',
            'position:fixed',
            'bottom:24px',
            'left:24px',
            'z-index:9999',
            'align-items:center',
            'gap:10px',
            'background:rgba(10,10,10,0.85)',
            'border:1px solid rgba(247,148,29,0.35)',
            'backdrop-filter:blur(10px)',
            'border-radius:8px',
            'padding:7px 14px',
            'box-shadow:0 0 20px rgba(247,148,29,0.08)',
        ].join(';');
        toolbar.innerHTML =
            '<span style="font-size:10px;font-family:monospace;color:#f7941d;letter-spacing:.12em;text-transform:uppercase;">&#9679; Admin Mode</span>' +
            '<button id="admin-logout-btn" style="font-size:10px;font-family:monospace;color:#666;background:none;border:1px solid rgba(255,255,255,.1);cursor:pointer;padding:3px 8px;border-radius:4px;transition:color .2s,border-color .2s"' +
            ' onmouseover="this.style.color=\'#fff\';this.style.borderColor=\'rgba(255,255,255,.3)\'"' +
            ' onmouseout="this.style.color=\'#666\';this.style.borderColor=\'rgba(255,255,255,.1)\'"' +
            ' onclick="window.AdminAuth.logout()">Logout</button>';
        document.body.appendChild(toolbar);
    }

    const AdminAuth = {
        isLoggedIn() {
            return sessionStorage.getItem(SESSION_KEY) === PW_HASH;
        },

        async login(password) {
            const hash = await sha256(password);
            if (hash === PW_HASH) {
                sessionStorage.setItem(SESSION_KEY, hash);
                return true;
            }
            return false;
        },

        logout() {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.reload();
        },

        applyUI() {
            const loggedIn = this.isLoggedIn();
            document.querySelectorAll('[data-admin-only]').forEach(el => {
                el.style.display = loggedIn ? '' : 'none';
            });
            const toolbar = document.getElementById('admin-toolbar');
            if (toolbar) toolbar.style.display = loggedIn ? 'flex' : 'none';
        }
    };

    window.AdminAuth = AdminAuth;

    document.addEventListener('DOMContentLoaded', function () {
        injectAdminToolbar();
        AdminAuth.applyUI();
    });
})();
