
const API_ROOT = window.MOVIE_API_URL || "https://movie-recommendation-system-2tze.onrender.com/api/ai"
//|| "http://localhost:3000/api/ai";
const INDIAN_MOVIES = new Set([
  "3 Idiots",
  "Dangal",
  "Zindagi Na Milegi Dobara",
  "Taare Zameen Par",
  "Lagaan",
  "Dilwale Dulhania Le Jayenge",
  "Gully Boy",
  "Queen",
  "Bajrangi Bhaijaan",
  "Andhadhun",
]);
const POSTER_BACKGROUNDS = [
  ["#172936", "#6b9ab0"],
  ["#343033", "#c17848"],
  ["#252b21", "#9d9c6a"],
  ["#422c33", "#ba7970"],
  ["#282820", "#aaa16e"],
  ["#282d3c", "#748ab1"],
  ["#342d39", "#b17da3"],
  ["#283d3c", "#72a79a"],
  ["#333024", "#c1a36c"],
  ["#38402b", "#a2b276"],
];
const POSTER_IMAGES = [
  "photo-1489599849927-2ee91cede3ba",
  "photo-1440404653325-ab127d49abc1",
  "photo-1485846234645-a62644f84728",
  "photo-1517604931442-7e0c8ed2963c",
  "photo-1478720568477-152d9b164e26",
];

const grid = document.querySelector("#movie-grid");
const searchInput = document.querySelector("#movie-search");
const emptyState = document.querySelector("#empty-state");
const visibleCount = document.querySelector("#visible-count");
const collectionCount = document.querySelector("#collection-count");
const recommendationSection = document.querySelector("#recommendations");
const selectedMovieElement = document.querySelector("#selected-movie");
const selectedTitleElement = document.querySelector("#selected-title");
const similarGrid = document.querySelector("#similar-grid");
const recommendationError = document.querySelector("#recommendation-error");
const filterButtons = [...document.querySelectorAll(".filter-chip")];

let movies = [];
let activeFilter = "all";
let activeRequest = 0;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function posterMarkup(movie, index, compact = false) {
  const title = escapeHtml(movie.title);
  const [base, glow] = POSTER_BACKGROUNDS[index % POSTER_BACKGROUNDS.length];
  const imageUrl =
    typeof movie.posterUrl === "string" && movie.posterUrl.trim()
      ? movie.posterUrl
      : `https://images.unsplash.com/${POSTER_IMAGES[index % POSTER_IMAGES.length]}?auto=format&fit=crop&w=560&q=75`;
  const initials = escapeHtml(
    movie.title
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join(""),
  );

  return `
    <span class="poster-wrap${compact ? " poster-compact" : ""}" style="--poster-base:${base};--poster-glow:${glow}">
      <img src="${escapeHtml(imageUrl)}" alt="" loading="lazy" />
      <span class="poster-index">RG / ${String(index + 1).padStart(2, "0")}</span>
      <span class="poster-symbol" aria-hidden="true">${initials}</span>
      <span class="poster-title">${title}</span>
    </span>`;
}

function filteredMovies() {
  const query = searchInput.value.trim().toLowerCase();
  return movies.filter((movie) => {
    const matchesQuery =
      movie.title.toLowerCase().includes(query) ||
      movie.description.toLowerCase().includes(query);
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "international" && INDIAN_MOVIES.has(movie.title));

    return matchesQuery && matchesFilter;
  });
}

function renderMovies() {
  const visibleMovies = filteredMovies();
  grid.innerHTML = visibleMovies.length
    ? visibleMovies
        .map((movie) => {
          const index = movies.indexOf(movie);
          return `
            <button class="movie-card" type="button" data-title="${escapeHtml(movie.title)}" aria-label="See details and similar movies for ${escapeHtml(movie.title)}">
              ${posterMarkup(movie, index)}
              <span class="movie-card-meta">
                <span class="movie-card-title">${escapeHtml(movie.title)}</span>
                <span class="movie-card-description">${escapeHtml(movie.description)}</span>
              </span>
            </button>`;
        })
        .join("")
    : "";
  emptyState.hidden = visibleMovies.length > 0;
  visibleCount.textContent = `${visibleMovies.length} film${visibleMovies.length === 1 ? "" : "s"}`;
}

function showSimilarMovies(items) {
  similarGrid.innerHTML = items
    .map((movie) => {
      const index = movies.findIndex((item) => item.title === movie.title);
      const match = Number.isFinite(movie.match)
        ? Math.round(Math.max(0, Math.min(1, movie.match)) * 100)
        : null;

      return `
        <article class="similar-card">
          ${posterMarkup(movie, Math.max(index, 0), true)}
          <span class="movie-card-title">${escapeHtml(movie.title)}</span>
          ${match === null ? "" : `<span class="match-label">${match}% story match</span>`}
          <p class="similar-description">${escapeHtml(movie.description)}</p>
        </article>`;
    })
    .join("");
}

async function selectMovie(movie) {
  const requestId = ++activeRequest;
  selectedTitleElement.textContent = movie.title;
  selectedMovieElement.innerHTML = `
    ${posterMarkup(movie, movies.indexOf(movie))}
    <div class="selected-copy">
      <p class="selected-label">YOUR PICK</p>
      <h3>${escapeHtml(movie.title)}</h3>
      <p>${escapeHtml(movie.description)}</p>
    </div>`;
  similarGrid.innerHTML = '<div class="loading-state"><span class="loader"></span><span>Finding stories with the same feeling…</span></div>';
  recommendationError.hidden = true;
  recommendationError.textContent = "";
  recommendationSection.hidden = false;
  recommendationSection.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const response = await fetch(`${API_ROOT}/vector`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: movie.title }),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Recommendations couldn’t be loaded.");
    }
    if (requestId !== activeRequest) return;

    showSimilarMovies(Array.isArray(result.topFive) ? result.topFive : []);
    if (!result.topFive?.length) {
      recommendationError.textContent = "No similar films were returned for this title.";
      recommendationError.hidden = false;
    }
  } catch (error) {
    if (requestId !== activeRequest) return;
    similarGrid.innerHTML = "";
    recommendationError.textContent =
      `${error.message} Make sure the backend is running on port 3000 and its Gemini API key is configured.`;
    recommendationError.hidden = false;
  }
}

async function loadMovies() {
  try {
    const response = await fetch(`${API_ROOT}/movies`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "The movie collection couldn’t be loaded.");
    }
    if (!Array.isArray(result.movies)) {
      throw new Error("The movie collection response was not in the expected format.");
    }

    movies = result.movies.filter(
      (movie) =>
        typeof movie.title === "string" &&
        typeof movie.description === "string",
    );
    collectionCount.textContent = `${String(movies.length).padStart(2, "0")} FILMS TO FALL FOR`;
    renderMovies();
  } catch (error) {
    grid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)} Start the backend and refresh to browse its movie collection.</p>`;
    collectionCount.textContent = "COLLECTION UNAVAILABLE";
  }
}

grid.addEventListener("click", (event) => {
  const card = event.target.closest(".movie-card");
  if (!card) return;
  const movie = movies.find((item) => item.title === card.dataset.title);
  if (movie) selectMovie(movie);
});

searchInput.addEventListener("input", renderMovies);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    renderMovies();
  });
});

document.querySelector("#close-detail").addEventListener("click", () => {
  activeRequest += 1;
  recommendationSection.hidden = true;
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus(); 
  }
  if (event.key === "Escape" && !recommendationSection.hidden) {
    recommendationSection.hidden = true;
  }
});

loadMovies(); 
