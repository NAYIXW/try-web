// DOM 元素引用
const navLinks = document.querySelectorAll('.nav-link') || [];
const sections = document.querySelectorAll('.content-section') || [];
const darkModeToggle = document.getElementById('dark-mode-toggle');
const loginLink = document.querySelector('[data-section="login"]');
const loginOverlay = document.getElementById('login-overlay');
const loginClose = document.getElementById('login-close');
const authFormModal = document.getElementById('auth-form-modal');

// 预加载背景图
function preloadBackgroundImage() {
    const bgImage = new Image();
    bgImage.src = './背景_optimized.jpg';
    bgImage.onload = function() {
        document.body.classList.add('bg-loaded');
    };
    return bgImage;
}

// 应用初始化
document.addEventListener('DOMContentLoaded', function() {
    // 设置首页body类以显示背景图
    setPageBodyClass('home');
    
    // 预加载背景图
    preloadBackgroundImage();
    
    // 加载主题偏好
    loadThemePreference();
    
    // 设置导航
    setupNavigation();
    
    // 设置夜间模式切换
    setupDarkMode();
    
    // 设置登录弹窗
    setupLoginModal();
    
    // 设置登录表单
    setupLoginForm();
    
    // 添加全局登录检查
    addGlobalLoginChecks();
    
    // 设置示例作品库
    setupSampleLibrary();
    
    // 加载保存的用户数据
    loadSavedData();
    
    // Set initial page class for homepage background if home is active
    setTimeout(() => {
        const homeSection = document.getElementById('home');
        if (homeSection && homeSection.classList.contains('active')) {
            setPageBodyClass('home');
        }
        
        // Set initial navigation highlighting based on active section
        sections.forEach(section => {
            if (section.classList.contains('active')) {
                const navLink = document.querySelector(`.nav-link[data-section="${section.id}"]`);
                if (navLink) {
                    navLinks.forEach(link => link.classList.remove('is-active'));
                    navLink.classList.add('is-active');
                }
            }
        });
    }, 0);
});

// 加载主题偏好
function loadThemePreference() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        darkModeToggle.textContent = '🌙';
    }
}

// 设置导航
function setupNavigation() {
    navLinks.forEach(link => {
        // 为非登录链接设置导航功能
        if (link.getAttribute('data-section') !== 'login') {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetSection = this.getAttribute('data-section');
                
                // 检查是否需要登录（首页和登录页除外）
                const requiresLogin = targetSection !== 'home' && targetSection !== 'login';
                if (requiresLogin && !isLoggedIn()) {
                    requireLogin('访问该页面');
                    return;
                }
                
                // 隐藏所有section
                sections.forEach(section => {
                    section.classList.remove('active');
                });
                
                // 显示目标section
                const targetSectionElement = document.getElementById(targetSection);
                if (targetSectionElement) {
                    targetSectionElement.classList.add('active');
                }
                
                // 特殊处理：当切换到Library时，自动加载照片
                if (targetSection === 'library') {
                    loadLibraryPhotos();
                }
                
                // 特殊处理：当切换到Gallery时，自动加载画廊
                if (targetSection === 'gallery') {
                    loadGalleryPhotos();
                }
                
                // 特殊处理：当切换到EXIF分析时，自动加载作品库缩略图和统计图表
                if (targetSection === 'exif-lab') {
                    setTimeout(() => {
                        loadLibraryThumbnailsForAnalysis(); // 等待页面渲染完成
                        updateExifStatistics(); // Update statistics with fixed data
                    }, 100);
                }
                
                // 特殊处理：当切换到拍摄地图时，初始化或刷新地图
                if (targetSection === 'photo-map') {
                    setTimeout(initOrRefreshShootMap, 100); // 等待页面渲染完成
                }
                
                // 特殊处理：当切换到线上展厅时，渲染展览内容
                if (targetSection === 'gallery') {
                    setTimeout(() => {
                        renderExhibitionSidebar();
                        renderExhibitionCanvas();
                    }, 100); // 等待页面渲染完成
                }
                
                // 更新导航高亮
                navLinks.forEach(navLink => navLink.classList.remove('is-active'));
                this.classList.add('is-active');
                
                // Set page-specific body class for homepage background
                setPageBodyClass(targetSection);
            });
        }
    });
    
    // 添加登出功能
    const logoutButton = document.querySelector('.logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            handleLogout();
        });
    }
    
    // 更新用户名显示
    updateUsernameDisplay();
}

// 更新用户名显示
function updateUsernameDisplay() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const usernameSpan = document.querySelector('.nav-username');
    if (usernameSpan && currentUser) {
        usernameSpan.textContent = currentUser.name || currentUser.email || '用户';
    } else if (usernameSpan) {
        usernameSpan.textContent = '游客';
    }
}

// Set page-specific class on body element
function setPageBodyClass(pageName) {
    // Remove all page-specific classes
    document.body.className = document.body.className.replace(/\bpage-\w+\b/g, '');
    
    // Add the current page class if it's the home page
    if (pageName === 'home') {
        document.body.classList.add(`page-${pageName}`);
    }
}

// 设置登录弹窗
function setupLoginModal() {
    // 在函数内部获取元素，确保DOM已加载
    const loginClose = document.getElementById('login-close');
    const loginOverlay = document.getElementById('login-overlay');
    const loginLink = document.querySelector('[data-section="login"]');
    
    if (!loginLink || !loginClose || !loginOverlay) return; // 元素不存在则跳过功能
    
    // 为登录链接设置弹窗功能
    loginLink.addEventListener('click', function(e) {
        e.preventDefault();
        openLoginModal();
    });
    
    // 关闭弹窗事件
    loginClose.addEventListener('click', closeLoginModal);
    
    // 点击遮罩关闭弹窗
    loginOverlay.addEventListener('click', function(e) {
        if (e.target === loginOverlay) {
            closeLoginModal();
        }
    });
    
    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && loginOverlay && loginOverlay.classList.contains('visible')) {
            closeLoginModal();
        }
    });
}

// 打开登录弹窗
function openLoginModal() {
    const loginOverlay = document.getElementById('login-overlay');
    if (!loginOverlay) return;
    
    loginOverlay.style.display = 'flex';
    setTimeout(() => {
        loginOverlay.classList.add('visible');
        const modalContent = document.querySelector('.login-modal-content');
        if (modalContent) modalContent.classList.add('visible');
    }, 10);
}

// 关闭登录弹窗
function closeLoginModal() {
    const loginOverlay = document.getElementById('login-overlay');
    if (!loginOverlay) return;
    
    loginOverlay.classList.remove('visible');
    const modalContent = document.querySelector('.login-modal-content');
    if (modalContent) modalContent.classList.remove('visible');
    
    setTimeout(() => {
        loginOverlay.style.display = 'none';
    }, 300);
}

// 设置登录表单
function setupLoginForm() {
    if (!authFormModal) return; // 元素不存在则跳过功能
    
    authFormModal.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('auth-name-modal').value.trim();
        const email = document.getElementById('auth-email-modal').value.trim();
        const password = document.getElementById('auth-password-modal').value;
        const statusElement = document.getElementById('auth-status-modal');
        
        // 验证输入
        if (!name || !email || !password) {
            statusElement.innerHTML = '<span style="color: red;">请填写所有字段</span>';
            return;
        }
        
        if (password.length < 6) {
            statusElement.innerHTML = '<span style="color: red;">密码长度至少为6位</span>';
            return;
        }
        
        // 从localStorage获取用户
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // 检查用户是否存在
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
            // 用户存在 - 尝试登录
            if (existingUser.password === password) {
                // 登录成功
                localStorage.setItem('currentUser', JSON.stringify(existingUser));
                localStorage.setItem('userLoggedIn', 'true'); // Add login marker
                statusElement.innerHTML = '<span style="color: green;">登录成功！</span>';
                
                // 关闭弹窗
                setTimeout(() => {
                    closeLoginModal();
                    
                    // Update navigation bar display
                    updateNavigationBar(existingUser);
                    
                    // Update button restrictions for logged in user
                    updateButtonRestrictions(false);
                }, 1000);
            } else {
                // 密码错误
                statusElement.innerHTML = '<span style="color: red;">密码错误</span>';
            }
        } else {
            // 用户不存在 - 注册新用户
            const newUser = {
                id: Date.now(),
                name: name,
                email: email,
                password: password,
                joinDate: new Date().toISOString()
            };
            
            // 保存用户到localStorage
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            // 自动登录新用户
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            localStorage.setItem('userLoggedIn', 'true'); // Add login marker
            statusElement.innerHTML = '<span style="color: green;">注册成功！正在自动登录...</span>';
            
            // 关闭弹窗
            setTimeout(() => {
                closeLoginModal();
                
                // Update navigation bar display
                updateNavigationBar(newUser);
                
                // Update button restrictions for logged in user
                updateButtonRestrictions(false);
            }, 1500);
        }
    });
}

// 处理登出
function handleLogout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userLoggedIn'); // Remove login marker
    
    // Update navigation bar display
    const currentUser = null;
    updateNavigationBar(currentUser);
    
    // Update button restrictions for guest
    updateButtonRestrictions(true);
    
    alert('已成功退出登录');
}

// 设置夜间模式
function setupDarkMode() {
    if (!darkModeToggle) return; // 元素不存在则跳过功能
    
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        const isDarkMode = document.body.classList.contains('dark-mode');
        this.textContent = isDarkMode ? '☀️' : '🌙';
        
        localStorage.setItem('darkMode', isDarkMode);
    });
}

// 固定作品数据
const works = [
  { 
    id: "work1", 
    title: "窗口人像 01", 
    tag: "人像", 
    image: "images/window_portrait.jpg",
    inExhibition: false,
    locationName: "杭州 私宅",
    lat: 30.2741,
    lng: 120.1551,
    params: {
      camera: "Fujifilm X-T4",
      lens: "XF 35mm F1.4 R",
      aperture: "f/2.0",
      shutter: "1/125s",
      iso: "400",
      focal: "35mm",
      location: "杭州 私宅"
    }
  },
  { 
    id: "work2", 
    title: "路口海景 01", 
    tag: "旅行", 
    image: "images/street_seaview.jpg",
    inExhibition: false,
    locationName: "镰仓 海岸路口",
    lat: 35.3083,
    lng: 139.5530,
    params: {
      camera: "Sony A7C",
      lens: "FE 55mm F1.8",
      aperture: "f/8",
      shutter: "1/500s",
      iso: "100",
      focal: "55mm",
      location: "镰仓 海岸路口"
    }
  },
  { 
    id: "work3", 
    title: "雪山滑雪 01", 
    tag: "运动", 
    image: "images/snow_mountain_ski.jpg",
    inExhibition: false,
    locationName: "霞慕尼 法国",
    lat: 45.9239,
    lng: 6.8694,
    params: {
      camera: "Sony A7RIII",
      lens: "FE 24-105mm F4 G OSS",
      aperture: "f/10",
      shutter: "1/2000s",
      iso: "200",
      focal: "70mm",
      location: "霞慕尼 法国"
    }
  },
  { 
    id: "work4", 
    title: "城市夜色 01", 
    tag: "夜景", 
    image: "images/night_city_hk.jpg",
    inExhibition: false,
    locationName: "香港 中环",
    lat: 22.2844,
    lng: 114.1569,
    params: {
      camera: "Canon EOS R",
      lens: "RF 50mm F1.8 STM",
      aperture: "f/1.8",
      shutter: "1/80s",
      iso: "1600",
      focal: "50mm",
      location: "香港 中环"
    }
  },
  { 
    id: "work5", 
    title: "窗外湖景 01", 
    tag: "旅行", 
    image: "images/window_lakeview.jpg",
    inExhibition: false,
    locationName: "西雅图 渡轮上",
    lat: 47.6062,
    lng: -122.3321,
    params: {
      camera: "Leica Q2",
      lens: "Summilux 28mm f/1.7 ASPH",
      aperture: "f/5.6",
      shutter: "1/1000s",
      iso: "200",
      focal: "28mm",
      location: "西雅图 渡轮上"
    }
  },
  { 
    id: "work6", 
    title: "自由女神像 01", 
    tag: "建筑", 
    image: "images/statue_liberty.jpg",
    inExhibition: false,
    locationName: "纽约 自由岛",
    lat: 40.6892,
    lng: -74.0445,
    params: {
      camera: "Nikon Z7 II",
      lens: "NIKKOR Z 70-200mm f/2.8 VR S",
      aperture: "f/8",
      shutter: "1/400s",
      iso: "100",
      focal: "135mm",
      location: "纽约 自由岛"
    }
  }
];

// 示例 EXIF 数据数组
const exifSamples = [
  { iso: 200, focal: 50, aperture: 1.8 },
  { iso: 400, focal: 35, aperture: 2.8 },
  { iso: 100, focal: 70, aperture: 4.0 },
  { iso: 200, focal: 24, aperture: 2.0 },
  { iso: 800, focal: 105, aperture: 4.0 },
  { iso: 1600, focal: 200, aperture: 5.6 }
];

// 设置示例作品库功能
function setupSampleLibrary() {
  // 加载示例作品库
  function loadSampleLibrary() {
    const libraryGrid = document.getElementById('library-grid');
    if (!libraryGrid) return;
    
    // Render tag filter first
    const tagFilterContainer = document.getElementById('library-tag-filter');
    if (tagFilterContainer) {
      // Function to update the photo display based on selected tags
      const updateDisplay = () => {
        // Get currently selected tags
        const selectedTags = tagFilterContainer.getAttribute('data-selected-tags') ? 
            JSON.parse(tagFilterContainer.getAttribute('data-selected-tags')) : [];
        
        // Filter photos based on selected tags
        const filteredPhotos = filterByTags(SAMPLE_PHOTOS, selectedTags);
        
        // Update the photo display
        renderFilteredPhotos(filteredPhotos);
        
        // Re-render the tag filter to update button states
        renderTagFilter('library-tag-filter', updateDisplay);
      };
      
      // Render the tag filter
      renderTagFilter('library-tag-filter', updateDisplay);
      
      // Initial update
      updateDisplay();
    } else {
      // If no tag filter container, render all photos normally
      renderFilteredPhotos(SAMPLE_PHOTOS);
    }
    
    // Helper function to render photos
    function renderFilteredPhotos(photosToRender) {
      libraryGrid.innerHTML = '';
      
      if (photosToRender.length === 0) {
        libraryGrid.innerHTML = '<p class="card">没有找到匹配标签的照片</p>';
        return;
      }
      
      photosToRender.forEach(photo => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        photoCard.innerHTML = `
          <div class="photo-card-content">
            <div class="photo-preview" data-photo-id="${photo.id}">
              <img src="${photo.src}" alt="${photo.title}" style="width: 100%; height: auto; object-fit: cover; border-radius: 10px; cursor: pointer;">
            </div>
            <div class="photo-details" id="details-${photo.id}">
              <h3>${photo.title}</h3>
              <div class="photo-tags">
                ${photo.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
              </div>
              <div class="photo-actions">
                <button class="add-to-gallery-btn" data-id="${photo.id}">加入展厅</button>
                <button class="view-exif-btn" data-id="${photo.id}">查看参数</button>
              </div>
            </div>
          </div>
        `;
        libraryGrid.appendChild(photoCard);
      });
      
      // Add event listeners for action buttons
      document.querySelectorAll('.add-to-gallery-btn').forEach(button => {
        button.addEventListener('click', function() {
          const photoId = this.getAttribute('data-id');
          addToExhibition(photoId);
        });
      });
      
      document.querySelectorAll('.view-exif-btn').forEach(button => {
        button.addEventListener('click', function() {
          const photoId = this.getAttribute('data-id');
          viewPhotoExif(photoId);
        });
      });
      
      // 为图片预览添加点击事件以展开/收起详情
      document.querySelectorAll('.photo-preview').forEach(preview => {
        preview.addEventListener('click', function() {
          const photoId = this.getAttribute('data-photo-id');
          const details = document.getElementById(`details-${photoId}`);
          
          // Toggle the expanded class to show/hide details
          if (details.classList.contains('expanded')) {
            details.classList.remove('expanded');
          } else {
            details.classList.add('expanded');
          }
        });
      });
    }
  }
  
  // View photo EXIF data
  function viewPhotoExif(photoId) {
    const photo = SAMPLE_PHOTOS.find(p => p.id === photoId);
    if (!photo || !photo.exif) return;
    
    alert(`作品: ${photo.title}\n光圈: ${photo.exif.aperture}\n快门: ${photo.exif.shutter}\nISO: ${photo.exif.iso}\n焦距: ${photo.exif.focal}`);
  }
  
  // Add photo to exhibition
function addToExhibition(workId) {
    if (!requireLogin('添加作品到展厅')) return;
    
    const work = works.find(w => w.id === workId);
    if (!work) return;
    
    // Get exhibition layout
    let exhibitionLayout = loadExhibitionLayout();
    
    // Check if work is already in exhibition
    const existingItem = exhibitionLayout.find(item => item.photoId === workId);
    if (existingItem) {
      alert('该作品已在展厅中');
      return;
    }
    
    const newItem = {
      id: Date.now().toString(),
      type: 'photo',
      photoId: workId,
      xPercent: 30,  // Position in visible central area
      yPercent: 30,
      widthPercent: 18,
      caption: work.title || ''
    };
    
    exhibitionLayout.push(newItem);
    saveExhibitionLayout(exhibitionLayout);
    
    // Update exhibition canvas if we're on that page
    if (document.getElementById('gallery').classList.contains('active')) {
      renderExhibitionCanvas();
    }
    
    alert('已添加到展厅！');
  }
  
  // 页面加载时初始化
  loadSampleLibrary();
}
// 提取EXIF数据（模拟实现）
function extractExifData(file) {
    const possibleModels = ['Canon EOS R5', 'Nikon D850', 'Sony A7R IV', 'Fujifilm X-T4', 'Olympus OM-D E-M1'];
    const possibleApertures = ['f/1.4', 'f/1.8', 'f/2.0', 'f/2.8', 'f/4.0', 'f/5.6'];
    const possibleShutterSpeeds = ['1/500', '1/250', '1/125', '1/60', '1/30', '1/15'];
    const possibleISOs = [100, 200, 400, 800, 1600, 3200];
    const possibleFocalLengths = ['24mm', '35mm', '50mm', '85mm', '135mm', '200mm'];
    
    return {
        aperture: possibleApertures[Math.floor(Math.random() * possibleApertures.length)],
        shutterSpeed: possibleShutterSpeeds[Math.floor(Math.random() * possibleShutterSpeeds.length)],
        iso: possibleISOs[Math.floor(Math.random() * possibleISOs.length)],
        focalLength: possibleFocalLengths[Math.floor(Math.random() * possibleFocalLengths.length)],
        dateTime: new Date().toISOString(),
        model: possibleModels[Math.floor(Math.random() * possibleModels.length)]
    };
}

// 加载图库照片
function loadLibraryPhotos() {
    const libraryGrid = document.getElementById('library-grid');
    if (!libraryGrid) return;
    
    // 使用固定作品数据
    const allWorks = works;
    
    // Render tag filter first
    const tagFilterContainer = document.getElementById('library-tag-filter');
    if (tagFilterContainer) {
        // Function to update the photo display based on selected tags
        const updateDisplay = () => {
            // Get currently selected tags
            const selectedTags = tagFilterContainer.getAttribute('data-selected-tags') ? 
                JSON.parse(tagFilterContainer.getAttribute('data-selected-tags')) : [];
            
            // Filter works based on selected tags
            const filteredWorks = selectedTags.length > 0 
                ? allWorks.filter(work => selectedTags.includes(work.tag))
                : allWorks;
            
            // Update the photo display
            renderFilteredWorks(filteredWorks);
            
            // Re-render the tag filter to update button states
            renderTagFilter('library-tag-filter', updateDisplay);
        };
        
        // Render the tag filter
        renderTagFilter('library-tag-filter', updateDisplay);
        
        // Initial update
        updateDisplay();
    } else {
        // If no tag filter container, render all works normally
        renderFilteredWorks(allWorks);
    }
    
    // Helper function to render works
    function renderFilteredWorks(worksToRender) {
        libraryGrid.innerHTML = '';
        
        if (worksToRender.length === 0) {
            libraryGrid.innerHTML = '<p class="card">没有找到匹配标签的作品</p>';
            return;
        }
        
        worksToRender.forEach(work => {
            // Check if work is already in exhibition using the inExhibition field
            const isInExhibition = work.inExhibition || exhibitionLayout.some(item => item.photoId === work.id);
            const buttonText = isInExhibition ? '已加入' : '加入展厅';
            const buttonDisabled = isInExhibition ? 'disabled' : '';
            const buttonStyle = isInExhibition ? 'opacity: 0.6; cursor: not-allowed;' : '';
            
            const workCard = document.createElement('div');
            workCard.className = 'photo-card';
            workCard.style = 'box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-radius: 10px; overflow: hidden; margin: 10px; background: var(--card-bg); color: var(--text-primary); padding: 10px; position: relative;';
            workCard.innerHTML = `
                <img src="${work.image}" alt="${work.title}" class="work-img">
                <h3>${work.title}</h3>
                <p class="work-tag">${work.tag}</p>
                <button class="add-exhibit" data-id="${work.id}" ${buttonDisabled} style="${buttonStyle}">${buttonText}</button>
                <button class="view-meta" data-id="${work.id}">显示参数</button>
                <button class="edit-work" data-id="${work.id}">编辑</button>
                <div class="params-detail" id="params-${work.id}" style="display: none;">
                    <h4>拍摄参数</h4>
                    <p><strong>相机:</strong> ${work.params.camera}</p>
                    <p><strong>镜头:</strong> ${work.params.lens}</p>
                    <p><strong>光圈:</strong> ${work.params.aperture}</p>
                    <p><strong>快门:</strong> ${work.params.shutter}</p>
                    <p><strong>ISO:</strong> ${work.params.iso}</p>
                    <p><strong>焦距:</strong> ${work.params.focal}</p>
                    <p><strong>地点:</strong> ${work.params.location}</p>
                    <button class="close-params" data-id="${work.id}">×</button>
                </div>
                <div class="edit-form" id="edit-form-${work.id}" style="display: none;">
                    <h4>编辑作品</h4>
                    <div class="form-group">
                        <label for="edit-title-${work.id}">作品名称:</label>
                        <input type="text" id="edit-title-${work.id}" value="${work.title}" class="edit-input">
                    </div>
                    <div class="form-group">
                        <label for="edit-tag-${work.id}">标签:</label>
                        <input type="text" id="edit-tag-${work.id}" value="${work.tag}" class="edit-input">
                    </div>
                    <div class="edit-actions">
                        <button class="save-edit" data-id="${work.id}">保存</button>
                        <button class="cancel-edit" data-id="${work.id}">取消</button>
                    </div>
                </div>
            `;
            libraryGrid.appendChild(workCard);
        });
        
        // Add event listeners for action buttons
        document.querySelectorAll('.add-exhibit').forEach(button => {
            button.addEventListener('click', function() {
                const workId = this.getAttribute('data-id');
                addToExhibition(workId);
            });
        });
        
        document.querySelectorAll('.view-meta').forEach(button => {
            button.addEventListener('click', function() {
                if (!requireLogin('查看参数')) return;
                
                const workId = this.getAttribute('data-id');
                const paramsDetail = document.getElementById(`params-${workId}`);
                paramsDetail.style.display = paramsDetail.style.display === 'block' ? 'none' : 'block';
            });
        });
        
        // Add event listeners for close buttons
        document.querySelectorAll('.close-params').forEach(button => {
            button.addEventListener('click', function() {
                const workId = this.getAttribute('data-id');
                const paramsDetail = document.getElementById(`params-${workId}`);
                paramsDetail.style.display = 'none';
            });
        });

        // Add event listeners for edit buttons
        document.querySelectorAll('.edit-work').forEach(button => {
            button.addEventListener('click', function() {
                const workId = this.getAttribute('data-id');
                const editForm = document.getElementById(`edit-form-${workId}`);
                const paramsDetail = document.getElementById(`params-${workId}`);
                
                // Hide params if visible
                if (paramsDetail) paramsDetail.style.display = 'none';
                
                // Toggle edit form
                editForm.style.display = editForm.style.display === 'block' ? 'none' : 'block';
            });
        });

        // Add event listeners for save edit buttons
        document.querySelectorAll('.save-edit').forEach(button => {
            button.addEventListener('click', function() {
                const workId = this.getAttribute('data-id');
                const titleInput = document.getElementById(`edit-title-${workId}`);
                const tagInput = document.getElementById(`edit-tag-${workId}`);
                
                const newTitle = titleInput.value.trim();
                const newTag = tagInput.value.trim();
                
                if (newTitle && newTag) {
                    saveWorkEdit(workId, newTitle, newTag);
                    const editForm = document.getElementById(`edit-form-${workId}`);
                    editForm.style.display = 'none';
                } else {
                    alert('请填写作品名称和标签');
                }
            });
        });

        // Add event listeners for cancel edit buttons
        document.querySelectorAll('.cancel-edit').forEach(button => {
            button.addEventListener('click', function() {
                const workId = this.getAttribute('data-id');
                const editForm = document.getElementById(`edit-form-${workId}`);
                editForm.style.display = 'none';
            });
        });
    }
}

// 保存照片编辑（统一保存函数）
function savePhotoEdit(id) {
    const titleInput = document.querySelector(`[data-id="${id}"]`);
    const tagInput = document.getElementById(`tags-${id}`);
    
    // 获取当前页面上的值
    const newTitle = titleInput ? titleInput.textContent : '';
    const newTagsValue = tagInput ? tagInput.value : '';

    // 处理标签
    const newTags = newTagsValue.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    // 更新 localStorage 中的数据源
    const allPhotos = loadPhotos();
    const photoIndex = allPhotos.findIndex(p => p.id == id);
    if (photoIndex !== -1) {
        allPhotos[photoIndex].title = newTitle.trim();
        allPhotos[photoIndex].tags = newTags;
        // Ensure src field is maintained for consistency
        if (allPhotos[photoIndex].url && !allPhotos[photoIndex].src) {
            allPhotos[photoIndex].src = allPhotos[photoIndex].url;
        }
        
        localStorage.setItem('photos', JSON.stringify(allPhotos));
        
        // 重新渲染Library以确保UI同步
        if (typeof loadLibraryPhotos === 'function') {
            loadLibraryPhotos();
        }
    }
}

// 更新照片标题
function updatePhotoTitle(photoId, newTitle) {
    const allPhotos = loadPhotos();
    const photoIndex = allPhotos.findIndex(p => p.id == photoId); // Using == to handle type conversion
    if (photoIndex !== -1) {
        allPhotos[photoIndex].title = newTitle.trim();
        // Ensure src field is maintained for consistency
        if (allPhotos[photoIndex].url && !allPhotos[photoIndex].src) {
            allPhotos[photoIndex].src = allPhotos[photoIndex].url;
        }
        localStorage.setItem('photos', JSON.stringify(allPhotos));
        
        // 无论当前是否激活，都重新加载Library以确保UI同步
        if (typeof loadLibraryPhotos === 'function') {
            loadLibraryPhotos();
        }
    }
}

// 更新照片标签
function updatePhotoTags(photoId, tagsString) {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    const allPhotos = loadPhotos();
    const photoIndex = allPhotos.findIndex(p => p.id == photoId); // Using == to handle type conversion
    if (photoIndex !== -1) {
        allPhotos[photoIndex].tags = tags;
        // Ensure src field is maintained for consistency
        if (allPhotos[photoIndex].url && !allPhotos[photoIndex].src) {
            allPhotos[photoIndex].src = allPhotos[photoIndex].url;
        }
        localStorage.setItem('photos', JSON.stringify(allPhotos));
        
        // 无论当前是否激活，都重新加载Library以确保UI同步
        if (typeof loadLibraryPhotos === 'function') {
            loadLibraryPhotos();
        }
    }
}

// 保存作品编辑
function saveWorkEdit(workId, newTitle, newTag) {
    if (!requireLogin('保存编辑')) return;
    
    const workIndex = works.findIndex(w => w.id === workId);
    if (workIndex !== -1) {
        works[workIndex].title = newTitle;
        works[workIndex].tag = newTag;
        
        // 重新渲染作品库
        loadLibraryPhotos();
        
        // 如果作品在展厅中，更新展厅中的标题
        const exhibitionLayout = loadExhibitionLayout();
        const exhibitionItem = exhibitionLayout.find(item => item.photoId === workId);
        if (exhibitionItem) {
            exhibitionItem.caption = newTitle;
            saveExhibitionLayout(exhibitionLayout);
            
            // 如果当前在展厅页面，更新显示
            if (document.getElementById('gallery').classList.contains('active')) {
                renderExhibitionCanvas();
            }
        }
    }
}

// 设置EXIF分析
const analyzeBtn = document.getElementById('analyze-btn');
if (analyzeBtn) {
    analyzeBtn.addEventListener('click', function() {
        const exifUpload = document.getElementById('exif-upload');
        if (exifUpload && exifUpload.files.length > 0) {
            analyzePhotoEXIF(exifUpload.files[0]);
        } else {
            alert('请选择要分析的照片');
        }
    });
}

// 同步作品库照片进行分析
function loadLibraryThumbnailsForAnalysis() {
    // 使用示例作品库数据
    const allWorks = works;
    
    const thumbnailContainer = document.getElementById('library-thumbnails');
    
    if (allWorks.length === 0) {
        thumbnailContainer.innerHTML = '<p>暂无示例作品可供分析。</p>';
    } else {
        // 清空现有缩略图
        thumbnailContainer.innerHTML = '';
        
        // 为每张作品创建缩略图
        allWorks.forEach(work => {
            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'thumbnail-item';
            thumbDiv.innerHTML = `<img src="${work.image}" alt="${work.title}" title="${work.title}">`;
            
            // 绑定点击事件以分析该作品
            thumbDiv.addEventListener('click', function() {
                // 移除之前选中的样式
                document.querySelectorAll('.thumbnail-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // 添加选中样式
                this.classList.add('selected');
                
                // 分析该作品（使用示例作品数据进行分析）
                analyzePhotoFromLibrary(work);
            });
            
            thumbnailContainer.appendChild(thumbDiv);
        });
    }
    
    // Update statistics after loading thumbnails
    updateExifStatistics();
}

// Count values in an array
function countValues(arr) {
    return arr.reduce((acc, cur) => {
        acc[cur] = (acc[cur] || 0) + 1;
        return acc;
    }, {});
}

// Update EXIF statistics display
function updateExifStatistics() {
    // Get total count from sample data
    const total = exifSamples.length;
    
    const debugEl = document.getElementById('stats-debug');
    if (debugEl) {
        debugEl.textContent = `调试：共检测到 ${total} 张示例照片的EXIF数据。`;
    }
    
    // Generate and display ISO distribution chart
    const isoChartDom = document.getElementById('isoChart');
    if (isoChartDom) {
        renderIsoChart(isoChartDom, exifSamples, total);
    }
    
    // Generate and display focal length distribution chart
    const focalChartDom = document.getElementById('focalChart');
    if (focalChartDom) {
        renderFocalChart(focalChartDom, exifSamples, total);
    }
    
    // Generate and display aperture distribution chart
    const apertureChartDom = document.getElementById('apertureChart');
    if (apertureChartDom) {
        renderApertureChart(apertureChartDom, exifSamples, total);
    }
}

// Render ISO distribution chart
function renderIsoChart(container, samples, total) {
    // Count ISO values
    const isoCounts = {};
    samples.forEach(sample => {
        isoCounts[sample.iso] = (isoCounts[sample.iso] || 0) + 1;
    });
    
    // Sort ISO values
    const sortedIsoEntries = Object.entries(isoCounts).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    
    // Find maximum count for scaling
    const maxCount = Math.max(...sortedIsoEntries.map(entry => entry[1]), 1);
    
    // Generate chart HTML
    let chartHtml = '<div class="chart-container" style="padding: 10px;">';
    chartHtml += '<h4>ISO 分布</h4>';
    
    sortedIsoEntries.forEach(([iso, count]) => {
        // Calculate bar width as percentage of max count
        const barWidth = (count / maxCount) * 100;
        chartHtml += `
        <div class="chart-row" style="margin: 8px 0; display: flex; align-items: center;">
            <div style="width: 80px; font-size: 12px;">ISO ${iso}:</div>
            <div style="flex: 1; display: flex; align-items: center;">
                <div style="background: #333; height: 20px; width: ${barWidth}%; min-width: 20px; display: flex; align-items: center; padding: 0 5px; color: white; font-size: 12px; border-radius: 2px;">
                    ${'|'.repeat(count)}
                </div>
                <span style="margin-left: 5px; font-size: 12px;">(${count})</span>
            </div>
        </div>
        `;
    });
    
    chartHtml += `<p style="margin-top: 15px; font-size: 12px; color: #666;">本次分析基于 ${total} 张示例照片的数据统计</p>`;
    chartHtml += '</div>';
    
    container.innerHTML = chartHtml;
}

// Render focal length distribution chart
function renderFocalChart(container, samples, total) {
    // Group focal lengths into ranges
    const focalRanges = {
        '0-35mm': 0,
        '35-70mm': 0,
        '70-150mm': 0,
        '150mm+': 0
    };
    
    samples.forEach(sample => {
        const focal = sample.focal;
        if (focal <= 35) {
            focalRanges['0-35mm']++;
        } else if (focal <= 70) {
            focalRanges['35-70mm']++;
        } else if (focal <= 150) {
            focalRanges['70-150mm']++;
        } else {
            focalRanges['150mm+']++;
        }
    });
    
    // Find maximum count for scaling
    const maxCount = Math.max(...Object.values(focalRanges), 1);
    
    // Generate chart HTML
    let chartHtml = '<div class="chart-container" style="padding: 10px;">';
    chartHtml += '<h4>焦距分布</h4>';
    
    Object.entries(focalRanges).forEach(([range, count]) => {
        // Calculate bar width as percentage of max count
        const barWidth = (count / maxCount) * 100;
        chartHtml += `
        <div class="chart-row" style="margin: 8px 0; display: flex; align-items: center;">
            <div style="width: 80px; font-size: 12px;">${range}:</div>
            <div style="flex: 1; display: flex; align-items: center;">
                <div style="background: #333; height: 20px; width: ${barWidth}%; min-width: 20px; display: flex; align-items: center; padding: 0 5px; color: white; font-size: 12px; border-radius: 2px;">
                    ${'|'.repeat(count)}
                </div>
                <span style="margin-left: 5px; font-size: 12px;">(${count})</span>
            </div>
        </div>
        `;
    });
    
    chartHtml += `<p style="margin-top: 15px; font-size: 12px; color: #666;">本次分析基于 ${total} 张示例照片的数据统计</p>`;
    chartHtml += '</div>';
    
    container.innerHTML = chartHtml;
}

// Render aperture distribution chart
function renderApertureChart(container, samples, total) {
    // Count aperture values
    const apertureCounts = {};
    samples.forEach(sample => {
        const aperture = sample.aperture;
        apertureCounts[aperture] = (apertureCounts[aperture] || 0) + 1;
    });
    
    // Sort aperture values
    const sortedApertureEntries = Object.entries(apertureCounts).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
    
    // Find maximum count for scaling
    const maxCount = Math.max(...sortedApertureEntries.map(entry => entry[1]), 1);
    
    // Generate chart HTML
    let chartHtml = '<div class="chart-container" style="padding: 10px;">';
    chartHtml += '<h4>光圈分布</h4>';
    
    sortedApertureEntries.forEach(([aperture, count]) => {
        // Calculate bar width as percentage of max count
        const barWidth = (count / maxCount) * 100;
        chartHtml += `
        <div class="chart-row" style="margin: 8px 0; display: flex; align-items: center;">
            <div style="width: 80px; font-size: 12px;">f/${aperture}:</div>
            <div style="flex: 1; display: flex; align-items: center;">
                <div style="background: #333; height: 20px; width: ${barWidth}%; min-width: 20px; display: flex; align-items: center; padding: 0 5px; color: white; font-size: 12px; border-radius: 2px;">
                    ${'|'.repeat(count)}
                </div>
                <span style="margin-left: 5px; font-size: 12px;">(${count})</span>
            </div>
        </div>
        `;
    });
    
    chartHtml += `<p style="margin-top: 15px; font-size: 12px; color: #666;">本次分析基于 ${total} 张示例照片的数据统计</p>`;
    chartHtml += '</div>';
    
    container.innerHTML = chartHtml;
}

// 查看作品详情
function viewWorkDetails(workId) {
    // 显示当前作品的拍摄参数
    const exifInfo = document.getElementById('exif-info');
    
    const work = works.find(w => w.id === workId);
    if (!work || !work.params) {
        exifInfo.innerHTML = '<p>找不到指定作品的参数信息</p>';
        return;
    }
    
    let detailsHtml = '<h4>拍摄参数：</h4>';
    detailsHtml += `<p><strong>相机:</strong> ${work.params.camera}</p>`;
    detailsHtml += `<p><strong>镜头:</strong> ${work.params.lens}</p>`;
    detailsHtml += `<p><strong>光圈:</strong> ${work.params.aperture}</p>`;
    detailsHtml += `<p><strong>快门:</strong> ${work.params.shutter}</p>`;
    detailsHtml += `<p><strong>ISO:</strong> ${work.params.iso}</p>`;
    detailsHtml += `<p><strong>焦距:</strong> ${work.params.focal}</p>`;
    detailsHtml += `<p><strong>地点:</strong> ${work.params.location}</p>`;
    
    exifInfo.innerHTML = detailsHtml;
}

// 从作品库分析照片
function analyzePhotoFromLibrary(photo) {
    // 显示当前照片的基本信息
    const exifInfo = document.getElementById('exif-info');
    
    // 根据是作品还是照片来显示不同的信息
    if (photo.image && photo.params) {
        // 这是works中的作品
        let detailsHtml = '<h4>拍摄参数：</h4>';
        detailsHtml += `<p><strong>相机:</strong> ${photo.params.camera}</p>`;
        detailsHtml += `<p><strong>镜头:</strong> ${photo.params.lens}</p>`;
        detailsHtml += `<p><strong>光圈:</strong> ${photo.params.aperture}</p>`;
        detailsHtml += `<p><strong>快门:</strong> ${photo.params.shutter}</p>`;
        detailsHtml += `<p><strong>ISO:</strong> ${photo.params.iso}</p>`;
        detailsHtml += `<p><strong>焦距:</strong> ${photo.params.focal}</p>`;
        detailsHtml += `<p><strong>地点:</strong> ${photo.params.location}</p>`;
        
        exifInfo.innerHTML = detailsHtml;
    } else if (photo.image) {
        // 这是只有基本信息的作品
        let detailsHtml = '<h4>基本信息：</h4>';
        detailsHtml += `<p><strong>作品名：</strong> ${photo.title}</p>`;
        detailsHtml += `<p><strong>标签：</strong> ${photo.tag}</p>`;
        detailsHtml += `<p><strong>ID：</strong> ${photo.id}</p>`;
        
        exifInfo.innerHTML = detailsHtml;
    } else {
        // 这是旧的数据结构
        let exifHtml = '<h4>基本信息：</h4>';
        exifHtml += `<p><strong>作品名：</strong> ${photo.title || photo.name}</p>`;
        exifHtml += `<p><strong>描述：</strong> ${photo.description || '暂无描述'}</p>`;
        exifHtml += `<p><strong>ID：</strong> ${photo.id}</p>`;
        
        // 如果照片已经有EXIF数据，则显示
        if (photo.exif && Object.keys(photo.exif).length > 0) {
            exifHtml += '<h4>拍摄参数：</h4>';
            exifHtml += `<p><strong>焦距：</strong> ${photo.exif.focal || '未知'}</p>`;
            exifHtml += `<p><strong>光圈：</strong> ${photo.exif.aperture || '未知'}</p>`;
            exifHtml += `<p><strong>快门速度：</strong> ${photo.exif.shutter || '未知'}</p>`;
            exifHtml += `<p><strong>ISO：</strong> ${photo.exif.iso || '未知'}</p>`;
        } else {
            exifHtml += '<h4>拍摄参数：</h4>';
            exifHtml += '<p>此照片暂无详细的拍摄参数</p>';
        }
        
        // 添加地理位置信息
        if (photo.location) {
            exifHtml += '<h4>拍摄地点：</h4>';
            exifHtml += `<p><strong>地点：</strong> ${photo.location.place}</p>`;
            exifHtml += `<p><strong>纬度：</strong> ${photo.location.lat}</p>`;
            exifHtml += `<p><strong>经度：</strong> ${photo.location.lng}</p>`;
        }
        
        // 添加标签信息
        if (photo.tags && photo.tags.length > 0) {
            exifHtml += '<h4>标签：</h4>';
            exifHtml += `<p><strong>分类：</strong> ${photo.tags.join(', ')}</p>`;
        }
        
        exifInfo.innerHTML = exifHtml;
    }
}



// 分析照片EXIF数据
function analyzePhotoEXIF(file) {
    if (!file.type.startsWith('image/')) {
        alert('请选择图像文件');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        // 模拟EXIF数据提取
        const exifInfo = document.getElementById('exif-info');
        
        // 模拟EXIF数据
        const simulatedExif = {
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(2) + ' KB',
            mimeType: file.type,
            dimensions: '1920x1080', // 从实际图像中获取
            cameraModel: 'Canon EOS R5',
            lensModel: 'RF 24-70mm f/2.8L IS USM',
            focalLength: '50mm',
            aperture: 'f/2.8',
            shutterSpeed: '1/125',
            iso: '400',
            exposureMode: 'Manual',
            whiteBalance: 'Auto',
            dateTaken: new Date().toISOString().split('T')[0],
            gps: '37.7749° N, 122.4194° W' // 旧金山坐标
        };
        
        let exifHtml = '<h4>基本信息：</h4>';
        exifHtml += `<p><strong>文件名：</strong> ${simulatedExif.fileName}</p>`;
        exifHtml += `<p><strong>文件大小：</strong> ${simulatedExif.fileSize}</p>`;
        exifHtml += `<p><strong>MIME类型：</strong> ${simulatedExif.mimeType}</p>`;
        exifHtml += `<p><strong>尺寸：</strong> ${simulatedExif.dimensions}</p>`;
        
        exifHtml += '<h4>相机设置：</h4>';
        exifHtml += `<p><strong>相机型号：</strong> ${simulatedExif.cameraModel}</p>`;
        exifHtml += `<p><strong>镜头型号：</strong> ${simulatedExif.lensModel}</p>`;
        exifHtml += `<p><strong>焦距：</strong> ${simulatedExif.focalLength}</p>`;
        exifHtml += `<p><strong>光圈：</strong> ${simulatedExif.aperture}</p>`;
        exifHtml += `<p><strong>快门速度：</strong> ${simulatedExif.shutterSpeed}</p>`;
        exifHtml += `<p><strong>ISO：</strong> ${simulatedExif.iso}</p>`;
        exifHtml += `<p><strong>曝光模式：</strong> ${simulatedExif.exposureMode}</p>`;
        exifHtml += `<p><strong>白平衡：</strong> ${simulatedExif.whiteBalance}</p>`;
        
        exifHtml += '<h4>位置和时间：</h4>';
        exifHtml += `<p><strong>拍摄日期：</strong> ${simulatedExif.dateTaken}</p>`;
        exifHtml += `<p><strong>GPS坐标：</strong> ${simulatedExif.gps}</p>`;
        
        exifInfo.innerHTML = exifHtml;
    };
    
    reader.readAsDataURL(file);
}

// 加载画廊照片
function loadGalleryPhotos() {
    const galleryGrid = document.getElementById('gallery-wall');
    if (!galleryGrid) return;
    
    // 获取示例作品
    const worksToDisplay = works;
    
    galleryGrid.innerHTML = '';
    
    if (worksToDisplay.length === 0) {
        galleryGrid.innerHTML = '<p class="card">暂无示例作品</p>';
        return;
    }
    
    // 显示示例作品在画廊格式中
    worksToDisplay.forEach(work => {
        const workCard = document.createElement('div');
        workCard.className = 'gallery-item';
        workCard.innerHTML = `
            <img src="${work.image}" alt="${work.title}" style="width: 100%; height: 100%; object-fit: cover;">
            <div class="gallery-info">
                <h4 class="gallery-title">${work.title || '未命名作品'}</h4>
                <p class="gallery-desc">${work.tag || '示例作品'}</p>
            </div>
        `;
        galleryGrid.appendChild(workCard);
    });
}

// Load photos from localStorage
function loadPhotos() {
    const raw = localStorage.getItem('photos');
    if (!raw) return [];
    try {
        let photos = JSON.parse(raw);
        
        // Ensure all photos have inExhibition field
        photos = photos.map(photo => {
            if (!('inExhibition' in photo)) {
                // Check if this photo is in the exhibition layout
                photo.inExhibition = exhibitionLayout.some(item => item.photoId === photo.id);
            }
            return photo;
        });
        
        return photos;
    } catch (e) {
        console.error('photos 解析失败，已清空', e);
        localStorage.removeItem('photos');
        return [];
    }
}

// 删除照片
function deletePhoto(id) {
    let photos = loadPhotos();
    photos = photos.filter(p => p.id !== id);
    localStorage.setItem("photos", JSON.stringify(photos));
    loadLibraryPhotos(); // Re-render the library after deletion
}

// 加载保存的数据
function loadSavedData() {
    // 数据迁移：确保所有照片都有 src 字段
    migratePhotoData();
    
    // 检查用户是否已登录
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isLoggedInStatus = localStorage.getItem('userLoggedIn') === 'true';
    
    // Update navigation bar display based on login status
    updateNavigationBar(currentUser);
    
    // Update button restrictions based on login status
    updateButtonRestrictions(!isLoggedInStatus);
    
    // 根据登录状态更新图库部分
    const libraryElement = document.getElementById('library');
    if (libraryElement && libraryElement.classList.contains('active')) {
        loadLibraryPhotos();
    }
}

// Update navigation bar display based on login status
function updateNavigationBar(currentUser) {
    const userDropdownBtn = document.querySelector('.user-dropdown-btn');
    const navUsername = document.querySelector('.nav-username');
    const userDropdownMenu = document.querySelector('.user-dropdown-menu');
    const logoutLink = document.getElementById('logout-link');
    
    if (!navUsername) return;
    
    if (currentUser) {
        // User is logged in
        navUsername.textContent = currentUser.name;
        
        // Show logout link in dropdown
        if (logoutLink) {
            logoutLink.style.display = 'block';
        }
    } else {
        // User is not logged in (guest)
        navUsername.textContent = '游客';
        
        // Hide logout link for guests
        if (logoutLink) {
            logoutLink.style.display = 'none';
        }
    }
}

// Update button restrictions based on login status
function updateButtonRestrictions(isGuest) {
    // Add or remove guest restriction classes to buttons
    const restrictedButtons = document.querySelectorAll(
        '.add-exhibit, .add-to-exhibition, .exhibition-toolbar button, ' +
        '.upload-section button, .analyze-btn, #sync-with-library-btn, ' +
        '#add-location-btn, .save-tags-btn, .photo-delete-btn'
    );
    
    restrictedButtons.forEach(button => {
        if (isGuest) {
            // Add disabled class for guest
            button.classList.add('disabled-when-guest');
            button.dataset.originalEvents = 'true'; // Mark that we've added event listener
        } else {
            // Remove disabled class for logged in user
            button.classList.remove('disabled-when-guest');
        }
    });
    
    // Add event listeners to restricted buttons if in guest mode
    if (isGuest) {
        addGuestRestrictionListeners();
    } else {
        removeGuestRestrictionListeners();
    }
}

// Check if user is logged in using the marker
function isLoggedIn() {
    return localStorage.getItem('userLoggedIn') === 'true';
}

// 全局登录验证函数
function requireLogin(actionName) {
    if (!isLoggedIn()) {
        openLoginModal();
        return false;
    }
    return true;
}

// 为所有功能按钮添加登录检查
function addGlobalLoginChecks() {
    // 为作品库的所有按钮添加登录检查
    document.addEventListener('click', function(e) {
        const target = e.target;
        
        // 检查是否是功能按钮（排除登录相关的按钮）
        const isFeatureButton = target.classList.contains('add-exhibit') ||
                               target.classList.contains('view-meta') ||
                               target.classList.contains('edit-work') ||
                               target.classList.contains('save-edit') ||
                               target.classList.contains('add-to-gallery-btn') ||
                               target.classList.contains('view-exif-btn') ||
                               target.classList.contains('analyze-btn') ||
                               target.classList.contains('upload-btn');
        
        if (isFeatureButton && !isLoggedIn()) {
            e.preventDefault();
            e.stopPropagation();
            requireLogin('使用该功能');
        }
    });
}

// Add event listeners to prevent guest actions
function addGuestRestrictionListeners() {
    const restrictedButtons = document.querySelectorAll('.disabled-when-guest:not([data-listener-added])');
    
    restrictedButtons.forEach(button => {
        const listener = function(e) {
            // Check if user has logged in since the page loaded
            if (localStorage.getItem('userLoggedIn') === 'true') {
                // If user has logged in, allow the action
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // Open login modal directly without alert
            openLoginModal();
        };
        
        button.addEventListener('click', listener);
        button.setAttribute('data-listener-added', 'true');
        button.dataset.originalListener = listener.toString(); // Store reference
    });
}

// Remove event listeners when user logs in
function removeGuestRestrictionListeners() {
    const restrictedButtons = document.querySelectorAll('.disabled-when-guest[data-listener-added]');
    
    restrictedButtons.forEach(button => {
        // We can't remove the specific anonymous function, so we'll just remove the attribute
        // The actual removal happens when the class is removed
        button.removeAttribute('data-listener-added');
    });
}

// 迁移照片数据以确保所有照片都有 src 字段
function migratePhotoData() {
    const photos = JSON.parse(localStorage.getItem('photos')) || [];
    let hasUpdates = false;
    
    const migratedPhotos = photos.map(photo => {
        if (!photo.src && photo.url) {
            photo.src = photo.url;  // Copy url to src for consistency
            hasUpdates = true;
        }
        return photo;
    });
    
    if (hasUpdates) {
        localStorage.setItem('photos', JSON.stringify(migratedPhotos));
    }
}

// Global variable to hold the map instance
let shootMap = null;

// Initialize or refresh the shooting map when the page is activated
function initOrRefreshShootMap() {
    const mapContainer = document.getElementById('shootMap');
    if (!mapContainer) return;

    if (!shootMap) {
        // First time entering the page - initialize map
        shootMap = L.map('shootMap').setView([30, 104], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '&copy; OpenStreetMap'
        }).addTo(shootMap);

        // Load and display existing albums
        loadAlbumMarkers();
        
        // Set up click event to get coordinates for adding locations
        shootMap.on('click', function(e) {
            if (window.isAddingLocation) {
                document.getElementById('location-lat').value = e.latlng.lat.toFixed(6);
                document.getElementById('location-lng').value = e.latlng.lng.toFixed(6);
            }
        });
    } else {
        // Subsequent visits - just refresh size
        setTimeout(() => {
            shootMap.invalidateSize();
        }, 0);
    }
}

// Load album markers from localStorage and works data
function loadAlbumMarkers() {
    if (!shootMap) return; // Don't try to load markers if map isn't initialized
    
    // Clear existing markers
    if (window.albumMarkers) {
        window.albumMarkers.forEach(marker => shootMap.removeLayer(marker));
    }
    window.albumMarkers = [];
    
    // Add markers for works that have location information
    const worksWithLocation = works.filter(work => work.lat && work.lng);
    
    if (worksWithLocation.length === 0) {
        // Show a message if no works have location info
        const noLocationMessage = L.control();
        noLocationMessage.onAdd = function(map) {
            var div = L.DomUtil.create('div', 'no-location-message');
            div.style.position = 'absolute';
            div.style.top = '50%';
            div.style.left = '50%';
            div.style.transform = 'translate(-50%, -50%)';
            div.style.background = 'rgba(255, 255, 255, 0.9)';
            div.style.padding = '10px';
            div.style.borderRadius = '4px';
            div.style.zIndex = '1000';
            div.style.textAlign = 'center';
            div.innerHTML = '当前作品没有位置信息，无法在地图上展示';
            return div;
        };
        noLocationMessage.addTo(shootMap);
        
        // Remove the message after 3 seconds
        setTimeout(() => {
            if (shootMap && noLocationMessage._map) {
                shootMap.removeControl(noLocationMessage);
            }
        }, 3000);
        
        return;
    }
    
    // Add markers for each work with location
    worksWithLocation.forEach(work => {
        const marker = L.marker([work.lat, work.lng]).addTo(shootMap);
        marker.bindPopup(`<strong>${work.title}</strong><br>${work.locationName}`);
        window.albumMarkers.push(marker);
    });
    
    // Fit map to show all markers
    if (window.albumMarkers.length > 0) {
        const group = new L.featureGroup(window.albumMarkers);
        shootMap.fitBounds(group.getBounds().pad(0.1)); // Add slight padding
    }
}

// Create photo popup HTML
function createPhotoPopup(photo) {
    return `
        <div class="photo-popup">
            <h3 style="margin: 0 0 10px 0;">${photo.title}</h3>
            <p style="margin: 5px 0;"><strong>描述:</strong> ${photo.description}</p>
            <p style="margin: 5px 0;"><strong>位置:</strong> ${photo.location.place}</p>
            <p style="margin: 5px 0;"><strong>坐标:</strong> ${photo.location.lat}, ${photo.location.lng}</p>
            ${photo.exif ? `
            <p style="margin: 5px 0;"><strong>焦距:</strong> ${photo.exif.focal}</p>
            <p style="margin: 5px 0;"><strong>光圈:</strong> ${photo.exif.aperture}</p>
            <p style="margin: 5px 0;"><strong>快门:</strong> ${photo.exif.shutter}</p>
            <p style="margin: 5px 0;"><strong>ISO:</strong> ${photo.exif.iso}</p>
            ` : ''}
            ${photo.tags && photo.tags.length > 0 ? `
            <p style="margin: 5px 0;"><strong>标签:</strong> ${photo.tags.join(', ')}</p>
            ` : ''}
            <div style="text-align: center; margin-top: 10px;">
                <img src="${photo.src}" style="max-width: 150px; max-height: 150px; object-fit: cover; border-radius: 4px; cursor: pointer;" 
                     onclick="showFullPhoto('${photo.src}')" title="点击查看原图">
            </div>
        </div>
    `;
}

// Create album popup HTML
function createAlbumPopup(album) {
    let photosHtml = '';
    if (album.photos && album.photos.length > 0) {
        photosHtml = '<div class="album-grid" style="display: flex; flex-wrap: wrap; gap: 5px; margin: 10px 0;">';
        album.photos.forEach(photo => {
            photosHtml += `<img src="${photo.src}" class="album-thumb" style="max-width: 80px; max-height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer;" 
                           onclick="showFullPhoto('${photo.src}')" title="点击查看原图">`;
        });
        photosHtml += '</div>';
    }
    
    return `
        <div>
            <h3 style="margin: 0 0 10px 0;">${album.title}</h3>
            ${album.desc ? `<p style="margin: 5px 0;">${album.desc}</p>` : ''}
            ${photosHtml}
            <button onclick="prepareToAddPhoto(${album.id})" style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">添加照片</button>
        </div>
    `;
}

// Show full photo in a popup
function showFullPhoto(src) {
    const fullPhotoWindow = window.open('', '_blank');
    fullPhotoWindow.document.write(`
        <html>
            <head>
                <title>照片预览</title>
                <style>
                    body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; }
                    img { max-width: 90vw; max-height: 90vh; object-fit: contain; }
                </style>
            </head>
            <body>
                <img src="${src}" alt="Full photo" />
            </body>
        </html>
    `);
}

// Load map albums from localStorage
function loadMapAlbums() {
    const raw = localStorage.getItem('mapAlbums');
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error('mapAlbums 解析失败，已清空', e);
        localStorage.removeItem('mapAlbums');
        return [];
    }
}

// Save map albums to localStorage
function saveMapAlbums(albums) {
    localStorage.setItem('mapAlbums', JSON.stringify(albums));
}

// Add a new album/location
function addNewLocation() {
    window.isAddingLocation = true;
    document.getElementById('add-location-modal').style.display = 'flex';
    
    // Clear form
    document.getElementById('location-title').value = '';
    document.getElementById('location-desc').value = '';
    document.getElementById('location-lat').value = '';
    document.getElementById('location-lng').value = '';
    document.getElementById('album-photos').value = '';
}

// Save the new location
function saveNewLocation() {
    const title = document.getElementById('location-title').value.trim();
    if (!title) {
        alert('请输入地点名称');
        return;
    }
    
    const desc = document.getElementById('location-desc').value.trim();
    const lat = parseFloat(document.getElementById('location-lat').value);
    const lng = parseFloat(document.getElementById('location-lng').value);
    
    if (isNaN(lat) || isNaN(lng)) {
        alert('请输入有效的经纬度');
        return;
    }
    
    // Get uploaded photos
    const fileInput = document.getElementById('album-photos');
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert('请至少上传一张照片');
        return;
    }
    
    // Process photos
    const photos = [];
    let processedCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            continue;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const maxWidth = 1200;
                const maxHeight = 1200;
                const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Compressed base64, smaller size to avoid localStorage quota exceeded
                const compressedSrc = canvas.toDataURL('image/jpeg', 0.7);

                photos.push({
                    id: Date.now() + i,
                    src: compressedSrc,
                    exif: {}  // We could add EXIF parsing here if needed
                });
                
                processedCount++;
                
                // When all photos are processed, save the album
                if (processedCount === files.length) {
                    saveAlbum(title, desc, lat, lng, photos);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // Close modal
    document.getElementById('add-location-modal').style.display = 'none';
}

// Save album to localStorage and update map
function saveAlbum(title, desc, lat, lng, photos) {
    const albums = loadMapAlbums();
    
    const newAlbum = {
        id: Date.now(),
        title: title,
        desc: desc,
        lat: lat,
        lng: lng,
        photos: photos
    };
    
    albums.push(newAlbum);
    saveMapAlbums(albums);
    
    // Add marker to map if map is initialized
    if (shootMap) {
        const marker = L.marker([lat, lng]).addTo(shootMap);
        marker.bindPopup(createAlbumPopup(newAlbum));
        if (!window.albumMarkers) window.albumMarkers = [];
        window.albumMarkers.push(marker);
    }
    
    alert(`地点 "${title}" 已成功添加到地图！`);
}

// Prepare to add photo to an album
function prepareToAddPhoto(albumId) {
    window.currentAlbumId = albumId;
    document.getElementById('add-photo-modal').style.display = 'flex';
    document.getElementById('more-album-photos').value = '';
}

// Add photo to album
function addPhotoToAlbum() {
    if (!window.currentAlbumId) return;
    
    const fileInput = document.getElementById('more-album-photos');
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert('请选择要添加的照片');
        return;
    }
    
    const albums = loadMapAlbums();
    const albumIndex = albums.findIndex(a => a.id === window.currentAlbumId);
    
    if (albumIndex === -1) {
        alert('找不到指定的相册');
        return;
    }
    
    const album = albums[albumIndex];
    let processedCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            continue;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const maxWidth = 1200;
                const maxHeight = 1200;
                const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Compressed base64, smaller size to avoid localStorage quota exceeded
                const compressedSrc = canvas.toDataURL('image/jpeg', 0.7);

                album.photos.push({
                    id: Date.now() + i,
                    src: compressedSrc,
                    exif: {}  // We could add EXIF parsing here if needed
                });
                
                processedCount++;
                
                // When all photos are processed, save the album
                if (processedCount === files.length) {
                    saveMapAlbums(albums);
                    
                    // Find and update the marker popup
                    if (window.albumMarkers) {
                        window.albumMarkers.forEach(marker => {
                            // We'd need to find the right marker to update, for simplicity we'll reload
                        });
                    }
                    
                    // Reload the markers to reflect the changes
                    loadAlbumMarkers();
                    
                    // Close modal
                    document.getElementById('add-photo-modal').style.display = 'none';
                    alert(`${files.length} 张照片已添加到相册！`);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Exhibition Hall functionality

function loadExhibitionLayout() {
  const raw = localStorage.getItem('exhibitionLayout');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('exhibitionLayout 解析失败', e);
    return [];
  }
}

function saveExhibitionLayout(layout) {
  localStorage.setItem('exhibitionLayout', JSON.stringify(layout));
}

let exhibitionLayout = loadExhibitionLayout();

// Load photos from localStorage
function loadPhotos() {
    const raw = localStorage.getItem('photos');
    if (!raw) return [];
    try {
        let photos = JSON.parse(raw);
        
        // Ensure all photos have inExhibition field
        photos = photos.map(photo => {
            if (!('inExhibition' in photo)) {
                // Check if this photo is in the exhibition layout
                photo.inExhibition = exhibitionLayout.some(item => item.photoId === photo.id);
            }
            return photo;
        });
        
        return photos;
    } catch (e) {
        console.error('photos 解析失败，已清空', e);
        localStorage.removeItem('photos');
        return [];
    }
}

// Collect all unique tags from all photos and works
function collectAllTags() {
    const photos = loadPhotos();
    const allTags = new Set();
    
    // Collect tags from localStorage photos
    photos.forEach(photo => {
        if (photo.tags && Array.isArray(photo.tags)) {
            photo.tags.forEach(tag => {
                if (tag.trim()) {
                    allTags.add(tag.trim());
                }
            });
        }
    });
    
    // Collect tags from works array (sample images)
    works.forEach(work => {
        if (work.tag && work.tag.trim()) {
            allTags.add(work.tag.trim());
        }
    });
    
    return Array.from(allTags).sort();
}

// Filter photos by selected tags
function filterByTags(photos, selectedTags) {
    if (!selectedTags || selectedTags.length === 0) {
        return photos;
    }
    
    return photos.filter(photo => {
        // Handle both tag (string) and tags (array) formats
        const photoTags = Array.isArray(photo.tags) ? photo.tags : (photo.tag ? [photo.tag] : []);
        
        if (photoTags.length === 0) {
            return false;
        }
        
        // Check if photo contains ALL selected tags
        return selectedTags.every(selectedTag => 
            photoTags.some(photoTag => photoTag.trim() === selectedTag.trim())
        );
    });
}

// Render tag filter UI
function renderTagFilter(containerId, onTagClickCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const tags = collectAllTags();
    
    if (tags.length === 0) {
        container.innerHTML = '<div class="tag-filter-container"><p class="no-tags-message">暂无标签</p></div>';
        return;
    }
    
    const selectedTags = container.getAttribute('data-selected-tags') ? 
        JSON.parse(container.getAttribute('data-selected-tags')) : [];
    
    let tagButtonsHTML = '<div class="tag-filter-container">';
    tagButtonsHTML += '<span class="tag-filter-label">标签筛选：</span>';
    
    tags.forEach(tag => {
        const isSelected = selectedTags.includes(tag);
        const className = isSelected ? 'tag-button selected' : 'tag-button';
        tagButtonsHTML += `<button class="${className}" data-tag="${tag}">${tag}</button>`;
    });
    
    tagButtonsHTML += '</div>';
    
    container.innerHTML = tagButtonsHTML;
    
    // Add event listeners to tag buttons
    document.querySelectorAll(`#${containerId} .tag-button`).forEach(button => {
        button.addEventListener('click', function() {
            const tag = this.getAttribute('data-tag');
            const isSelected = this.classList.contains('selected');
            
            if (isSelected) {
                // Remove tag from selection
                const newSelectedTags = selectedTags.filter(t => t !== tag);
                container.setAttribute('data-selected-tags', JSON.stringify(newSelectedTags));
            } else {
                // Add tag to selection
                const newSelectedTags = [...selectedTags, tag];
                container.setAttribute('data-selected-tags', JSON.stringify(newSelectedTags));
            }
            
            // Call the callback to update the display
            if (onTagClickCallback) {
                onTagClickCallback();
            }
        });
    });
}

// Render exhibition sidebar with photo list
function renderExhibitionSidebar() {
    const photoList = document.getElementById('exhibition-photo-list');
    if (!photoList) return;
    
    const worksToDisplay = works;
    
    // Render tag filter first
    const tagFilterContainer = document.getElementById('exhibition-tag-filter');
    if (tagFilterContainer) {
        // Function to update the photo display based on selected tags
        const updateDisplay = () => {
            // Get currently selected tags
            const selectedTags = tagFilterContainer.getAttribute('data-selected-tags') ? 
                JSON.parse(tagFilterContainer.getAttribute('data-selected-tags')) : [];
            
            // Filter works based on selected tags
            const filteredWorks = selectedTags.length > 0 
                ? worksToDisplay.filter(work => selectedTags.includes(work.tag))
                : worksToDisplay;
            
            // Update the photo display
            renderFilteredWorks(filteredWorks);
        };
        
        // Initial update
        updateDisplay();
    } else {
        // If no tag filter container, render all works normally
        renderFilteredWorks(worksToDisplay);
    }
    
    // Helper function to render works
    function renderFilteredWorks(worksToRender) {
        photoList.innerHTML = '';
        
        if (worksToRender.length === 0) {
            photoList.innerHTML = '<p>没有找到匹配标签的作品</p>';
            return;
        }
        
        worksToRender.forEach(work => {
            // Check if work is already in exhibition using the inExhibition field
            const isInExhibition = work.inExhibition || exhibitionLayout.some(item => item.photoId === work.id);
            const buttonText = isInExhibition ? '已加入' : '加入展厅';
            const buttonDisabled = isInExhibition ? 'disabled' : '';
            const buttonStyle = isInExhibition ? 'opacity: 0.6; cursor: not-allowed;' : '';
            
            const workItem = document.createElement('div');
            workItem.className = 'photo-list-item';
            workItem.innerHTML = `
                <img src="${work.image}" class="photo-list-thumb" alt="${work.title}">
                <div class="photo-list-title">${work.title}</div>
                <button class="add-to-exhibition" data-id="${work.id}" ${buttonDisabled} style="${buttonStyle}">${buttonText}</button>
            `;
            photoList.appendChild(workItem);
        });
        
        // Add event listeners to "加入展厅" buttons
        document.querySelectorAll('.add-to-exhibition').forEach(button => {
            button.addEventListener('click', function() {
                const workId = this.getAttribute('data-id');
                addToExhibition(workId);
            });
        });
    }
}

// Add photo to exhibition layout
function addToExhibition(workId) {
    // First check if it's a work from the works array
    const work = works.find(w => w.id === workId);
    
    if (!work) {
        // If not in works, try to find in photos from localStorage
        const photo = loadPhotos().find(p => p.id === workId);
        if (!photo) {
            alert('找不到指定作品');
            return;
        }
        
        // Check if photo is already in exhibition
        const existingItem = exhibitionLayout.find(item => item.photoId === workId);
        if (existingItem) {
            showToast('该作品已在展厅中');
            // Update button state if it exists
            const addButton = document.querySelector(`.add-exhibit[data-id="${workId}"]`);
            if (addButton) {
                addButton.textContent = '已加入';
                addButton.disabled = true;
                addButton.style.opacity = '0.6';
                addButton.style.cursor = 'not-allowed';
            }
            return;
        }
        
        const newItem = {
            id: Date.now().toString(),
            type: 'photo',
            photoId: workId,
            xPercent: 30,  // Position in visible central area
            yPercent: 30,
            widthPercent: 18,
            caption: photo.title || ''
        };
        
        exhibitionLayout.push(newItem);
        saveExhibitionLayout(exhibitionLayout);
        
        // Set inExhibition to true
        photo.inExhibition = true;
        const photos = loadPhotos();
        const updatedPhotos = photos.map(p => p.id === photo.id ? photo : p);
        localStorage.setItem('photos', JSON.stringify(updatedPhotos));
        
        renderExhibitionCanvas();
        
        // Update button state if it exists
        const addButton = document.querySelector(`.add-exhibit[data-id="${workId}"]`);
        if (addButton) {
            addButton.textContent = '已加入';
            addButton.disabled = true;
            addButton.style.opacity = '0.6';
            addButton.style.cursor = 'not-allowed';
        }
        
        // Update exhibition count
        updateExhibitionCount();
        
        // Show success notification
        showToast('作品已成功添加到展厅！');
        
        return;
    }
    
    // Check if work is already in exhibition
    const existingItem = exhibitionLayout.find(item => item.photoId === workId);
    if (existingItem) {
        showToast('该作品已在展厅中');
        // Update button state if it exists
        const addButton = document.querySelector(`.add-exhibit[data-id="${workId}"]`);
        if (addButton) {
            addButton.textContent = '已加入';
            addButton.disabled = true;
            addButton.style.opacity = '0.6';
            addButton.style.cursor = 'not-allowed';
        }
        return;
    }
    
    const newItem = {
        id: Date.now().toString(),
        type: 'photo',
        photoId: workId,
        xPercent: 30,  // Position in visible central area
        yPercent: 30,
        widthPercent: 18,
        caption: work.title || ''
    };
    
    exhibitionLayout.push(newItem);
    saveExhibitionLayout(exhibitionLayout);
    
    // Set inExhibition to true
    work.inExhibition = true;
    
    renderExhibitionCanvas();
    
    // Update button state if it exists
    const addButton = document.querySelector(`.add-exhibit[data-id="${workId}"]`);
    if (addButton) {
        addButton.textContent = '已加入';
        addButton.disabled = true;
        addButton.style.opacity = '0.6';
        addButton.style.cursor = 'not-allowed';
    }
    
    // Update exhibition count
    updateExhibitionCount();
    
    // Update the corresponding button in the exhibition sidebar
    updateExhibitionButton(workId);
    
    // Show success notification
    showToast('作品已成功添加到展厅！');
}

// Show toast notification
function showToast(message) {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    
    // Style the toast
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#333';
    toast.style.color = 'white';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '10000';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    toast.style.fontFamily = 'inherit';
    toast.style.fontSize = '14px';
    
    // Add to document
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Update exhibition count indicator
function updateExhibitionCount() {
    const count = exhibitionLayout.length;
    
    // Look for exhibition count indicators in the UI and update them
    const exhibitionCountElements = document.querySelectorAll('.exhibition-count, [data-exhibition-count]');
    exhibitionCountElements.forEach(element => {
        element.textContent = count;
    });
    
    // Update the exhibition tab if it has a count indicator
    const exhibitionTab = document.querySelector('.nav-link[data-section="gallery"]');
    if (exhibitionTab) {
        // Remove any existing badge
        const existingBadge = exhibitionTab.querySelector('.exhibition-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Add new badge if there are items in exhibition
        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'exhibition-badge';
            badge.textContent = count;
            badge.style = 'position: absolute; top: -5px; right: -5px; background: #ff4757; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold;';
            exhibitionTab.style.position = 'relative';
            exhibitionTab.appendChild(badge);
        }
    }
}

// Update exhibition button state based on isInExhibition field
function updateExhibitionButton(photoId) {
    const button = document.querySelector(`.add-to-exhibition[data-id="${photoId}"]`);
    if (!button) return;
    
    // Find the work to check its inExhibition status
    const work = works.find(w => w.id === photoId);
    if (!work) return;
    
    // Check if work is in exhibition (considering both inExhibition field and exhibition layout)
    const isInExhibition = work.inExhibition || exhibitionLayout.some(item => item.photoId === photoId);
    
    if (isInExhibition) {
        // Set to "已加入" state
        button.textContent = '已加入';
        button.disabled = true;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
    } else {
        // Set to "加入展厅" state
        button.textContent = '加入展厅';
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

// Update all exhibition buttons based on current exhibition state
function updateAllExhibitionButtons() {
    document.querySelectorAll('.add-to-exhibition').forEach(button => {
        const photoId = button.getAttribute('data-id');
        if (photoId) {
            updateExhibitionButton(photoId);
        }
    });
}

// Initialize exhibition count when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Update exhibition count on initial load
    updateExhibitionCount();
    
    // Initialize inExhibition status for all works based on exhibition layout
    initializeExhibitionStatus();
});

// Initialize exhibition status for all works
function initializeExhibitionStatus() {
    // Set inExhibition to false for all works initially
    works.forEach(work => {
        work.inExhibition = false;
    });
    
    // Then set to true for works that are in the exhibition layout
    exhibitionLayout.forEach(item => {
        const work = works.find(w => w.id === item.photoId);
        if (work) {
            work.inExhibition = true;
        }
    });
    
    // Also update localStorage photos
    const photos = loadPhotos();
    const updatedPhotos = photos.map(photo => {
        const inExhibition = exhibitionLayout.some(item => item.photoId === photo.id);
        return { ...photo, inExhibition };
    });
    
    if (JSON.stringify(photos) !== JSON.stringify(updatedPhotos)) {
        localStorage.setItem('photos', JSON.stringify(updatedPhotos));
    }
}

// Render exhibition canvas
function renderExhibitionCanvas() {
  const canvas = document.getElementById('exhibition-canvas');
  if (!canvas) return;

  canvas.innerHTML = '';

  if (!exhibitionLayout || exhibitionLayout.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'exhibition-placeholder';
    placeholder.textContent = '将作品加入展厅后，可以在这里自由拖拽排布';
    canvas.appendChild(placeholder);
    
    // Update exhibition count
    updateExhibitionCount();
    return;
  }

  exhibitionLayout.forEach(item => {
    if (item.type === 'photo') {
      // Check if the item is from the works array
      const work = works.find(w => w.id === item.photoId);
      if (work) {
        // Item is from works array
        const artworkElement = document.createElement('div');
        artworkElement.className = 'work-item';
        artworkElement.id = `artwork-${item.id}`;
        artworkElement.dataset.id = item.id;

        // Position and size (percentage)
        artworkElement.style.left = (item.xPercent || 10) + '%';
        artworkElement.style.top = (item.yPercent || 10) + '%';
        artworkElement.style.width = (item.widthPercent || 18) + '%';

        // Controls area
        const controls = document.createElement('div');
        controls.className = 'work-controls';

        const sizeUpBtn = document.createElement('button');
        sizeUpBtn.textContent = '+';
        sizeUpBtn.onclick = () => updateItemSize(item.id, 2);

        const sizeDownBtn = document.createElement('button');
        sizeDownBtn.textContent = '-';
        sizeDownBtn.onclick = () => updateItemSize(item.id, -2);

        const delBtn = document.createElement('button');
        delBtn.textContent = '×';
        delBtn.onclick = () => removeFromExhibition(item.id);

        controls.appendChild(sizeUpBtn);
        controls.appendChild(sizeDownBtn);
        controls.appendChild(delBtn);

        // Image and caption
        const img = document.createElement('img');
        img.src = work.image;
        img.alt = work.title;

        const caption = document.createElement('div');
        caption.className = 'work-caption';
        caption.id = `caption-${item.id}`;
        caption.textContent = item.caption || work.title;
        caption.onclick = () => editPhotoCaption(item.id);

        artworkElement.appendChild(img);
        artworkElement.appendChild(caption);
        artworkElement.appendChild(controls);
        canvas.appendChild(artworkElement);
      } else {
        // Item is from localStorage photos
        const photos = loadPhotos();
        const photo = photos.find(p => p.id === item.photoId);
        
        if (!photo) return; // Skip if photo doesn't exist anymore
        
        const artworkElement = document.createElement('div');
        artworkElement.className = 'work-item';
        artworkElement.id = `artwork-${item.id}`;
        artworkElement.dataset.id = item.id;

        // Position and size (percentage)
        artworkElement.style.left = (item.xPercent || 10) + '%';
        artworkElement.style.top = (item.yPercent || 10) + '%';
        artworkElement.style.width = (item.widthPercent || 18) + '%';

        // Controls area
        const controls = document.createElement('div');
        controls.className = 'work-controls';

        const sizeUpBtn = document.createElement('button');
        sizeUpBtn.textContent = '+';
        sizeUpBtn.onclick = () => updateItemSize(item.id, 2);

        const sizeDownBtn = document.createElement('button');
        sizeDownBtn.textContent = '-';
        sizeDownBtn.onclick = () => updateItemSize(item.id, -2);

        const delBtn = document.createElement('button');
        delBtn.textContent = '×';
        delBtn.onclick = () => removeFromExhibition(item.id);

        controls.appendChild(sizeUpBtn);
        controls.appendChild(sizeDownBtn);
        controls.appendChild(delBtn);

        // Image and caption
        const img = document.createElement('img');
        img.src = photo.src;
        img.alt = photo.title || photo.name;

        const caption = document.createElement('div');
        caption.className = 'work-caption';
        caption.id = `caption-${item.id}`;
        caption.textContent = item.caption || photo.title || photo.name;
        caption.onclick = () => editPhotoCaption(item.id);

        artworkElement.appendChild(img);
        artworkElement.appendChild(caption);
        artworkElement.appendChild(controls);
        canvas.appendChild(artworkElement);
      }

      return;
    }

    if (item.type === 'text') {
      // Text block rendering
      const el = document.createElement('div');
      el.className = 'artwork-item text-item';
      el.dataset.id = item.id;

      // Position and size (percentage)
      el.style.left = (item.xPercent || 10) + '%';
      el.style.top = (item.yPercent || 10) + '%';
      el.style.width = (item.widthPercent || 30) + '%';

      // Apply font size class based on item.fontSize
      if (item.fontSize === 'small') {
        el.classList.add('font-small');
      } else if (item.fontSize === 'large') {
        el.classList.add('font-large');
      } else {
        el.classList.add('font-medium'); // default
      }

      // Controls area
      const controls = document.createElement('div');
      controls.className = 'text-controls'; // Fixed class name to match CSS

      const smallBtn = document.createElement('button');
      smallBtn.textContent = '小';
      smallBtn.onclick = (e) => { e.stopPropagation(); updateTextSize(item.id, 'small'); };

      const mediumBtn = document.createElement('button');
      mediumBtn.textContent = '中';
      mediumBtn.onclick = (e) => { e.stopPropagation(); updateTextSize(item.id, 'medium'); };

      const largeBtn = document.createElement('button');
      largeBtn.textContent = '大';
      largeBtn.onclick = (e) => { e.stopPropagation(); updateTextSize(item.id, 'large'); };

      const delBtn = document.createElement('button');
      delBtn.textContent = '删';
      delBtn.onclick = (e) => { e.stopPropagation(); removeFromExhibition(item.id); };

      controls.appendChild(smallBtn);
      controls.appendChild(mediumBtn);
      controls.appendChild(largeBtn);
      controls.appendChild(delBtn);

      // Text content
      const textDiv = document.createElement('div');
      textDiv.className = 'text-content';
      textDiv.textContent = item.content || '双击此处编辑文字';

      // Double-click to edit text
      textDiv.ondblclick = (e) => { e.stopPropagation(); editTextContent(item.id); };

      el.appendChild(controls);
      el.appendChild(textDiv);
      canvas.appendChild(el);
    }
  });
  
  // Add event listeners for drag functionality
  initDragAndDrop();
  
  // Update exhibition count
  updateExhibitionCount();
}

// Helper functions
function findLayoutItem(id) {
  return exhibitionLayout.find(i => i.id === id);
}

function updateItemSize(id, delta) {
  const item = findLayoutItem(id);
  if (!item) return;
  
  const newSize = item.widthPercent + delta;
  if (newSize >= 8 && newSize <= 50) { // Limit size range
    item.widthPercent = newSize;
    
    // Update the element on canvas - check both work-item and text-item
    const element = document.querySelector(`.work-item[data-id="${id}"]`) || document.querySelector(`.artwork-item.text-item[data-id="${id}"]`);
    if (element) {
      element.style.width = `${item.widthPercent}%`;
    }
    
    // Save to localStorage
    saveExhibitionLayout(exhibitionLayout);
  }
}

function updateTextSize(id, size) {
  const item = findLayoutItem(id);
  if (!item) return;
  
  item.fontSize = size;
  saveExhibitionLayout(exhibitionLayout);
  
  // Update the element directly instead of re-rendering everything
  const textElement = document.querySelector(`.artwork-item.text-item[data-id="${id}"]`);
  if (textElement) {
    // Remove existing font size classes
    textElement.classList.remove('font-small', 'font-medium', 'font-large');
    // Add the new font size class
    textElement.classList.add(`font-${size}`);
  }
}

function removeFromExhibition(id) {
  // Find the item in exhibitionLayout
  const item = exhibitionLayout.find(i => i.id === id);
  if (!item) return;
  
  // Remove from exhibition layout
  exhibitionLayout = exhibitionLayout.filter(i => i.id !== id);
  saveExhibitionLayout(exhibitionLayout);
  
  // Find the corresponding work and set inExhibition to false
  const work = works.find(w => w.id === item.photoId);
  if (work) {
    work.inExhibition = false;
  }
  
  // Also check if it's a photo from localStorage
  const photos = loadPhotos();
  const photo = photos.find(p => p.id === item.photoId);
  if (photo) {
    photo.inExhibition = false;
    // Save updated photo back to localStorage
    const updatedPhotos = photos.map(p => p.id === photo.id ? photo : p);
    localStorage.setItem('photos', JSON.stringify(updatedPhotos));
  }
  
  // Re-render both exhibition and library to ensure sync
  renderExhibitionCanvas();
  if (document.getElementById('library').classList.contains('active')) {
    loadLibraryPhotos();
  }
  
  // Update exhibition count
  updateExhibitionCount();
  
  // Update the corresponding button in the exhibition sidebar
  if (item && item.photoId) {
    updateExhibitionButton(item.photoId);
  }
}

// Alias deleteLayoutItem to removeFromExhibition for backward compatibility
function deleteLayoutItem(id) {
  removeFromExhibition(id);
}

function editTextContent(id) {
  const canvas = document.getElementById('exhibition-canvas');
  const item = findLayoutItem(id);
  if (!canvas || !item) return;

  const el = canvas.querySelector('.artwork-item[data-id="' + id + '"] .text-content');
  if (!el) return;

  const textarea = document.createElement('textarea');
  textarea.value = item.content || '';
  textarea.style.width = '100%';
  textarea.style.height = '80px';

  el.replaceWith(textarea);
  textarea.focus();

  const finish = () => {
    item.content = textarea.value || '';
    saveExhibitionLayout(exhibitionLayout);
    renderExhibitionCanvas();
  };

  textarea.addEventListener('blur', finish);
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      textarea.blur();
    }
  });
}

function editPhotoCaption(id) {
  const item = findLayoutItem(id);
  if (!item) return;
  
  const captionEl = document.getElementById(`caption-${id}`);
  if (!captionEl) return;
  
  const input = document.createElement('input');
  input.type = 'text';
  input.value = item.caption || '';
  input.style.width = '100%';
  input.style.fontSize = '12px';
  input.style.padding = '2px';
  input.style.border = '1px solid #ccc';
  
  captionEl.innerHTML = '';
  captionEl.appendChild(input);
  input.focus();
  
  const saveCaption = () => {
    const newText = input.value;
    item.caption = newText;
    captionEl.innerHTML = newText;
    
    // Save to localStorage
    saveExhibitionLayout(exhibitionLayout);
  };
  
  input.addEventListener('blur', saveCaption);
  
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveCaption();
    }
  });
}

// Add a text block to the exhibition
function addTextBlock() {
  // New text element
  const newItem = {
    type: 'text',
    id: 'text-' + Date.now(),
    xPercent: 30,
    yPercent: 20,
    widthPercent: 30,
    content: '双击此处编辑文字',
    fontSize: 'medium',
    align: 'left'
  };

  exhibitionLayout.push(newItem);
  saveExhibitionLayout(exhibitionLayout);
  renderExhibitionCanvas();
}

// Make element draggable
function makeDraggable(element, itemId) {
    const canvas = document.getElementById('exhibition-canvas');
    if (!canvas) return;
    
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    
    element.addEventListener('mousedown', function(e) {
        // Prevent dragging when clicking on buttons or inputs
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        isDragging = true;
        element.classList.add('dragging');
        
        const rect = element.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const canvasRect = canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left - offsetX;
        const y = e.clientY - canvasRect.top - offsetY;
        
        // Calculate percentage positions and keep within canvas bounds
        const widthPercent = parseFloat(element.style.width) || (element.classList.contains('text-item') ? 30 : 18);
        const xPercent = Math.max(0, Math.min(100 - widthPercent, (x / canvasRect.width) * 100));
        const yPercent = Math.max(0, Math.min(100 - 8, (y / canvasRect.height) * 100)); // Assuming min height of ~8%
        
        // Update element position
        element.style.left = `${xPercent}%`;
        element.style.top = `${yPercent}%`;
        
        // Find corresponding item in layout and update its position
        const item = exhibitionLayout.find(i => i.id === itemId);
        if (item) {
            item.xPercent = xPercent;
            item.yPercent = yPercent;
            
            // Save to localStorage
            saveExhibitionLayout(exhibitionLayout);
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            element.classList.remove('dragging');
            isDragging = false;
        }
    });
    
    // Prevent scrolling when dragging
    document.addEventListener('selectstart', function(e) {
        if (isDragging) {
            e.preventDefault();
        }
    });
}

// Initialize drag and drop functionality
function initDragAndDrop() {
    const canvas = document.getElementById('exhibition-canvas');
    if (!canvas) return;
    
    // Make all work-items (photos) draggable
    document.querySelectorAll('.work-item').forEach(element => {
        const itemId = element.dataset.id || element.id.replace('artwork-', '');
        makeDraggable(element, itemId);
    });
    
    // Make all text-items draggable
    document.querySelectorAll('.artwork-item.text-item').forEach(element => {
        const itemId = element.dataset.id;
        makeDraggable(element, itemId);
    });
}

// Adjust item size
function adjustItemSize(itemId, delta) {
    const item = exhibitionLayout.find(i => i.id === itemId);
    if (!item) return;
    
    const newSize = item.widthPercent + delta;
    if (newSize >= 8 && newSize <= 50) { // Limit size range
        item.widthPercent = newSize;
        
        // Update the element on canvas
        const element = document.getElementById(`artwork-${itemId}`);
        if (element) {
            element.style.width = `${item.widthPercent}%`;
        }
        
        // Save to localStorage
        localStorage.setItem('exhibitionLayout', JSON.stringify(exhibitionLayout));
    }
}

// Remove item from exhibition
function removeItemFromExhibition(itemId) {
    exhibitionLayout = exhibitionLayout.filter(item => item.id !== itemId);
    
    // Update canvas
    renderExhibitionCanvas();
    
    // Save to localStorage
    localStorage.setItem('exhibitionLayout', JSON.stringify(exhibitionLayout));
}

// Save exhibition layout
function saveExhibition() {
    localStorage.setItem('exhibitionLayout', JSON.stringify(exhibitionLayout));
    alert('布展已保存！');
}

// Clear exhibition
function clearExhibition() {
    if (confirm('确定要清空展厅吗？所有布展信息将丢失。')) {
        exhibitionLayout = [];
        localStorage.removeItem('exhibitionLayout');
        
        // Reset inExhibition status for all works
        works.forEach(work => {
            work.inExhibition = false;
        });
        
        // Also reset inExhibition for localStorage photos
        const photos = loadPhotos();
        const updatedPhotos = photos.map(photo => {
            return { ...photo, inExhibition: false };
        });
        if (photos.length > 0) {
            localStorage.setItem('photos', JSON.stringify(updatedPhotos));
        }
        
        renderExhibitionCanvas();
        
        // Update all buttons in the exhibition sidebar
        updateAllExhibitionButtons();
    }
}

// Bind events after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Bind sync button if it exists
    const syncBtn = document.getElementById('sync-with-library-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', syncMapFromLibrary);
    }
    
    // Bind add location button
    const addLocationBtn = document.getElementById('add-location-btn');
    if (addLocationBtn) {
        addLocationBtn.addEventListener('click', addNewLocation);
    }
    
    // Bind modal controls
    document.getElementById('cancel-location').addEventListener('click', function() {
        document.getElementById('add-location-modal').style.display = 'none';
    });
    
    const saveLocationBtn = document.getElementById('save-location');
    saveLocationBtn.addEventListener('click', saveNewLocation);
    
    // Add hover effect for save location button
    saveLocationBtn.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#5a5a5a';
    });
    
    saveLocationBtn.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '#4a4a4a';
    });
    
    document.getElementById('cancel-photo').addEventListener('click', function() {
        document.getElementById('add-photo-modal').style.display = 'none';
    });
    
    document.getElementById('save-photo').addEventListener('click', addPhotoToAlbum);
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    // Exhibition-specific buttons
    const exhibitionSaveBtn = document.getElementById('exhibition-save-btn');
    if (exhibitionSaveBtn) {
        exhibitionSaveBtn.addEventListener('click', saveExhibition);
    }
    
    const exhibitionAddTextBtn = document.getElementById('exhibition-add-text-btn');
    if (exhibitionAddTextBtn) {
        exhibitionAddTextBtn.addEventListener('click', addTextBlock);
    }
    
    const exhibitionClearBtn = document.getElementById('exhibition-clear-btn');
    if (exhibitionClearBtn) {
        exhibitionClearBtn.addEventListener('click', clearExhibition);
    }
    
    // Initial render of exhibition canvas
    renderExhibitionCanvas();
    
    // Initialize exhibition page when it becomes active
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.classList && node.classList.contains('content-section')) {
                    if (node.id === 'gallery' && node.classList.contains('active')) {
                        renderExhibitionSidebar();
                        renderExhibitionCanvas();
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Initial check in case gallery is already active
    if (document.getElementById('gallery').classList.contains('active')) {
        renderExhibitionSidebar();
        renderExhibitionCanvas();
    }
    
    // Window resize handler for map
    window.addEventListener('resize', () => {
        if (shootMap) {
            shootMap.invalidateSize();
        }
    });
});

// User dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    const dropdownBtn = document.querySelector('.user-dropdown-btn');
    const dropdownMenu = document.querySelector('.user-dropdown-menu');
    const logoutLink = document.getElementById('logout-link');
    const navUsername = document.querySelector('.nav-username');
    
    // Check login status and update navigation bar on page load
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isLoggedInStatus = localStorage.getItem('userLoggedIn') === 'true';
    updateNavigationBar(currentUser);
    updateButtonRestrictions(!isLoggedInStatus);
    
    // Toggle dropdown on click - only for logged in users
    if (dropdownBtn) {
        dropdownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if user is logged in using the new marker
            const isLoggedInStatus = localStorage.getItem('userLoggedIn') === 'true';
            
            if (isLoggedInStatus) {
                // If logged in, show dropdown with logout option
                dropdownMenu.classList.toggle('show');
            } else {
                // If not logged in (guest), open login modal
                openLoginModal();
            }
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (dropdownBtn && !dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
    
    // Handle logout
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // 额外保障：确保登录弹窗关闭按钮能工作
    const loginClose = document.getElementById('login-close');
    const loginOverlay = document.getElementById('login-overlay');
    
    if (loginClose && loginOverlay) {
        // 移除可能存在的旧监听器，添加新的
        loginClose.onclick = function() {
            closeLoginModal();
        };
        
        // 确保点击遮罩也能关闭
        loginOverlay.addEventListener('click', function(e) {
            if (e.target === loginOverlay) {
                closeLoginModal();
            }
        });
    }
});

// Sync map from library functionality
function syncMapFromLibrary() {
    const syncBtn = document.getElementById('sync-with-library-btn');
    
    // Temporarily disable button to prevent multiple clicks
    if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.style.opacity = '0.6';
        syncBtn.textContent = '同步中...';
    }
    
    // Small delay to prevent rapid clicks
    setTimeout(() => {
        if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.style.opacity = '1';
            syncBtn.textContent = '同步作品库';
        }
    }, 500);
    
    // Load markers from works data
    loadAlbumMarkers();
    
    // Get works with location information
    const worksWithLocation = works.filter(work => work.lat && work.lng);
    
    if (worksWithLocation.length === 0) {
        alert('当前作品没有位置信息');
    } else {
        alert(`已从作品库同步 ${worksWithLocation.length} 条拍摄地点到地图`);
    }
}
