import { generateHeroTemplate, generateSkeletonTemplate, generateCardItemTemplate } from "../../templates.js";
import HomePresenter from "./home-presenter";
import * as StoryAPI from "../../data/api";
import Map from "../../utils/map";
import { getAccessToken } from "../../utils/auth";
import { toggleSaveStory, isStorySaved, getAllStories, saveStories } from "../../utils/db-helper";

export default class HomePage {
    #presenter = null;
    #map = null;
    #loadMoreButtonListener = null;

    async render() {
        return `
            <div class="main-content">
                <div class="hero-section">${generateHeroTemplate()}</div>

                <h2 class="section-title">Lokasi dari para authors</h2>
                <div class="map-container" style="height: 400px; margin-top: 40px;">
                    <div id="map" style="width: 100%; height: 100%;"></div>
                </div>
                
                <section class="container">
                    <h2 class="section-title">Kisah Terbaru</h2>
                    <div class="card-list__container">
                        <div id="card-list" class="card-list">
                            <div id="card-list-loading-container"></div>
                        </div>
                        <p id="error-message" style="color: red; display: none; text-align: center; margin-top: 20px;"></p>
                    </div>
                </section>
            </div>
        `;
    }

    async afterRender() {
        this.#presenter = new HomePresenter({
            view: this,
            model: StoryAPI,
        });

        this.#map = null;
        await this.#fetchStories();
        this.#setupLoadMoreButton();

        setTimeout(() => this.#initBookmarkButtons(), 300);
    }

    async #fetchStories() {
        this.showLoading();

        try {
            const token = getAccessToken();

            if (!token) {
                console.warn('No token, using cache');
                const cachedStories = await getAllStories();
                this.displayStories(cachedStories);
                this.hideLoading();
                return;
            }

            const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('API Response:', result);

            const stories = result.listStory || [];
            await saveStories(stories);
            this.displayStories(stories);
            this.hideLoading();
        } catch (err) {
            console.error('Fetch error:', err);
            console.warn('Ambil dari IndexedDB (offline mode)');
            const cachedStories = await getAllStories();
            this.displayStories(cachedStories);
            this.hideLoading();

            if (cachedStories.length === 0) {
                this.displayError('Tidak dapat memuat cerita. Periksa koneksi internet Anda.');
            }
        }
    }

    #setupLoadMoreButton() {
        const loadMoreButton = document.getElementById('load-more-button');
        if (!loadMoreButton) return;
        if (this.#loadMoreButtonListener) {
            loadMoreButton.removeEventListener('click', this.#loadMoreButtonListener);
        }
        this.#loadMoreButtonListener = async () => {
            await this.#presenter.loadNextStories();
        };
        loadMoreButton.addEventListener('click', this.#loadMoreButtonListener);
    }

    displayStories(stories = []) {
        const loadingContainer = document.getElementById('card-list-loading-container');
        const cardList = document.getElementById('card-list');
        const errorMessageElement = document.getElementById('error-message');

        if (loadingContainer) loadingContainer.style.display = 'none';
        if (errorMessageElement) errorMessageElement.style.display = 'none';

        if (stories.length === 0) {
            if (cardList) cardList.innerHTML = '<p class="empty-state">Belum ada cerita yang tersedia saat ini.</p>';
            return;
        }

        let cardTemplates = '';
        stories.forEach(story => {
            cardTemplates += generateCardItemTemplate(story);
        });

        if (cardList) cardList.innerHTML = cardTemplates;
        this.#updateMap(stories);
    }

    displayError(message) {
        const loadingContainer = document.getElementById('card-list-loading-container');
        const cardList = document.getElementById('card-list');
        const errorMessageElement = document.getElementById('error-message');
        const loadMoreButton = document.getElementById('load-more-button');

        if (loadingContainer) loadingContainer.style.display = 'none';
        if (cardList) cardList.innerHTML = '';
        if (loadMoreButton) loadMoreButton.style.display = 'none';

        if (errorMessageElement) {
            errorMessageElement.textContent = message;
            errorMessageElement.style.display = 'block';
        }
    }

    async #initBookmarkButtons() {
        const buttons = document.querySelectorAll('.bookmark-button');
        if (!buttons.length) return;

        for (const button of buttons) {
            const id = button.dataset.id;
            const saved = await isStorySaved(id);
            
            if (saved) button.classList.add('saved');

            button.addEventListener('click', async () => {
                const story = {
                    id,
                    name: button.closest('.card-item').querySelector('.card-item__title').textContent,
                    description: button.closest('.card-item').querySelector('.card-item__description').textContent,
                    photoUrl: button.closest('.card-item').querySelector('.card-item__image').src
                };

                const isSavedNow = await toggleSaveStory(story);
                if (isSavedNow) {
                    button.classList.add('saved');
                } else {
                    button.classList.remove('saved');
                }
            });
        }
    }

    showLoading() {
        const loadingContainer = document.getElementById('card-list-loading-container');
        if (loadingContainer) {
            loadingContainer.innerHTML = generateSkeletonTemplate(8);
            loadingContainer.style.display = 'block';
        }
    }

    hideLoading() {
        const loadingContainer = document.getElementById('card-list-loading-container');
        if (loadingContainer) {
            loadingContainer.innerHTML = '';
            loadingContainer.style.display = 'none';
        }
    }

    #updateMap(stories) {
        if (!stories || stories.length === 0) return;
        const storiesWithLocation = stories.filter(s => s.lat && s.lon);
        if (storiesWithLocation.length === 0) return;
        if (!this.#map) {
            this.#initializeMap(storiesWithLocation);
        } else {
            this.#rebuildMapMarkers(storiesWithLocation);
        }
    }

    #initializeMap(stories) {
        if (typeof Map === 'undefined' || typeof Map.build !== 'function') {
            console.warn('Map library tidak tersedia');
            const mapEl = document.getElementById('map');
            if (mapEl) {
                mapEl.innerHTML = '<p style="text-align:center; color:#999;">Map library belum tersedia.</p>';
            }
            return;
        }

        const avgLat = stories.reduce((sum, s) => sum + s.lat, 0) / stories.length;
        const avgLon = stories.reduce((sum, s) => sum + s.lon, 0) / stories.length;

        Map.build('#map', {
            center: [avgLat, avgLon],
            zoom: 5,
            locate: false
        })
            .then(map => {
                this.#map = map;
                this.#addMarkersToMap(stories);
            })
            .catch(err => {
                console.error('Map setup error:', err);
                const mapEl = document.getElementById('map');
                if (mapEl) {
                    mapEl.innerHTML = '<p style="text-align:center; color:#999;">Peta gagal dimuat.</p>';
                }
            });
    }

    #rebuildMapMarkers(stories) {
        if (!this.#map) return;
        const leafletMap = this.#map.getLeafletMap();
        leafletMap.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                leafletMap.removeLayer(layer);
            }
        });
        this.#addMarkersToMap(stories);
    }

    #addMarkersToMap(stories) {
        if (!this.#map || !stories || stories.length === 0) return;

        const bounds = [];
        stories.forEach(story => {
            if (story.lat && story.lon) {
                try {
                    const marker = this.#map.addMarker(
                        [story.lat, story.lon],
                        {
                            title: story.name || story.description || 'Story',
                            draggable: false
                        }
                    );
                    if (marker && typeof marker.bindPopup === 'function') {
                        const popupContent = `
                            <div style="cursor: pointer;">
                                <strong>${story.name || 'Story'}</strong>
                                ${story.description ? `<br><small>${story.description.substring(0, 100)}...</small>` : ''}
                            </div>
                        `;
                        marker.bindPopup(popupContent);
                    }
                    if (marker && typeof marker.on === 'function') {
                        marker.on('click', () => {
                            location.hash = `#/stories/${story.id}`;
                        });
                    }
                    bounds.push([story.lat, story.lon]);
                } catch (error) {
                    console.error('Error creating marker:', error);
                }
            }
        });

        if (bounds.length > 0) {
            try {
                const leafletMap = this.#map.getLeafletMap();
                leafletMap.fitBounds(bounds, { padding: [50, 50] });
            } catch (error) {
                console.error('Error fitting bounds:', error);
            }
        }
    }
}