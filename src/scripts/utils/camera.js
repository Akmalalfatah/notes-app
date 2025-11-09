export default class Camera {
  #video;
  #canvas;
  #cameraSelect;
  #stream;

  constructor({ video, canvas, cameraSelect }) {
    this.#video = video;
    this.#canvas = canvas;
    this.#cameraSelect = cameraSelect;
    this.#stream = null;

    this.#setupCameraSelection();
  }

  async #setupCameraSelection() {
    this.#cameraSelect.addEventListener('change', () => this.launch());

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((device) => device.kind === 'videoinput');

    if (videoDevices.length === 0) {
      console.warn('No video input devices found.');
      return;
    }

    videoDevices.forEach((device) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Camera ${this.#cameraSelect.length + 1}`;
      this.#cameraSelect.appendChild(option);
    });
  }

  async launch() {
    this.stop();

    const deviceId = this.#cameraSelect.value;
    const constraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        facingMode: 'environment', 
      },
    };

    try {
      this.#stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.#video.srcObject = this.#stream;
      this.#video.play();
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.');
    }
  }

  stop() {
    if (this.#stream) {
      this.#stream.getTracks().forEach((track) => track.stop());
      this.#stream = null;
    }
  }

  takePicture() {
    if (!this.#stream) {
      return Promise.reject(new Error('Kamera belum diluncurkan.'));
    }

    this.#canvas.width = this.#video.videoWidth;
    this.#canvas.height = this.#video.videoHeight;

    const context = this.#canvas.getContext('2d');
    context.drawImage(this.#video, 0, 0, this.#canvas.width, this.#canvas.height);

    return new Promise((resolve) => {
      this.#canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }

  addCheeseButtonListener(selector, callback) {
    document.querySelector(selector).addEventListener('click', callback);
  }
}