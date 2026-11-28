const CACHE_NAME = 'watt-a-ham-2026-v9';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './app.js',
  './manifest.json',
  './icon.svg',
  './assets/photos/handheld-ht.jpg',
  './assets/photos/desktop-transceiver.jpg',
  './assets/photos/mobile-rig-mic.jpg',
  './assets/photos/amateur-shack.jpg',
  './assets/photos/cw-iambic-paddles.jpg',
  './assets/photos/mmdvm-hotspot.jpg',
  './assets/photos/rf-power-amplifier.jpg',
  './assets/photos/ft8-waterfall.jpg',
  './assets/photos/swr-wattmeter.jpg',
  './assets/photos/dummy-load.jpg',
  './assets/photos/antenna-analyzer.jpg',
  './assets/photos/bench-power-supply.jpg',
  './assets/photos/ferrite-choke.jpg',
  './assets/photos/digital-multimeter.jpg',
  './assets/photos/solder-joint.jpg',
  './assets/photos/antenna-tuner.jpg',
  './assets/photos/resistors-potentiometer.jpg',
  './assets/photos/capacitors-assorted.jpg',
  './assets/photos/inductors-coils.jpg',
  './assets/photos/diodes-leds.jpg',
  './assets/photos/transistors-packages.jpg',
  './assets/photos/relay-contacts.jpg',
  './assets/photos/integrated-circuit.jpg',
  './assets/photos/blade-cartridge-fuses.jpg',
  './assets/photos/coax-cutaway.jpg',
  './assets/photos/pl259-connector.jpg',
  './assets/photos/type-n-connector.jpg',
  './assets/photos/yagi-antenna.jpg',
  './assets/photos/mobile-loading-whip.jpg',
  './assets/photos/repeater-tower.jpg',
  './assets/photos/ground-clamp-turnbuckle.jpg',
  './assets/photos/battery-12v.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
