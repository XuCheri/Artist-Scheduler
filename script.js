// ========== 全局变量 ==========
let allTasks = [];
let currentView = 'list'; // list, calendar, timeline
let currentYear = 2025;
let currentMonth = null;
let filteredTasks = [];

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 优先从本地存储加载
    const localData = Storage.load();

    if (localData) {
      // 使用本地数据
      allTasks = [];
      Object.keys(localData).forEach(year => {
        localData[year].forEach(task => {
          allTasks.push({
            ...task,
            year: year
          });
        });
      });
    } else {
      // 从JSON文件加载
      const response = await fetch('data.json');
      const data = await response.json();

      allTasks = [];
      Object.keys(data).forEach(year => {
        data[year].forEach(task => {
          allTasks.push({
            ...task,
            year: year
          });
        });
      });

      // 首次加载时保存到本地存储
      Storage.save(allTasks);
    }

    // 初始化过滤器
    populateFilters();

    // 渲染初始视图
    filteredTasks = allTasks.filter(task => task.year === String(currentYear));
    renderCurrentView();
    updateYearDisplay();

    // 绑定事件监听器
    setupEventListeners();
  } catch (error) {
    console.error('加载数据失败:', error);
    showError('数据加载失败,请检查 data.json 文件');
  }
});

// ========== 事件监听器设置 ==========
function setupEventListeners() {
  // 视图切换按钮
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.target.dataset.view;
      switchView(view);
    });
  });

  // 筛选器
  document.getElementById('yearFilter').addEventListener('change', applyFilters);
  document.getElementById('typeFilter').addEventListener('change', applyFilters);
  document.getElementById('statusFilter').addEventListener('change', applyFilters);
  document.getElementById('monthFilter').addEventListener('change', applyFilters);

  // 年份导航
  document.getElementById('prevYear').addEventListener('click', () => changeYear(-1));
  document.getElementById('nextYear').addEventListener('click', () => changeYear(1));
}

// ========== 视图切换 ==========
function switchView(view) {
  currentView = view;

  // 更新按钮状态
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // 显示/隐藏对应视图
  document.querySelectorAll('.view-container').forEach(container => {
    container.classList.add('hidden');
  });

  renderCurrentView();
}

// ========== 渲染当前视图 ==========
function renderCurrentView() {
  const container = document.getElementById(`${currentView}View`);
  container.classList.remove('hidden');

  switch (currentView) {
    case 'dashboard':
      Dashboard.render();
      break;
    case 'list':
      renderListView();
      break;
    case 'calendar':
      renderCalendarView();
      break;
    case 'timeline':
      renderTimelineView();
      break;
    case 'gantt':
      GanttChart.render();
      break;
  }
}

// ========== 列表视图渲染 ==========
function renderListView() {
  const container = document.getElementById('listView');

  if (filteredTasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>📭 暂无符合条件的任务</p></div>';
    return;
  }

  container.innerHTML = filteredTasks.map((task, index) => {
    const artistsText = task.artists ? task.artists.join('、') : '';
    const locationText = task.location ? `📍 地点: ${task.location}` : '';

    return `
    <div class="task-card ${task.status}" onclick="TaskManager.showTaskDetail(filteredTasks[${index}])">
      <h3>${task.type}</h3>
      <div class="month">📅 ${task.year}年 ${task.month}</div>
      ${locationText ? `<div class="location">${locationText}</div>` : ''}
      <div class="artists">👥 参与画师: ${artistsText}</div>
      <span class="status-badge ${task.status}">${task.status}</span>
    </div>
  `}).join('');
}

// ========== 日历视图渲染 ==========
function renderCalendarView() {
  const container = document.getElementById('calendarView');

  // 按月份分组
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  let html = '<div class="year-calendar">';

  monthNames.forEach((monthName, index) => {
    const tasksInMonth = filteredTasks.filter(task => task.month === monthName);

    html += `
      <div class="month-section">
        <div class="month-header">${monthName}</div>
        <div class="month-tasks">
    `;

    if (tasksInMonth.length === 0) {
      html += '<div class="no-tasks">暂无任务</div>';
    } else {
      tasksInMonth.forEach(task => {
        const artistsText = task.artists ? task.artists.slice(0, 3).join('、') : '';
        const moreArtists = task.artists && task.artists.length > 3 ? `+${task.artists.length - 3}` : '';

        html += `
          <div class="calendar-task ${task.status}">
            <div class="task-type">${task.type}</div>
            <div class="task-artists">${artistsText}${moreArtists}</div>
            ${task.location ? `<div class="task-location">📍 ${task.location}</div>` : ''}
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

// ========== 时间轴视图渲染 ==========
function renderTimelineView() {
  const container = document.getElementById('timelineView');

  if (filteredTasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>📭 暂无符合条件的任务</p></div>';
    return;
  }

  // 按月份排序
  const monthOrder = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
  });

  let html = '<div class="timeline-container">';

  sortedTasks.forEach((task, index) => {
    const artistsText = task.artists ? task.artists.join('、') : '';
    const locationText = task.location ? `📍 ${task.location}` : '';

    html += `
      <div class="timeline-item ${task.status}" style="animation-delay: ${index * 0.1}s">
        <div class="timeline-card ${task.status}">
          <div class="timeline-month">${task.year}年 ${task.month}</div>
          <h3>${task.type}</h3>
          ${locationText ? `<div class="location">${locationText}</div>` : ''}
          <div class="artists">👥 ${artistsText}</div>
          <span class="status-badge ${task.status}">${task.status}</span>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

// ========== 填充筛选器选项 ==========
function populateFilters() {
  // 年份筛选器
  const years = [...new Set(allTasks.map(task => task.year))].sort().reverse();
  const yearFilter = document.getElementById('yearFilter');

  // 先清空已有选项(保留第一个默认选项)
  while (yearFilter.options.length > 1) {
    yearFilter.remove(1);
  }

  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year + '年';
    if (year === String(currentYear)) {
      option.selected = true;
    }
    yearFilter.appendChild(option);
  });

  // 类型筛选器
  const types = [...new Set(allTasks.map(task => task.type))];
  const typeFilter = document.getElementById('typeFilter');
  types.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    typeFilter.appendChild(option);
  });

  // 状态筛选器和月份筛选器已在HTML中定义
}

// ========== 应用筛选 ==========
function applyFilters() {
  const yearFilter = document.getElementById('yearFilter').value;
  const typeFilter = document.getElementById('typeFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;
  const monthFilter = document.getElementById('monthFilter').value;

  // 更新当前年份
  if (yearFilter) {
    currentYear = parseInt(yearFilter);
  }

  filteredTasks = allTasks.filter(task => {
    const matchYear = !yearFilter || task.year === yearFilter;
    const matchType = !typeFilter || task.type === typeFilter;
    const matchStatus = !statusFilter || task.status === statusFilter;
    const matchMonth = !monthFilter || task.month === monthFilter;
    return matchYear && matchType && matchStatus && matchMonth;
  });

  // 应用搜索过滤
  filteredTasks = SearchManager.filter(filteredTasks);

  updateYearDisplay();
  renderCurrentView();
}

// ========== 年份导航 ==========
function changeYear(delta) {
  // 获取所有可用年份
  const availableYears = [...new Set(allTasks.map(task => parseInt(task.year)))].sort();
  const currentIndex = availableYears.indexOf(currentYear);

  // 计算新的索引
  const newIndex = currentIndex + delta;

  // 检查是否超出范围
  if (newIndex < 0 || newIndex >= availableYears.length) {
    return; // 不做任何操作
  }

  // 更新年份
  currentYear = availableYears[newIndex];

  // 更新年份筛选器
  document.getElementById('yearFilter').value = String(currentYear);

  applyFilters();
}

function updateYearDisplay() {
  document.getElementById('currentYear').textContent = `${currentYear}年`;
}

// ========== 错误提示 ==========
function showError(message) {
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="empty-state">
      <p>❌ ${message}</p>
    </div>
  `;
}

// ========== 响应式处理 ==========
function handleResize() {
  // 在移动端自动切换到列表视图
  if (window.innerWidth < 768 && currentView === 'calendar') {
    switchView('list');
  }
}

window.addEventListener('resize', handleResize);
