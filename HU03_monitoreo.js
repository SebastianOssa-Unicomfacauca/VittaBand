/**
 * ============================================
 * HU03 - MONITOREO CONTINUO
 * ============================================
 * Coordina la actualización automática de todos los signos vitales
 * (BPM y SpO₂) en intervalos cortos, mostrando cambios inmediatos
 * sin recargar la página.
 * 
 * Criterios de aceptación: holaa isa
 * - Actualizar automáticamente BPM y SpO₂
 * - Intervalos cortos
 * - Mostrar cambios inmediatamente
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURACIÓN
    // ============================================

    const MONITOR_CONFIG = {
        UPDATE_INTERVAL: 2000,      // Intervalo principal de actualización (ms)
        CHART_UPDATE_INTERVAL: 1000, // Intervalo de actualización del gráfico (ms)
        MAX_CHART_POINTS: 30,        // Máximo de puntos en el gráfico
        SIMULATION_ENABLED: true     // Habilitar simulación de sensores
    };

    // ============================================
    // ESTADO
    // ============================================

    let isMonitoring = false;
    let mainInterval = null;
    let chartInterval = null;
    let chartData = {
        bpm: [],
        spo2: [],
        timestamps: []
    };

    // ============================================
    // REFERENCIAS DOM
    // ============================================

    const lastUpdateEl = document.getElementById('last-update-time');
    const mainChartCanvas = document.getElementById('main-chart');

    // Contexto del canvas
    let chartContext = null;

    // ============================================
    // INICIALIZACIÓN DEL GRÁFICO
    // ============================================

    /**
     * Inicializa el canvas del gráfico principal
     */
    function initChart() {
        if (!mainChartCanvas) return;

        chartContext = mainChartCanvas.getContext('2d');

        // Ajustar tamaño del canvas para alta resolución
        resizeChart();

        // Escuchar cambios de tamaño
        window.addEventListener('resize', resizeChart);
    }

    /**
     * Ajusta el tamaño del canvas según el contenedor
     */
    function resizeChart() {
        if (!mainChartCanvas || !mainChartCanvas.parentElement) return;

        const container = mainChartCanvas.parentElement;
        const dpr = window.devicePixelRatio || 1;

        mainChartCanvas.width = container.clientWidth * dpr;
        mainChartCanvas.height = container.clientHeight * dpr;

        chartContext.scale(dpr, dpr);

        mainChartCanvas.style.width = container.clientWidth + 'px';
        mainChartCanvas.style.height = container.clientHeight + 'px';
    }

    // ============================================
    // ACTUALIZACIÓN DE SIGNOS VITALES
    // ============================================

    /**
     * Actualiza todos los signos vitales simultáneamente
     * Genera nuevos valores y actualiza las tarjetas
     */
    function updateAllVitals() {
        // Generar nuevos valores para BPM y SpO₂
        let newBPM = 72;
        let newSpO2 = 98;

        if (window.VitaMonitorBPM && window.VitaMonitorBPM.generateNewBPM) {
            newBPM = window.VitaMonitorBPM.generateNewBPM();
        }

        if (window.VitaMonitorSpO2 && window.VitaMonitorSpO2.generateNewSpO2) {
            newSpO2 = window.VitaMonitorSpO2.generateNewSpO2();
        }

        // Actualizar timestamp
        updateLastUpdateTime();

        // Agregar datos al gráfico
        addChartData(newBPM, newSpO2);

        // Verificar alarmas (delegado a HU04 y HU05)
        checkVitalAlarms(newBPM, newSpO2);

        return { bpm: newBPM, spo2: newSpO2 };
    }

    /**
     * Actualiza el timestamp de última actualización
     */
    function updateLastUpdateTime() {
        if (!lastUpdateEl) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        lastUpdateEl.textContent = timeString;
    }

    /**
     * Verifica si hay alarmas que activar
     * @param {number} bpm - Valor actual de BPM
     * @param {number} spo2 - Valor actual de SpO₂
     */
    function checkVitalAlarms(bpm, spo2) {
        // Delegar a los módulos de alarmas específicos
        if (window.VitaMonitorAlarmBPM && window.VitaMonitorAlarmBPM.checkCriticalBPM) {
            window.VitaMonitorAlarmBPM.checkCriticalBPM(bpm);
        }

        if (window.VitaMonitorAlarmSpO2 && window.VitaMonitorAlarmSpO2.checkCriticalSpO2) {
            window.VitaMonitorAlarmSpO2.checkCriticalSpO2(spo2);
        }
    }

    // ============================================
    // GRÁFICO PRINCIPAL (CANVAS)
    // ============================================

    /**
     * Agrega nuevos datos al historial del gráfico
     * @param {number} bpm - Valor de BPM
     * @param {number} spo2 - Valor de SpO₂
     */
    function addChartData(bpm, spo2) {
        const now = Date.now();

        chartData.bpm.push(bpm);
        chartData.spo2.push(spo2);
        chartData.timestamps.push(now);

        // Mantener solo los últimos N puntos
        if (chartData.bpm.length > MONITOR_CONFIG.MAX_CHART_POINTS) {
            chartData.bpm.shift();
            chartData.spo2.shift();
            chartData.timestamps.shift();
        }
    }

    /**
     * Dibuja el gráfico principal en el canvas
     */
    function drawChart() {
        if (!chartContext || !mainChartCanvas) return;

        const canvas = mainChartCanvas;
        const ctx = chartContext;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        // Limpiar canvas
        ctx.clearRect(0, 0, width, height);

        // Si no hay datos suficientes, mostrar mensaje
        if (chartData.bpm.length < 2) {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Recopilando datos...', width / 2, height / 2);
            return;
        }

        // Configuración de márgenes
        const margin = { top: 20, right: 50, bottom: 30, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Dibujar grid
        drawGrid(ctx, margin, chartWidth, chartHeight);

        // Dibujar línea BPM (escala izquierda: 0-250)
        drawLine(ctx, chartData.bpm, margin, chartWidth, chartHeight, 
                 0, 250, '#ef4444', 2);

        // Dibujar línea SpO₂ (escala derecha: 0-100)
        drawLine(ctx, chartData.spo2, margin, chartWidth, chartHeight, 
                 0, 100, '#3b82f6', 2);

        // Dibujar ejes y etiquetas
        drawAxes(ctx, margin, chartWidth, chartHeight);

        // Dibujar valores actuales
        drawCurrentValues(ctx, margin, chartWidth, chartHeight);
    }

    /**
     * Dibuja el grid de fondo
     */
    function drawGrid(ctx, margin, width, height) {
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
        ctx.lineWidth = 1;

        // Líneas horizontales
        for (let i = 0; i <= 5; i++) {
            const y = margin.top + (height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(margin.left, y);
            ctx.lineTo(margin.left + width, y);
            ctx.stroke();
        }

        // Líneas verticales
        const dataCount = chartData.bpm.length;
        for (let i = 0; i < dataCount; i += Math.ceil(dataCount / 6)) {
            const x = margin.left + (width / (dataCount - 1)) * i;
            ctx.beginPath();
            ctx.moveTo(x, margin.top);
            ctx.lineTo(x, margin.top + height);
            ctx.stroke();
        }
    }

    /**
     * Dibuja una línea de datos en el gráfico
     */
    function drawLine(ctx, data, margin, width, height, minVal, maxVal, color, lineWidth) {
        if (data.length < 2) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();

        data.forEach((value, index) => {
            const x = margin.left + (width / (data.length - 1)) * index;
            const normalizedValue = (value - minVal) / (maxVal - minVal);
            const y = margin.top + height - (normalizedValue * height);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Dibujar puntos en los últimos valores
        const lastIndex = data.length - 1;
        const lastValue = data[lastIndex];
        const lastX = margin.left + width;
        const lastNormalized = (lastValue - minVal) / (maxVal - minVal);
        const lastY = margin.top + height - (lastNormalized * height);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Dibuja los ejes y etiquetas
     */
    function drawAxes(ctx, margin, width, height) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';

        // Eje Y izquierdo (BPM: 0-250)
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((250 / 5) * (5 - i));
            const y = margin.top + (height / 5) * i;
            ctx.fillText(value, margin.left - 8, y + 4);
        }

        // Eje Y derecho (SpO₂: 0-100)
        ctx.textAlign = 'left';
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((100 / 5) * (5 - i));
            const y = margin.top + (height / 5) * i;
            ctx.fillText(value + '%', margin.left + width + 8, y + 4);
        }
    }

    /**
     * Dibuja los valores actuales en el gráfico
     */
    function drawCurrentValues(ctx, margin, width, height) {
        if (chartData.bpm.length === 0) return;

        const lastBPM = chartData.bpm[chartData.bpm.length - 1];
        const lastSpO2 = chartData.spo2[chartData.spo2.length - 1];

        // Etiqueta BPM
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${lastBPM} BPM`, margin.left + 10, margin.top + 15);

        // Etiqueta SpO₂
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${lastSpO2}%`, margin.left + width - 10, margin.top + 15);
    }

    // ============================================
    // CONTROL DE MONITOREO
    // ============================================

    /**
     * Inicia el monitoreo continuo de signos vitales
     */
    function startMonitoring() {
        if (isMonitoring) return;

        isMonitoring = true;

        // Inicializar gráfico
        initChart();

        // Generar valores iniciales
        updateAllVitals();

        // Intervalo principal de actualización de signos vitales
        mainInterval = setInterval(updateAllVitals, MONITOR_CONFIG.UPDATE_INTERVAL);

        // Intervalo de renderizado del gráfico (más frecuente para animación suave)
        chartInterval = setInterval(drawChart, MONITOR_CONFIG.CHART_UPDATE_INTERVAL);

        console.log('[VitaMonitor] Monitoreo iniciado');
    }

    /**
     * Detiene el monitoreo continuo
     */
    function stopMonitoring() {
        isMonitoring = false;

        if (mainInterval) {
            clearInterval(mainInterval);
            mainInterval = null;
        }

        if (chartInterval) {
            clearInterval(chartInterval);
            chartInterval = null;
        }

        // Limpiar datos del gráfico
        chartData = { bpm: [], spo2: [], timestamps: [] };

        console.log('[VitaMonitor] Monitoreo detenido');
    }

    /**
     * Verifica si el monitoreo está activo
     * @returns {boolean}
     */
    function isMonitoringActive() {
        return isMonitoring;
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    window.VitaMonitor = {
        startMonitoring,
        stopMonitoring,
        isMonitoringActive,
        getChartData: () => ({ ...chartData }),
        CONFIG: MONITOR_CONFIG
    };

})();