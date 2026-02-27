import { setVideojsLang } from './videojs-lang.js';
import { SHOW_OVERLAY, toggleOverlay } from './overlay.js';
import { fetchCanalesPrincipales, fetchCanalesSecundarios } from './fetch.js';
import { limpiarTransmisionActiva, cambiarTabindex, normalizeText } from './ui-utils.js';
import { setupObserver } from './observer.js';
import { showModal } from './modal.js';
import { filtro } from './filtro.js';

export const CONTAINER_OVERLAY = document.querySelector('.container-overlay');
export const UL_OVERLAY_SEÑALES = document.querySelector('#lista-señales');
export const SPAN_NOMBRE_OVERLAY = document.querySelector('#nombre-overlay');
export const BOTON_ALTERNAR_VISIBILIDAD_OVERLAY = document.querySelector('#boton-alternar-visibilidad-overlay');
export const SPAN_BOTON_ALTERNAR_VISIBILIDAD_OVERLAY = document.querySelector('#span-boton-alternar-visibilidad-overlay');
export const CONTAINER_TRANSMISION_ACTIVA = document.querySelector('#container-transmision');
export const TEXTO_DETRAS_CONTAINER_TRANSMISION_ACTIVA = document.querySelector('#texto-detras-container-transmision');
export const CONTAINER_BOTONES_CANALES_PRINCIPAL = document.querySelector('#lista-botones');
export const CONTAINER_BOTONES_CANALES_SECUNDARIOS = document.querySelector('#lista-botones-m3u8');
const BOTON_QUITAR_SEÑAL = document.querySelector('#boton-overlay-quitar-señal');
const BOTON_ALTERNAR_CONTAINER_BOTONES_CANALES = document.querySelector('#boton-alternar-lista-canales');
const CONTAINER_FLIP = document.querySelector('#flip-container');
export const INPUT_FILTRADO_CANALES = document.querySelector('#filtro');

if (localStorage.getItem('modal_status') !== 'hide') showModal();

BOTON_QUITAR_SEÑAL.addEventListener('click', () => {
    try { if(typeof webapis !== 'undefined' && webapis.avplay) webapis.avplay.stop(); } catch(e) {}
    limpiarTransmisionActiva();
});

BOTON_ALTERNAR_VISIBILIDAD_OVERLAY.addEventListener('click', () => {
    toggleOverlay(localStorage.getItem('estado_overlay') !== SHOW_OVERLAY);
});

BOTON_ALTERNAR_CONTAINER_BOTONES_CANALES.addEventListener('click', () => {
    INPUT_FILTRADO_CANALES.value = "";
    if (CONTAINER_BOTONES_CANALES_PRINCIPAL.style.display === 'none') {
        cambiarTabindex(CONTAINER_BOTONES_CANALES_PRINCIPAL, "0");
        cambiarTabindex(CONTAINER_BOTONES_CANALES_SECUNDARIOS, "-1");
        BOTON_ALTERNAR_CONTAINER_BOTONES_CANALES.querySelector('i').classList.replace('ai-arrow-back-thick', 'ai-arrow-forward-thick');
        BOTON_ALTERNAR_CONTAINER_BOTONES_CANALES.disabled = true;
        CONTAINER_BOTONES_CANALES_PRINCIPAL.style.display = 'grid';
        setTimeout(() => {
            BOTON_ALTERNAR_CONTAINER_BOTONES_CANALES.disabled = false;
            filtro();
        }, 610);
    } else {
        cambiarTabindex(CONTAINER_BOTONES_CANALES_PRINCIPAL, "-1");
        cambiarTabindex(CONTAINER_BOTONES_CANALES_SECUNDARIOS, "0");
        BOTON_ALTERNAR_CONTAINER_BOTONES_CANALES.querySelector('i').classList.replace('ai-arrow-forward-thick', 'ai-arrow-back-thick');
        BOTON_ALTERNAR_CONTAINER_BOTONES_CANALES.disabled = true;
        setTimeout(() => {
            BOTON_ALTERNAR_CONTAINER_BOTONES_CANALES.disabled = false;
            CONTAINER_BOTONES_CANALES_PRINCIPAL.style.display = 'none';
            filtro();
        }, 610);
    }
    CONTAINER_FLIP.classList.toggle('hover');
});

INPUT_FILTRADO_CANALES.addEventListener('input', filtro);

setVideojsLang(window.videojs);

fetchCanalesPrincipales();
fetchCanalesSecundarios();

setupObserver();

// ==========================================
// LÓGICA TIZEN: CONTROL REMOTO (CH+ / CH-)
// ==========================================
try {
    if(typeof tizen !== 'undefined') {
        tizen.tvinputdevice.registerKey('ChannelUp');
        tizen.tvinputdevice.registerKey('ChannelDown');
    }
} catch (e) {
    console.warn("No se pudieron registrar las teclas en Tizen");
}

window.addEventListener('keydown', (e) => {
    // 427 es CH+ (Arriba), 428 es CH- (Abajo)
    if (e.keyCode === 427 || e.keyCode === 428) {
        const direccion = e.keyCode === 427 ? 1 : -1;
        
        const isSecundario = document.querySelector('#flip-container').classList.contains('hover');
        const contenedorActivo = isSecundario ? CONTAINER_BOTONES_CANALES_SECUNDARIOS : CONTAINER_BOTONES_CANALES_PRINCIPAL;

        const botones = Array.from(contenedorActivo.querySelectorAll('.boton-canal:not(.d-none)'));
        if (botones.length === 0) return;

        const botonActivo = contenedorActivo.querySelector('.boton-activo');
        let index = botones.indexOf(botonActivo);

        if (index === -1) {
            index = 0;
        } else {
            index += direccion;
        }

        if (index >= botones.length) index = 0;
        if (index < 0) index = botones.length - 1;

        botones[index].click();
    }
});