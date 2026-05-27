/**
 * ============================================
 * HU05 - ALERTA SpO₂ (Oxígeno Crítico)
 * ============================================
 * Detecta cuando la SpO₂ es menor a 50% y genera
 * una alarma inmediata con simulación de envío al servidor.
 * 
 * Criterios de aceptación:
 * - Detectar SpO₂ bajo (< 50)
 * - Generar alarma inmediata
 * - Simular envío al servidor
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURACIÓN
    // ============================================

    const ALERT_CONFIG = {
        CRITICAL_THRESHOLD: 50,
        COOLDOWN_MS: 10000,  // Tiempo mínimo entre alertas
        SIMULATE_SERVER_URL: 'https://api.vitamonitor.simulated/alerts/spo2'
    };

    // ============================================
    // ESTADO
    // ============================================

    let lastAlertTime = 0;
    let isAlertActive = false;

    // ============================================
    // REFERENCIAS DOM (comparte modal con HU04)
    // ============================================

    const alarmModal = document.getElementById('alarm-modal');
    const alarmMessage = document.getElementById('alarm-message');
    const alarmDetails = document.getElementById('alarm-details');
    const dismissAlarmBtn = document.getElementById('dismiss-alarm');
    const simulateSendBtn = document.getElementById('simulate-send');

    // ============================================
    // DETECCIÓN DE SpO₂ CRÍTICO
    // ============================================

    /**
     * Verifica si la SpO₂ está en rango crítico
     * @param {number} spo2 - Valor de SpO₂ a verificar
     * @returns {boolean} - true si está en rango crítico
     */
    function isCriticalSpO2(spo2) {
        return spo2 < ALERT_CONFIG.CRITICAL_THRESHOLD;
    }

    /**
     * Verifica si ha pasado suficiente tiempo desde la última alerta
     * @returns {boolean} - true si se puede generar nueva alerta
     */
    function canTriggerAlert() {
        const now = Date.now();
        return (now - lastAlertTime) > ALERT_CONFIG.COOLDOWN_MS;
    }

    /**
     * Determina el nivel de gravedad de la hipoxemia
     * @param {number} spo2 - Valor de SpO₂
     * @returns {string} - Descripción de la gravedad
     */
    function getHypoxemiaLevel(spo2) {
        if (spo2 < 30) return 'Hipoxemia severa';
        if (spo2 < 40) return 'Hipoxemia grave';
        return 'Hipoxemia crítica';
    }

    // ============================================
    // ACTIVACIÓN DE ALERTA
    // ============================================

    /**
     * Activa la alerta visual de emergencia por SpO₂
     * @param {number} spo2 - Valor crítico de SpO₂
     */
    function triggerSpO2Alert(spo2) {
        if (isAlertActive) return;

        isAlertActive = true;
        lastAlertTime = Date.now();

        const hypoxemiaLevel = getHypoxemiaLevel(spo2);

        // Actualizar contenido del modal
        if (alarmMessage) {
            alarmMessage.textContent = `¡${hypoxemiaLevel} detectada! Nivel crítico de oxigenación en sangre.`;
        }

        if (alarmDetails) {
            alarmDetails.innerHTML = `
                <span class="alarm-vital">SpO₂</span>
                <span class="alarm-value">${spo2.toFixed(1)}%</span>
            `;
        }

        // Mostrar modal
        if (alarmModal) {
            alarmModal.classList.remove('hidden');
        }

        // Efecto visual de alarma
        playAlertEffect();

        // Enviar notificación al panel (HU06)
        sendSpO2Notification(spo2, hypoxemiaLevel);

        console.warn(`[ALERTA SpO₂] ${hypoxemiaLevel} detectada: ${spo2}%`);
    }

    /**
     * Efecto visual de alerta (parpadeo del body)
     */
    function playAlertEffect() {
        let flashCount = 0;
        const maxFlashes = 6;

        const flashInterval = setInterval(() => {
            document.body.style.boxShadow = flashCount % 2 === 0 
                ? 'inset 0 0 50px rgba(59, 130, 246, 0.3)' 
                : 'none';

            flashCount++;
            if (flashCount >= maxFlashes) {
                clearInterval(flashInterval);
                document.body.style.boxShadow = 'none';
            }
        }, 300);
    }

    /**
     * Cierra el modal de alerta
     */
    function dismissAlert() {
        isAlertActive = false;

        if (alarmModal) {
            alarmModal.classList.add('hidden');
        }
    }

    // ============================================
    // NOTIFICACIONES (Integración con HU06)
    // ============================================

    /**
     * Envía una notificación de alerta SpO₂ al panel
     * @param {number} spo2 - Valor crítico
     * @param {string} level - Nivel de hipoxemia
     */
    function sendSpO2Notification(spo2, level) {
        if (window.VitaMonitorNotifications && window.VitaMonitorNotifications.addNotification) {
            window.VitaMonitorNotifications.addNotification({
                type: 'danger',
                title: `🫁 ${level}`,
                description: `SpO₂ detectado: <span class="notification-value">${spo2.toFixed(1)}%</span>`,
                vital: 'SpO₂',
                value: spo2
            });
        }
    }

    // ============================================
    // SIMULACIÓN DE ENVÍO AL SERVIDOR
    // ============================================

    /**
     * Simula el envío de la alerta SpO₂ a un servidor
     */
    function simulateServerSend() {
        simulateSendBtn.disabled = true;
        simulateSendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

        setTimeout(() => {
            simulateSendBtn.disabled = false;
            simulateSendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Notificar Familiares';

            showToast('Alerta de oxígeno enviada a contactos de emergencia', 'success');

            saveAlertLog();
            dismissAlert();
        }, 1500);
    }

    /**
     * Guarda un registro de la alerta en localStorage
     */
    function saveAlertLog() {
        try {
            const alerts = JSON.parse(localStorage.getItem('vitamonitor_alerts')) || [];
            alerts.push({
                type: 'SPO2_CRITICO',
                timestamp: new Date().toISOString(),
                value: alarmDetails ? alarmDetails.querySelector('.alarm-value')?.textContent : 'N/A',
                simulated: true
            });
            localStorage.setItem('vitamonitor_alerts', JSON.stringify(alerts));
        } catch (error) {
            console.error('Error al guardar log de alerta SpO₂:', error);
        }
    }

    // ============================================
    // API PÚBLICA - FUNCIÓN PRINCIPAL
    // ============================================

    /**
     * Función principal que verifica si la SpO₂ es crítica
     * Es llamada por el módulo de monitoreo continuo (HU03)
     * @param {number} spo2 - Valor actual de SpO₂
     */
    function checkCriticalSpO2(spo2) {
        if (!isCriticalSpO2(spo2)) return;
        if (!canTriggerAlert()) return;

        triggerSpO2Alert(spo2);
    }

    // ============================================
    // MANEJADORES DE EVENTOS
    // ============================================

    // Comparte los mismos botones que HU04
    if (dismissAlarmBtn) {
        dismissAlarmBtn.addEventListener('click', dismissAlert);
    }

    if (simulateSendBtn) {
        simulateSendBtn.addEventListener('click', simulateServerSend);
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    window.VitaMonitorAlarmSpO2 = {
        checkCriticalSpO2,
        triggerSpO2Alert,
        dismissAlert,
        isAlertActive: () => isAlertActive,
        CONFIG: ALERT_CONFIG
    };

})();