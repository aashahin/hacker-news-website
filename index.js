const STORIES_PER_PAGE = 30;
const BASE_API_URL = "https://hacker-news.firebaseio.com/v0";

const section = document.querySelector("section");

async function getTopStories(page = 1) {
  try {
    const response = await fetch(`${BASE_API_URL}/topstories.json`);
    const storyIds = await response.json();
    const startIndex = (page - 1) * STORIES_PER_PAGE;
    return storyIds.slice(startIndex, startIndex + STORIES_PER_PAGE);
  } catch (error) {
    console.error("Error fetching top stories:", error);
    throw error;
  }
}

async function getStoryDetails(id) {
  try {
    const response = await fetch(`${BASE_API_URL}/item/${id}.json`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching story ${id}:`, error);
    throw error;
  }
}

function formatTime(timestamp) {
  const now = new Date();
  const storyDate = new Date(timestamp * 1000);
  const diffInHours = Math.floor((now - storyDate) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return "less than an hour ago";
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }
}

function createStoryCard(story, index, page) {
  const storyCard = document.createElement("div");
  storyCard.className = "story-card";

  const domain = story.url
    ? new URL(story.url).hostname.replace("www.", "")
    : "";

  const rank = (page - 1) * STORIES_PER_PAGE + index + 1;

  storyCard.innerHTML = `
    <span class="rank">${rank}.</span>
    <div class="story-details">
      <div>
        <a href="${story.url || `item?id=${story.id}`}" class="title">
          ${story.title} ${domain ? `(${domain})` : ""}
        </a>
      </div>
      <div class="meta">
        ${story.score} points by 
        <a href="user?id=${story.by}">${story.by}</a> 
        ${formatTime(story.time)} | 
        <a href="item?id=${story.id}">${story.descendants || 0} comments</a>
      </div>
    </div>
  `;

  return storyCard;
}

function createPaginationControls(currentPage) {
  const paginationDiv = document.createElement("div");
  paginationDiv.className = "pagination";

  if (currentPage > 1) {
    const prevLink = document.createElement("a");
    prevLink.href = `#page=${currentPage - 1}`;
    prevLink.textContent = "Previous";
    prevLink.addEventListener("click", (e) => {
      e.preventDefault();
      displayStories(currentPage - 1);
    });
    paginationDiv.appendChild(prevLink);
  }

  const nextLink = document.createElement("a");
  nextLink.href = `#page=${currentPage + 1}`;
  nextLink.textContent = "More";
  nextLink.addEventListener("click", (e) => {
    e.preventDefault();
    displayStories(currentPage + 1);
  });

  if (currentPage > 1) {
    paginationDiv.appendChild(document.createTextNode(" | "));
  }
  paginationDiv.appendChild(nextLink);

  return paginationDiv;
}

async function displayStories(page = 1) {
  try {
    section.innerHTML = '<div class="loader">Loading stories...</div>';

    const storyIds = await getTopStories(page);
    const stories = await Promise.all(storyIds.map(getStoryDetails));

    section.innerHTML = "";
    stories.forEach((story, index) => {
      if (story) {
        const storyCard = createStoryCard(story, index, page);
        section.appendChild(storyCard);
      }
    });

    const paginationControls = createPaginationControls(page);
    section.appendChild(paginationControls);

    window.history.pushState({}, "", `#page=${page}`);
  } catch (error) {
    section.innerHTML =
      '<div class="error">Error loading stories. Please try again later.</div>';
  }
}

window.addEventListener("popstate", () => {
  const page = parseInt(window.location.hash.match(/#page=(\d+)/)?.[1]) || 1;
  displayStories(page);
});

const initialPage =
  parseInt(window.location.hash.match(/#page=(\d+)/)?.[1]) || 1;
displayStories(initialPage);

setInterval(() => {
  const currentPage =
    parseInt(window.location.hash.match(/#page=(\d+)/)?.[1]) || 1;
  displayStories(currentPage);
}, 5 * 60 * 1000);
