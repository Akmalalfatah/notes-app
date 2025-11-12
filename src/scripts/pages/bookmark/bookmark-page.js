import { getAllStories, deleteStory } from "../../utils/db-helper";
import { generateCardItemTemplate } from "../../templates";

export default class BookmarkPage {
  async render() {
    return `
      <div class="main-content">
        <section class="container">
          <h2 class="section-title">Bookmark Saya</h2>
          <div id="bookmark-list" class="card-list"></div>
          <p id="empty-bookmark" class="empty-state hidden">
            Belum ada cerita yang dibookmark.
          </p>
        </section>
      </div>
    `;
  }

  async afterRender() {
    const stories = await getAllStories();
    const container = document.getElementById("bookmark-list");
    const emptyMessage = document.getElementById("empty-bookmark");

    if (!stories || stories.length === 0) {
      emptyMessage.classList.remove("hidden");
      return;
    }
    container.innerHTML = stories.map(story => generateCardItemTemplate(story)).join("");

    this.#setupDeleteButtons();
  }

  async #setupDeleteButtons() {
    const buttons = document.querySelectorAll(".bookmark-button");

    for (const button of buttons) {
      button.textContent = "Hapus"; 
      button.classList.add("saved"); 

      button.addEventListener("click", async () => {
        const id = button.dataset.id;
        await deleteStory(id);

        const card = button.closest(".card-item");
        if (card) card.remove();
        const remaining = document.querySelectorAll(".card-item").length;
        if (remaining === 0) {
          document.getElementById("empty-bookmark").classList.remove("hidden");
        }
      });
    }
  }
}
