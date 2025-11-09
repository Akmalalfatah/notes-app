export default class AddPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this._model = model; 
  }

  async storeStory({ description, photo, lat, lon }) {
    if (!description || !photo) {
      this.#view.displayError('Deskripsi dan foto tidak boleh kosong.');
      return;
    }

    this.#view.showSubmitLoadingButton();

    try {
      const response = await this._model.storeNewStory({ description, photo, lat, lon }); 

      if (!response.ok) {
        throw new Error(response.message || 'Gagal menyimpan cerita baru.');
      }

      this.#view.storyStoredSuccessfully(response.message || 'Cerita berhasil ditambahkan!');

    } catch (error) {
      console.error('Error storing story:', error);
      this.#view.displayError(error.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}