/**
 * ============================================
 * HU45 - REGISTRO DE USUARIO
 * ============================================
 * Módulo encargado del registro de nuevos usuarios.
 * Valida campos, verifica formato de correo y almacena
 * credenciales en localStorage para simular backend.
 */

(function() {
    'use strict';

    // Referencias DOM
    const registerForm = document.getElementById('registerForm');
    const regName = document.getElementById('regName');
    const regEmail = document.getElementById('regEmail');
    const regPassword = document.getElementById('regPassword');
    
    // Mensajes de error
    const regNameError = document.getElementById('regNameError');
    const regEmailError = document.getElementById('regEmailError');
    const regPasswordError = document.getElementById('regPasswordError');
    const registerSuccess = document.getElementById('registerSuccess');
    
    // Navegación
    const linkToLogin = document.getElementById('linkToLogin');

    /**
     * Expresión regular para validar formato de correo electrónico
     */
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /**
     * Limpia todos los mensajes de error y estilos de validación
     */
    function clearErrors() {
        [regName, regEmail, regPassword].forEach(input => input.classList.remove('error'));
        [regNameError, regEmailError, regPasswordError].forEach(el => el.textContent = '');
        registerSuccess.classList.add('hidden');
    }

    /**
     * Muestra mensaje de error en un campo específico
     * @param {HTMLElement} input - Campo de entrada
     * @param {HTMLElement} errorEl - Elemento donde mostrar el error
     * @param {string} message - Mensaje de error
     */
    function showError(input, errorEl, message) {
        input.classList.add('error');
        errorEl.textContent = message;
    }

    /**
     * Valida todos los campos del formulario de registro
     * @returns {boolean} - true si todos los campos son válidos
     */
    function validateForm() {
        clearErrors();
        let isValid = true;

        // Validar nombre: no vacío y mínimo 2 caracteres
        const nameValue = regName.value.trim();
        if (!nameValue) {
            showError(regName, regNameError, 'El nombre es obligatorio');
            isValid = false;
        } else if (nameValue.length < 2) {
            showError(regName, regNameError, 'El nombre debe tener al menos 2 caracteres');
            isValid = false;
        }

        // Validar correo: no vacío y formato correcto
        const emailValue = regEmail.value.trim();
        if (!emailValue) {
            showError(regEmail, regEmailError, 'El correo es obligatorio');
            isValid = false;
        } else if (!EMAIL_REGEX.test(emailValue)) {
            showError(regEmail, regEmailError, 'Formato de correo inválido');
            isValid = false;
        }

        // Validar contraseña: no vacía y mínimo 6 caracteres
        const passwordValue = regPassword.value;
        if (!passwordValue) {
            showError(regPassword, regPasswordError, 'La contraseña es obligatoria');
            isValid = false;
        } else if (passwordValue.length < 6) {
            showError(regPassword, regPasswordError, 'La contraseña debe tener al menos 6 caracteres');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Verifica si el correo ya está registrado en localStorage
     * @param {string} email - Correo a verificar
     * @returns {boolean} - true si ya existe
     */
    function emailExists(email) {
        const users = JSON.parse(localStorage.getItem('hm_users') || '[]');
        return users.some(user => user.email.toLowerCase() === email.toLowerCase());
    }

    /**
     * Guarda un nuevo usuario en localStorage
     * @param {Object} userData - Datos del usuario {name, email, password}
     */
    function saveUser(userData) {
        const users = JSON.parse(localStorage.getItem('hm_users') || '[]');
        users.push(userData);
        localStorage.setItem('hm_users', JSON.stringify(users));
    }

    /**
     * Manejador del envío del formulario de registro
     */
    function handleRegister(event) {
        event.preventDefault();

        if (!validateForm()) return;

        const userData = {
            name: regName.value.trim(),
            email: regEmail.value.trim().toLowerCase(),
            password: regPassword.value,
            createdAt: new Date().toISOString()
        };

        // Verificar si el correo ya está registrado
        if (emailExists(userData.email)) {
            showError(regEmail, regEmailError, 'Este correo ya está registrado');
            return;
        }

        // Guardar usuario y mostrar éxito
        try {
            saveUser(userData);
            registerForm.reset();
            registerSuccess.classList.remove('hidden');
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                document.getElementById('sectionRegister').classList.add('hidden');
                document.getElementById('sectionLogin').classList.remove('hidden');
                registerSuccess.classList.add('hidden');
            }, 2000);
        } catch (error) {
            console.error('Error al guardar usuario:', error);
            alert('Ocurrió un error al registrar. Intenta de nuevo.');
        }
    }

    // Event Listeners
    registerForm.addEventListener('submit', handleRegister);

    // Limpiar errores al escribir
    [regName, regEmail, regPassword].forEach(input => {
        input.addEventListener('input', clearErrors);
    });

    // Navegación a login
    linkToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('sectionRegister').classList.add('hidden');
        document.getElementById('sectionLogin').classList.remove('hidden');
        clearErrors();
    });

})();