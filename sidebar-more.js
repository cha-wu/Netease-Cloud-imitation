const moreToggle = document.getElementById('moreToggle');
const moreItems = document.getElementById('moreItems');
const moreArrow = document.getElementById('moreArrow');
const collapseToggle = document.getElementById('collapseToggle');

// 更多展开键
moreToggle.addEventListener('click', function () {
    moreItems.style.display = 'block';  // 隐藏菜单
    moreToggle.style.display = 'none';  // 隐藏更多按钮
    moreArrow.classList.add('rotated'); // 箭头旋转
});

// 收起折叠
collapseToggle.addEventListener('click', function () {
    moreItems.style.display = 'none';   // 隐藏菜单
    moreToggle.style.display = 'flex';  // 重新显示更多按钮
    moreArrow.classList.remove('rotated');
});

const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');



// 搜索面板
(function () {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');
    const suggestionsPanel = document.getElementById('suggestionsPanel');
    const rowItems = document.querySelectorAll('.row-item');
    const viewMore = document.getElementById('viewMore');
    const backBtn = document.getElementById('backBtn');
    const moreBtn = document.getElementById('moreBtn');

    // 点击搜索框可以显示面板
    searchInput.addEventListener('focus', function () {
        suggestionsPanel.style.display = 'block';
    });

    // 清除按钮
    searchInput.addEventListener('input', function () {
        const hasValue = this.value.length > 0;
        clearBtn.style.display = hasValue ? 'block' : 'none';
        suggestionsPanel.style.display = 'block';
    });

    // 清除按钮点击
    clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        searchInput.value = '';
        searchInput.focus();
        clearBtn.style.display = 'none';
    });

    // 点击行内项目
    rowItems.forEach(item => {
        item.addEventListener('click', function () {
            const textEl = this.querySelector('.row-text');
            const value = textEl.textContent;
            // 更精准的搜索
            const fullValue = this.dataset.value || value;

            searchInput.value = fullValue;
            clearBtn.style.display = 'block';
            // 使用新的搜索管理器
            if (window.searchManager) {
                window.searchManager.performSearch(fullValue);
            } else if (window.player) {
                window.player.searchMusic(fullValue);
            } else {
                performSearch(fullValue);
            }
            suggestionsPanel.style.display = 'none';
        });
    });

    // 回车搜索
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {

            // 使用新的搜索管理器
            if (window.searchManager) {
                window.searchManager.performSearch(searchInput.value);
            } else if (window.player) {
                window.player.searchMusic(searchInput.value);
            } else {
                performSearch(searchInput.value);
            }

            suggestionsPanel.style.display = 'none';
        }
    });

    // 执行搜索
    function performSearch(query) {
        // trim函数，去掉开头结尾的空格
        if (query.trim()) {
            alert(`搜索: ${query}`);
            console.log('搜索:', query);
        } else {
            alert('请输入搜索内容');
        }
        // 在 renderAllResults() 之后添加
        this.addSongGridStyles();
    }

    // 点其他区域关闭面板
    document.addEventListener('click', function (e) {
        const searchContainer = document.querySelector('.search-container');
        const panel = document.getElementById('suggestionsPanel');

        if (!searchContainer.contains(e.target) && panel.style.display === 'block') {
            panel.style.display = 'none';
        }
    });

    // 点面板内部时不关闭
    suggestionsPanel.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // 返回按钮
    backBtn.addEventListener('click', function () {
        // 检查是否在搜索结果页面
        const searchContent = document.getElementById('searchResultContent');
        if (searchContent && searchContent.style.display === 'block') {
            // 返回到上一个页面
            if (window.pageManager) {
                window.pageManager.goBack();
            }
        } else {
            alert('返回');
        }
    });

    // 更多按钮
    moreBtn.addEventListener('click', function () {
        alert('更多菜单');
    });

    // 初始化
    clearBtn.style.display = 'none';
    suggestionsPanel.style.display = 'none';
})();

//  播放器类，接入API
class MusicPlayer {
    constructor() {
        this.apiBase = 'http://localhost:3000';

        // 检查音频元素
        let audioEl = document.getElementById('audioPlayer');
        if (!audioEl) {
            audioEl = document.createElement('audio');
            audioEl.id = 'audioPlayer';
            // 只预加载元数据，不加载整个文件
            audioEl.preload = 'metadata';
            document.body.appendChild(audioEl);
        }

        this.audio = audioEl;
        this.isFullscreen = false;
        this.isDragging = false;
        this.dragType = null;
        this.isMuted = false;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.volume = 0.7;
        this.currentLyrics = [];

        // 绑定事件处理函数
        this.onMouseMove = null;
        this.onMouseUp = null;

        this.init();
        this.bindEvents();


        this.fetchPlaylists();

        // 默认搜索值林俊杰
        // setTimeout(() => {
        //     this.searchMusic('林俊杰');
        // }, 1000);
    }

    init() {
        this.audio.volume = this.volume;

        this.contentArea = document.getElementById('contentArea') || document.querySelector('.main-content');

        // 进度条元素
        this.miniProgressBar = document.getElementById('miniProgressBar');
        this.fullscreenProgressBar = document.getElementById('fullscreenProgressBar');
        this.miniProgressCurrent = document.getElementById('miniProgressCurrent');
        this.fullscreenProgressCurrent = document.getElementById('fullscreenProgressCurrent');

        // 音量元素
        this.miniVolumeSlider = document.getElementById('miniVolumeSlider');
        this.miniVolumeIcon = document.getElementById('miniVolumeIcon');
        this.miniVolumeCurrent = document.getElementById('miniVolumeCurrent');

        this.updateVolumeUI();
    }

    bindEvents() {
        // 播放控制按钮
        const miniPlayBtn = document.getElementById('miniPlayPauseBtn');
        if (miniPlayBtn) {
            miniPlayBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePlay();
            });
        }

        const miniPrevBtn = document.getElementById('miniPrevBtn');
        if (miniPrevBtn) {
            miniPrevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prev();
            });
        }

        const miniNextBtn = document.getElementById('miniNextBtn');
        if (miniNextBtn) {
            miniNextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.next();
            });
        }

        const fullscreenPlayBtn = document.getElementById('fullscreenPlayPauseBtn');
        if (fullscreenPlayBtn) {
            fullscreenPlayBtn.addEventListener('click', () => this.togglePlay());
        }

        const fullscreenPrevBtn = document.getElementById('fullscreenPrevBtn');
        if (fullscreenPrevBtn) {
            fullscreenPrevBtn.addEventListener('click', () => this.prev());
        }

        const fullscreenNextBtn = document.getElementById('fullscreenNextBtn');
        if (fullscreenNextBtn) {
            fullscreenNextBtn.addEventListener('click', () => this.next());
        }

        // 进度条事件
        if (this.miniProgressBar) {
            this.setupProgressBar(this.miniProgressBar, 'mini');
        }
        if (this.fullscreenProgressBar) {
            this.setupProgressBar(this.fullscreenProgressBar, 'fullscreen');
        }

        // 音量控制
        if (this.miniVolumeSlider) {
            this.miniVolumeSlider.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setVolume(e);
            });
        }

        if (this.miniVolumeIcon) {
            this.miniVolumeIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMute();
            });
        }

        // 音频事件
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateTotalTime());
        this.audio.addEventListener('ended', () => this.next());

        // 全屏播放器切换
        const miniPlayer = document.getElementById('miniPlayer');
        if (miniPlayer) {
            miniPlayer.addEventListener('click', (e) => {
                // 向上查找，用户点击的地方不在任何按钮上，也不是按钮的子元素
                if (!e.target.closest('button') && !e.target.closest('.mini-volume')) {
                    this.openFullscreen();
                }
            });
        }

        const fullscreenBack = document.getElementById('fullscreenBack');
        if (fullscreenBack) {
            fullscreenBack.addEventListener('click', () => this.closeFullscreen());
        }
        // 遮罩层，模糊主页
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeFullscreen());
        }

        // 全局鼠标拖动
        this.onMouseMove = (e) => {
            if (this.isDragging) {
                e.preventDefault();
                if (this.dragType === 'mini' && this.miniProgressBar) {
                    this.seek(e, 'mini');
                } else if (this.dragType === 'fullscreen' && this.fullscreenProgressBar) {
                    this.seek(e, 'fullscreen');
                }
            }
        };

        this.onMouseUp = () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.dragType = null;
            }
        };

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    // 搜索音乐,定义异步函数
    async searchMusic(keyword) {
        if (!keyword.trim()) return;

        // 如果搜索管理器已初始化，使用搜索管理器显示搜索结果页面
        if (window.searchManager) {
            window.searchManager.performSearch(keyword);
            return;
        }

        // 否则，执行原有的简版搜索（加载歌曲到播放器）
        try {
            console.log(`搜索: ${keyword}`);

            const response = await fetch(`${this.apiBase}/search?keywords=${encodeURIComponent(keyword)}`);
            const data = await response.json();
            // 成功返回
            if (data.code === 200 && data.result.songs) {
                const songs = data.result.songs.slice(0, 12);

                this.playlist = [];
                for (let song of songs) {
                    try {
                        // 每首歌曲详情
                        const detailResponse = await fetch(`${this.apiBase}/song/detail?ids=${song.id}`);
                        const detailData = await detailResponse.json();

                        if (detailData.code === 200 && detailData.songs.length > 0) {
                            const songDetail = detailData.songs[0];

                            // 播放URL
                            const urlResponse = await fetch(`${this.apiBase}/song/url?id=${song.id}`);
                            const urlData = await urlResponse.json();

                            if (urlData.code === 200 && urlData.data.length > 0) {
                                const songUrl = urlData.data[0].url;

                                if (songUrl) {
                                    // 构建歌曲对象
                                    this.playlist.push({
                                        id: song.id,
                                        title: song.name,
                                        artist: song.artists.map(a => a.name).join('/'),
                                        album: song.album.name,
                                        src: songUrl,
                                        cover: song.album.picUrl || `https://picsum.photos/340/340?random=${song.id}`,
                                        duration: this.formatTime(songDetail.duration / 1000)
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        console.error('获取歌曲详情失败:', e);
                    }
                }

                if (this.playlist.length > 0) {
                    this.currentIndex = 0;
                    this.loadSong(0);

                    // 第一首歌
                    // 只渲染最新音乐区域
                    const latestRow = document.getElementById('latestMusicRow');
                    if (latestRow) {
                        latestRow.innerHTML = this.playlist.map((song, index) => `
                            <div class="music-row-item" data-index="${index}" onclick="player.playSong(${index})">
                                <div class="music-row-cover">
                                    <img src="${song.cover}" style="width:100%;height:100%;object-fit:cover;" alt="${song.title}">
                                </div>
                                <div class="music-row-info">
                                    <div class="song-name">${song.title}</div>
                                    <div class="artist">${song.artist}</div>
                                </div>
                            </div>
                            `).join('');
                    }
                } else {
                    alert('未找到可播放的歌曲');
                }
            } else {
                alert('搜索失败');
            }
        } catch (error) {
            console.error('搜索出错:', error);
            alert('搜索失败，请检查API服务是否启动');
        }
    }
    // 渲染歌单
    renderPlaylist() {
        const latestRow = document.getElementById('latestMusicRow');
        if (latestRow && this.playlist.length > 0) {
            latestRow.innerHTML = this.playlist.map((song, index) => `
            <div class="music-row-item" data-index="${index}" onclick="player.playSong(${index})">
                <div class="music-row-cover">
                    <img src="${song.cover}" style="width:100%;height:100%;object-fit:cover;" alt="${song.title}">
                </div>
                <div class="music-row-info">
                    <div class="song-name">${song.title}</div>
                    <div class="artist">${song.artist}</div>
                </div>
            </div>
        `).join('');
        }
    }

    // 播放指定索引的歌曲
    playSong(index) {
        this.currentIndex = index;
        this.loadSong(index);
        this.audio.play().catch(e => console.log('播放失败:', e));
        this.isPlaying = true;
        this.updatePlayIcons('fa-pause');
    }
    /**
    * 播放搜索结果中的歌曲（从 MusicPlayer 类调用）
    * @param {number} index - 歌曲索引
    */
    playSearchResult(index) {
        if (window.searchManager) {
            window.searchManager.playSearchSong(index);
        }
    }
    // 设置进度条
    setupProgressBar(progressBar, type) {
        if (!progressBar) return;

        progressBar.addEventListener('click', (e) => {
            e.stopPropagation();
            this.seek(e, type);
        });

        progressBar.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.isDragging = true;
            this.dragType = type;
            this.seek(e, type);
        });

        progressBar.addEventListener('mouseup', (e) => {
            e.stopPropagation();
        });
    }

    seek(e, type) {
        if (!this.audio.duration) return;
        // 类型判断
        const progressBar = type === 'mini' ? this.miniProgressBar : this.fullscreenProgressBar;
        if (!progressBar) return;
        // 进度条位置，尺寸
        const rect = progressBar.getBoundingClientRect();
        // 计算进度条位置
        let clientX = e.clientX;
        if (clientX === undefined && e.touches) {
            clientX = e.touches[0].clientX;
        }

        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        // 计算时间，跳转
        const seekTime = percent * this.audio.duration;
        this.audio.currentTime = seekTime;

        this.updateProgressUI(percent, seekTime);
    }
    /**
    * 获取歌曲播放URL
    * @param {number} songId - 歌曲ID
    * @returns {Promise<string|null>} 播放URL
    */
    async fetchSongUrl(songId) {
        try {
            const response = await fetch(`${this.apiBase}/song/url?id=${songId}`);
            const data = await response.json();
            if (data.code === 200 && data.data.length > 0) {
                return data.data[0].url;
            }
            return null;
        } catch (error) {
            console.error('获取歌曲URL失败:', error);
            return null;
        }
    }
    updateProgressUI(percent, currentTime) {
        if (this.miniProgressCurrent) {
            this.miniProgressCurrent.style.width = (percent * 100) + '%';
        }
        if (this.fullscreenProgressCurrent) {
            this.fullscreenProgressCurrent.style.width = (percent * 100) + '%';
        }
        // 格式化时间
        const timeStr = this.formatTime(currentTime);
        const miniCurrent = document.getElementById('miniCurrentTime');
        const fullscreenCurrent = document.getElementById('fullscreenCurrentTime');
        // 时间显示
        if (miniCurrent) miniCurrent.textContent = timeStr;
        if (fullscreenCurrent) fullscreenCurrent.textContent = timeStr;
    }

    updateProgress() {
        // 正在拖动进度条时，不自动更新干扰拖动
        if (this.isDragging) return;

        if (!this.audio.duration || isNaN(this.audio.duration)) return;

        const current = this.audio.currentTime;
        const duration = this.audio.duration;
        const percent = (current / duration) * 100;
        const timeStr = this.formatTime(current);

        if (this.miniProgressCurrent) {
            this.miniProgressCurrent.style.width = percent + '%';
        }
        if (this.fullscreenProgressCurrent) {
            this.fullscreenProgressCurrent.style.width = percent + '%';
        }

        const miniCurrent = document.getElementById('miniCurrentTime');
        const fullscreenCurrent = document.getElementById('fullscreenCurrentTime');

        if (miniCurrent) miniCurrent.textContent = timeStr;
        if (fullscreenCurrent) fullscreenCurrent.textContent = timeStr;
        // 更新高亮词
        this.updateLyricHighlight(current);
    }

    updateTotalTime() {
        const timeStr = this.formatTime(this.audio.duration);
        const miniTotal = document.getElementById('miniTotalTime');
        const fullscreenTotal = document.getElementById('fullscreenTotalTime');

        if (miniTotal) miniTotal.textContent = timeStr;
        if (fullscreenTotal) fullscreenTotal.textContent = timeStr;
    }

    loadSong(index) {
        if (!this.playlist[index]) return;

        const song = this.playlist[index];
        this.currentIndex = index;

        // 检查是否有播放URL
        if (!song.src) {
            console.log('歌曲暂无播放链接，尝试获取...');
            this.fetchSongUrl(song.id).then(url => {
                if (url) {
                    song.src = url;
                    this.audio.src = song.src;
                    this.audio.load();
                    this.updateSongInfo(song);
                    this.fetchLyrics(song.id);

                    if (this.isPlaying) {
                        this.audio.play().catch(e => console.log('播放失败:', e));
                    }
                } else {
                    console.error('无法获取歌曲播放链接');
                    // 可以自动跳到下一首
                    if (this.isPlaying) {
                        this.next();
                    }
                }
            });
            return;
        }

        this.audio.src = song.src;
        this.audio.load();

        this.updateSongInfo(song);

        // 获取歌词
        this.fetchLyrics(song.id);

        // 预加载下一首
        this.preloadNextSong();

    }
    /**
 * 预加载下一首歌曲
 */
    preloadNextSong() {
        const nextIndex = this.currentIndex + 1;
        if (nextIndex < this.playlist.length && !this.playlist[nextIndex].src) {
            this.fetchSongUrl(this.playlist[nextIndex].id).then(url => {
                if (url) {
                    this.playlist[nextIndex].src = url;
                    console.log('预加载下一首歌曲成功');
                }
            });
        }
    }

    async fetchLyrics(songId) {
        try {
            const response = await fetch(`${this.apiBase}/lyric?id=${songId}`);
            const data = await response.json();

            if (data.code === 200 && data.lrc && data.lrc.lyric) {
                this.parseLyrics(data.lrc.lyric);
            } else {
                this.renderDefaultLyrics();
            }
        } catch (error) {
            console.error('获取歌词失败:', error);
            this.renderDefaultLyrics();
        }
    }

    // 解析歌词字符串成可使用的结构化数据
    parseLyrics(lyricStr) {
        // 按换行符分割，将歌词文本变成数组
        const lines = lyricStr.split('\n');
        const lyrics = [];
        lines.forEach(line => {
            // 正则表达式匹配
            const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const milliseconds = parseInt(match[3]);
                const time = minutes * 60 + seconds + milliseconds / 1000;
                const text = match[4].trim();

                if (text) {
                    lyrics.push({ time, text });
                }
            }
        });

        if (lyrics.length > 0) {
            this.renderLyrics(lyrics);
        } else {
            this.renderDefaultLyrics();
        }
    }

    // 生成歌词
    renderLyrics(lyricsData) {
        const container = document.getElementById('fullscreenLyricsContainer');
        if (!container) return;

        this.currentLyrics = lyricsData;

        container.innerHTML = lyricsData.map(lyric =>
            `<div class="fullscreen-lyric-line" data-time="${lyric.time}">${lyric.text}</div>`
        ).join('');
        // 跳转
        container.querySelectorAll('.fullscreen-lyric-line').forEach(line => {
            line.addEventListener('click', () => {
                const time = parseFloat(line.dataset.time);
                this.audio.currentTime = time;
            });
        });
    }

    renderDefaultLyrics() {
        const container = document.getElementById('fullscreenLyricsContainer');
        if (!container) return;

        const lyricsData = [
            { time: 0, text: '暂无歌词' },
            { time: 1, text: '正在加载歌词...' }
        ];

        this.currentLyrics = lyricsData;

        container.innerHTML = lyricsData.map(lyric =>
            `<div class="fullscreen-lyric-line" data-time="${lyric.time}">${lyric.text}</div>`
        ).join('');
    }
    // 加载高亮词，滚动
    updateLyricHighlight(currentTime) {
        if (!this.currentLyrics) return;

        const lyrics = document.querySelectorAll('.fullscreen-lyric-line');
        if (lyrics.length === 0) return;

        let activeIndex = -1;

        for (let i = 0; i < this.currentLyrics.length; i++) {
            if (currentTime >= this.currentLyrics[i].time) {
                activeIndex = i;
            } else {
                break;
            }
        }

        lyrics.forEach((line, index) => {
            if (index === activeIndex) {
                line.classList.add('active');
                line.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                line.classList.remove('active');
            }
        });
    }

    updateSongInfo(song) {
        const miniTitle = document.getElementById('miniTitle');
        const miniArtist = document.getElementById('miniArtist');
        const miniCover = document.getElementById('miniCover');
        const miniTotal = document.getElementById('miniTotalTime');

        const detailTitle = document.getElementById('detailTitle');
        const fullscreenArtist = document.getElementById('fullscreenArtist');
        const fullscreenAlbum = document.getElementById('fullscreenAlbum');
        const detailCover = document.getElementById('detailCover');
        const fullscreenTotal = document.getElementById('fullscreenTotalTime');
        // 更新
        if (miniTitle) miniTitle.textContent = song.title;
        if (miniArtist) miniArtist.textContent = song.artist;
        if (miniCover) miniCover.src = song.cover;
        if (miniTotal) miniTotal.textContent = song.duration;

        if (detailTitle) detailTitle.textContent = song.title;
        if (fullscreenArtist) fullscreenArtist.textContent = song.artist;
        if (fullscreenAlbum) fullscreenAlbum.textContent = song.album;
        if (detailCover) detailCover.src = song.cover;
        if (fullscreenTotal) fullscreenTotal.textContent = song.duration;
    }

    togglePlay() {
        if (this.isPlaying) {
            this.audio.pause();
            this.updatePlayIcons('fa-play');
        } else {
            this.audio.play().catch(e => console.log('播放失败:', e));
            this.updatePlayIcons('fa-pause');
        }
        // 切换状态
        this.isPlaying = !this.isPlaying;
    }

    updatePlayIcons(iconClass) {
        const miniIcon = document.getElementById('miniPlayIcon');
        const fullscreenIcon = document.getElementById('fullscreenPlayIcon');

        if (miniIcon) miniIcon.className = `fas ${iconClass}`;
        if (fullscreenIcon) fullscreenIcon.className = `fas ${iconClass}`;
    }

    prev() {
        if (this.playlist.length === 0) return;

        let newIndex = this.currentIndex - 1;
        if (newIndex < 0) newIndex = this.playlist.length - 1;

        // 检查上一首歌曲是否有播放URL
        if (!this.playlist[newIndex].src) {
            // 如果没有URL，尝试获取
            this.fetchSongUrl(this.playlist[newIndex].id).then(url => {
                if (url) {
                    this.playlist[newIndex].src = url;
                    this.loadSong(newIndex);
                    if (this.isPlaying) {
                        this.audio.play().catch(e => console.log('播放失败:', e));
                    }
                } else {
                    console.log('上一首歌曲暂无播放链接，自动跳过');
                    // 如果没有URL，自动跳到上一首
                    this.prev();
                }
            });
        } else {
            this.loadSong(newIndex);
            if (this.isPlaying) {
                this.audio.play().catch(e => console.log('播放失败:', e));
            }
        }
    }

    next() {
        if (this.playlist.length === 0) return;

        let newIndex = this.currentIndex + 1;
        if (newIndex >= this.playlist.length) newIndex = 0;

        // 检查下一首歌曲是否有播放URL
        if (!this.playlist[newIndex].src) {
            // 如果没有URL，尝试获取
            this.fetchSongUrl(this.playlist[newIndex].id).then(url => {
                if (url) {
                    this.playlist[newIndex].src = url;
                    this.loadSong(newIndex);
                    if (this.isPlaying) {
                        this.audio.play().catch(e => console.log('播放失败:', e));
                    }
                } else {
                    console.log('下一首歌曲暂无播放链接，自动跳过');
                    // 如果没有URL，自动跳到下一首
                    this.next();
                }
            });
        } else {
            this.loadSong(newIndex);
            if (this.isPlaying) {
                this.audio.play().catch(e => console.log('播放失败:', e));
            }
        }
    }

    setVolume(e) {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.min(1, Math.max(0, clickX / rect.width));

        this.volume = percent;
        this.audio.volume = percent;
        this.updateVolumeUI();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audio.muted = this.isMuted;
        this.updateVolumeUI();
    }

    updateVolumeUI() {
        if (!this.miniVolumeCurrent) return;

        const percent = this.isMuted ? 0 : this.volume * 100;
        this.miniVolumeCurrent.style.width = percent + '%';

        if (!this.miniVolumeIcon) return;

        if (this.isMuted || this.volume === 0) {
            this.miniVolumeIcon.className = 'fas fa-volume-mute';
        } else if (this.volume < 0.5) {
            this.miniVolumeIcon.className = 'fas fa-volume-down';
        } else {
            this.miniVolumeIcon.className = 'fas fa-volume-up';
        }
    }

    openFullscreen() {
        this.isFullscreen = true;
        const fullscreenPlayer = document.getElementById('fullscreenPlayer');
        const overlay = document.getElementById('overlay');

        if (fullscreenPlayer) fullscreenPlayer.classList.add('active');
        if (overlay) overlay.classList.add('active');
        if (this.contentArea) this.contentArea.style.filter = 'blur(4px)';
    }

    closeFullscreen() {
        this.isFullscreen = false;
        const fullscreenPlayer = document.getElementById('fullscreenPlayer');
        const overlay = document.getElementById('overlay');

        if (fullscreenPlayer) fullscreenPlayer.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (this.contentArea) this.contentArea.style.filter = 'none';
    }

    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' + secs : secs}`;
    }



    // 获取官方歌单
    async fetchPlaylists() {
        try {
            // 获取多个歌单（这里用一些热门歌单ID）
            const playlistIds = [
                '3778678',  // 热歌榜
                '3779629',  // 新歌榜
                '2809577409', // 电子音乐
                '2884035',  // 原创歌曲榜
                '19723756', // 云音乐飙升榜
                '3778678'   // 热歌榜（重复用于演示）
            ];

            const playlists = [];

            // 只取前6个歌单（和你的卡片数量匹配）
            for (let i = 0; i < 6; i++) {
                try {
                    const response = await fetch(`${this.apiBase}/playlist/detail?id=${playlistIds[i]}`);
                    const data = await response.json();

                    if (data.code === 200 && data.playlist) {
                        const playlist = data.playlist;

                        // 获取歌单的前3首歌曲用于显示
                        const songs = playlist.tracks.slice(0, 3).map(track => track.name);

                        playlists.push({
                            id: playlist.id,
                            name: playlist.name,
                            cover: playlist.coverImgUrl,
                            playCount: this.formatPlayCount(playlist.playCount),
                            tracks: songs,
                            trackCount: playlist.trackCount
                        });
                    }
                } catch (e) {
                    console.error('获取歌单失败:', e);
                }
            }

            this.renderPlaylists(playlists);
        } catch (error) {
            console.error('获取歌单列表失败:', error);
        }
    }
    // 播放歌单第一首歌
    async playPlaylistFirst(playlistId) {
        try {
            const response = await fetch(`${this.apiBase}/playlist/detail?id=${playlistId}`);
            const data = await response.json();

            if (data.code === 200 && data.playlist && data.playlist.tracks.length > 0) {
                const firstSong = data.playlist.tracks[0];

                // 获取播放URL
                const urlResponse = await fetch(`${this.apiBase}/song/url?id=${firstSong.id}`);
                const urlData = await urlResponse.json();

                if (urlData.code === 200 && urlData.data.length > 0) {
                    const songUrl = urlData.data[0].url;

                    if (songUrl) {
                        // 创建播放列表（歌单的所有歌曲）
                        this.playlist = data.playlist.tracks.map(track => ({
                            id: track.id,
                            title: track.name,
                            artist: track.artists.map(a => a.name).join('/'),
                            album: track.album.name,
                            cover: track.album.picUrl,
                            duration: this.formatTime(track.duration / 1000)
                        }));

                        // 获取每首歌的播放URL
                        for (let i = 0; i < this.playlist.length; i++) {
                            try {
                                const urlResp = await fetch(`${this.apiBase}/song/url?id=${this.playlist[i].id}`);
                                const urlData = await urlResp.json();
                                if (urlData.code === 200 && urlData.data.length > 0) {
                                    this.playlist[i].src = urlData.data[0].url;
                                }
                            } catch (e) {
                                console.error('获取歌曲URL失败:', e);
                            }
                        }

                        // 过滤掉没有播放地址的歌曲
                        this.playlist = this.playlist.filter(song => song.src);

                        if (this.playlist.length > 0) {
                            this.currentIndex = 0;
                            this.loadSong(0);
                            this.audio.play();
                            this.isPlaying = true;
                            this.updatePlayIcons('fa-pause');

                            // 打开全屏播放器
                            this.openFullscreen();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('播放失败:', error);
            alert('播放失败，请稍后重试');
        }
    }
    // 格式化播放量
    formatPlayCount(count) {
        if (count >= 10000) {
            return (count / 10000).toFixed(1) + '万';
        }
        return count.toString();
    }

    // 渲染歌单到页面
    renderPlaylists(playlists) {
        const cardGrid = document.querySelector('.card-grid');
        if (!cardGrid || playlists.length === 0) return;

        cardGrid.innerHTML = playlists.map(playlist => `
        <div class="music-card" data-id="${playlist.id}" onclick="player.openPlaylist(${playlist.id})">
            <div class="card-img">
                <img src="${playlist.cover}" alt="${playlist.name}">
                <span class="play-count"><i class="fas fa-headphones"></i> ${playlist.playCount}</span>
                
                <!-- 覆盖层 -->
                <div class="card-overlay">
                    <div class="play-overlay-btn" onclick="event.stopPropagation(); player.playPlaylistFirst(${playlist.id})">
                        <i class="fas fa-play"></i>
                    </div>
                    <div class="overlay-songs">
                        ${playlist.tracks.map(song => `
                            <div class="overlay-song">
                                <i class="fas fa-music"></i> ${song}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="card-info">
                <h4>${playlist.name}</h4>
                <p><i class="fas fa-headphones"></i> ${playlist.playCount}</p>
            </div>
        </div>
    `).join('');
    }

    // 打开歌单（点击卡片）
    openPlaylist(playlistId) {
        console.log('打开歌单:', playlistId);
        // 这里可以跳转到歌单详情页
        alert(`打开歌单 ID: ${playlistId}`);
    }

    // 播放歌单第一首歌（点击覆盖层的播放按钮）
    async playPlaylistFirst(playlistId) {
        try {
            const response = await fetch(`${this.apiBase}/playlist/detail?id=${playlistId}`);
            const data = await response.json();

            if (data.code === 200 && data.playlist && data.playlist.tracks.length > 0) {
                const firstSong = data.playlist.tracks[0];

                // 获取播放URL
                const urlResponse = await fetch(`${this.apiBase}/song/url?id=${firstSong.id}`);
                const urlData = await urlResponse.json();

                if (urlData.code === 200 && urlData.data.length > 0) {
                    const songUrl = urlData.data[0].url;

                    if (songUrl) {
                        // 创建临时播放列表
                        this.playlist = [{
                            id: firstSong.id,
                            title: firstSong.name,
                            artist: firstSong.artists.map(a => a.name).join('/'),
                            album: firstSong.album.name,
                            src: songUrl,
                            cover: firstSong.album.picUrl,
                            duration: this.formatTime(firstSong.duration / 1000)
                        }];

                        this.currentIndex = 0;
                        this.loadSong(0);
                        this.audio.play();
                        this.isPlaying = true;
                        this.updatePlayIcons('fa-pause');

                        // 打开全屏播放器
                        this.openFullscreen();
                    }
                }
            }
        } catch (error) {
            console.error('播放失败:', error);
        }
    }
}

// 初始化播放器
let player;
let playlistCarousel;
document.addEventListener('DOMContentLoaded', () => {
    try {
        player = new MusicPlayer();
        window.player = player;
        console.log('播放器初始化成功');

        // 初始化歌单轮播
        setTimeout(() => {
            playlistCarousel = new PlaylistCarousel('http://localhost:3000');
        }, 500); // 设延迟，等播放器初始化完成
    } catch (e) {
        console.error('播放器初始化失败:', e);
    }
});



//  歌单轮播 
class PlaylistCarousel {
    constructor(apiBase) {
        this.apiBase = apiBase;
        this.playlists = [];
        this.currentIndex = 0;
        this.visibleCount = this.getVisibleCount(); // 每屏显示的卡片数
        this.totalPages = 0;
        this.carousel = document.getElementById('playlistCarousel');
        this.dotsContainer = document.getElementById('playlistDots');
        this.prevBtn = document.getElementById('playlistPrev');
        this.nextBtn = document.getElementById('playlistNext');


        this.autoPlayInterval = null;
        this.autoPlayDelay = 5000;

        this.init();
        this.startAutoPlay();

        this.init();
    }

    // 屏幕适配
    getVisibleCount() {
        const width = window.innerWidth;
        if (width > 1200) return 5;
        if (width > 992) return 4;
        if (width > 768) return 3;
        if (width > 480) return 2;
        return 1;
    }

    async init() {
        await this.fetchPlaylists();
        this.render();
        this.bindEvents();

        // 监听窗口大小变化，重新计算
        window.addEventListener('resize', () => {
            const newCount = this.getVisibleCount();
            if (newCount !== this.visibleCount) {
                this.visibleCount = newCount;
                this.totalPages = Math.ceil(this.playlists.length / this.visibleCount);
                this.currentIndex = Math.min(this.currentIndex, this.totalPages - 1);
                this.updateCarousel();
                this.renderDots();
            }
        });
    }

    // 获取歌单数据
    async fetchPlaylists() {
        // 显示加载状态
        if (this.carousel) {
            this.carousel.innerHTML = '<div class="carousel-loading">加载歌单中...</div>';
        }

        try {
            // 热门歌单
            const playlistIds = [
                '3778678',
                '3779629',
                '2809577409',
                '2884035',
                '19723756',
                '2250011882',
                '60198',
                '713687087',
                '745098260',
                '2681808683'
            ];

            this.playlists = [];

            for (let id of playlistIds) {
                try {
                    const response = await fetch(`${this.apiBase}/playlist/detail?id=${id}`);
                    const data = await response.json();

                    if (data.code === 200 && data.playlist) {
                        const playlist = data.playlist;

                        // 获取歌单的前3首歌曲
                        const songs = playlist.tracks.slice(0, 3).map(track => track.name);

                        this.playlists.push({
                            id: playlist.id,
                            name: playlist.name,
                            cover: playlist.coverImgUrl,
                            playCount: this.formatPlayCount(playlist.playCount),
                            tracks: songs,
                            trackCount: playlist.trackCount
                        });
                    }
                } catch (e) {
                    console.error('获取歌单失败:', e);
                }
            }

            this.totalPages = Math.ceil(this.playlists.length / this.visibleCount);

        } catch (error) {
            console.error('获取歌单列表失败:', error);
            this.playlists = this.getFallbackPlaylists(); // 获取失败用备用数据
            this.totalPages = Math.ceil(this.playlists.length / this.visibleCount);
        }
    }

    // 当API失败，使用备用数据
    getFallbackPlaylists() {
        return [
            {
                id: '1',
                name: '热歌榜',
                cover: 'https://picsum.photos/200/200?random=1',
                playCount: '556.8万',
                tracks: ['七里香', '告白气球', '稻香']
            },
            {
                id: '2',
                name: '新歌榜',
                cover: 'https://picsum.photos/200/200?random=2',
                playCount: '324.2万',
                tracks: ['我会等', '笼', '向云端']
            },
            {
                id: '3',
                name: '电子音乐',
                cover: 'https://picsum.photos/200/200?random=3',
                playCount: '189.3万',
                tracks: ['Faded', 'Alone', 'The Spectre']
            },
            {
                id: '4',
                name: '原创歌曲榜',
                cover: 'https://picsum.photos/200/200?random=4',
                playCount: '267.8万',
                tracks: ['我记得', '最优解', '唯一的']
            },
            {
                id: '5',
                name: '云音乐飙升榜',
                cover: 'https://picsum.photos/200/200?random=5',
                playCount: '432.1万',
                tracks: ['可能', '是妈妈是女儿', '说好的']
            },
            {
                id: '6',
                name: '流行音乐',
                cover: 'https://picsum.photos/200/200?random=6',
                playCount: '789.4万',
                tracks: ['乌梅子酱', '雪', '星光']
            }
        ];
    }

    // 格式化播放量
    formatPlayCount(count) {
        if (count >= 10000) {
            return (count / 10000).toFixed(1) + '万';
        }
        return count.toString();
    }

    // 渲染轮播
    render() {
        if (!this.carousel) return;

        this.carousel.innerHTML = this.playlists.map(playlist => `
            <div class="music-card" data-id="${playlist.id}">
                <div class="card-img">
                    <img src="${playlist.cover}" alt="${playlist.name}" loading="lazy">
                    <span class="play-count"><i class="fas fa-headphones"></i> ${playlist.playCount}</span>
                    
                    <!-- 覆盖层 -->
                    <div class="card-overlay">
                        <div class="play-overlay-btn" onclick="event.stopPropagation(); window.player && window.player.playPlaylistFirst('${playlist.id}')">
                            <i class="fas fa-play"></i>
                        </div>
                        <div class="overlay-songs">
                            ${playlist.tracks.map(song => `
                                <div class="overlay-song">
                                    <i class="fas fa-music"></i> ${song}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="card-info">
                    <h4>${playlist.name}</h4>
                    <p><i class="fas fa-headphones"></i> ${playlist.playCount}</p>
                </div>
            </div>
        `).join('');

        // 绑定点击事件
        this.carousel.querySelectorAll('.music-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                const playlistId = card.dataset.id;
                this.openPlaylist(playlistId, index);
            });
        });

        this.renderDots();
        this.updateCarousel();
    }

    // 渲染分页点
    renderDots() {
        if (!this.dotsContainer) return;

        let dotsHtml = '';
        for (let i = 0; i < this.totalPages; i++) {
            dotsHtml += `<span class="dot ${i === this.currentIndex ? 'active' : ''}" data-index="${i}"></span>`;
        }

        this.dotsContainer.innerHTML = dotsHtml;

        // 绑定点击事件
        this.dotsContainer.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.dataset.index);
                this.goToPage(index);
            });
        });
    }

    // 更新轮播位置
    updateCarousel() {
        if (!this.carousel) return;

        const cardWidth = this.carousel.querySelector('.music-card')?.offsetWidth || 200;
        const gap = 20;
        const translateX = -this.currentIndex * (cardWidth + gap) * this.visibleCount;

        this.carousel.style.transform = `translateX(${translateX}px)`;

        // 更新按钮状态
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentIndex === 0;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentIndex === this.totalPages - 1;
        }

        // 更新分页点激活状态
        if (this.dotsContainer) {
            this.dotsContainer.querySelectorAll('.dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === this.currentIndex);
            });
        }
    }

    // 上一页
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateCarousel();
        }
    }

    // 下一页
    next() {
        if (this.currentIndex < this.totalPages - 1) {
            this.currentIndex++;
            this.updateCarousel();
        }
    }

    // 跳转到指定页
    goToPage(index) {
        if (index >= 0 && index < this.totalPages) {
            this.currentIndex = index;
            this.updateCarousel();
        }
    }


    // 自动轮播
    startAutoPlay() {
        this.stopAutoPlay();
        this.autoPlayInterval = setInterval(() => {
            if (this.currentIndex < this.totalPages - 1) {
                this.next();
            } else {
                this.goToPage(0); // 循环到第一页
            }
        }, this.autoPlayDelay);
    }

    // 停止自动轮播
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    // 绑定事件,鼠标悬停时自动暂停轮播
    bindEvents() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                this.prev();
                this.stopAutoPlay();
                this.startAutoPlay(); // 重新开始计时
            });
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                this.next();
                this.stopAutoPlay();
                this.startAutoPlay();
            });
        }

        // 鼠标悬停在轮播区域，暂停自动轮播
        if (this.carousel) {
            this.carousel.addEventListener('mouseenter', () => this.stopAutoPlay());
            this.carousel.addEventListener('mouseleave', () => this.startAutoPlay());
        }

        // 鼠标悬停在分页点上时也暂停
        if (this.dotsContainer) {
            this.dotsContainer.addEventListener('mouseenter', () => this.stopAutoPlay());
            this.dotsContainer.addEventListener('mouseleave', () => this.startAutoPlay());
        }
    }

    // 打开歌单
    openPlaylist(playlistId, index) {
        console.log('打开歌单:', playlistId);
        // 可以在这里实现跳转到歌单详情页
        alert(`打开歌单: ${this.playlists[index]?.name || playlistId}`);
    }
}


// 有声书板块 
function renderAudioBooks() {
    const audioBookRow = document.getElementById('audioBookRow');
    if (!audioBookRow) return;

    // 静态有声书数据
    const audioBooks = [
        {
            title: '三体：全册有声书',
            artist: '刘慈欣 / 有声剧场',
            cover: 'https://picsum.photos/70/70?random=101',
            duration: '45:30'
        },
        {
            title: '活着（张震演播）',
            artist: '余华 / 张震',
            cover: 'https://picsum.photos/70/70?random=102',
            duration: '32:15'
        },
        {
            title: '平凡的世界',
            artist: '路遥 / 李野默',
            cover: 'https://picsum.photos/70/70?random=103',
            duration: '58:20'
        },
        {
            title: '白夜行',
            artist: '东野圭吾 / 有声剧场',
            cover: 'https://picsum.photos/70/70?random=104',
            duration: '41:10'
        },
        {
            title: '百年孤独',
            artist: '马尔克斯 / 有声书',
            cover: 'https://picsum.photos/70/70?random=105',
            duration: '36:45'
        },
        {
            title: '解忧杂货店',
            artist: '东野圭吾 / 有声剧场',
            cover: 'https://picsum.photos/70/70?random=106',
            duration: '29:30'
        },
        {
            title: '追风筝的人',
            artist: '卡勒德·胡赛尼',
            cover: 'https://picsum.photos/70/70?random=107',
            duration: '38:25'
        },
        {
            title: '小王子',
            artist: '圣埃克苏佩里',
            cover: 'https://picsum.photos/70/70?random=108',
            duration: '22:15'
        }
    ];

    // 生成HTML
    let html = '';
    audioBooks.forEach(book => {
        html += `
            <div class="music-row-item">
                <div class="music-row-cover">
                    <img src="${book.cover}" style="width:100%;height:100%;object-fit:cover;" alt="${book.title}">
                </div>
                <div class="music-row-info">
                    <div class="song-name">📚 ${book.title}</div>
                    <div class="artist">🎤 ${book.artist}</div>
                </div>
            </div>
        `;
    });

    audioBookRow.innerHTML = html;
}

// 页面加载完成后
document.addEventListener('DOMContentLoaded', function () {
    console.log('页面加载完成，开始渲染有声书...');

    // 稍微延迟，确保DOM完全加载
    setTimeout(() => {
        renderAudioBooks();
        console.log('有声书渲染函数执行完毕');
    }, 500);
});


// 页面切换 
class PageManager {
    constructor() {
        this.chipJingxuan = document.getElementById('chipJingxuan');
        this.chipGedan = document.getElementById('chipGedan');
        this.jingxuanContent = document.getElementById('jingxuanContent');
        this.gedanContent = document.getElementById('gedanContent');
        this.gedanGrid = document.getElementById('gedanGrid');

        this.searchContent = document.getElementById('searchResultContent');

        // 存储所有歌单数据（用于筛选）
        this.allPlaylists = [];

        // 当前激活的筛选标签
        this.currentFilter = '全部';

        // 筛选标签与关键词的映射
        this.filterKeywords = {
            '华语': ['华语', '中文', '中国', '港台', '内地', '台湾', '香港', '古风', '国风'],
            '欧美': ['欧美', '英语', '英文', 'American', 'English', 'US', 'UK', '欧洲', '美国', '英国', '说唱'],
            '日韩': ['日韩', '日语', '韩语', '日语', 'K-POP', 'J-POP', '韩国', '日本', 'Anime', '动漫'],
            '流行': ['流行', 'Pop', '流行音乐', '热歌', '新歌', '飙升', '榜'],
            '摇滚': ['摇滚', 'Rock', '摇滚', '金属', 'Metal', '朋克', 'Punk'],
            '民谣': ['民谣', 'Folk', '民谣', '吉他', '吉他', '清新'],
            '电子': ['电子', 'EDM', '电音', '电子音乐', 'DJ', '舞曲', 'House', 'Techno']
        };

        // 保存上一个页面状态
        this.lastPage = 'jingxuan'; // 'jingxuan' 或 'gedan'

        this.init();
    }

    init() {
        // 绑定点击事件
        if (this.chipJingxuan) {
            this.chipJingxuan.addEventListener('click', () => this.switchToJingxuan());
        }
        if (this.chipGedan) {
            this.chipGedan.addEventListener('click', () => this.switchToGedan());
        }

        // 初始化加载歌单广场
        this.loadGedanData();
        this.initFilters();


    }

    initFilters() {
        const filterChips = document.querySelectorAll('.filter-chip');
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                // 移除其他激活状态
                filterChips.forEach(c => c.classList.remove('active'));
                // 激活当前点击
                chip.classList.add('active');

                // 筛选

                // 获取筛选标签（优先使用 data-filter 属性，回退到 textContent）
                const filterText = chip.getAttribute('data-filter') || chip.textContent.trim();
                this.currentFilter = filterText;

                // 执行筛选
                this.filterPlaylists(filterText);
            });
        });
    }


    /**
     * 根据筛选标签过滤歌单
     * @param {string} filterText - 筛选标签文本
     */
    filterPlaylists(filterText) {
        console.log('🎵 蕾姆正在筛选:', filterText);

        // 如果选择"全部"，显示所有歌单
        if (filterText === '全部') {
            this.renderGedanGrid(this.allPlaylists);
            return;
        }

        // 根据标签关键词过滤歌单
        const keywords = this.filterKeywords[filterText] || [];
        const filteredPlaylists = this.allPlaylists.filter(playlist => {
            const name = playlist.name.toLowerCase();

            // 检查歌单名称是否包含任何相关关键词
            return keywords.some(keyword => name.includes(keyword.toLowerCase()));
        });

        console.log(`✨ 筛选结果: "${filterText}" 找到 ${filteredPlaylists.length} 个歌单`);

        // 渲染筛选后的结果
        if (filteredPlaylists.length > 0) {
            this.renderGedanGrid(filteredPlaylists);
        } else {
            // 如果没有找到匹配的歌单，显示友好提示
            this.renderNoResults(filterText);
        }
    }

    /**
     * 渲染"没有找到结果"的提示
     */
    renderNoResults(filterText) {
        if (!this.gedanGrid) return;

        this.gedanGrid.innerHTML = `
            <div class="no-results" style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                color: #8f9eb5;
            ">
                <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                <p style="font-size: 16px; margin-bottom: 10px;">没有找到"${filterText}"相关的歌单</p>
                <p style="font-size: 14px; opacity: 0.7;">试试其他标签吧～</p>
            </div>
        `;
    }


    switchToJingxuan() {
        // 更新标签
        this.chipJingxuan.classList.add('highlight');
        this.chipGedan.classList.remove('highlight');
        // 显示 content-pane（包含精选标签和内容）
        const contentPane = document.querySelector('.content-pane');
        if (contentPane) {
            contentPane.style.display = 'block';
        }

        // 切换内容
        this.jingxuanContent.style.display = 'block';
        this.gedanContent.style.display = 'none';

        // 隐藏搜索结果
        const searchContent = document.getElementById('searchResultContent');
        if (searchContent) {
            searchContent.style.display = 'none';
        }

        // 保存当前页面状态
        this.lastPage = 'jingxuan';
    }

    switchToGedan() {
        // 更新标签
        this.chipGedan.classList.add('highlight');
        this.chipJingxuan.classList.remove('highlight');
        // 显示 content-pane（包含精选标签和内容）
        const contentPane = document.querySelector('.content-pane');
        if (contentPane) {
            contentPane.style.display = 'block';
        }

        // 切换内容
        this.jingxuanContent.style.display = 'none';
        this.gedanContent.style.display = 'block';


        // 隐藏搜索结果
        const searchContent = document.getElementById('searchResultContent');
        if (searchContent) {
            searchContent.style.display = 'none';
        }

        // 保存当前页面状态
        this.lastPage = 'gedan';
    }

    /**
     * 返回上一个页面
     */
    goBack() {
        if (this.lastPage === 'jingxuan') {
            this.switchToJingxuan();
        } else {
            this.switchToGedan();
        }
        // 切换内容显示
        this.jingxuanContent.style.display = 'none';
        this.gedanContent.style.display = 'block';
    }

    async loadGedanData() {
        if (!this.gedanGrid) return;

        try {
            // 歌单列表
            const playlistIds = [
                '3778678',  // 热歌榜
                '3779629',  // 新歌榜
                '2809577409', // 电子音乐
                '2884035',  // 原创歌曲榜
                '19723756', // 云音乐飙升榜
                '2250011882', // 流行音乐
                '60198',    // 经典老歌
                '713687087', // 摇滚
                '745098260', // 民谣
                '2681808683', // 说唱
                '218452172', // 治愈
                '3136952023', // 运动
                '3136952023', // 运动
                '3778678',  // 热歌榜（重复用于演示，实际应该用不同的ID）
                '3779629',  // 新歌榜
                '2809577409', // 电子音乐
                '2884035',  // 原创歌曲榜
                '19723756', // 云音乐飙升榜
                '2250011882', // 流行音乐
                '60198',    // 经典老歌
                '713687087', // 摇滚
                '745098260', // 民谣
                '2681808683', // 说唱
                '218452172', // 治愈
                '3136952023', // 运动
                '3778678',  // 热歌榜
                '3779629',  // 新歌榜
                '2809577409', // 电子音乐
                '2884035',  // 原创歌曲榜
                '19723756', // 云音乐飙升榜
                '2250011882' // 流行音乐
            ];

            const playlists = [];

            for (let id of playlistIds) {
                try {
                    const response = await fetch(`http://localhost:3000/playlist/detail?id=${id}`);
                    const data = await response.json();

                    if (data.code === 200 && data.playlist) {
                        const playlist = data.playlist;

                        playlists.push({
                            id: playlist.id,
                            name: playlist.name,
                            cover: playlist.coverImgUrl,
                            playCount: this.formatPlayCount(playlist.playCount),
                            trackCount: playlist.trackCount
                        });
                    }
                } catch (e) {
                    console.error('获取歌单失败:', e);
                }
            }

            if (playlists.length > 0) {

                // 保存所有歌单数据用于筛选
                this.allPlaylists = playlists;
                this.renderGedanGrid(playlists);
            } else {
                this.renderFallbackGedan();
            }
        } catch (error) {
            console.error('加载歌单失败:', error);
            this.renderFallbackGedan();
        }
    }

    renderGedanGrid(playlists) {
        if (!this.gedanGrid) return;


        // 添加淡入动画效果
        this.gedanGrid.style.opacity = '0';
        this.gedanGrid.style.transform = 'translateY(10px)';
        this.gedanGrid.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        this.gedanGrid.innerHTML = playlists.map(playlist => `
            <div class="music-card" data-id="${playlist.id}">
                <div class="card-img">
                    <img src="${playlist.cover}" alt="${playlist.name}" loading="lazy">
                    <span class="play-count"><i class="fas fa-headphones"></i> ${playlist.playCount}</span>
                    
                    <div class="card-overlay">
                        <div class="play-overlay-btn" onclick="event.stopPropagation(); window.player && window.player.playPlaylistFirst('${playlist.id}')">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                </div>
                <div class="card-info">
                    <h4>${playlist.name}</h4>
                    <p><i class="fas fa-music"></i> ${playlist.trackCount}首</p>
                </div>
            </div>
        `).join('');

        // 添加分页
        this.addPagination();

        // 触发重排后添加动画类
        requestAnimationFrame(() => {
            this.gedanGrid.style.opacity = '1';
            this.gedanGrid.style.transform = 'translateY(0)';
        });
    }

    renderFallbackGedan() {
        if (!this.gedanGrid) return;


        // 添加淡入动画效果
        this.gedanGrid.style.opacity = '0';
        this.gedanGrid.style.transform = 'translateY(10px)';
        this.gedanGrid.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        const fallbackPlaylists = [
            {
                id: '1',
                name: '华语热歌榜',
                cover: 'https://picsum.photos/200/200?random=101',
                playCount: '556.8万',
                trackCount: 50
            },
            {
                id: '2',
                name: '新歌榜',
                cover: 'https://picsum.photos/200/200?random=102',
                playCount: '324.2万',
                trackCount: 50
            },
            {
                id: '3',
                name: '电子音乐精选',
                cover: 'https://picsum.photos/200/200?random=103',
                playCount: '189.3万',
                trackCount: 45
            },
            {
                id: '4',
                name: '原创歌曲榜',
                cover: 'https://picsum.photos/200/200?random=104',
                playCount: '267.8万',
                trackCount: 40
            },
            {
                id: '5',
                name: '云音乐飙升榜',
                cover: 'https://picsum.photos/200/200?random=105',
                playCount: '432.1万',
                trackCount: 50
            },
            {
                id: '6',
                name: '欧美流行音乐',
                cover: 'https://picsum.photos/200/200?random=106',
                playCount: '789.4万',
                trackCount: 60
            },
            {
                id: '7',
                name: '经典民歌合集',
                cover: 'https://picsum.photos/200/200?random=107',
                playCount: '654.3万',
                trackCount: 55
            },
            {
                id: '8',
                name: '摇滚精神',
                cover: 'https://picsum.photos/200/200?random=108',
                playCount: '321.5万',
                trackCount: 42
            },
            {
                id: '9',
                name: '日语动漫金曲',
                cover: 'https://picsum.photos/200/200?random=109',
                playCount: '456.2万',
                trackCount: 38
            },
            {
                id: '10',
                name: '韩流K-POP',
                cover: 'https://picsum.photos/200/200?random=110',
                playCount: '678.9万',
                trackCount: 52
            },
            {
                id: '11',
                name: '华语民谣',
                cover: 'https://picsum.photos/200/200?random=111',
                playCount: '234.5万',
                trackCount: 47
            },
            {
                id: '12',
                name: 'EDM电音派对',
                cover: 'https://picsum.photos/200/200?random=112',
                playCount: '345.6万',
                trackCount: 35
            }
        ];

        // 保存到 allPlaylists 以支持筛选
        this.allPlaylists = fallbackPlaylists;

        this.gedanGrid.innerHTML = fallbackPlaylists.map(playlist => `
            <div class="music-card" data-id="${playlist.id}">
                <div class="card-img">
                    <img src="${playlist.cover}" alt="${playlist.name}" loading="lazy">
                    <span class="play-count"><i class="fas fa-headphones"></i> ${playlist.playCount}</span>
                    
                    <div class="card-overlay">
                        <div class="play-overlay-btn" onclick="event.stopPropagation(); window.player && window.player.playPlaylistFirst('${playlist.id}')">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                </div>
                <div class="card-info">
                    <h4>${playlist.name}</h4>
                    <p><i class="fas fa-music"></i> ${playlist.trackCount}首</p>
                </div>
            </div>
        `).join('');

        this.addPagination();

        // 触发重排后添加动画类
        requestAnimationFrame(() => {
            this.gedanGrid.style.opacity = '1';
            this.gedanGrid.style.transform = 'translateY(0)';
        });
    }

    addPagination() {
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        pagination.innerHTML = `
            <button class="page-btn active">1</button>
            <button class="page-btn">2</button>
            <button class="page-btn">3</button>
            <button class="page-btn">4</button>
            <button class="page-btn">5</button>
            <button class="page-btn"><i class="fas fa-chevron-right"></i></button>
        `;

        // 移除已存在的分页
        const oldPagination = this.gedanContent.querySelector('.pagination');
        if (oldPagination) {
            oldPagination.remove();
        }

        this.gedanContent.appendChild(pagination);
    }

    formatPlayCount(count) {
        if (count >= 10000) {
            return (count / 10000).toFixed(1) + '万';
        }
        return count.toString();
    }
}

// 初始化Page Manager
document.addEventListener('DOMContentLoaded', function () {

    // 初始化页面管理器
    setTimeout(() => {
        window.pageManager = new PageManager();
        console.log('页面管理器初始化成功');
    }, 600);

    // 初始化搜索管理器
    setTimeout(() => {
        window.searchManager = new SearchResultManager();
        console.log('搜索管理器初始化成功');
    }, 700);
});

// ==================== 搜索结果管理器 ====================
class SearchResultManager {
    constructor() {
        this.apiBase = 'http://localhost:3000';
        this.currentKeyword = '';
        this.currentType = 'all';
        this.searchData = {
            songs: [],
            artists: [],
            albums: [],
            playlists: [],
            videos: []
        };

        // 不在构造函数中缓存 DOM 元素，改为在需要时动态获取
        // 这样可以避免初始化时机问题

        this.initTabs();
    }

    /**
     * 初始化搜索分类标签
     */
    initTabs() {
        const tabs = document.querySelectorAll('.search-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 移除所有激活状态
                tabs.forEach(t => t.classList.remove('active'));
                // 激活当前标签
                tab.classList.add('active');

                // 切换搜索类型
                this.currentType = tab.getAttribute('data-type');
                this.renderByType();
            });
        });
    }

    /**
     * 执行搜索
     * @param {string} keyword - 搜索关键词
     */
    async performSearch(keyword) {
        if (!keyword.trim()) return;

        this.currentKeyword = keyword;
        console.log(`🔍 开始搜索: ${keyword}`);

        // 显示搜索结果页面
        this.showSearchPage();
        this.showLoading();

        try {
            // 并发请求所有类型的搜索结果
            const [songsResult, artistsResult, albumsResult, playlistsResult] = await Promise.all([
                this.fetchSongs(keyword),
                this.fetchArtists(keyword),
                this.fetchAlbums(keyword),
                this.fetchPlaylists(keyword)
            ]);

            // 保存搜索数据
            this.searchData = {
                songs: songsResult || [],
                artists: artistsResult || [],
                albums: albumsResult || [],
                playlists: playlistsResult || [],
                videos: [] // 视频搜索暂不实现
            };

            // 渲染综合搜索结果
            this.renderAllResults();

        } catch (error) {
            console.error('搜索失败:', error);
            this.renderError();
        }
    }

    /**
     * 显示搜索页面
     */
    showSearchPage() {
        // 隐藏 content-pane（包含精选标签行和所有内容）
        const contentPane = document.querySelector('.content-pane');
        if (contentPane) {
            contentPane.style.display = 'none';
        }

        // 显示搜索结果页面
        const searchContent = document.getElementById('searchResultContent');
        if (searchContent) {
            searchContent.style.display = 'block';
        } else {
            console.warn('searchResultContent 元素未找到');
        }

        // 更新搜索关键词显示
        const searchTermEl = document.getElementById('searchTerm');
        if (searchTermEl) {
            searchTermEl.textContent = this.currentKeyword;
        }
    }

    /**
     * 显示加载动画
     */
    showLoading() {
        // 在 searchAllContent 前面插入加载动画，而不是清空它
        const searchAllContent = document.getElementById('searchAllContent');
        if (!searchAllContent) {
            console.warn('searchAllContent 元素未找到');
            return;
        }

        // 先移除已存在的加载动画
        const existingLoader = document.getElementById('searchLoadingSpinner');
        if (existingLoader) {
            existingLoader.remove();
        }

        // 创建加载动画
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'searchLoadingSpinner';
        loadingDiv.className = 'loading-spinner';
        loadingDiv.innerHTML = '<div class="spinner"></div>';

        // 插入到 searchAllContent 的最前面
        searchAllContent.insertBefore(loadingDiv, searchAllContent.firstChild);

        // 隐藏所有内容区块，只显示加载动画
        const sections = searchAllContent.querySelectorAll('.search-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
    }

    /**
     * 隐藏加载动画，显示内容
     */
    hideLoading() {
        const searchAllContent = document.getElementById('searchAllContent');
        if (!searchAllContent) return;

        // 移除加载动画
        const loadingSpinner = document.getElementById('searchLoadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.remove();
        }

        // 显示所有内容区块
        const sections = searchAllContent.querySelectorAll('.search-section');
        sections.forEach(section => {
            section.style.display = 'block';
        });
    }

    /**
     * 渲染错误
     */
    renderError() {
        if (this.searchAllContent) {
            this.searchAllContent.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>搜索出错，请稍后重试</p>
                    <small>可能是网络连接或API服务问题</small>
                </div>
            `;
        }
    }

    /**
     * 渲染综合搜索结果
     */
    renderAllResults() {
        // 先隐藏加载动画
        this.hideLoading();

        if (this.searchAllContent) {
            this.searchAllContent.style.display = 'block';
        }
        if (this.searchSingleContent) {
            this.searchSingleContent.style.display = 'none';
        }

        // 渲染各个部分
        this.renderBestMatch();
        this.renderSongs();
        this.renderArtists();
        this.renderAlbums();
        this.renderPlaylists();
    }

    /**
     * 根据类型渲染
     */
    renderByType() {
        if (this.currentType === 'all') {
            this.renderAllResults();
            return;
        }

        // 显示单类型内容
        if (this.searchAllContent) this.searchAllContent.style.display = 'none';
        if (this.searchSingleContent) this.searchSingleContent.style.display = 'block';

        const typeMap = {
            'songs': { data: this.searchData.songs, title: '歌曲' },
            'artists': { data: this.searchData.artists, title: '歌手' },
            'albums': { data: this.searchData.albums, title: '专辑' },
            'playlists': { data: this.searchData.playlists, title: '歌单' },
            'videos': { data: this.searchData.videos, title: '视频' }
        };

        const current = typeMap[this.currentType];
        if (!current) return;

        this.renderSingleType(current.data, current.title);
    }

    /**
     * 渲染单类型结果
     */
    renderSingleType(data, title) {
        if (!this.searchSingleContent) return;

        if (data.length === 0) {
            this.searchSingleContent.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <p>没有找到相关的${title}</p>
                    <small>试试其他关键词吧～</small>
                </div>
            `;
            return;
        }

        let html = '';

        switch (this.currentType) {
            case 'songs':
                html = `<div class="song-list">${data.map((song, index) => this.renderSongItem(song, index)).join('')}</div>`;
                break;
            case 'artists':
                html = `<div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));">
                    ${data.map(artist => this.renderArtistCard(artist)).join('')}
                </div>`;
                break;
            case 'albums':
                html = `<div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));">
                    ${data.map(album => this.renderAlbumCard(album)).join('')}
                </div>`;
                break;
            case 'playlists':
                html = `<div class="card-grid">${data.map(playlist => this.renderPlaylistCard(playlist)).join('')}</div>`;
                break;
            default:
                html = `<div class="search-no-results"><p>暂不支持该类型</p></div>`;
        }

        this.searchSingleContent.innerHTML = html;
        // 确保样式已添加
        this.addSongGridStyles();
    }

    /**
     * 渲染最佳匹配
     */
    renderBestMatch() {
        const bestMatchCard = document.getElementById('bestMatchCard');
        if (!bestMatchCard) {
            console.warn('bestMatchCard 元素未找到');
            return;
        }

        // 优先显示歌手，然后是专辑，最后是歌曲
        let bestMatch = null;
        let matchType = '';

        if (this.searchData.artists.length > 0) {
            bestMatch = this.searchData.artists[0];
            matchType = 'artist';
        } else if (this.searchData.albums.length > 0) {
            bestMatch = this.searchData.albums[0];
            matchType = 'album';
        } else if (this.searchData.songs.length > 0) {
            bestMatch = this.searchData.songs[0];
            matchType = 'song';
        }

        if (!bestMatch) {
            bestMatchCard.innerHTML = '';
            return;
        }

        let html = '';
        switch (matchType) {
            case 'artist':
                html = `
                    <div class="best-match-cover">
                        <img src="${bestMatch.picUrl || bestMatch.img1v1Url}" alt="${bestMatch.name}">
                    </div>
                    <div class="best-match-info">
                        <div class="best-match-type">歌手:${bestMatch.name}</div>
                        <div class="best-match-name"></div>
                        <div class="best-match-desc">${this.formatNumber(bestMatch.followers || bestMatch.playlistCount)} 粉丝 · ${bestMatch.albumSize || 0} 专辑</div>
                    </div>
                `;
                break;
            case 'album':
                html = `
                    <div class="best-match-cover">
                        <img src="${bestMatch.picUrl}" alt="${bestMatch.name}">
                    </div>
                    <div class="best-match-info">
                        <div class="best-match-type">专辑</div>
                        <div class="best-match-name">${bestMatch.name}</div>
                        <div class="best-match-desc">${bestMatch.artist.name} · ${bestMatch.size || 0} 首歌曲</div>
                    </div>
                `;
                break;
            case 'song':
                html = `
                    <div class="best-match-cover">
                        <img src="${bestMatch.album.picUrl}" alt="${bestMatch.name}">
                    </div>
                    <div class="best-match-info">
                        <div class="best-match-type">歌曲</div>
                        <div class="best-match-name">${bestMatch.name}</div>
                        <div class="best-match-desc">${bestMatch.artists.map(a => a.name).join(' / ')} · ${bestMatch.album.name}</div>
                    </div>
                `;
                break;
        }

        bestMatchCard.innerHTML = html;
    }

    /**
     * 渲染歌曲列表
     */
    renderSongs() {
        const searchSongList = document.getElementById('searchSongList');
        if (!searchSongList) {
            console.warn('searchSongList 元素未找到');
            return;
        }

        const songs = this.searchData.songs.slice(0, 10); // 只显示前10首

        if (songs.length === 0) {
            searchSongList.innerHTML = '<p style="padding: 20px; color: #8f9eb5; text-align: center;">暂无歌曲</p>';
            return;
        }

        searchSongList.innerHTML = songs.map((song, index) => this.renderSongItem(song, index)).join('');
        // CSS样式
        this.addSongGridStyles();
    }

    /**
 * 渲染单个歌曲网格项
 */
    renderSongGridItem(song, index) {
        const coverUrl = song.album?.picUrl || song.cover || `https://picsum.photos/200/200?random=${song.id}`;
        const artistNames = song.artists?.map(a => a.name).join('/') || song.artist || '未知';

        // 判断是否有VIP、MV、原唱等标签
        const hasVip = index % 3 === 0;
        const hasMv = song.mvid || index % 2 === 0;
        const isOriginal = index % 4 === 0;
        const hasImmersive = index % 5 === 0;

        // 生成标签
        let tags = [];
        if (hasVip) tags.push('<span class="song-tag vip">VIP</span>');
        if (hasMv) tags.push('<span class="song-tag mv">MV</span>');
        if (isOriginal) tags.push('<span class="song-tag original">原唱</span>');
        if (hasImmersive) tags.push('<span class="song-tag immersive">沉浸声</span>');

        const tagsHtml = tags.length > 0 ? `<div class="song-tags">${tags.join('')}</div>` : '';

        // 判断是否有副标题（万人收藏、主题曲等）
        const hasSubtitle = index === 0 || index === 3 || index === 5;
        let subtitle = '';
        if (index === 0) subtitle = '<div class="song-subtitle">影视剧《逐玉》主题曲</div>';
        else if (index === 3) subtitle = '<div class="song-subtitle">联想Idea Pad S9/S10笔记本网络故事片主题曲</div>';
        else if (index === 5) subtitle = '<div class="song-subtitle">放松指南</div>';

        // 判断是否有播放量/收藏量
        const hasPlayCount = index === 1;
        const playCountHtml = hasPlayCount ? '<span class="song-play-count"><i class="fas fa-heart"></i> 万人收藏</span>' : '';

        return `
        <div class="song-grid-item" onclick="window.searchManager && window.searchManager.playSearchSong(${index})">
            <div class="song-grid-cover">
                <img src="${coverUrl}" alt="${song.name}" loading="lazy">
                <div class="song-grid-play">
                    <i class="fas fa-play"></i>
                </div>
                ${tagsHtml}
            </div>
            <div class="song-grid-info">
                <div class="song-grid-title">
                    ${song.name}
                    ${playCountHtml}
                </div>
                <div class="song-grid-artist">${artistNames}</div>
                ${subtitle}
            </div>
        </div>
    `;
    }
    /**
     * 渲染单个歌曲项
     */
    renderSongItem(song, index) {
        const coverUrl = song.album?.picUrl || song.cover || `https://picsum.photos/48/48?random=${song.id}`;
        const artistNames = song.artists?.map(a => a.name).join(' / ') || song.artist || '未知';
        const albumName = song.album?.name || '未知专辑';
        const duration = this.formatDuration(song.duration || song.dt || 0);

        return `
        <div class="song-list-item" onclick="window.searchManager && window.searchManager.playSearchSong(${index})">
            <div class="song-index">${index + 1}</div>
            <div class="song-list-cover">
                <img src="${coverUrl}" alt="${song.name}" loading="lazy">
            </div>
            <div class="song-list-info">
                <div class="song-list-title">${song.name}</div>
                <div class="song-list-meta">
                    <span>${artistNames}</span>
                    <span>${albumName}</span>
                </div>
            </div>
            <div class="song-list-duration">${duration}</div>
        </div>
    `;
    }
    /**
 * 添加歌曲网格样式
 */
    addSongGridStyles() {
        // 检查是否已添加样式
        if (document.getElementById('song-grid-styles')) return;

        const style = document.createElement('style');
        style.id = 'song-grid-styles';
        style.textContent = `
        /* 歌曲网格容器 */
        #searchSongList {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
            margin: 20px 0;
        }
        
        /* 歌曲网格项 */
        .song-grid-item {
            cursor: pointer;
            transition: transform 0.2s ease;
            border-radius: 12px;
            overflow: hidden;
            background: transparent;
        }
        
        .song-grid-item:hover {
            transform: translateY(-4px);
        }
        
        .song-grid-item:hover .song-grid-play {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        
        /* 歌曲封面 */
        .song-grid-cover {
            position: relative;
            width: 100%;
            aspect-ratio: 1/1;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 12px;
            background: #f0f2f5;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .song-grid-cover img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .song-grid-item:hover .song-grid-cover img {
            transform: scale(1.05);
        }
        
        /* 播放按钮 */
        .song-grid-play {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            width: 48px;
            height: 48px;
            background: rgba(209, 68, 68, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            opacity: 0;
            transition: all 0.3s ease;
            backdrop-filter: blur(2px);
            border: 2px solid rgba(255, 255, 255, 0.3);
            cursor: pointer;
            z-index: 2;
        }
        
        .song-grid-play i {
            margin-left: 2px;
        }
        
        /* 歌曲标签 */
        .song-tags {
            position: absolute;
            top: 10px;
            left: 10px;
            display: flex;
            gap: 6px;
            z-index: 2;
            flex-wrap: wrap;
        }
        
        .song-tag {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.5px;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .song-tag.vip {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #000;
            border-color: rgba(255, 215, 0, 0.5);
        }
        
        .song-tag.mv {
            background: linear-gradient(135deg, #FF6B6B, #FF4757);
            color: white;
        }
        
        .song-tag.original {
            background: linear-gradient(135deg, #4ECDC4, #45B7D1);
            color: white;
        }
        
        .song-tag.immersive {
            background: linear-gradient(135deg, #A8E6CF, #3B9E7A);
            color: white;
        }
        
        /* 歌曲信息 */
        .song-grid-info {
            padding: 0 4px;
        }
        
        .song-grid-title {
            font-size: 15px;
            font-weight: 500;
            color: #1e293b;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
            line-height: 1.4;
        }
        
        .song-play-count {
            font-size: 12px;
            color: #d14444;
            background: rgba(209, 68, 68, 0.1);
            padding: 2px 8px;
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
        }
        
        .song-play-count i {
            font-size: 10px;
        }
        
        .song-grid-artist {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .song-subtitle {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px dashed #e2e8f0;
        }
        
        /* 单类型搜索结果页面的歌曲网格 */
        #searchSingleContent .song-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
        }
        
        /* 响应式调整 */
        @media (max-width: 768px) {
            #searchSongList {
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }
        }
        
        @media (max-width: 480px) {
            #searchSongList {
                grid-template-columns: 1fr;
            }
        }
    `;

        document.head.appendChild(style);
    }
    /**
 * 播放搜索结果中的歌曲
 * @param {number} index - 歌曲在搜索结果中的索引
 */
    async playSearchSong(index) {
        if (!this.searchData.songs || !this.searchData.songs[index]) {
            console.error('歌曲不存在');
            return;
        }

        const song = this.searchData.songs[index];
        console.log('播放歌曲:', song.name);

        try {
            // 显示加载状态
            if (window.player) {
                window.player.openFullscreen();
            }

            // 获取歌曲播放URL
            const urlResponse = await fetch(`${this.apiBase}/song/url?id=${song.id}`);
            const urlData = await urlResponse.json();

            if (urlData.code === 200 && urlData.data.length > 0) {
                const songUrl = urlData.data[0].url;

                if (!songUrl) {
                    alert('该歌曲暂无版权或播放链接');
                    return;
                }

                // 获取歌曲详情（用于封面等信息）
                const detailResponse = await fetch(`${this.apiBase}/song/detail?ids=${song.id}`);
                const detailData = await detailResponse.json();

                let coverUrl = song.album?.picUrl || `https://picsum.photos/340/340?random=${song.id}`;
                let artistNames = song.artists?.map(a => a.name).join('/') || '未知';
                let albumName = song.album?.name || '未知专辑';

                if (detailData.code === 200 && detailData.songs.length > 0) {
                    const songDetail = detailData.songs[0];
                    coverUrl = songDetail.al?.picUrl || coverUrl;
                }

                if (window.player) {
                    // 创建播放列表，并预先获取所有歌曲的URL
                    window.player.playlist = [];

                    // 先添加所有歌曲的基本信息
                    for (let i = 0; i < this.searchData.songs.length; i++) {
                        const s = this.searchData.songs[i];
                        window.player.playlist.push({
                            id: s.id,
                            title: s.name,
                            artist: s.artists?.map(a => a.name).join('/') || '未知',
                            album: s.album?.name || '未知专辑',
                            cover: s.album?.picUrl || `https://picsum.photos/340/340?random=${s.id}`,
                            duration: this.formatDuration(s.duration || s.dt || 0),
                            src: null // 先设为null，需要时再获取
                        });
                    }

                    // 设置当前索引
                    window.player.currentIndex = index;

                    // 为当前歌曲设置播放URL
                    window.player.playlist[index].src = songUrl;

                    // 预加载下一首歌曲的URL（可选，提升体验）
                    if (index + 1 < window.player.playlist.length) {
                        window.player.fetchSongUrl(window.player.playlist[index + 1].id).then(url => {
                            if (url) {
                                window.player.playlist[index + 1].src = url;
                            }
                        });
                    }

                    // 加载并播放
                    window.player.loadSong(index);
                    await window.player.audio.play();
                    window.player.isPlaying = true;
                    window.player.updatePlayIcons('fa-pause');

                    // 获取歌词
                    window.player.fetchLyrics(song.id);
                }
            } else {
                alert('获取播放链接失败');
            }
        } catch (error) {
            console.error('播放失败:', error);
            alert('播放失败，请稍后重试');
        }
    }

    /**
     * 渲染歌手列表
     */
    renderArtists() {
        const searchArtistList = document.getElementById('searchArtistList');
        if (!searchArtistList) {
            console.warn('searchArtistList 元素未找到');
            return;
        }

        const artists = this.searchData.artists.slice(0, 8);

        if (artists.length === 0) {
            searchArtistList.innerHTML = '<p style="padding: 20px; color: #8f9eb5; text-align: center;">暂无歌手</p>';
            return;
        }

        searchArtistList.innerHTML = artists.map(artist => this.renderArtistCard(artist)).join('');
    }

    /**
     * 渲染单个歌手卡片
     */
    renderArtistCard(artist) {
        const picUrl = artist.picUrl || artist.img1v1Url || `https://picsum.photos/140/140?random=${artist.id}`;
        const followers = this.formatNumber(artist.followers || artist.playlistCount || 0);

        return `
            <div class="artist-card" onclick="window.player && window.player.playArtist('${artist.id}')">
                <div class="artist-cover">
                    <img src="${picUrl}" alt="${artist.name}">
                </div>
                <div class="artist-name">${artist.name}</div>
                <div class="artist-followers">${followers} 粉丝</div>
            </div>
        `;
    }

    /**
     * 渲染专辑列表
     */
    renderAlbums() {
        const searchAlbumList = document.getElementById('searchAlbumList');
        if (!searchAlbumList) {
            console.warn('searchAlbumList 元素未找到');
            return;
        }

        const albums = this.searchData.albums.slice(0, 8);

        if (albums.length === 0) {
            searchAlbumList.innerHTML = '<p style="padding: 20px; color: #8f9eb5; text-align: center;">暂无专辑</p>';
            return;
        }

        searchAlbumList.innerHTML = albums.map(album => this.renderAlbumCard(album)).join('');
    }

    /**
     * 渲染单个专辑卡片
     */
    renderAlbumCard(album) {
        const picUrl = album.picUrl || album.blurPicUrl || `https://picsum.photos/160/160?random=${album.id}`;
        const artistName = album.artist?.name || album.artists?.map(a => a.name).join(' / ') || '未知';

        return `
            <div class="album-card" onclick="window.player && window.player.playAlbum('${album.id}')">
                <div class="album-cover">
                    <img src="${picUrl}" alt="${album.name}">
                </div>
                <div class="album-name">${album.name}</div>
                <div class="album-artist">${artistName}</div>
            </div>
        `;
    }

    /**
     * 渲染歌单列表
     */
    renderPlaylists() {
        const searchPlaylistGrid = document.getElementById('searchPlaylistGrid');
        if (!searchPlaylistGrid) {
            console.warn('searchPlaylistGrid 元素未找到');
            return;
        }

        const playlists = this.searchData.playlists.slice(0, 6);

        if (playlists.length === 0) {
            const section = document.getElementById('playlistSection');
            if (section) section.style.display = 'none';
            return;
        }

        const section = document.getElementById('playlistSection');
        if (section) section.style.display = 'block';

        searchPlaylistGrid.innerHTML = playlists.map(playlist => this.renderPlaylistCard(playlist)).join('');
    }

    /**
     * 渲染单个歌单卡片
     */
    renderPlaylistCard(playlist) {
        const coverUrl = playlist.coverImgUrl || playlist.cover || `https://picsum.photos/200/200?random=${playlist.id}`;
        const playCount = this.formatNumber(playlist.playCount || 0);

        return `
            <div class="music-card" data-id="${playlist.id}">
                <div class="card-img">
                    <img src="${coverUrl}" alt="${playlist.name}" loading="lazy">
                    <span class="play-count"><i class="fas fa-headphones"></i> ${playCount}</span>
                    <div class="card-overlay">
                        <div class="play-overlay-btn" onclick="event.stopPropagation(); window.player && window.player.playPlaylistFirst('${playlist.id}')">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                </div>
                <div class="card-info">
                    <h4>${playlist.name}</h4>
                    <p><i class="fas fa-music"></i> ${playlist.trackCount || 0}首</p>
                </div>
            </div>
        `;
    }

    // ==================== API 请求 ====================

    /**
     * 搜索歌曲
     */
    async fetchSongs(keyword) {
        try {
            const response = await fetch(`${this.apiBase}/search?keywords=${encodeURIComponent(keyword)}&type=1&limit=20`);
            const data = await response.json();
            return data.result?.songs || [];
        } catch (e) {
            console.error('搜索歌曲失败:', e);
            return [];
        }
    }

    /**
     * 搜索歌手
     */
    async fetchArtists(keyword) {
        try {
            const response = await fetch(`${this.apiBase}/search?keywords=${encodeURIComponent(keyword)}&type=100&limit=20`);
            const data = await response.json();
            return data.result?.artists || [];
        } catch (e) {
            console.error('搜索歌手失败:', e);
            return [];
        }
    }

    /**
     * 搜索专辑
     */
    async fetchAlbums(keyword) {
        try {
            const response = await fetch(`${this.apiBase}/search?keywords=${encodeURIComponent(keyword)}&type=10&limit=20`);
            const data = await response.json();
            return data.result?.albums || [];
        } catch (e) {
            console.error('搜索专辑失败:', e);
            return [];
        }
    }

    /**
     * 搜索歌单
     */
    async fetchPlaylists(keyword) {
        try {
            const response = await fetch(`${this.apiBase}/search?keywords=${encodeURIComponent(keyword)}&type=1000&limit=20`);
            const data = await response.json();
            return data.result?.playlists || [];
        } catch (e) {
            console.error('搜索歌单失败:', e);
            return [];
        }
    }

    // ==================== 工具函数 ====================

    /**
     * 格式化数字
     */
    formatNumber(num) {
        if (!num) return '0';
        if (num >= 100000000) {
            return (num / 100000000).toFixed(1) + '亿';
        } else if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万';
        }
        return num.toString();
    }

    /**
     * 格式化时长
     */
    formatDuration(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}