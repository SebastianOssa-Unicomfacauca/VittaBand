/**
 * ============================================
 * HU46 - INICIO DE SESIÓN
 * ============================================
 * Maneja el formulario de login, validación de credenciales
 * y redirección al dashboard principal.
 * 
 * Criterios de aceptación:
 * - Permitir login con correo y contraseña
 * - Validar credenciales
 * - Mostrar "Correo o contraseña incorrectos"
 * - Redirigir al HOME si el login es correcto
 */

(function() {
    'use strict';

    // Referencias DOM
    const loginForm = document.getElementById('login-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginErrorBanner = document.getElementById('login-error');
    const showRegisterLink = document.getElementById('show-register');
    const logoutBtn = document.getElementById('logout-btn');

    // ============================================
    // AUTENTICACIÓN
    // ============================================

    /**
     * Busca un usuario por correo y contraseña
     * @param {string} email - Correo electrónico
     * @param {string} password - Contraseña
     * @returns {Object|null} - Usuario encontrado o null
     */
    function authenticateUser(email, password) {
        try {
            const users = JSON.parse(localStorage.getItem('vitamonitor_users')) || [];
            const normalizedEmail = email.trim().toLowerCase();

            return users.find(user => 
                user.email === normalizedEmail && 
                user.password === password
            ) || null;
        } catch (error) {
            console.error('Error al autenticar usuario:', error);
            return null;
        }
    }

    /**
     * Guarda la sesión activa en localStorage
     * @param {Object} user - Datos del usuario autenticado
     */
    function setActiveSession(user) {
        try {
            const sessionData = {
                id: user.id,
                name: user.name,
                email: user.email,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('vitamonitor_session', JSON.stringify(sessionData));
        } catch (error) {
            console.error('Error al guardar sesión:', error);
        }
    }

    /**
     * Obtiene la sesión activa si existe
     * @returns {Object|null} - Datos de sesión o null
     */
    function getActiveSession() {
        try {
            const session = localStorage.getItem('vitamonitor_session');
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error al obtener sesión:', error);
            return null;
        }
    }

    /**
     * Cierra la sesión activa
     */
    function clearSession() {
        try {
            localStorage.removeItem('vitamonitor_session');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }

    // ============================================
    // NAVEGACIÓN
    // ============================================

    /**
     * Muestra el dashboard y oculta pantallas de auth
     * @param {Object} user - Datos del usuario
     */
    function showDashboard(user) {
        const loginScreen = document.getElementById('login-screen');
        const registerScreen = document.getElementById('register-screen');
        const dashboard = document.getElementById('dashboard');

        // Ocultar pantallas de autenticación
        if (loginScreen) loginScreen.classList.add('hidden');
        if (registerScreen) registerScreen.classList.add('hidden');

        // Mostrar dashboard
        if (dashboard) {
            dashboard.classList.remove('hidden');
            // Actualizar info del usuario en el header
            updateUserInfo(user);
        }

        // Iniciar el monitoreo de signos vitales
        if (window.VitaMonitor && window.VitaMonitor.startMonitoring) {
            window.VitaMonitor.startMonitoring();
        }
    }

    /**
     * Muestra la pantalla de login
     */
    function showLoginScreen() {
        const loginScreen = document.getElementById('login-screen');
        const registerScreen = document.getElementById('register-screen');
        const dashboard = document.getElementById('dashboard');

        if (dashboard) dashboard.classList.add('hidden');
        if (registerScreen) registerScreen.classList.add('hidden');
        if (loginScreen) loginScreen.classList.remove('hidden');

        // Limpiar formulario
        if (loginForm) loginForm.reset();
        hideLoginError();
    }

    /**
     * Muestra la pantalla de registro
     */
    function showRegisterScreen() {
        const loginScreen = document.getElementById('login-screen');
        const registerScreen = document.getElementById('register-screen');

        if (loginScreen) loginScreen.classList.add('hidden');
        if (registerScreen) registerScreen.classList.remove('hidden');
    }

    /**
     * Actualiza la información del usuario en el header
     * @param {Object} user - Datos del usuario
     */
    function updateUserInfo(user) {
        const userNameEl = document.getElementById('user-name');
        const userEmailEl = document.getElementById('user-email');

        if (userNameEl) userNameEl.textContent = user.name || 'Usuario';
        if (userEmailEl) userEmailEl.textContent = user.email || '';
    }

    // ============================================
    // MANEJO DE ERRORES
    // ============================================

    /**
     * Muestra el banner de error de login
     */
    function showLoginError() {
        if (loginErrorBanner) {
            loginErrorBanner.classList.add('visible');
        }
    }

    /**
     * Oculta el banner de error de login
     */
    function hideLoginError() {
        if (loginErrorBanner) {
            loginErrorBanner.classList.remove('visible');
        }
    }

    // ============================================
    // MANEJADORES DE EVENTOS
    // ============================================

    /**
     * Maneja el envío del formulario de login
     * @param {Event} event - Evento de submit
     */
    function handleLoginSubmit(event) {
        event.preventDefault();
        hideLoginError();

        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value;

        // Validar campos no vacíos
        if (!email || !password) {
            showLoginError();
            return;
        }

        // Autenticar usuario
        const user = authenticateUser(email, password);

        if (user) {
            // Login exitoso
            setActiveSession(user);
            showDashboard(user);
            showToast(`Bienvenido, ${user.name}`, 'success');
        } else {
            // Credenciales incorrectas
            showLoginError();
            // Limpiar contraseña para reintento
            if (loginPasswordInput) loginPasswordInput.value = '';
            if (loginPasswordInput) loginPasswordInput.focus();
        }
    }

    /**
     * Maneja el cierre de sesión
     */
    function handleLogout() {
        clearSession();

        // Detener monitoreo
        if (window.VitaMonitor && window.VitaMonitor.stopMonitoring) {
            window.VitaMonitor.stopMonitoring();
        }

        showLoginScreen();
        showToast('Sesión cerrada correctamente', 'info');
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    // Evento de login
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // Navegación a registro
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(event) {
            event.preventDefault();
            showRegisterScreen();
        });
    }

    // Cerrar sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Limpiar error al escribir
    if (loginEmailInput) {
        loginEmailInput.addEventListener('input', hideLoginError);
    }
    if (loginPasswordInput) {
        loginPasswordInput.addEventListener('input', hideLoginError);
    }

    // ============================================
    // AUTO-LOGIN (sesión persistente)
    // ============================================

    /**
     * Verifica si hay una sesión activa al cargar la página
     */
    function checkActiveSession() {
        const session = getActiveSession();
        if (session) {
            // Restaurar sesión y mostrar dashboard
            showDashboard(session);
        }
    }

    // Verificar sesión al cargar (con pequeño delay para asegurar que DOM esté listo)
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(checkActiveSession, 100);
    });

    // Exponer funciones útiles globalmente
    window.VitaMonitorAuth = {
        showLoginScreen,
        showDashboard,
        getActiveSession,
        clearSession
    };

})();