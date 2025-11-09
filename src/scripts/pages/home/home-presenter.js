import { getAllStories } from '../../data/api';
import { getAccessToken } from '../../utils/auth';

export default class HomePresenter {
    #view;
    #model;
    #currentPage = 1;
    #pageSize = 8;
    #totalStories = [];
    #canLoadMore = true;

    constructor({ view, model }) {
        this.#view = view;
        this.#model = model || { getAllStories };
    }

    getCurrentStories() {
        return this.#totalStories;
    }

    async fetchStories() {
        this.#view.showLoading();
        this.#currentPage = 1;
        this.#totalStories = [];

        const isAuthenticated = getAccessToken();
        if (!isAuthenticated) {
            this.#view.displayError('Anda harus masuk untuk melihat daftar cerita.');
            return;
        }

        await this.#loadData();
    }

    async loadNextStories() {
        if (!this.#canLoadMore) return [];
        
        this.#view.showLoadMoreButton(true, true);
        this.#currentPage += 1;
        await this.#loadData();
        
        return this.#totalStories;
    }

    async #loadData() {
        try {
            const query = `?page=${this.#currentPage}&size=${this.#pageSize}`;
            const response = typeof this.#model.getAllStories === 'function'
                ? await this.#model.getAllStories(query)
                : await getAllStories(query);

            if (!response.ok) {
                throw new Error(response.message || 'Gagal memuat data cerita.');
            }
            
            const newStories = response.listStory || [];
            this.#totalStories.push(...newStories);
            
            this.#canLoadMore = newStories.length === this.#pageSize; 
            
            this.#view.displayStories(this.#totalStories);

        } catch (error) {
            console.error('HomePresenter error:', error);
            this.#view.displayError(error.message || 'Terjadi kesalahan saat mengambil data.');
        } finally {
            this.#view.hideLoading();
            this.#view.showLoadMoreButton(this.#canLoadMore && this.#totalStories.length > 0, false);
        }
    }
}