/**
 * ============================================
 * HU02 - VISUALIZAR SpO₂ (Saturación de Oxígeno)
 * ============================================
 * Maneja la visualización de SpO₂ en tiempo real,
 * actualización automática y generación de alertas
 * cuando el valor está fuera de rango.
 * 
 * Criterios de aceptación:
 * - Mostrar SpO₂ en tiempo real
 * - Actualización automática
 * - Si SpO₂ < 50: generar alerta
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURACIÓN
    // ============================================

    const SPO2_CONFIG = {
        MIN_NORMAL: 95,
        MAX_NORMAL: 100,
        MIN_WARNING: 90,
        MIN_CRITICAL: 50,
        UPDATE_INTERVAL: 2500, // ms entre actualizaciones
        HISTORY_LENGTH: 20      // Cantidad de valores históricos
    };

    // ============================================
    // ESTADO
    // ============================================

    let currentSpO2 = 98;
    let spo2History = [];
    let spo2Interval = null;

    // ============================================
    // REFERENCIAS DOM
    // ============================================

    const spo2ValueEl = document.getElementById('spo2-value');
    const spo2StatusEl = document.getElementById('spo2-status');
    const spo2CardEl = document.getElementById('spo2-card');
    const spo2ChartEl = document.getElementById('spo2-chart');

    // ============================================
    // SIMULACIÓN DE SENSOR SpO₂
    // ============================================

    /**
     * Genera un valor SpO₂ aleatorio realista
     * Normalmente entre 95-100%, con baja probabilidad de valores críticos
     * @returns {number} - Valor SpO₂ simulado
     */
    function simulateSpO2Reading() {
        // 95% de probabilidad: valor normal (90-100%)
        // 5% de probabilidad: valor crítico para demostración
        const isCritical = Math.random() < 0.05;

        if (isCritical) {
            // Generar valor crítico (muy bajo)
            return Math.floor(Math.random() * 45) + 5; // 5-50%
        }

        // Valor normal con pequeña variación
        const baseSpO2 = 98;
        const variation = (Math.random() - 0.5) * 6; // ±3%
        const dip = Math.random() < 0.15 ? -(Math.random() * 5) : 0; // Ocasional pequeña caída

        let spo2 = Math.round((baseSpO2 + variation + dip) * 10) / 10;

        // Asegurar que esté en rango razonable si no es crítico
        spo2 = Math.max(55, Math.min(100, spo2));

        return spo2;
    }

    // ============================================
    // ACTUALIZACIÓN DE UI
    // ============================================

    /**
     * Determina el estado del SpO₂ según su valor
     * @param {number} spo2 - Valor de SpO₂
     * @returns {string} - Estado: 'normal', 'warning', 'danger'
     */
    function getSpO2Status(spo2) {
        if (spo2 < SPO2_CONFIG.MIN_CRITICAL) {
            return 'danger';
        }
        if (spo2 < SPO2_CONFIG.MIN_WARNING) {
            return 'warning';
        }
        return 'normal';
    }

    /**
     * Obtiene el texto descriptivo del estado
     * @param {string} status - Estado del SpO₂
     * @returns {string} - Texto descriptivo
     */
    function getSpO2StatusText(status) {
        const texts = {
            normal: 'Normal',
            warning: 'Bajo',
            danger: '¡Crítico!'
        };
        return texts[status] || 'Desconocido';
    }

    /**
     * Actualiza la tarjeta de SpO₂ en el DOM
     * @param {number} spo2 - Valor actual de SpO₂
     */
    function updateSpO2Display(spo2) {
        if (!spo2ValueEl) return;

        // Animar el cambio de valor
        animateValueChange(spo2ValueEl, parseFloat(spo2ValueEl.textContent) || 98, spo2, 500);

        // Actualizar estado visual
        const status = getSpO2Status(spo2);
        updateSpO2StatusDisplay(status);

        // Actualizar historial y mini chart
        addSpO2ToHistory(spo2);
        updateSpO2MiniChart();
    }

    /**
     * Actualiza el indicador de estado visual
     * @param {string} status - Estado actual
     */
    function updateSpO2StatusDisplay(status) {
        if (!spo2StatusEl || !spo2CardEl) return;

        const badge = spo2StatusEl.querySelector('.status-badge');
        if (badge) {
            badge.className = `status-badge ${status}`;
            badge.textContent = getSpO2StatusText(status);
        }

        // Actualizar clase de la tarjeta para el borde superior
        spo2CardEl.classList.remove('normal', 'warning', 'danger');
        spo2CardEl.classList.add(status);
    }

    /**
     * Agrega un valor al historial de SpO₂
     * @param {number} spo2 - Valor a agregar
     */
    function addSpO2ToHistory(spo2) {
        spo2History.push({
            value: spo2,
            timestamp: Date.now()
        });

        // Mantener solo los últimos N valores
        if (spo2History.length > SPO2_CONFIG.HISTORY_LENGTH) {
            spo2History.shift();
        }
    }

    /**
     * Actualiza el mini chart de barras en la tarjeta SpO₂
     */
    function updateSpO2MiniChart() {
        if (!spo2ChartEl) return;

        // Limpiar chart actual
        spo2ChartEl.innerHTML = '';

        // Crear barras para cada valor histórico
        spo2History.forEach((data) => {
            const bar = document.createElement('div');
            bar.className = 'mini-bar';

            // Altura proporcional al valor (escala: 50-100% -> 10%-100%)
            const heightPercent = Math.max(10, Math.min(100, 
                ((data.value - 50) / (100 - 50)) * 100
            ));

            bar.style.height = `${heightPercent}%`;

            // Color según estado
            const status = getSpO2Status(data.value);
            const colors = {
                normal: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444'
            };
            bar.style.backgroundColor = colors[status];

            spo2ChartEl.appendChild(bar);
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

            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = (start + (end - start) * easeProgress).toFixed(1);

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
     * Obtiene el valor actual de SpO₂
     * @returns {number} - SpO₂ actual
     */
    function getCurrentSpO2() {
        return currentSpO2;
    }

    /**
     * Obtiene el historial de SpO₂
     * @returns {Array} - Array de objetos {value, timestamp}
     */
    function getSpO2History() {
        return [...spo2History];
    }

    /**
     * Actualiza el valor de SpO₂ (usado por el monitoreo continuo)
     * @param {number} spo2 - Nuevo valor de SpO₂
     */
    function setSpO2(spo2) {
        currentSpO2 = spo2;
        updateSpO2Display(spo2);
    }

    /**
     * Genera y actualiza un nuevo valor SpO₂
     * @returns {number} - Nuevo valor generado
     */
    function generateNewSpO2() {
        const newSpO2 = simulateSpO2Reading();
        setSpO2(newSpO2);
        return newSpO2;
    }

    /**
     * Inicia la simulación automática de SpO₂
     * @param {number} interval - Intervalo en ms (opcional)
     */
    function startSpO2Simulation(interval) {
        const updateInterval = interval || SPO2_CONFIG.UPDATE_INTERVAL;

        // Generar valor inicial
        generateNewSpO2();

        // Iniciar intervalo
        if (spo2Interval) clearInterval(spo2Interval);
        spo2Interval = setInterval(generateNewSpO2, updateInterval);
    }

    /**
     * Detiene la simulación automática de SpO₂
     */
    function stopSpO2Simulation() {
        if (spo2Interval) {
            clearInterval(spo2Interval);
            spo2Interval = null;
        }
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    // Inicializar mini chart vacío
    if (spo2ChartEl) {
        for (let i = 0; i < 10; i++) {
            const bar = document.createElement('div');
            bar.className = 'mini-bar';
            bar.style.height = '50%';
            bar.style.backgroundColor = '#334155';
            spo2ChartEl.appendChild(bar);
        }
    }

    // Exponer API global
    window.VitaMonitorSpO2 = {
        getCurrentSpO2,
        getSpO2History,
        setSpO2,
        generateNewSpO2,
        startSpO2Simulation,
        stopSpO2Simulation,
        getSpO2Status,
        CONFIG: SPO2_CONFIG
    };

})();