/**
 * ============================================
 * HU45 - REGISTRO DE USUARIO
 * ============================================
 * Maneja el formulario de registro, validación de datos
 * y almacenamiento simulado en localStorage.
 * 
 * Criterios de aceptación:
 * - Registrar nombre, correo y contraseña
 * - Validar campos vacíos
 * - Validar formato de correo
 * - Guardar usuario en localStorage
 * - Permitir luego iniciar sesión
 */

(function() {
    'use strict';

    // Referencias DOM
    const registerForm = document.getElementById('register-form');
    const regNameInput = document.getElementById('reg-name');
    const regEmailInput = document.getElementById('reg-email');
    const regPasswordInput = document.getElementById('reg-password');
    const showLoginLink = document.getElementById('show-login');

    // Referencias a mensajes de error
    const nameError = document.getElementById('reg-name-error');
    const emailError = document.getElementById('reg-email-error');
    const passwordError = document.getElementById('reg-password-error');

    // ============================================
    // VALIDACIONES
    // ============================================

    /**
     * Valida que el campo no esté vacío
     * @param {string} value - Valor a validar
     * @returns {boolean} - true si no está vacío
     */
    function isNotEmpty(value) {
        return value.trim().length > 0;
    }

    /**
     * Valida formato de correo electrónico
     * @param {string} email - Correo a validar
     * @returns {boolean} - true si el formato es válido
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    /**
     * Valida longitud mínima de contraseña
     * @param {string} password - Contraseña a validar
     * @returns {boolean} - true si cumple longitud mínima
     */
    function isValidPassword(password) {
        return password.length >= 6;
    }

    /**
     * Muestra mensaje de error en un campo específico
     * @param {HTMLElement} input - Input con error
     * @param {HTMLElement} errorElement - Elemento donde mostrar error
     * @param {string} message - Mensaje de error
     */
    function showFieldError(input, errorElement, message) {
        input.classList.add('error');
        errorElement.textContent = message;
    }

    /**
     * Limpia el estado de error de un campo
     * @param {HTMLElement} input - Input a limpiar
     * @param {HTMLElement} errorElement - Elemento de error a limpiar
     */
    function clearFieldError(input, errorElement) {
        input.classList.remove('error');
        errorElement.textContent = '';
    }

    /**
     * Limpia todos los errores del formulario
     */
    function clearAllErrors() {
        clearFieldError(regNameInput, nameError);
        clearFieldError(regEmailInput, emailError);
        clearFieldError(regPasswordInput, passwordError);
    }

    // ============================================
    // ALMACENAMIENTO
    // ============================================

    /**
     * Verifica si un usuario ya existe por correo
     * @param {string} email - Correo a buscar
     * @returns {boolean} - true si ya existe
     */
    function userExists(email) {
        try {
            const users = JSON.parse(localStorage.getItem('vitamonitor_users')) || [];
            return users.some(user => user.email === email.trim().toLowerCase());
        } catch (error) {
            console.error('Error al verificar usuario existente:', error);
            return false;
        }
    }

    /**
     * Guarda un nuevo usuario en localStorage
     * @param {Object} userData - Datos del usuario
     * @returns {boolean} - true si se guardó correctamente
     */
    function saveUser(userData) {
        try {
            const users = JSON.parse(localStorage.getItem('vitamonitor_users')) || [];

            // Agregar nuevo usuario con ID y fecha de registro
            const newUser = {
                id: Date.now().toString(),
                name: userData.name.trim(),
                email: userData.email.trim().toLowerCase(),
                password: userData.password, // En producción: usar hash
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem('vitamonitor_users', JSON.stringify(users));

            return true;
        } catch (error) {
            console.error('Error al guardar usuario:', error);
            return false;
        }
    }

    // ============================================
    // NAVEGACIÓN ENTRE PANTALLAS
    // ============================================

    /**
     * Muestra la pantalla de login y oculta registro
     */
    function showLoginScreen() {
        const registerScreen = document.getElementById('register-screen');
        const loginScreen = document.getElementById('login-screen');

        registerScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');

        // Limpiar formulario de registro
        registerForm.reset();
        clearAllErrors();
    }

    // ============================================
    // MANEJADORES DE EVENTOS
    // ============================================

    /**
     * Maneja el envío del formulario de registro
     * @param {Event} event - Evento de submit
     */
    function handleRegisterSubmit(event) {
        event.preventDefault();
        clearAllErrors();

        const name = regNameInput.value;
        const email = regEmailInput.value;
        const password = regPasswordInput.value;

        let hasErrors = false;

        // Validar nombre
        if (!isNotEmpty(name)) {
            showFieldError(regNameInput, nameError, 'El nombre es obligatorio');
            hasErrors = true;
        }

        // Validar correo
        if (!isNotEmpty(email)) {
            showFieldError(regEmailInput, emailError, 'El correo es obligatorio');
            hasErrors = true;
        } else if (!isValidEmail(email)) {
            showFieldError(regEmailInput, emailError, 'Ingresa un correo válido');
            hasErrors = true;
        } else if (userExists(email)) {
            showFieldError(regEmailInput, emailError, 'Este correo ya está registrado');
            hasErrors = true;
        }

        // Validar contraseña
        if (!isNotEmpty(password)) {
            showFieldError(regPasswordInput, passwordError, 'La contraseña es obligatoria');
            hasErrors = true;
        } else if (!isValidPassword(password)) {
            showFieldError(regPasswordInput, passwordError, 'Mínimo 6 caracteres');
            hasErrors = true;
        }

        // Si hay errores, detener
        if (hasErrors) {
            return;
        }

        // Guardar usuario
        const success = saveUser({ name, email, password });

        if (success) {
            // Mostrar mensaje de éxito y redirigir a login
            showToast('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
            setTimeout(() => {
                showLoginScreen();
            }, 1500);
        } else {
            showToast('Error al registrar. Intenta de nuevo.', 'error');
        }
    }

    /**
     * Maneja la visualización de contraseña
     * @param {Event} event - Evento de click
     */
    function handleTogglePassword(event) {
        const button = event.currentTarget;
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    // Evento de registro
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }

    // Navegación a login
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(event) {
            event.preventDefault();
            showLoginScreen();
        });
    }

    // Toggle de contraseña
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', handleTogglePassword);
    });

    // Limpiar errores al escribir
    [regNameInput, regEmailInput, regPasswordInput].forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                this.classList.remove('error');
                const errorEl = document.getElementById(this.id + '-error');
                if (errorEl) errorEl.textContent = '';
            });
        }
    });

    // ============================================
    // FUNCIÓN GLOBAL DE TOAST (compartida)
    // ============================================
    window.showToast = function(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            info: 'fa-circle-info'
        };

        toast.innerHTML = `
            <i class="fa-solid ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(30px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

})();
