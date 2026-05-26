/**
 * ============================================
 * HU01 - VISUALIZAR BPM (Frecuencia Cardíaca).
 * ============================================
 * Maneja la visualización del BPM en tiempo real,
 * actualización automática y generación de alertas
 * cuando el valor está fuera de rango.
 * 
 * Criterios de aceptación:
 * - Mostrar BPM en tiempo real
 * - Actualización automática
 * - NO recargar página
 * - Si BPM < 30 o BPM > 220: generar alerta
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURACIÓN
    // ============================================

    const BPM_CONFIG = {
        MIN_NORMAL: 60,
        MAX_NORMAL: 100,
        MIN_WARNING: 50,
        MAX_WARNING: 120,
        MIN_CRITICAL: 30,
        MAX_CRITICAL: 220,
        UPDATE_INTERVAL: 2000, // ms entre actualizaciones
        HISTORY_LENGTH: 20      // Cantidad de valores históricos
    };

    // ============================================
    // ESTADO
    // ============================================

    let currentBPM = 72;
    let bpmHistory = [];
    let bpmInterval = null;

    // ============================================
    // REFERENCIAS DOM
    // ============================================

    const bpmValueEl = document.getElementById('bpm-value');
    const bpmStatusEl = document.getElementById('bpm-status');
    const bpmCardEl = document.getElementById('bpm-card');
    const bpmChartEl = document.getElementById('bpm-chart');

    // ============================================
    // SIMULACIÓN DE SENSOR BPM
    // ============================================

    /**
     * Genera un valor BPM aleatorio realista
     * Basado en distribución normal centrada en 72 BPM
     * Con probabilidad baja de generar valores críticos para demo
     * @returns {number} - Valor BPM simulado
     */
    function simulateBPMReading() {
        // 95% de probabilidad: valor normal (50-130)
        // 5% de probabilidad: valor crítico para demostración
        const isCritical = Math.random() < 0.05;

        if (isCritical) {
            // Generar valor crítico (muy bajo o muy alto)
            const isTooLow = Math.random() < 0.5;
            if (isTooLow) {
                return Math.floor(Math.random() * 25) + 5; // 5-30 BPM
            } else {
                return Math.floor(Math.random() * 50) + 221; // 221-270 BPM
            }
        }

        // Valor normal con variación realista
        const baseBPM = 72;
        const variation = (Math.random() - 0.5) * 30; // ±15 BPM
        const activitySpike = Math.random() < 0.1 ? (Math.random() * 20) : 0;

        let bpm = Math.round(baseBPM + variation + activitySpike);

        // Asegurar que esté en rango razonable si no es crítico
        bpm = Math.max(35, Math.min(210, bpm));

        return bpm;
    }

    // ============================================
    // ACTUALIZACIÓN DE UI
    // ============================================

    /**
     * Determina el estado del BPM según su valor
     * @param {number} bpm - Valor de BPM
     * @returns {string} - Estado: 'normal', 'warning', 'danger'
     */
    function getBPMStatus(bpm) {
        if (bpm < BPM_CONFIG.MIN_CRITICAL || bpm > BPM_CONFIG.MAX_CRITICAL) {
            return 'danger';
        }
        if (bpm < BPM_CONFIG.MIN_WARNING || bpm > BPM_CONFIG.MAX_WARNING) {
            return 'warning';
        }
        return 'normal';
    }

    /**
     * Obtiene el texto descriptivo del estado
     * @param {string} status - Estado del BPM
     * @returns {string} - Texto descriptivo
     */
    function getBPMStatusText(status) {
        const texts = {
            normal: 'Normal',
            warning: 'Advertencia',
            danger: '¡Emergencia!'
        };
        return texts[status] || 'Desconocido';
    }

    /**
     * Actualiza la tarjeta de BPM en el DOM
     * @param {number} bpm - Valor actual de BPM
     */
    function updateBPMDisplay(bpm) {
        if (!bpmValueEl) return;

        // Animar el cambio de valor
        animateValueChange(bpmValueEl, parseInt(bpmValueEl.textContent) || 0, bpm, 500);

        // Actualizar estado visual
        const status = getBPMStatus(bpm);
        updateBPMStatusDisplay(status);

        // Actualizar historial y mini chart
        addBPMToHistory(bpm);
        updateBPMMiniChart();
    }

    /**
     * Actualiza el indicador de estado visual
     * @param {string} status - Estado actual
     */
    function updateBPMStatusDisplay(status) {
        if (!bpmStatusEl || !bpmCardEl) return;

        const badge = bpmStatusEl.querySelector('.status-badge');
        if (badge) {
            badge.className = `status-badge ${status}`;
            badge.textContent = getBPMStatusText(status);
        }

        // Actualizar clase de la tarjeta para el borde superior
        bpmCardEl.classList.remove('normal', 'warning', 'danger');
        bpmCardEl.classList.add(status);
    }

    /**
     * Agrega un valor al historial de BPM
     * @param {number} bpm - Valor a agregar
     */
    function addBPMToHistory(bpm) {
        bpmHistory.push({
            value: bpm,
            timestamp: Date.now()
        });

        // Mantener solo los últimos N valores
        if (bpmHistory.length > BPM_CONFIG.HISTORY_LENGTH) {
            bpmHistory.shift();
        }
    }

    /**
     * Actualiza el mini chart de barras en la tarjeta BPM
     */
    function updateBPMMiniChart() {
        if (!bpmChartEl) return;

        // Limpiar chart actual
        bpmChartEl.innerHTML = '';

        // Crear barras para cada valor histórico
        bpmHistory.forEach((data, index) => {
            const bar = document.createElement('div');
            bar.className = 'mini-bar';

            // Altura proporcional al valor (escala: 30-220 BPM -> 10%-100%)
            const heightPercent = Math.max(10, Math.min(100, 
                ((data.value - 30) / (220 - 30)) * 100
            ));

            bar.style.height = `${heightPercent}%`;

            // Color según estado
            const status = getBPMStatus(data.value);
            const colors = {
                normal: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444'
            };
            bar.style.backgroundColor = colors[status];

            bpmChartEl.appendChild(bar);
        });
    }

    /**
     * Anima el cambio de un valor numérico
     * @param {HTMLElement} element - Elemento a animar
     * @param {number} start - Valor inicial
     * @param {number} end - Valor final
     * @param {number} duration - Duración en ms
     */
    function animateValueChange(element, start, end, duration) {
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing suave
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * easeProgress);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    /**
     * Obtiene el valor actual de BPM
     * @returns {number} - BPM actual
     */
    function getCurrentBPM() {
        return currentBPM;
    }

    /**
     * Obtiene el historial de BPM
     * @returns {Array} - Array de objetos {value, timestamp}
     */
    function getBPMHistory() {
        return [...bpmHistory];
    }

    /**
     * Actualiza el valor de BPM (usado por el monitoreo continuo)
     * @param {number} bpm - Nuevo valor de BPM
     */
    function setBPM(bpm) {
        currentBPM = bpm;
        updateBPMDisplay(bpm);
    }

    /**
     * Genera y actualiza un nuevo valor BPM
     * @returns {number} - Nuevo valor generado
     */
    function generateNewBPM() {
        const newBPM = simulateBPMReading();
        setBPM(newBPM);
        return newBPM;
    }

    /**
     * Inicia la simulación automática de BPM
     * @param {number} interval - Intervalo en ms (opcional)
     */
    function startBPMSimulation(interval) {
        const updateInterval = interval || BPM_CONFIG.UPDATE_INTERVAL;

        // Generar valor inicial
        generateNewBPM();

        // Iniciar intervalo
        if (bpmInterval) clearInterval(bpmInterval);
        bpmInterval = setInterval(generateNewBPM, updateInterval);
    }

    /**
     * Detiene la simulación automática de BPM
     */
    function stopBPMSimulation() {
        if (bpmInterval) {
            clearInterval(bpmInterval);
            bpmInterval = null;
        }
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    // Inicializar mini chart vacío
    if (bpmChartEl) {
        for (let i = 0; i < 10; i++) {
            const bar = document.createElement('div');
            bar.className = 'mini-bar';
            bar.style.height = '20%';
            bar.style.backgroundColor = '#334155';
            bpmChartEl.appendChild(bar);
        }
    }

    // Exponer API global
    window.VitaMonitorBPM = {
        getCurrentBPM,
        getBPMHistory,
        setBPM,
        generateNewBPM,
        startBPMSimulation,
        stopBPMSimulation,
        getBPMStatus,
        CONFIG: BPM_CONFIG
    };

})();