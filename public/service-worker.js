// Uncomment the lines below to set up the cache files

//create two caches
const CACHE_NAME = 'budget-site-cache-v1';
const DATA_CACHE_NAME = 'budget-data-cache-v1';

const FILES_TO_CACHE = [ //cache static files
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    '/js/idb.js',
    '/js/index.js'
];

// Install the service worker
self.addEventListener('install', function(evt) {
    evt.waitUntil( //wait
        caches.open(CACHE_NAME).then(cache => { //open cache
            console.log('Your files were pre-cached successfully!');
            return cache.addAll(FILES_TO_CACHE); //add file to cache
        })
    );

    self.skipWaiting(); //need to skip the waiting to bypass the wait
});

// Activate the service worker and remove old data from the cache
self.addEventListener('activate', function(evt) {
    evt.waitUntil(
        caches.keys().then(keyList => { //check if cache exists
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log('Removing old cache data', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// Intercept fetch requests
self.addEventListener('fetch', function(evt) { //make a fetch request
    if (evt.request.url.includes('/api/')) { //if it includes 'api'
        evt.respondWith(
            caches
            .open(DATA_CACHE_NAME) //open
            .then(cache => {
                return fetch(evt.request) //fetch
                    .then(response => {
                        // If the response was good, clone it and store it in the cache.
                        if (response.status === 200) {
                            cache.put(evt.request.url, response.clone()); //save the url and clone the response
                        }

                        return response; //return it to the user
                    })
                    .catch(err => {
                        // Network request failed, try to get it from the cache.
                        return cache.match(evt.request); //if req fail, then go to cache and get the data
                    });
            })
            .catch(err => console.log(err))
        );

        return;
    } //end of if - then else

    evt.respondWith( //check for anything else in cache that is not api (thinks it is a static file)
        fetch(evt.request).catch(function() {
            return caches.match(evt.request).then(function(response) {
                if (response) { //return it back
                    return response;
                } else if (evt.request.headers.get('accept').includes('text/html')) {
                    // return the cached home page for all requests for html pages
                    return caches.match('/');
                }
            });
        })
    );
});