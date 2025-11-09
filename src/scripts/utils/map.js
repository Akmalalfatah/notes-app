class Map {
    #map;
    #singleMarker;

    constructor(selector, options) {
        const container = typeof selector === 'string' ? document.querySelector(selector) : selector;
        
        if (!container) {
            throw new Error(`Map container "${selector}" not found in DOM`);
        }
        
        if (container.offsetParent === null) {
            console.warn('Map container is hidden, making it visible...');
            container.style.display = 'block';
        }

        this.#map = L.map(container).setView(
            options.center || [-6.2, 106.8],
            options.zoom || 13
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(this.#map);
    }

    static async build(selector, options = {}) {
        const waitForLeaflet = () => {
            return new Promise((resolve, reject) => {
                if (typeof L !== 'undefined') {
                    resolve();
                    return;
                }

                let attempts = 0;
                const maxAttempts = 100;

                const interval = setInterval(() => {
                    attempts++;
                    if (typeof L !== 'undefined') {
                        clearInterval(interval);
                        resolve();
                    } else if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        reject(new Error('Leaflet load timeout'));
                    }
                }, 100);
            });
        };

        const waitForContainer = (selector) => {
            return new Promise((resolve, reject) => {
                const checkContainer = () => {
                    const container = typeof selector === 'string' 
                        ? document.querySelector(selector) 
                        : selector;
                    
                    if (container && container.offsetHeight > 0 && container.offsetWidth > 0) {
                        resolve(container);
                    } else {
                        requestAnimationFrame(checkContainer);
                    }
                };
                
                checkContainer();
                setTimeout(() => {
                    reject(new Error(`Container ${selector} not ready after 10s`));
                }, 10000);
            });
        };

        try {
            await waitForLeaflet();
            await waitForContainer(selector);
            
            return new Promise((resolve, reject) => {
                try {
                    const mapInstance = new Map(selector, options);
                    
                    mapInstance.#map.whenReady(() => {
                        setTimeout(() => {
                            mapInstance.#map.invalidateSize();
                        }, 100);
                        
                        const center = mapInstance.#map.getCenter();
                        mapInstance.addSingleDraggableMarker([center.lat, center.lng]); 

                        if (options.locate) {
                            mapInstance.locateUser();
                        }
                        resolve(mapInstance);
                    });
                } catch (error) {
                    reject(error);
                }
            });
        } catch (error) {
            console.error('Map build failed:', error);
            throw error;
        }
    }

    addSingleDraggableMarker(coordinate, options = {}) {
        if (this.#singleMarker) {
            this.#map.removeLayer(this.#singleMarker);
        }
        this.#singleMarker = L.marker(coordinate, { ...options, draggable: true }).addTo(this.#map);
        return this.#singleMarker;
    }

    addMarker(coordinate, options = {}) {
        const marker = L.marker(coordinate, { ...options, draggable: false }).addTo(this.#map);
        return marker;
    }

    setSingleMarker(markerInstance) {
        if (this.#singleMarker) {
            this.#map.removeLayer(this.#singleMarker);
        }
        this.#singleMarker = markerInstance;
    }
    
    getSingleMarker() {
        return this.#singleMarker;
    }

    addMapEventListener(event, handler) {
        this.#map.on(event, handler);
    }

    getCenter() {
        const center = this.#map.getCenter();
        return { lat: center.lat, lng: center.lng };
    }

    locateUser() {
        this.#map.locate({ setView: true, maxZoom: 16 });

        this.#map.on('locationfound', (e) => {
            const { lat, lng } = e.latlng;
            this.#map.setView([lat, lng], 16);
            this.addSingleDraggableMarker([lat, lng]); 
        });

        this.#map.on('locationerror', (e) => {
            console.warn('Location error:', e.message);
            alert('Lokasi tidak bisa diakses. Klik peta untuk menandai.');
        });
    }

    getLeafletMap() {
        return this.#map;
    }
    invalidateSize() {
        if (this.#map) {
            this.#map.invalidateSize();
        }
    }
}

export default Map;