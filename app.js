
class SocialMediaApp {
    constructor() {
        this.posts = [];
        this.currentUser = null;
        this.currentFilter = 'latest';
        this.editingPostId = null;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.checkAuthStatus();
        this.applyTheme();
    }


    setupEventListeners() {

        document.querySelector('#toggle-signup').addEventListener('click', () => this.toggleAuthForm());
        document.querySelector('#toggle-login').addEventListener('click', () => this.toggleAuthForm());
        document.querySelector('#login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.querySelector('#signup-form').addEventListener('submit', (e) => this.handleSignup(e));

        document.querySelector('#post-btn').addEventListener('click', () => this.createPost());

        document.querySelector('#search-input').addEventListener('input', (e) => this.searchPosts(e.target.value));
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter, e.target));
        });


        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emoji = e.target.dataset.emoji;
                const textarea = document.querySelector('#post-text');
                textarea.value += emoji;
                textarea.focus();
            });
        });


        document.querySelector('#theme-toggle').addEventListener('click', () => this.toggleTheme());


        document.querySelector('#logout-btn').addEventListener('click', () => this.logout());


        document.querySelector('.modal-close').addEventListener('click', () => this.closeEditModal());
        document.querySelector('#cancel-edit').addEventListener('click', () => this.closeEditModal());
        document.querySelector('#save-edit').addEventListener('click', () => this.saveEdit());
    }

    toggleAuthForm() {
        document.querySelector('#login-form').classList.toggle('active');
        document.querySelector('#signup-form').classList.toggle('active');
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.querySelector('#login-email').value.trim();
        const password = document.querySelector('#login-password').value.trim();

        if (!email || !password) {
            document.querySelector('#requiredPara').textContent = 'Please fill all fields';
            return;
        }

    
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            document.querySelector('#requiredPara').textContent = 'Invalid email or password!';
            return;
        }

        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.showFeed();
        this.clearAuthForms();
    }

    handleSignup(e) {
        e.preventDefault();
        const name = document.querySelector('#signup-name').value.trim();
        const email = document.querySelector('#signup-email').value.trim();
        const password = document.querySelector('#signup-password').value.trim();

        if (!name || !email || !password) {
          document.querySelector('#requiredPara').textContent = 'Please fill all fields';
            return;
        }

        if (password.length < 8) {
            document.querySelector('#requiredPara').textContent = 'Password must be at least 4 characters long!';
            return;
        }


        let users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.find(u => u.email === email)) {
            document.querySelector('#requiredPara').textContent = 'Email already registered!';
            return;
        }

        const newUser = { id: Date.now(), name, email, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        
        this.toggleAuthForm();
        this.clearAuthForms();
    }

    clearAuthForms() {
        document.querySelector('#login-email').value = '';
        document.querySelector('#login-password').value = '';
        document.querySelector('#signup-name').value = '';
        document.querySelector('#signup-email').value = '';
        document.querySelector('#signup-password').value = '';
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showFeed();
        } else {
            this.showAuth();
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showAuth();
        this.clearAuthForms();
        document.querySelector('#login-form').classList.add('active');
        document.querySelector('#signup-form').classList.remove('active');
    }

 
    showAuth() {
        document.querySelector('.auth-nav').style.display = 'flex' 
        document.querySelector('#auth-container').classList.add('active');
        document.querySelector('.feed-screen').classList.remove('active');
    }

    showFeed() {
        document.querySelector('.auth-nav').style.display = 'none' 
        document.querySelector('#auth-container').classList.remove('active');
        document.querySelector('.feed-screen').classList.add('active');
        document.querySelector('#welcome-user').textContent = `Welcome, ${this.currentUser.name}`;
        this.renderFeed();
    }


    createPost() {
        const text = document.querySelector('#post-text').value.trim();
        const imageUrl = document.querySelector('#post-image').value.trim();

        if (!text) {
            alert('Please write something to post!');
            return;
        }

        const post = {
            id: Date.now(),
            author: this.currentUser.name,
            text,
            image: imageUrl,
            likes: 0,
            liked: false,
            timestamp: new Date(),
            reactions: {}
        };

        this.posts.unshift(post);
        this.saveToStorage();
        this.renderFeed();


        document.querySelector('#post-text').value = '';
        document.querySelector('#post-image').value = '';

        console.log('[v0] Post created successfully');
    }

    deletePost(postId) {
       let delModal =  document.querySelector('#delete-modal');
       delModal.style.display = 'flex';
         document.querySelector('#confirm-delete').onclick = () => {
            this.posts = this.posts.filter(p => p.id !== postId);
            this.saveToStorage();
            this.renderFeed();
            console.log('[v0] Post deleted:', postId);
        }
        document.querySelector('#cancel-delete').onclick = () => {
            delModal.style.display = 'none';
        }
    }

    toggleLike(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            post.liked = !post.liked;
            post.likes = post.liked ? post.likes + 1 : post.likes - 1;
            this.saveToStorage();
            this.renderFeed();
        }
    }

    openEditModal(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        this.editingPostId = postId;
        document.querySelector('#edit-text').value = post.text;
        document.querySelector('#edit-image').value = post.image;
        document.querySelector('#edit-modal').classList.add('active');
    }

    closeEditModal() {
        this.editingPostId = null;
        document.querySelector('#edit-modal').classList.remove('active');
    }

    saveEdit() {
        const post = this.posts.find(p => p.id === this.editingPostId);
        if (!post) return;

        const newText = document.querySelector('#edit-text').value.trim();
        if (!newText) {
            alert('Post cannot be empty!');
            return;
        }

        post.text = newText;
        post.image = document.querySelector('#edit-image').value.trim();
        this.saveToStorage();
        this.renderFeed();
        this.closeEditModal();
        console.log('[v0] Post updated:', this.editingPostId);
    }


    searchPosts(query) {
        this.renderFeed(query);
    }

    setFilter(filter, element) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
        this.renderFeed();
    }

    getFilteredAndSortedPosts(searchQuery = '') {
        let filtered = this.posts;


        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.author.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }


        const sorted = [...filtered];
        switch (this.currentFilter) {
            case 'latest':
                sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'oldest':
                sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
            case 'popular':
                sorted.sort((a, b) => b.likes - a.likes);
                break;
            case 'trending':
                // Posts with likes from today
                sorted.sort((a, b) => {
                    const today = new Date().toDateString();
                    const aToday = new Date(a.timestamp).toDateString() === today ? 1 : 0;
                    const bToday = new Date(b.timestamp).toDateString() === today ? 1 : 0;
                    return (bToday * b.likes) - (aToday * a.likes);
                });
                break;
        }

        return sorted;
    }


    renderFeed(searchQuery = '') {
        const feed = document.querySelector('#posts-feed');
        const posts = this.getFilteredAndSortedPosts(searchQuery);

        if (posts.length === 0) {
            feed.innerHTML = '<div class="empty-state">📝 No posts found. Try searching differently!</div>';
            return;
        }

        feed.innerHTML = posts.map(post => this.createPostHTML(post)).join('');


        posts.forEach(post => {
            const likeBtn = document.querySelector(`[data-post-id="${post.id}"] .like-btn`);
            const deleteBtn = document.querySelector(`[data-post-id="${post.id}"] .delete-btn`);
            const editBtn = document.querySelector(`[data-post-id="${post.id}"] .edit-btn`);

            if (likeBtn) likeBtn.addEventListener('click', () => this.toggleLike(post.id));
            if (deleteBtn) deleteBtn.addEventListener('click', () => this.deletePost(post.id));
            if (editBtn) editBtn.addEventListener('click', () => this.openEditModal(post.id));
        });
         this.setupReactionEvents();
    }

    createPostHTML(post) {
        const timeAgo = this.getTimeAgo(post.timestamp);
        const liked = post.liked ? 'liked' : '';

        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-user">
                        <div class="post-avatar">👤</div>
                        <div class="post-info">
                            <h3>${this.escapeHtml(post.author)}</h3>
                            <span class="post-time">${timeAgo}</span>
                        </div>
                    </div>
                    <button class="post-menu">⋮</button>
                </div>
                <div class="post-content">
                    <p class="post-text">${this.escapeHtml(post.text)}</p>
                    ${post.image ? `<img src="${this.escapeHtml(post.image)}" alt="Post image" class="post-image" onerror="this.style.display='none'">` : ''}
                </div>
                <div class="post-actions">
  <button class="action-btn like-btn ${post.reaction ? 'liked' : ''}" title="Like">
        ${post.reaction ? post.reaction : '❤️'} 
        <span>${post.likes}</span>
    </button>
    <div class="reaction-popup" style="display:none;">
        <span class="reaction-btn">❤️</span>
        <span class="reaction-btn">😂</span>
        <span class="reaction-btn">😍</span>
        <span class="reaction-btn">😮</span>
        <span class="reaction-btn">😢</span>
        <span class="reaction-btn">😡</span>
        <span class="reaction-btn">👍</span>
    </div>
    <button class="action-btn edit-btn" title="Edit">✏️ Edit</button>
    <button class="action-btn delete-btn" title="Delete">🗑️ Delete</button>
                </div>
            </div>
        `;
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const postTime = new Date(timestamp);
        const diffMs = now - postTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return postTime.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }


    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        this.updateThemeButton();
    }

    applyTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        }
        this.updateThemeButton();
    }

    updateThemeButton() {
        const isDark = document.body.classList.contains('dark-mode');
        document.querySelector('#theme-toggle').textContent = isDark ? '☀️' : '🌙';
    }

    saveToStorage() {
        localStorage.setItem('socialmedia_posts', JSON.stringify(this.posts));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('socialmedia_posts');
        if (saved) {
            this.posts = JSON.parse(saved).map(p => ({
                ...p,
                timestamp: new Date(p.timestamp)
            }));
        } else {

            this.posts = [
                {
                    id: Date.now() - 3600000,
                    author: 'Mark Zuckerberg',
                    text: 'hello everyone! Welcome to LinkUp, your new favorite social media app! 🎉',
                    image: './zuckerburg.png',
                    likes: 5,
                    liked: false,
                    timestamp: new Date(Date.now() - 3600000),
                    reactions: {}
                },
                {
                    id: Date.now() - 1800000,
                    author: 'Elon Musk',
                    text: 'Excited to see what the future holds with LinkUp! Let\'s connect and innovate together. 🚀',
                    image: './elonmusk.png',
                    likes: 3,
                    liked: false,
                    timestamp: new Date(Date.now() - 1800000),
                    reactions: {}
                }
            ];
            this.saveToStorage();
        }
    }

setupReactionEvents() {
    document.querySelectorAll('.post-card').forEach(postEl => {
        const postId = Number(postEl.dataset.postId);
        const reactionPopup = postEl.querySelector('.reaction-popup');
        const likeBtn = postEl.querySelector('.like-btn');


        likeBtn.addEventListener('mouseenter', () => reactionPopup.style.display = 'flex');
        document.querySelector('.post-card').addEventListener('mouseleave', () => reactionPopup.style.display = 'none');


        reactionPopup.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.textContent;
                const post = this.posts.find(p => p.id === postId);
                if (!post) return;


                post.reaction = emoji;
                post.liked = true;
                post.likes = 1; 
                this.saveToStorage();
                this.renderFeed();
            });
        });
    });
}

}


const app = new SocialMediaApp();
