// ========== 扩展功能模块 ==========

// ========== 本地存储管理 ==========
const Storage = {
  STORAGE_KEY: 'artist_scheduler_tasks',

  // 保存到本地存储
  save(tasks) {
    try {
      const dataByYear = {};
      tasks.forEach(task => {
        if (!dataByYear[task.year]) {
          dataByYear[task.year] = [];
        }
        dataByYear[task.year].push(task);
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataByYear));
      return true;
    } catch (e) {
      console.error('保存失败:', e);
      return false;
    }
  },

  // 从本地存储加载
  load() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('加载失败:', e);
      return null;
    }
  },

  // 检查是否有本地数据
  hasLocalData() {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }
};

// ========== 任务管理 ==========
const TaskManager = {
  currentTask: null,
  editingTaskId: null,

  // 显示任务详情
  showTaskDetail(task) {
    this.currentTask = task;
    const modal = document.getElementById('taskModal');
    const modalBody = document.getElementById('modalBody');

    const artistsText = task.artists ? task.artists.join('、') : '';
    const partnerText = task.partner ? `<div class="detail-row">
      <div class="detail-label">🤝 合作伙伴</div>
      <div class="detail-value">${task.partner}</div>
    </div>` : '';
    const locationText = task.location ? `<div class="detail-row">
      <div class="detail-label">📍 地点</div>
      <div class="detail-value">${task.location}</div>
    </div>` : '';
    const notesText = task.notes ? `<div class="detail-row">
      <div class="detail-label">📝 备注</div>
      <div class="detail-value">${task.notes}</div>
    </div>` : '';

    modalBody.innerHTML = `
      <div class="detail-row">
        <div class="detail-value large">${task.type}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">📅 时间</div>
        <div class="detail-value">${task.year}年 ${task.month}</div>
      </div>
      ${partnerText}
      ${locationText}
      <div class="detail-row">
        <div class="detail-label">👥 参与画师</div>
        <div class="detail-value">${artistsText}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">🔖 状态</div>
        <div class="detail-value">
          <span class="detail-badge ${task.status}">${task.status}</span>
        </div>
      </div>
      ${notesText}
    `;

    modal.classList.remove('hidden');
  },

  // 关闭任务详情
  closeTaskDetail() {
    const modal = document.getElementById('taskModal');
    modal.classList.add('hidden');
    this.currentTask = null;
  },

  // 显示任务表单(新增或编辑)
  showTaskForm(task = null) {
    this.editingTaskId = task ? task.id : null;
    const modal = document.getElementById('taskFormModal');
    const title = document.getElementById('formModalTitle');

    if (task) {
      title.textContent = '编辑任务';
      document.getElementById('taskYear').value = task.year;
      document.getElementById('taskMonth').value = task.month;
      document.getElementById('taskType').value = task.type;
      document.getElementById('taskPartner').value = task.partner || '';
      document.getElementById('taskLocation').value = task.location || '';
      document.getElementById('taskArtists').value = task.artists ? task.artists.join(',') : '';
      document.getElementById('taskStatus').value = task.status;
      document.getElementById('taskNotes').value = task.notes || '';
    } else {
      title.textContent = '新增任务';
      document.getElementById('taskForm').reset();
      document.getElementById('taskYear').value = currentYear;
    }

    modal.classList.remove('hidden');
  },

  // 关闭任务表单
  closeTaskForm() {
    const modal = document.getElementById('taskFormModal');
    modal.classList.add('hidden');
    document.getElementById('taskForm').reset();
    this.editingTaskId = null;
  },

  // 保存任务
  saveTask() {
    const form = document.getElementById('taskForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const taskData = {
      id: this.editingTaskId || Date.now(),
      year: document.getElementById('taskYear').value,
      month: document.getElementById('taskMonth').value,
      type: document.getElementById('taskType').value,
      partner: document.getElementById('taskPartner').value || undefined,
      location: document.getElementById('taskLocation').value || undefined,
      artists: document.getElementById('taskArtists').value.split(',').map(a => a.trim()).filter(a => a),
      status: document.getElementById('taskStatus').value,
      notes: document.getElementById('taskNotes').value || undefined
    };

    if (this.editingTaskId) {
      // 编辑现有任务
      const index = allTasks.findIndex(t => t.id === this.editingTaskId);
      if (index !== -1) {
        allTasks[index] = taskData;
      }
    } else {
      // 新增任务
      allTasks.push(taskData);
    }

    // 保存到本地存储
    Storage.save(allTasks);

    // 刷新视图
    applyFilters();
    this.closeTaskForm();

    // 显示成功提示
    showNotification('任务已保存!', 'success');
  },

  // 删除任务
  deleteTask() {
    if (!this.currentTask) return;

    if (confirm(`确定要删除任务"${this.currentTask.type}"吗?`)) {
      const index = allTasks.findIndex(t => t.id === this.currentTask.id);
      if (index !== -1) {
        allTasks.splice(index, 1);
        Storage.save(allTasks);
        applyFilters();
        this.closeTaskDetail();
        showNotification('任务已删除!', 'success');
      }
    }
  }
};

// ========== 搜索功能 ==========
const SearchManager = {
  searchTerm: '',

  init() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      applyFilters();
    });
  },

  filter(tasks) {
    if (!this.searchTerm) return tasks;

    return tasks.filter(task => {
      const searchableText = [
        task.type,
        task.partner,
        task.location,
        ...(task.artists || [])
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableText.includes(this.searchTerm);
    });
  }
};

// ========== Dashboard 统计 ==========
const Dashboard = {
  render() {
    const container = document.getElementById('dashboardView');

    // 统计数据
    const stats = this.calculateStats();

    const html = `
      <div class="dashboard-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">总任务数</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value">${stats.confirmed}</div>
          <div class="stat-label">已确认</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-value">${stats.pending}</div>
          <div class="stat-label">待开始</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">❓</div>
          <div class="stat-value">${stats.unconfirmed}</div>
          <div class="stat-label">未确认</div>
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-title">📅 月度任务分布</div>
        ${this.renderMonthChart(stats.byMonth)}
      </div>

      <div class="chart-container">
        <div class="chart-title">🎨 任务类型统计</div>
        ${this.renderTypeChart(stats.byType)}
      </div>

      <div class="chart-container">
        <div class="chart-title">👥 画师工作量</div>
        ${this.renderArtistChart(stats.byArtist)}
      </div>
    `;

    container.innerHTML = html;
  },

  calculateStats() {
    const stats = {
      total: filteredTasks.length,
      confirmed: 0,
      pending: 0,
      unconfirmed: 0,
      byMonth: {},
      byType: {},
      byArtist: {}
    };

    filteredTasks.forEach(task => {
      // 状态统计
      if (task.status === '已确认') stats.confirmed++;
      else if (task.status === '待开始') stats.pending++;
      else if (task.status === '未确认') stats.unconfirmed++;

      // 月份统计
      stats.byMonth[task.month] = (stats.byMonth[task.month] || 0) + 1;

      // 类型统计
      stats.byType[task.type] = (stats.byType[task.type] || 0) + 1;

      // 画师统计
      if (task.artists) {
        task.artists.forEach(artist => {
          stats.byArtist[artist] = (stats.byArtist[artist] || 0) + 1;
        });
      }
    });

    return stats;
  },

  renderMonthChart(data) {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const maxValue = Math.max(...Object.values(data), 1);

    return months.map(month => {
      const count = data[month] || 0;
      const percentage = (count / maxValue) * 100;

      return `
        <div class="chart-bar">
          <div class="chart-bar-label">
            <span>${month}</span>
            <span>${count} 个任务</span>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderTypeChart(data) {
    const maxValue = Math.max(...Object.values(data), 1);

    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => {
        const percentage = (count / maxValue) * 100;

        return `
          <div class="chart-bar">
            <div class="chart-bar-label">
              <span>${type}</span>
              <span>${count} 个任务</span>
            </div>
            <div class="chart-bar-track">
              <div class="chart-bar-fill" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
      }).join('');
  },

  renderArtistChart(data) {
    const maxValue = Math.max(...Object.values(data), 1);

    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // 只显示前10名
      .map(([artist, count]) => {
        const percentage = (count / maxValue) * 100;

        return `
          <div class="chart-bar">
            <div class="chart-bar-label">
              <span>${artist}</span>
              <span>${count} 个任务</span>
            </div>
            <div class="chart-bar-track">
              <div class="chart-bar-fill" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
      }).join('');
  }
};

// ========== 甘特图视图 ==========
const GanttChart = {
  render() {
    const container = document.getElementById('ganttView');

    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    let html = `
      <div class="gantt-container">
        <div class="gantt-header">
          <div class="gantt-task-name">任务</div>
          <div class="gantt-timeline">
            ${months.map(m => `<div class="gantt-month">${m}</div>`).join('')}
          </div>
        </div>
    `;

    filteredTasks.forEach(task => {
      const monthIndex = months.indexOf(task.month);
      const barLeft = (monthIndex / 12) * 100;
      const barWidth = (1 / 12) * 100;

      html += `
        <div class="gantt-row">
          <div class="gantt-task-name">${task.type}</div>
          <div class="gantt-timeline">
            <div class="gantt-bar ${task.status}"
                 style="left: ${barLeft}%; width: ${barWidth}%"
                 title="${task.type} - ${task.month}">
              ${task.type}
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }
};

// ========== 数据导出 ==========
const DataExporter = {
  exportToJSON() {
    const dataByYear = {};
    allTasks.forEach(task => {
      if (!dataByYear[task.year]) {
        dataByYear[task.year] = [];
      }
      dataByYear[task.year].push(task);
    });

    const dataStr = JSON.stringify(dataByYear, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artist-scheduler-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('数据已导出!', 'success');
  },

  exportToCSV() {
    const headers = ['年份', '月份', '类型', '合作伙伴', '地点', '画师', '状态', '备注'];
    const rows = allTasks.map(task => [
      task.year,
      task.month,
      task.type,
      task.partner || '',
      task.location || '',
      (task.artists || []).join(';'),
      task.status,
      task.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artist-scheduler-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('数据已导出为CSV!', 'success');
  }
};

// ========== 主题切换 ==========
const ThemeManager = {
  isDark: false,

  init() {
    // 从本地存储读取主题偏好
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.toggle();
    }
  },

  toggle() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-mode', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }
};

// ========== 通知系统 ==========
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 2rem;
    background: ${type === 'success' ? '#88B04B' : '#A6B1E1'};
    color: white;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// 添加通知动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// ========== 事件绑定 ==========
function setupFeatureEventListeners() {
  // 新增任务按钮
  document.getElementById('addTask').addEventListener('click', () => {
    TaskManager.showTaskForm();
  });

  // 导出数据按钮
  document.getElementById('exportData').addEventListener('click', () => {
    if (confirm('选择导出格式:\n确定 = JSON\n取消 = CSV')) {
      DataExporter.exportToJSON();
    } else {
      DataExporter.exportToCSV();
    }
  });

  // 主题切换按钮
  document.getElementById('toggleTheme').addEventListener('click', () => {
    ThemeManager.toggle();
  });

  // 任务详情弹窗
  document.getElementById('closeModal').addEventListener('click', () => {
    TaskManager.closeTaskDetail();
  });
  document.getElementById('modalClose').addEventListener('click', () => {
    TaskManager.closeTaskDetail();
  });
  document.getElementById('modalEdit').addEventListener('click', () => {
    TaskManager.closeTaskDetail();
    TaskManager.showTaskForm(TaskManager.currentTask);
  });
  document.getElementById('modalDelete').addEventListener('click', () => {
    TaskManager.deleteTask();
  });

  // 任务表单弹窗
  document.getElementById('closeFormModal').addEventListener('click', () => {
    TaskManager.closeTaskForm();
  });
  document.getElementById('formModalClose').addEventListener('click', () => {
    TaskManager.closeTaskForm();
  });
  document.getElementById('formModalSave').addEventListener('click', () => {
    TaskManager.saveTask();
  });

  // 点击弹窗背景关闭
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        TaskManager.closeTaskDetail();
        TaskManager.closeTaskForm();
      }
    });
  });

  // 搜索功能初始化
  SearchManager.init();

  // 主题初始化
  ThemeManager.init();
}

// ========== 初始化扩展功能 ==========
document.addEventListener('DOMContentLoaded', () => {
  setupFeatureEventListeners();
});
