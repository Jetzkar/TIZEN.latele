import { TWITCH_PARENT } from './config.js';
import { guardarSeñalPreferida } from './overlay.js';
import { UL_OVERLAY_SEÑALES, CONTAINER_TRANSMISION_ACTIVA } from './main.js';
import { listaCanales } from './fetch.js';

export function crearIframe(canalId, tipoSeñalParaIframe, valorIndex = 0) {
    valorIndex = Number(valorIndex);
    const DIV_ELEMENT = document.createElement('div');
    DIV_ELEMENT.classList.add('h-100');
    const { nombre, señales } = listaCanales[canalId];
    const URL_POR_TIPO_SEÑAL = {
        'iframe_url': señales.iframe_url && señales.iframe_url[valorIndex],
        'yt_id': señales.yt_id && `https://www.youtube-nocookie.com/embed/live_stream?channel=${señales.yt_id}&autoplay=1&mute=1&modestbranding=1&vq=medium&showinfo=0`,
        'yt_embed': señales.yt_embed && `https://www.youtube-nocookie.com/embed/${señales.yt_embed}?autoplay=1&mute=1&modestbranding=1&showinfo=0`,
        'yt_playlist': señales.yt_playlist && `https://www.youtube-nocookie.com/embed/videoseries?list=${señales.yt_playlist}&autoplay=0&mute=0&modestbranding=1&showinfo=0`,
        'twitch_id': señales.twitch_id && `https://player.twitch.tv/?channel=${señales.twitch_id}&parent=${TWITCH_PARENT}`
    };
    const IFRAME_ELEMENT = document.createElement('iframe');
    IFRAME_ELEMENT.src = URL_POR_TIPO_SEÑAL[tipoSeñalParaIframe];
    IFRAME_ELEMENT.classList.add('pe-auto');
    IFRAME_ELEMENT.setAttribute('contenedor-canal-cambio', canalId);
    IFRAME_ELEMENT.allowFullscreen = true;
    IFRAME_ELEMENT.title = nombre;
    IFRAME_ELEMENT.referrerPolicy = 'no-referrer';
    DIV_ELEMENT.append(IFRAME_ELEMENT);
    return DIV_ELEMENT;
}

// NUEVA FUNCIÓN PARA TIZEN AVPLAY
export function crearAvPlay(urlCarga) {
    const DIV_ELEMENT = document.createElement('div');
    DIV_ELEMENT.classList.add('h-100');
    DIV_ELEMENT.id = 'avplay-container';

    setTimeout(() => {
        try {
            if(typeof webapis === 'undefined' || !webapis.avplay) return;
            
            const avplay = webapis.avplay;
            
            if (avplay.getState() !== 'IDLE' && avplay.getState() !== 'NONE') {
                avplay.stop();
            }
            
            avplay.open(urlCarga);

            const container = document.querySelector('#container-transmision');
            if (container) {
                const rect = container.getBoundingClientRect();
                avplay.setDisplayRect(
                    Math.round(rect.left),
                    Math.round(rect.top),
                    Math.round(rect.width),
                    Math.round(rect.height)
                );
            }

            // Opciones para mejorar carga de IPTV en Tizen
            avplay.setStreamingProperty("ADAPTIVE_INFO", "BITRATES=1000000~3000000");

            avplay.prepareAsync(() => {
                avplay.play();
            }, (error) => {
                console.error("Error al preparar AVPlay: ", error);
            });
        } catch (e) {
            console.error("Excepción en AVPlay: ", e);
        }
    }, 50);

    return DIV_ELEMENT;
}

export function crearFragmentCanal(canalId) {
    if (listaCanales[canalId]?.señales) {
        let { señales } = listaCanales[canalId]
        let { iframe_url = [], m3u8_url = [], yt_id = '', yt_embed = '', yt_playlist = '', twitch_id = '' } = señales;
        let lsPreferenciasSeñalCanales = JSON.parse(localStorage.getItem('preferencia_señal_canales_la_tele')) || {};

        let señalUtilizar;
        let valorIndexArraySeñal = 0;

        if (Array.isArray(iframe_url) && iframe_url.length > 0) {
            señalUtilizar = 'iframe_url';
        } else if (Array.isArray(m3u8_url) && m3u8_url.length > 0) {
            señalUtilizar = 'm3u8_url';
        } else if (yt_id !== '') {
            señalUtilizar = 'yt_id';
        } else if (yt_embed !== '') {
            señalUtilizar = 'yt_embed';
        } else if (yt_playlist !== '') {
            señalUtilizar = 'yt_playlist';
        } else if (twitch_id !== '') {
            señalUtilizar = 'twitch_id';
        }

        if (lsPreferenciasSeñalCanales[canalId]) {
            señalUtilizar = Object.keys(lsPreferenciasSeñalCanales[canalId])[0].toString()
            valorIndexArraySeñal = Number(Object.values(lsPreferenciasSeñalCanales[canalId]))
        }

        UL_OVERLAY_SEÑALES.innerHTML = ''
        for (const key in señales) {
            let iconoSeñal = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ai ai-Globe"><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(90 12 12)"/><path d="M2 12h20"/></svg>'
            if (key.startsWith('m3u8_')) {
                iconoSeñal = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ai ai-Play"><path d="M6 4v16"/><path d="M20 12L6 20"/><path d="M20 12L6 4"/></svg>'
            }

            const value = señales[key];
            if (Array.isArray(value) && value.length > 0) {
                value.forEach((url, index) => {
                    const listItem = document.createElement("li");

                    if (señalUtilizar === key && valorIndexArraySeñal === index) listItem.classList.add('boton-activo');
                    listItem.innerHTML = value.length === 1 ? `${iconoSeñal} ${key.split('_')[0]}` : `${iconoSeñal} ${key.split('_')[0]} <span class="fst-italic">${index}</span>`;
                    listItem.addEventListener("click", () => {
                        UL_OVERLAY_SEÑALES.querySelectorAll('.dropdown-item').forEach(item => {
                            item.classList.remove('boton-activo');
                        });
                        listItem.classList.add('boton-activo');
                        guardarSeñalPreferida(canalId, key.toString(), Number(index));
                        CONTAINER_TRANSMISION_ACTIVA.innerHTML = '';
                        CONTAINER_TRANSMISION_ACTIVA.append(crearFragmentCanal(canalId));
                    });
                    UL_OVERLAY_SEÑALES.append(listItem);
                });
            } else if (typeof value === "string" && value !== "") {
                const listItem = document.createElement("li");
                if (señalUtilizar === key) listItem.classList.add('boton-activo');
                listItem.innerHTML = `${iconoSeñal} ${key.replace('_', ' ')}`;
                listItem.addEventListener("click", () => {
                    UL_OVERLAY_SEÑALES.querySelectorAll('.dropdown-item').forEach(item => {
                        item.classList.remove('boton-activo');
                    });
                    listItem.classList.add('boton-activo');
                    guardarSeñalPreferida(canalId, key.toString());
                    CONTAINER_TRANSMISION_ACTIVA.innerHTML = '';
                    CONTAINER_TRANSMISION_ACTIVA.append(crearFragmentCanal(canalId));
                });
                UL_OVERLAY_SEÑALES.append(listItem);
            }
        }

        const FRAGMENT_CANAL = document.createDocumentFragment();
        // USAR crearAvPlay en lugar de crearVideoJs
        FRAGMENT_CANAL.append(señalUtilizar === 'm3u8_url' ? crearAvPlay(m3u8_url[valorIndexArraySeñal]) : crearIframe(canalId, señalUtilizar, valorIndexArraySeñal));
        return FRAGMENT_CANAL
    } else {
        console.error(`${canalId} no tiene señales definidas.`);
    }
}