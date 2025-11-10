import { showFormattedDate } from './utils/index';

export function generateLoaderTemplate() {
    return `
        <div class="loader"></div>
    `;
}

export function generateSkeletonTemplate(count = 4) {
    let template = '';
    for (let i = 0; i < count; i++) {
        template += '<div class="skeleton-item"></div>';
    }
    return template;
}

export function generateHeroTemplate() {
    return `
        <section class="hero-section--book-theme">
            <div class="hero-section__content">
                <h1 class="hero-section__title">Jelajahi Dunia Cerita</h1>
                <p class="hero-section__subtitle">Temukan ribuan kisah fiksi dan non-fiksi terbaru di sini.</p>
                <a href="#/add" class="hero-section__cta-button">Tulis Ceritamu!</a>
            </div>
        </section>
    `;
}

export function generateCardItemTemplate({
    id, name, description, photoUrl, createdAt, lat, lon
}) {
    const formattedDate = showFormattedDate(createdAt);
    const locationString = (lat !== null && lon !== null) 
        ? `(Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)})` 
        : '';

    return `
        <div tabindex="0" class="card-item" data-item="${id}">
            <img class="card-item__image" src="${photoUrl}" alt="Ilustrasi cerita ${name}">
            <div class="card-item__body">
                <div class="card-item__main">
                    <h2 class="card-item__title">${name}</h2>
                    <p class="card-item__description">${description}</p>
                </div>
                <p class="card-item__meta">
                    Dipublikasikan: ${formattedDate}
                    ${locationString}
                </p>
            </div>
        </div>
    `;
}


export function generateUnauthenticatedNavigationListTemplate() {
  return `
    <li><a id="push-notification-button" class="btn push-notification-button"><i class="fa-solid fa-bell"></i> Subscribe</a></li>
    <li><a id="login-button" class="btn login-button" href="#/login">Login</a></li>
    <li><a id="register-button" class="btn register-button" href="#/register">Register</a></li>
  `;
}

export function generateAuthenticatedNavigationListTemplate() {
  return `
    <li><a id="push-notification-button" class="btn push-notification-button"><i class="fa-solid fa-bell"></i> Subscribe</a></li>
    <li><a id="new-report-button" class="btn new-report-button" href="#/add"><i class="fa-solid fa-plus"></i> Buat Laporan</a></li>
    <li><a id="logout-button" class="logout-button" href="#/logout"><i class="fa-solid fa-door-open"></i> Logout</a></li>
  `;
}