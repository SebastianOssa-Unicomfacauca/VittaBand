/**
 * ============================================
 * HU04 - ALARMA BPM (Frecuencia Cardíaca Crítica)
 * ============================================
 * Detecta cuando el BPM está fuera de rango crítico
 * (menor a 30 o mayor a 220) y genera una alarma visual
 * inmediata con opción de simular notificación a familiares.
 * 
 * Criterios de aceptación:
 * - Detectar BPM crítico (< 30 o > 220)
 * - Generar alarma visual inmediata
 * - Mostrar mensaje de emergencia
 * - Simular envío al servidor
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURACIÓN
    // ============================================

    const ALARM_CONFIG = {
        MIN_CRITICAL: 30,
        MAX_CRITICAL: 220,
        COOLDOWN_MS: 10000,  // Tiempo mínimo entre alarmas del mismo tipo
        SIMULATE_SERVER_URL: 'https://api.vitamonitor.simulated/alerts/bpm'
    };

    // ============================================
    // ESTADO
    // ============================================

    let lastAlarmTime = 0;
    let isAlarmActive = false;

    // ============================================
    // REFERENCIAS DOM
    // ============================================

    const alarmModal = document.getElementById('alarm-modal');
    const alarmMessage = document.getElementById('alarm-message');
    const alarmDetails = document.getElementById('alarm-details');
    const dismissAlarmBtn = document.getElementById('dismiss-alarm');
    const simulateSendBtn = document.getElementById('simulate-send');

    // ============================================
    // DETECCIÓN DE BPM CRÍTICO
    // ============================================

    /**
     * Verifica si el BPM está en rango crítico
     * @param {number} bpm - Valor de BPM a verificar
     * @returns {boolean} - true si está en rango crítico
     */
    function isCriticalBPM(bpm) {
        return bpm < ALARM_CONFIG.MIN_CRITICAL || bpm > ALARM_CONFIG.MAX_CRITICAL;
    }

    /**
     * Verifica si ha pasado suficiente tiempo desde la última alarma
     * @returns {boolean} - true si se puede generar nueva alarma
     */
    function canTriggerAlarm() {
        const now = Date.now();
        return (now - lastAlarmTime) > ALARM_CONFIG.COOLDOWN_MS;
    }

    /**
     * Determina el tipo de emergencia BPM
     * @param {number} bpm - Valor de BPM
     * @returns {string} - Descripción de la emergencia
     */
    function getEmergencyType(bpm) {
        if (bpm < ALARM_CONFIG.MIN_CRITICAL) {
            return 'Bradicardia severa';
        }
        if (bpm > ALARM_CONFIG.MAX_CRITICAL) {
            return 'Taquicardia severa';
        }
        return 'Anomalía cardíaca';
    }

    // ============================================
    // ACTIVACIÓN DE ALARMA
    // ============================================

    /**
     * Activa la alarma visual de emergencia
     * @param {number} bpm - Valor crítico de BPM
     */
    function triggerBPMAlarm(bpm) {
        if (isAlarmActive) return;

        isAlarmActive = true;
        lastAlarmTime = Date.now();

        const emergencyType = getEmergencyType(bpm);

        // Actualizar contenido del modal
        if (alarmMessage) {
            alarmMessage.textContent = `Se ha detectado ${emergencyType}. Valor crítico de frecuencia cardíaca.`;
        }

        if (alarmDetails) {
            alarmDetails.innerHTML = `
                <span class="alarm-vital">BPM</span>
                <span class="alarm-value">${bpm}</span>
            `;
        }

        // Mostrar modal
        if (alarmModal) {
            alarmModal.classList.remove('hidden');
        }

        // Reproducir sonido de alarma (simulado visualmente)
        playAlarmEffect();

        // Enviar notificación al panel (HU06)
        sendBPMNotification(bpm, emergencyType);

        console.warn(`[ALARMA BPM] ${emergencyType} detectada: ${bpm} BPM`);
    }

    /**
     * Efecto visual de alarma (parpadeo del body)
     */
    function playAlarmEffect() {
        let flashCount = 0;
        const maxFlashes = 6;

        const flashInterval = setInterval(() => {
            document.body.style.boxShadow = flashCount % 2 === 0 
                ? 'inset 0 0 50px rgba(239, 68, 68, 0.3)' 
                : 'none';

            flashCount++;
            if (flashCount >= maxFlashes) {
                clearInterval(flashInterval);
                document.body.style.boxShadow = 'none';
            }
        }, 300);
    }

    /**
     * Cierra el modal de alarma
     */
    function dismissAlarm() {
        isAlarmActive = false;

        if (alarmModal) {
            alarmModal.classList.add('hidden');
        }
    }

    // ============================================
    // NOTIFICACIONES (Integración con HU06)
    // ============================================

    /**
     * Envía una notificación de alarma BPM al panel
     * @param {number} bpm - Valor crítico
     * @param {string} emergencyType - Tipo de emergencia
     */
    function sendBPMNotification(bpm, emergencyType) {
        if (window.VitaMonitorNotifications && window.VitaMonitorNotifications.addNotification) {
            window.VitaMonitorNotifications.addNotification({
                type: 'danger',
                title: `🚨 ${emergencyType}`,
                description: `BPM detectado: <span class="notification-value">${bpm}</span> latidos/min`,
                vital: 'BPM',
                value: bpm
            });
        }
    }

    // ============================================
    // SIMULACIÓN DE ENVÍO AL SERVIDOR
    // ============================================

    /**
     * Simula el envío de la alerta a un servidor
     * Muestra un toast de confirmación
     */
    function simulateServerSend() {
        // Simular delay de red
        simulateSendBtn.disabled = true;
        simulateSendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

        setTimeout(() => {
            simulateSendBtn.disabled = false;
            simulateSendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Notificar Familiares';

            showToast('Alerta enviada a contactos de emergencia', 'success');

            // Guardar en localStorage como registro simulado
            saveAlertLog();

            dismissAlarm();
        }, 1500);
    }

    /**
     * Guarda un registro de la alerta en localStorage
     */
    function saveAlertLog() {
        try {
            const alerts = JSON.parse(localStorage.getItem('vitamonitor_alerts')) || [];
            alerts.push({
                type: 'BPM_CRITICO',
                timestamp: new Date().toISOString(),
                value: alarmDetails ? alarmDetails.querySelector('.alarm-value')?.textContent : 'N/A',
                simulated: true
            });
            localStorage.setItem('vitamonitor_alerts', JSON.stringify(alerts));
        } catch (error) {
            console.error('Error al guardar log de alerta:', error);
        }
    }

    // ============================================
    // API PÚBLICA - FUNCIÓN PRINCIPAL
    // ============================================

    /**
     * Función principal que verifica si el BPM es crítico
     * Es llamada por el módulo de monitoreo continuo (HU03)
     * @param {number} bpm - Valor actual de BPM
     */
    function checkCriticalBPM(bpm) {
        if (!isCriticalBPM(bpm)) return;
        if (!canTriggerAlarm()) return;

        triggerBPMAlarm(bpm);
    }

    // ============================================
    // MANEJADORES DE EVENTOS
    // ============================================

    if (dismissAlarmBtn) {
        dismissAlarmBtn.addEventListener('click', dismissAlarm);
    }

    if (simulateSendBtn) {
        simulateSendBtn.addEventListener('click', simulateServerSend);
    }

    // Cerrar modal al hacer click en el overlay
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', dismissAlarm);
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    window.VitaMonitorAlarmBPM = {
        checkCriticalBPM,
        triggerBPMAlarm,
        dismissAlarm,
        isAlarmActive: () => isAlarmActive,
        CONFIG: ALARM_CONFIG
    };

})();