// ==========================================
// 1. GLOBAL CONFIGURATION & CORE DOM NODES
// ==========================================
const contentDiv = document.getElementById('content');
const themeToggleBtn = document.getElementById('theme-toggle');

// Helper to update active navigation tab text highlights
function updateNav(activeTab) {
    document.getElementById('nav-blog').classList.toggle('active', activeTab === 'blog');
    document.getElementById('nav-vlog').classList.toggle('active', activeTab === 'vlog');
}

// Calculate runtime post layout reading metrics (Assumes average of 200 Words Per Minute)
function calculateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

// ==========================================
// 2. CENTRAL APPLICATION ROUTING SYSTEM
// ==========================================
async function router() {
    const hash = window.location.hash || '#/blog';

    // Toggle instant search bar layout visibility based on feed type properties
    const searchContainer = document.getElementById('search-container');
    if (searchContainer) {
        searchContainer.style.display = (hash === '#/blog') ? 'block' : 'none';
        // Clear previous input query elements upon changing layout pages
        if (hash !== '#/blog') {
            document.getElementById('search-input').value = '';
        }
    }

    // A. Single View Entry Routing Check: matches #/blog/slug-name or #/vlog/slug-name
    const articleMatch = hash.match(/^#\/(blog|vlog)\/(.+)$/);
    if (articleMatch) {
        const [_, type, slug] = articleMatch;
        updateNav(type);
        await renderArticle(type, slug);
        return;
    }

    // B. Stream List View Routing Check
    if (hash === '#/blog') {
        updateNav('blog');
        await renderFeed('blog');
    } else if (hash === '#/vlog') {
        updateNav('vlog');
        await renderFeed('vlog');
    } else {
        // Fallback default index point handling
        window.location.hash = '#/blog';
    }
}

// ==========================================
// 3. DATA VIEW RENDER LAYOUT ENGINES
// ==========================================

// Pull array structure from root registry ledger index file and map to viewport views
async function renderFeed(type) {
    contentDiv.innerHTML = '<p>Loading feeds...</p>';
    try {
        const response = await fetch('json/index.json');
        const data = await response.json();

        // Isolate content arrays matching targeted route stream type
        const items = data.filter(item => item.type === type);

        if (items.length === 0) {
            contentDiv.innerHTML = `<p>No ${type} entries found.</p>`;
            return;
        }

        let html = '';

        if (type === 'blog') {
            html += `<h1 class="page-main-title">Categories</h1>`;

            // Build key-value categorization buckets
            const grouped = {};
            items.forEach(item => {
                const cat = item.category || 'Uncategorized';
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(item);
            });

            // Iterate down through individual group segments
            for (const category in grouped) {
                html += `<div class="category-section">`;
                html += `<h2 class="category-heading">${category}</h2>`;
                html += `<ul class="post-list">`;

                grouped[category].forEach(item => {
                    html += `
                        <li class="post-item-minimal" style="display: flex; justify-content: space-between; align-items: baseline; padding: 0.4rem 0;">
                            <a class="post-title-link-minimal" href="#/${type}/${item.slug}" style="flex: 1; margin-right: 1rem;">${item.title}</a>
                            <span class="post-meta-minimal" style="font-size: 0.85rem; color: var(--muted); white-space: nowrap;">${item.date}</span>
                        </li>
                    `;
                });

                html += `</ul></div>`;
            }

        } else {
            // Render basic standard video card tracking lists for Vlog streams
            html += `<ul class="post-list">`;
            items.forEach(item => {
                html += `
                    <li class="post-item">
                        <div class="post-meta">${item.date}</div>
                        <a class="post-title-link" href="#/${type}/${item.slug}">${item.title}</a>
                        <p class="post-excerpt">${item.excerpt || ''}</p>
                    </li>
                `;
            });
            html += `</ul>`;
        }

        contentDiv.innerHTML = html;
    } catch (err) {
        contentDiv.innerHTML = '<p>Error loading content inventory index.</p>';
        console.error(err);
    }
}

// Pull standalone JSON file models sequentially to render reading interfaces
async function renderArticle(type, slug) {
    contentDiv.innerHTML = '<p>Reading file data...</p>';
    try {
        const response = await fetch(`json/${type}/${slug}.json`);
        if (!response.ok) throw new Error('File resource unreachable');
        const post = await response.json();

        // Calculate metadata context on the fly
        const minutes = calculateReadingTime(post.content);

        let mediaHtml = '';
        // Inject fluid responsive iframe elements if structural youtube metadata tags match
        if (type === 'vlog' && post.youtubeId) {
            mediaHtml = `
                <div class="video-container">
                    <iframe src="https://youtube.com{post.youtubeId}" allowfullscreen></iframe>
                </div>`;
        }

        contentDiv.innerHTML = `
            <article>
                <div class="article-meta">${post.date} &middot; <span>⏱️ ${minutes} min read</span></div>
                <h1 class="article-title">${post.title}</h1>
                ${mediaHtml}
                <div class="article-body">${post.content}</div>
            </article>
            <p style="margin-top: 3rem;"><a href="#/${type}" style="color: var(--accent); text-decoration: none; font-weight: 500;">&larr; Back to ${type}</a></p>
        `;

        // Reset scroll position window window view up to top upon navigating into pages
        window.scrollTo(0, 0);
    } catch (err) {
        contentDiv.innerHTML = '<p>Article file not found.</p>';
        console.error(err);
    }
}

// ==========================================
// 4. INTERACTIVE CLIENT UI UTILITIES & EVENTS
// ==========================================

// A. Instant Client-Side Search Filtering Hook
document.getElementById('search-input')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const sections = document.querySelectorAll('.post-item-minimal');
    const categories = document.querySelectorAll('.category-section');

    sections.forEach(item => {
        const match = item.textContent.toLowerCase().includes(query);
        item.style.display = match ? 'block' : 'none';
    });

    categories.forEach(cat => {
        const visibleItems = cat.querySelectorAll('.post-item-minimal[style="display: block;"]');
        if (query && visibleItems.length === 0) {
            cat.style.display = 'none';
        } else {
            cat.style.display = 'block';
        }
    });
});

// B. Reading Progress Scroll Tracker Logic
window.addEventListener('scroll', () => {
    const progressBar = document.getElementById('progress-bar');
    if (!progressBar) return;
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    progressBar.style.width = scrolled + '%';
});

// C. Dynamic Semantic Image Lightbox Interceptor
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG' && e.target.closest('.article-body')) {
        const overlay = document.createElement('div');
        overlay.id = 'image-lightbox-overlay';
        overlay.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.9); z-index:2000; display:flex; align-items:center; justify-content:center; cursor:zoom-out;';

        const cloneImg = document.createElement('img');
        cloneImg.src = e.target.src;
        cloneImg.style = 'max-width:90%; max-height:90%; object-fit:contain; border-radius:4px; transition: transform 0.2s ease;';

        overlay.appendChild(cloneImg);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => overlay.remove());
    }
});

// D. Light / Dark Theme Engine Manual LocalStorage Sync
const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
} else if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

themeToggleBtn?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    let targetTheme = 'light';

    if (!currentTheme) {
        targetTheme = systemPrefersDark ? 'light' : 'dark';
    } else if (currentTheme === 'dark') {
        targetTheme = 'light';
    } else {
        targetTheme = 'dark';
    }

    document.documentElement.setAttribute('data-theme', targetTheme);
    localStorage.setItem('theme', targetTheme);
});

// E. Global Application Core View Lifecycles
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
