// The homepage has its own Site; previews and other applications are not counted.
(() => {
    'use strict';
    if (location.origin !== 'https://vanilla-chan.cn' ||
        !['/', '/vanilla-chan.cn.html'].includes(location.pathname)) return;

    function start() {
        window.goatcounter = { no_onload: true, no_events: true, path: '/' };
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://cnt.vanilla-chan.cn/count.js';
        script.dataset.goatcounter = 'https://cnt.vanilla-chan.cn/count';
        const timeout = setTimeout(cleanup, 4000);
        function cleanup() {
            clearTimeout(timeout);
            script.onload = script.onerror = null;
            script.remove();
        }
        script.onload = () => {
            try { window.goatcounter.count?.(); } finally { cleanup(); }
        };
        script.onerror = cleanup;
        document.head.appendChild(script);
    }

    if (document.readyState === 'complete') setTimeout(start, 0);
    else window.addEventListener('load', start, { once: true });
})();
