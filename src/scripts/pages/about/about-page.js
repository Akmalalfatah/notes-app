export default class AboutPage {
  async render() {
    return `
      <section class="container about-page-content">
        <h1 class="section-title">Tentang BukuKami</h1>
        <article class="about-us-story">
          <p>BukuKami adalah platform berbagi cerita digital yang memungkinkan Anda mengabadikan momen berharga, baik fiksi maupun non-fiksi. Setiap kisah dapat didokumentasikan dengan foto dan ditandai dengan lokasi spesifik menggunakan peta.</p>
        </article>
      </section>
      
      <style>
        .about-page-content {
          padding-top: 40px;
          padding-bottom: 60px;
        }
        .about-us-story {
          max-width: 800px;
          line-height: 1.6;
          font-size: 1.1rem;
          margin-inline: auto;
          text-align: center;
        }
      </style>
    `;
  }

  async afterRender() {
    
  }
}