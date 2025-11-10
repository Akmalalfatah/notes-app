import AddPresenter from './add-presenter';
import { convertBase64ToBlob } from '../../utils/index';
import * as StoryAPI from '../../data/api';
import Camera from '../../utils/camera';
import Map from '../../utils/map';
import { generateLoaderTemplate } from '../../templates';
import { savePendingStory } from '../../utils/db-helper';

export default class AddPage {
  #presenter;
  #form;
  #camera;
  #isCameraOpen = false;
  #takenDocumentations = [];
  #map = null;

  async render() {
    return `
      <section class="container">
        <h1 class="section-title">Bagikan Ceritamu</h1>
        <div class="new-form__container">
          <form id="add-story-form" class="new-form">
            
            <div class="form-control description">
              <label for="description-input" class="new-form__description__title">Deskripsi Cerita</label>
              <textarea id="description-input" name="description" placeholder="Tuliskan deskripsi cerita Anda..." rows="6" required></textarea>
            </div>

            <div class="form-control">
              <label for="documentations-input" class="new-form__documentations__title">Dokumentasi Foto</label>
  
              <div class="new-form__documentations__container">
                <div class="new-form__documentations__buttons">
                  <button id="documentations-input-button" class="btn btn-outline" type="button">
                    Pilih Foto (Galeri)
                  </button>
                  <input
                    id="documentations-input"
                    name="documentations"
                    type="file"
                    accept="image/*"
                    hidden="hidden"
                    aria-describedby="documentations-more-info"
                  >
                  <button id="open-documentations-camera-button" class="btn btn-outline" type="button">
                    Buka Kamera
                  </button>
                </div>
                
                <div id="camera-container" class="new-form__camera__container" style="display: none; margin-top: 15px;">
                  <video id="camera-video" class="new-form__camera__video" style="width: 100%; max-width: 640px; height: auto; background: #000; border-radius: 8px;">
                    Video stream not available.
                  </video>
                  <canvas id="camera-canvas" class="new-form__camera__canvas" style="display: none;"></canvas>
  
                  <div class="new-form__camera__tools" style="margin-top: 10px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <select id="camera-select" style="flex: 1; min-width: 200px; padding: 8px; border-radius: 4px; border: 1px solid #ccc;"></select>
                    <div class="new-form__camera__tools_buttons">
                      <button id="camera-take-button" class="btn" type="button">
                        Ambil Gambar
                      </button>
                    </div>
                  </div>
                </div>
                <div id="documentation-output" class="new-form__documentations__output"></div>
              </div>
            </div>

            <div class="form-control">
              <div class="new-form__location__title">Lokasi Anda</div>
  
              <div class="new-form__location__container">
                <div class="new-form__location__map__container">
                  <div id="map" class="new-form__location__map" style="height: 300px; display: block;"></div>
                  <div id="map-loading-container"></div>
                </div>
                <div class="new-form__location__lat-lng">
                  <input type="hidden" name="latitude" id="latitude-input" value="">
                  <input type="hidden" name="longitude" id="longitude-input" value="">
                  <p class="map-hint" id="coordinate-display">Koordinat: Klik pada peta untuk menandai.</p>
                </div>
              </div>
            </div>

            <p id="error-message" style="color: red; margin-bottom: 15px; display: none;"></p>

            <div class="form-buttons">
              <a class="btn submit-button-container" href="#/">Batal</a>
              <button id="submit-button-container" class="btn" type="submit">Unggah Cerita</button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new AddPresenter({
      view: this,
      model: StoryAPI,
    });
    this.#takenDocumentations = [];

    this.#setupForm();
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.#setupMapAndCamera();
  }

  async #setupMapAndCamera() {
    this.showMapLoading();

    const waitForMapContainer = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;

        const check = () => {
          attempts++;
          const container = document.getElementById('map');

          if (container && container.offsetHeight > 0 && container.offsetWidth > 0) {
            console.log('Map container ready:', container.offsetHeight, 'x', container.offsetWidth);
            resolve(container);
          } else if (attempts >= maxAttempts) {
            reject(new Error('Map container timeout'));
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });
    };

    try {
      await waitForMapContainer();

      this.#map = await Map.build('#map', {
        zoom: 15,
        locate: true,
      });

      if (!this.#map) throw new Error('Peta gagal dimuat.');

      this.hideMapLoading();

      const center = this.#map.getCenter();
      this.#updateLatLngInput(center.lat, center.lng);

      let marker = this.#map.getSingleMarker();

      if (marker) {
        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          this.#updateLatLngInput(pos.lat, pos.lng);
        });
      }

      this.#map.addMapEventListener('click', (e) => {
        const latlng = e.latlng || e;
        marker = this.#map.getSingleMarker();

        if (!marker) {
          marker = this.#map.createMarker(latlng, { draggable: true });

          marker.on('dragend', (ev) => {
            const pos = ev.target.getLatLng();
            this.#updateLatLngInput(pos.lat, pos.lng);
          });
        } else {
          marker.setLatLng(latlng);
        }

        this.#updateLatLngInput(latlng.lat, latlng.lng);
      });

    } catch (error) {
      console.error('Map error:', error);
      this.hideMapLoading();
      const mapEl = document.getElementById('map');
      if (mapEl) {
        mapEl.innerHTML = `
        <div style="padding:20px; text-align:center; color:#999; font-size:14px;">
          <p>Peta tidak dapat dimuat.</p>
          <p style="font-size:12px;">${error.message}</p>
        </div>
      `;
      }
    }

    this.#setupCamera();
  }

  #updateLatLngInput(latitude, longitude) {
    document.getElementById('latitude-input').value = latitude;
    document.getElementById('longitude-input').value = longitude;
    document.getElementById('coordinate-display').textContent = `Koordinat: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  #setupCamera() {
    if (!this.#camera) {
      this.#camera = new Camera({
        video: document.getElementById('camera-video'),
        cameraSelect: document.getElementById('camera-select'),
        canvas: document.getElementById('camera-canvas'),
      });
    }

    this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
      const imageBlob = await this.#camera.takePicture();
      this.#setTakenPicture(imageBlob);
    });
  }

  #setupForm() {
    this.#form = document.getElementById('add-story-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const lat = this.#form.elements.namedItem('latitude').value;
      const lon = this.#form.elements.namedItem('longitude').value;

      const data = {
        description: this.#form.elements.namedItem('description').value,
        photo: this.#takenDocumentations[0] ? this.#takenDocumentations[0].blob : null,
        lat: lat === '' ? null : lat,
        lon: lon === '' ? null : lon,
      };

      try {
        await this.#presenter.storeStory(storyData);
      } catch (err) {
        await savePendingStory(storyData);
        alert('Kamu sedang offline. Cerita akan dikirim otomatis saat online.');
      }
    });

    document.getElementById('documentations-input').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        await this.#addTakenPicture(file);
      }
    });

    document.getElementById('documentations-input-button').addEventListener('click', () => {
      this.#form.elements.namedItem('documentations').click();
    });

    const cameraContainer = document.getElementById('camera-container');
    document
      .getElementById('open-documentations-camera-button')
      .addEventListener('click', async (event) => {
        const isCurrentlyOpen = cameraContainer.style.display === 'block';

        if (!isCurrentlyOpen) {
          cameraContainer.style.display = 'block';
          event.currentTarget.textContent = 'Tutup Kamera';

          if (this.#camera) {
            try {
              await this.#camera.launch();
            } catch (error) {
              console.error('Camera launch error:', error);
              alert('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
              cameraContainer.style.display = 'none';
              event.currentTarget.textContent = 'Buka Kamera';
            }
          }
        } else {
          cameraContainer.style.display = 'none';
          event.currentTarget.textContent = 'Buka Kamera';

          if (this.#camera) {
            this.#camera.stop();
          }
        }
      });
  }

  async #addTakenPicture(image) {
    let blob = image;

    if (image instanceof String) {
      blob = await convertBase64ToBlob(image, 'image/png');
    }

    this.#setTakenPicture(blob);
  }

  #setTakenPicture(blob) {
    this.#takenDocumentations = [{ id: 'main', blob: blob }];

    const imageUrl = URL.createObjectURL(blob);
    document.getElementById('documentation-output').innerHTML = `
        <div class="new-form__documentations__outputs-item">
          <button type="button" data-deletepictureid="main" class="new-form__documentations__outputs-item__delete-btn">
            <img src="${imageUrl}" alt="Dokumentasi utama">
          </button>
        </div>
    `;

    document.querySelector('button[data-deletepictureid]').addEventListener('click', () => {
      this.#takenDocumentations = [];
      document.getElementById('documentation-output').innerHTML = '';
      document.getElementById('documentations-input').value = '';
    });
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Unggah Cerita
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Unggah Cerita</button>
    `;
  }

  displayError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  storyStoredSuccessfully(message) {
    alert(message);
    this.clearForm();
    location.hash = '/';
  }

  clearForm() {
    this.#form.reset();
    this.#takenDocumentations = [];
    document.getElementById('documentation-output').innerHTML = '';
  }
}

async function handleSubmitStory(storyData) {
  try {
    const token = getAccessToken();
    const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(storyData),
    });

    if (!response.ok) throw new Error('Gagal kirim ke server');
    alert('Story berhasil dikirim!');
  } catch (err) {
    console.warn('Menyimpan story ke IndexedDB pending');
    await savePendingStory(storyData);
    alert('Kamu sedang offline. Story akan dikirim otomatis saat online.');
  }
}