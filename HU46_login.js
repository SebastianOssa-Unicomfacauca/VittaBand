/**
 * ============================================
 * HU46 - INICIO DE SESIÓN
 * ============================================
 */
// isabella 
(function() {
    'use strict';

    const loginForm          = document.getElementById('loginForm');
    const loginEmail         = document.getElementById('loginEmail');
    const loginPassword      = document.getElementById('loginPassword');
    const loginGeneralError  = document.getElementById('loginGeneralError');
    const linkToRegister     = document.getElementById('linkToRegister');

    const navLinks           = document.getElementById('navLinks');
    const navSession         = document.getElementById('navSession');
    const sessionRole        = document.getElementById('sessionLabel');
    const sessionName        = document.getElementById('sessionName');
    const btnLogout          = document.getElementById('btnLogout');

    /* ── helpers de navegación ── */
    function showSection(id) {
        ['sectionLogin','sectionRegister','sectionHome'].forEach(s => {
            document.getElementById(s).classList.add('hidden');
        });
        document.getElementById(id).classList.remove('hidden');
    }

    function clearLoginErrors() {
        loginGeneralError.textContent = '';
        loginGeneralError.classList.add('hidden');
        loginEmail.classList.remove('error');
        loginPassword.classList.remove('error');
    }

    function showLoginError(message) {
        loginGeneralError.textContent = message;
        loginGeneralError.classList.remove('hidden');
        loginEmail.classList.add('error');
        loginPassword.classList.add('error');
    }

    function authenticateUser(email, password) {
        const users = JSON.parse(localStorage.getItem('hm_users') || '[]');
        return users.find(u => u.email === email.toLowerCase() && u.password === password) || null;
    }

    /* ── sesión ── */
    function startSession(user) {
        const session = { name: user.name, email: user.email, loginAt: new Date().toISOString() };
        localStorage.setItem('hm_session', JSON.stringify(session));

        document.getElementById('userNameDisplay').textContent = user.name;
        sessionRole.textContent = 'Usuario';
        sessionName.textContent = user.name;

        navLinks.classList.add('hidden');
        navSession.classList.remove('hidden');

        loginForm.reset();
        clearLoginErrors();
        showSection('sectionHome');

        window.dispatchEvent(new CustomEvent('userLoggedIn'));
    }

    function logout() {
        localStorage.removeItem('hm_session');
        navSession.classList.add('hidden');
        navLinks.classList.remove('hidden');
        showSection('sectionLogin');
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }

    function checkExistingSession() {
        const session = JSON.parse(localStorage.getItem('hm_session') || 'null');
        if (session) {
            document.getElementById('userNameDisplay').textContent = session.name;
            sessionRole.textContent = 'Usuario';
            sessionName.textContent = session.name;
            navLinks.classList.add('hidden');
            navSession.classList.remove('hidden');
            showSection('sectionHome');
            window.dispatchEvent(new CustomEvent('userLoggedIn'));
        }
    }

    /* ── eventos ── */
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        clearLoginErrors();

        const email    = loginEmail.value.trim();
        const password = loginPassword.value;

        if (!email || !password) {
            showLoginError('Por favor completa todos los campos');
            return;
        }

        const user = authenticateUser(email, password);
        if (user) {
            startSession(user);
        } else {
            showLoginError('Correo o contraseña incorrectos');
        }
    });

    [loginEmail, loginPassword].forEach(i => i.addEventListener('input', clearLoginErrors));

    linkToRegister.addEventListener('click', e => {
        e.preventDefault();
        showSection('sectionRegister');
        clearLoginErrors();
    });

    btnLogout.addEventListener('click', logout);

    checkExistingSession();

})();