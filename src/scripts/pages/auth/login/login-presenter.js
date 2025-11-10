import { putAccessToken } from '../../../utils/auth'; 
import * as AuthAPI from '../../../data/api';   

export default class LoginPresenter {
    #view;
    #model;

    constructor({ view, model }) {
        this.#view = view;
        this.#model = model || AuthAPI; 
    }

    async getLogin({ email, password }) {
        this.#view.showSubmitLoadingButton();
        try {
            const response = await this.#model.getLogin({ email, password });

            if (!response.ok) {
                throw new Error(response.message || 'Email atau password salah.');
            }
            const token = response.loginResult?.token;
            if (!token) {
                throw new Error('Token tidak ditemukan dari server.');
            }
            putAccessToken(token);
            location.hash = '/';
            this.#view.loginSuccessfully('Login berhasil!', { token });
        } catch (error) {
            console.error('getLogin: error:', error);
            this.#view.loginFailed(error.message);
        } finally {
            this.#view.hideSubmitLoadingButton();
        }
    }
}