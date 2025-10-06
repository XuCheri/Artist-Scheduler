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
    const artistsTempText = task.artistsTemp ? task.artistsTemp.join('、') : '';
    const locationText = task.location ? `<div class="detail-row">
      <div class="detail-label">📍 场馆</div>
      <div class="detail-value">${task.location}</div>
    </div>` : '';
    const artistsTempRow = task.artistsTemp ? `<div class="detail-row">
      <div class="detail-label">⏳ 暂定画师</div>
      <div class="detail-value">${artistsTempText}</div>
    </div>` : '';
    const notesText = task.notes ? `<div class="detail-row">
      <div class="detail-label">📝 备注</div>
      <div class="detail-value">${task.notes}</div>
    </div>` : '';
    const displayStatus = (task.status === '已确认' || task.status === '待开始') ? '待开始' : task.status;

    modalBody.innerHTML = `
      <div class="detail-row">
        <div class="detail-value large">${task.type}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">📅 时间</div>
        <div class="detail-value">${task.year}年 ${task.month}</div>
      </div>
      ${locationText}
      <div class="detail-row">
        <div class="detail-label">👥 参与画师</div>
        <div class="detail-value">${artistsText}</div>
      </div>
      ${artistsTempRow}
      <div class="detail-row">
        <div class="detail-label">🔖 状态</div>
        <div class="detail-value">
          <span class="detail-badge ${task.status}">${displayStatus}</span>
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
    const form = document.getElementById('taskForm');

    console.log('showTaskForm 收到的任务数据:', task);

    if (task) {
      title.textContent = '编辑任务';

      // 先重置表单
      form.reset();

      // 延迟填充数据，确保表单已重置
      setTimeout(() => {
        console.log('开始填充表单字段...');
        console.log('年份:', task.year);
        console.log('月份:', task.month);
        console.log('类型:', task.type);
        console.log('场馆:', task.location);
        console.log('画师:', task.artists);
        console.log('暂定画师:', task.artistsTemp);
        console.log('状态:', task.status);
        console.log('备注:', task.notes);

        document.getElementById('taskYear').value = task.year || '';
        document.getElementById('taskMonth').value = task.month || '';
        document.getElementById('taskType').value = task.type || '';
        document.getElementById('taskLocation').value = task.location || '';
        document.getElementById('taskArtists').value = task.artists ? task.artists.join(',') : '';
        document.getElementById('taskArtistsTemp').value = task.artistsTemp ? task.artistsTemp.join(',') : '';
        document.getElementById('taskStatus').value = task.status || '';
        document.getElementById('taskNotes').value = task.notes || '';

        console.log('表单填充完成');
      }, 10);
    } else {
      title.textContent = '新增任务';
      form.reset();
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

    const artistsTemp = document.getElementById('taskArtistsTemp').value.split(',').map(a => a.trim()).filter(a => a);
    const locationValue = document.getElementById('taskLocation').value.trim();
    const notesValue = document.getElementById('taskNotes').value.trim();

    const taskData = {
      id: this.editingTaskId || Date.now(),
      year: String(document.getElementById('taskYear').value),
      month: document.getElementById('taskMonth').value,
      type: document.getElementById('taskType').value,
      location: locationValue || undefined,
      artists: document.getElementById('taskArtists').value.split(',').map(a => a.trim()).filter(a => a),
      artistsTemp: artistsTemp.length > 0 ? artistsTemp : undefined,
      status: document.getElementById('taskStatus').value,
      notes: notesValue || undefined
    };

    if (this.editingTaskId) {
      // 编辑现有任务 - 先按ID查找
      const index = allTasks.findIndex(t => t.id === this.editingTaskId);
      if (index !== -1) {
        // 更新任务,确保year字段正确
        allTasks[index] = { ...taskData, year: String(taskData.year) };
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

      <div class="chart-container">
        <div class="chart-title">🏛️ 场馆任务统计</div>
        ${this.renderLocationChart(stats.byLocation)}
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
      byArtist: {},
      byLocation: {}
    };

    filteredTasks.forEach(task => {
      // 状态统计 - 已确认也算作未开始
      if (task.status === '已确认' || task.status === '待开始') stats.pending++;
      else if (task.status === '未确认') stats.unconfirmed++;

      // 月份统计
      stats.byMonth[task.month] = (stats.byMonth[task.month] || 0) + 1;

      // 类型统计
      stats.byType[task.type] = (stats.byType[task.type] || 0) + 1;

      // 画师统计 - 包括暂定画师
      if (task.artists) {
        task.artists.forEach(artist => {
          stats.byArtist[artist] = (stats.byArtist[artist] || 0) + 1;
        });
      }
      if (task.artistsTemp) {
        task.artistsTemp.forEach(artist => {
          stats.byArtist[artist] = (stats.byArtist[artist] || 0) + 1;
        });
      }

      // 场馆统计
      if (task.location) {
        stats.byLocation[task.location] = (stats.byLocation[task.location] || 0) + 1;
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
  },

  renderLocationChart(data) {
    if (Object.keys(data).length === 0) {
      return '<div style="text-align: center; color: #999; padding: 20px;">暂无场馆数据</div>';
    }

    const maxValue = Math.max(...Object.values(data), 1);

    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .map(([location, count]) => {
        const percentage = (count / maxValue) * 100;

        return `
          <div class="chart-bar">
            <div class="chart-bar-label">
              <span>${location}</span>
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
          <div class="gantt-task-info">任务信息</div>
          <div class="gantt-timeline">
            ${months.map(m => `<div class="gantt-month">${m}</div>`).join('')}
          </div>
        </div>
    `;

    filteredTasks.forEach((task, index) => {
      const monthIndex = months.indexOf(task.month);
      const barLeft = (monthIndex / 12) * 100;
      const barWidth = (1 / 12) * 100;

      // 构建任务信息
      const displayStatus = (task.status === '已确认' || task.status === '待开始') ? '待开始' : task.status;
      const artists = task.artists ? task.artists.slice(0, 2).join('、') : '';
      const moreArtists = task.artists && task.artists.length > 2 ? `+${task.artists.length - 2}` : '';
      const artistsTemp = task.artistsTemp ? ` (暂定:${task.artistsTemp.join('、')})` : '';

      const tooltipText = `${task.type} | ${task.location || '未指定场馆'} | ${task.month}
画师: ${task.artists ? task.artists.join('、') : '无'}${artistsTemp}
状态: ${displayStatus}`;

      html += `
        <div class="gantt-row">
          <div class="gantt-task-info">
            <div class="gantt-task-title">${task.type}</div>
            <div class="gantt-task-detail">
              <span class="gantt-location">📍 ${task.location || '未指定'}</span>
              <span class="gantt-artists">👥 ${artists}${moreArtists}${artistsTemp}</span>
            </div>
          </div>
          <div class="gantt-timeline">
            <div class="gantt-bar ${task.status}"
                 style="left: ${barLeft}%; width: ${barWidth}%; cursor: pointer;"
                 title="${tooltipText}"
                 onclick="TaskManager.showTaskDetail(filteredTasks[${index}])">
              <span class="gantt-bar-label">${task.type}</span>
              <span class="gantt-bar-status">${displayStatus}</span>
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
  showExportModal() {
    const modal = document.getElementById('exportModal');
    modal.classList.remove('hidden');
  },

  closeExportModal() {
    const modal = document.getElementById('exportModal');
    modal.classList.add('hidden');
  },

  exportToJSON(silent = false) {
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

    if (!silent) {
      this.closeExportModal();
      showNotification('数据已导出为JSON!', 'success');
    }
  },

  exportToCSV(silent = false) {
    const headers = ['年份', '月份', '类型', '场馆', '画师', '暂定画师', '状态', '备注'];
    const rows = allTasks.map(task => [
      task.year,
      task.month,
      task.type,
      task.location || '',
      (task.artists || []).join(';'),
      (task.artistsTemp || []).join(';'),
      (task.status === '已确认' || task.status === '待开始') ? '待开始' : task.status,
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

    if (!silent) {
      this.closeExportModal();
      showNotification('数据已导出为CSV!', 'success');
    }
  },

  // 生成可视化视图HTML
  generateVisualizationHTML(tasksByYear, stats, monthsZh) {
    let html = '';

    // 时间轴视图
    html += `
      <div style="page-break-before: always; margin-top: 30px;">
        <h3 style="color: #2C2C2C; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #A6B1E1; padding-bottom: 8px;">⏱️ 时间轴视图</h3>
        <div style="position: relative; padding-left: 20px;">
          <div style="position: absolute; left: 7px; top: 0; bottom: 0; width: 3px; background: linear-gradient(180deg, #A6B1E1, #E9A6A6);"></div>
    `;

    monthsZh.forEach(month => {
      const tasksInMonth = filteredTasks.filter(t => t.month === month);
      if (tasksInMonth.length > 0) {
        html += `
          <div style="position: relative; margin-bottom: 15px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <div style="width: 16px; height: 16px; border-radius: 50%; background: #A6B1E1; border: 3px solid white; position: absolute; left: 0;"></div>
              <div style="margin-left: 25px; font-weight: 700; color: #A6B1E1; font-size: 14px;">${month}</div>
            </div>
            <div style="margin-left: 25px;">
        `;
        tasksInMonth.forEach(task => {
          const displayStatus = (task.status === '已确认' || task.status === '待开始') ? '待开始' : task.status;
          const statusColor = (task.status === '已确认' || task.status === '待开始') ? '#D4C5B9' : '#E8B4B8';
          html += `
            <div style="background: white; border-left: 3px solid ${statusColor}; padding: 8px 12px; margin-bottom: 6px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <div style="font-weight: 600; font-size: 13px; margin-bottom: 3px;">${task.type}</div>
              <div style="font-size: 11px; color: #666;">📍 ${task.location || '未指定'} | 👥 ${task.artists ? task.artists.slice(0, 2).join('、') : ''}</div>
            </div>
          `;
        });
        html += `
            </div>
          </div>
        `;
      }
    });

    html += `
        </div>
      </div>
    `;

    // 日历视图
    html += `
      <div style="page-break-before: always; margin-top: 30px;">
        <h3 style="color: #2C2C2C; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #A6B1E1; padding-bottom: 8px;">📅 日历视图</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
    `;

    monthsZh.forEach(month => {
      const tasksInMonth = filteredTasks.filter(t => t.month === month);
      html += `
        <div style="background: #F9F6F1; border-radius: 8px; padding: 12px;">
          <div style="font-weight: 700; color: #A6B1E1; text-align: center; margin-bottom: 8px; font-size: 13px;">${month}</div>
          <div style="min-height: 80px;">
      `;
      if (tasksInMonth.length === 0) {
        html += '<div style="text-align: center; color: #999; font-size: 11px;">暂无任务</div>';
      } else {
        tasksInMonth.slice(0, 3).forEach(task => {
          const statusColor = (task.status === '已确认' || task.status === '待开始') ? '#D4C5B9' : '#E8B4B8';
          html += `
            <div style="background: white; padding: 6px; margin-bottom: 4px; border-radius: 4px; border-left: 3px solid ${statusColor}; font-size: 10px;">
              <div style="font-weight: 600;">${task.type}</div>
              <div style="color: #666;">${task.location || ''}</div>
            </div>
          `;
        });
        if (tasksInMonth.length > 3) {
          html += `<div style="text-align: center; color: #999; font-size: 10px;">+${tasksInMonth.length - 3} 更多</div>`;
        }
      }
      html += `
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    // 甘特图视图
    html += `
      <div style="page-break-before: always; margin-top: 30px;">
        <h3 style="color: #2C2C2C; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #A6B1E1; padding-bottom: 8px;">📈 甘特图视图</h3>
        <div style="overflow-x: auto;">
          <div style="display: flex; border-bottom: 2px solid #A6B1E1; padding-bottom: 8px; margin-bottom: 10px;">
            <div style="min-width: 150px; font-weight: 600; font-size: 11px;">任务</div>
            <div style="flex: 1; display: grid; grid-template-columns: repeat(12, 1fr); gap: 2px; font-size: 10px; text-align: center;">
              ${monthsZh.map(m => `<div>${m}</div>`).join('')}
            </div>
          </div>
    `;

    filteredTasks.slice(0, 20).forEach(task => {
      const monthIndex = monthsZh.indexOf(task.month);
      const statusColor = (task.status === '已确认' || task.status === '待开始') ? '#D4C5B9' : '#E8B4B8';
      html += `
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <div style="min-width: 150px; font-size: 11px; padding-right: 10px;">
            <div style="font-weight: 600;">${task.type}</div>
            <div style="font-size: 9px; color: #666;">${task.location || ''}</div>
          </div>
          <div style="flex: 1; position: relative; height: 30px;">
            <div style="position: absolute; left: ${(monthIndex / 12) * 100}%; width: ${(1 / 12) * 100}%; height: 25px; background: ${statusColor}; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 9px; font-weight: 600;">
              ${task.type}
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  },

  // 生成统计图表HTML
  generateStatsChartsHTML(stats) {
    const maxTypeValue = Math.max(...Object.values(stats.byType), 1);
    const maxLocationValue = Math.max(...Object.values(stats.byLocation || {}), 1);
    const maxArtistValue = Math.max(...Object.values(stats.byArtist), 1);

    return `
      <div style="page-break-before: always; margin-top: 30px;">
        <h3 style="color: #2C2C2C; margin: 20px 0 15px 0; font-size: 18px; border-bottom: 2px solid #A6B1E1; padding-bottom: 8px;">🎨 任务类型统计</h3>
        ${Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
          const percentage = (count / maxTypeValue) * 100;
          return `
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
                <span style="font-weight: 600;">${type}</span>
                <span style="color: #666;">${count} 个任务</span>
              </div>
              <div style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden;">
                <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #A6B1E1, #E9A6A6);"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-top: 30px;">
        <h3 style="color: #2C2C2C; margin: 20px 0 15px 0; font-size: 18px; border-bottom: 2px solid #A6B1E1; padding-bottom: 8px;">🏛️ 场馆任务统计</h3>
        ${Object.keys(stats.byLocation || {}).length > 0 ? Object.entries(stats.byLocation).sort((a, b) => b[1] - a[1]).map(([location, count]) => {
          const percentage = (count / maxLocationValue) * 100;
          return `
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
                <span style="font-weight: 600;">${location}</span>
                <span style="color: #666;">${count} 个任务</span>
              </div>
              <div style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden;">
                <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #A6B1E1, #E9A6A6);"></div>
              </div>
            </div>
          `;
        }).join('') : '<p style="text-align: center; color: #999;">暂无场馆数据</p>'}
      </div>

      <div style="page-break-before: always; margin-top: 30px;">
        <h3 style="color: #2C2C2C; margin: 20px 0 15px 0; font-size: 18px; border-bottom: 2px solid #A6B1E1; padding-bottom: 8px;">👥 画师工作量统计</h3>
        ${Object.entries(stats.byArtist).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([artist, count]) => {
          const percentage = (count / maxArtistValue) * 100;
          return `
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
                <span style="font-weight: 600;">${artist}</span>
                <span style="color: #666;">${count} 个任务</span>
              </div>
              <div style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden;">
                <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #A6B1E1, #E9A6A6);"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  async exportToPDF(silent = false) {
    try {
      if (!silent) {
        showNotification('正在生成PDF...', 'info');
      }

      // 创建一个临时容器用于PDF内容
      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 800px;
        background: white;
        padding: 40px;
        font-family: 'Nunito', 'Microsoft YaHei', sans-serif;
      `;

      // 统计信息
      const stats = this.calculatePDFStats();
      const dateStr = new Date().toLocaleDateString('zh-CN');

      // 生成PDF内容HTML
      let htmlContent = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #A6B1E1; font-size: 32px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif;">✨ 稿件排期管理</h1>
          <h2 style="color: #E9A6A6; font-size: 24px; margin: 0 0 10px 0;">Artist Scheduler</h2>
          <p style="color: #888; font-size: 14px; margin: 0;">导出日期: ${dateStr}</p>
          <p style="color: #A6B1E1; font-size: 12px; margin: 5px 0 0 0; font-weight: bold;">${filteredTasks[0]?.year || ''}年数据报表</p>
        </div>

        <div style="background: #F9F6F1; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
          <h3 style="color: #2C2C2C; margin: 0 0 15px 0; font-size: 18px;">📊 总体统计</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #A6B1E1;">${stats.total}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">总任务数</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #D4C5B9;">${stats.pending}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">待开始</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #E8B4B8;">${stats.unconfirmed}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">未确认</div>
            </div>
          </div>
        </div>

        ${this.generateStatsChartsHTML(stats)}

        <div style="page-break-before: always;"></div>
        <h3 style="color: #2C2C2C; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #A6B1E1; padding-bottom: 8px;">📋 任务详情列表</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: linear-gradient(135deg, #A6B1E1, #E9A6A6); color: white;">
              <th style="padding: 12px 8px; text-align: center; border: 1px solid #ddd; width: 40px;">序号</th>
              <th style="padding: 12px 8px; text-align: center; border: 1px solid #ddd;">年份</th>
              <th style="padding: 12px 8px; text-align: center; border: 1px solid #ddd;">月份</th>
              <th style="padding: 12px 8px; text-align: left; border: 1px solid #ddd;">类型</th>
              <th style="padding: 12px 8px; text-align: center; border: 1px solid #ddd;">状态</th>
              <th style="padding: 12px 8px; text-align: left; border: 1px solid #ddd;">场馆</th>
              <th style="padding: 12px 8px; text-align: left; border: 1px solid #ddd;">参与画师</th>
              <th style="padding: 12px 8px; text-align: left; border: 1px solid #ddd;">暂定画师</th>
            </tr>
          </thead>
          <tbody>
      `;

      // 按年份和月份分组
      const tasksByYear = {};
      filteredTasks.forEach(task => {
        if (!tasksByYear[task.year]) {
          tasksByYear[task.year] = {};
        }
        if (!tasksByYear[task.year][task.month]) {
          tasksByYear[task.year][task.month] = [];
        }
        tasksByYear[task.year][task.month].push(task);
      });

      // 生成表格行
      let rowIndex = 0;
      const monthsZh = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

      Object.keys(tasksByYear).sort((a, b) => b - a).forEach(year => {
        monthsZh.forEach(month => {
          if (tasksByYear[year][month]) {
            tasksByYear[year][month].forEach(task => {
              const displayStatus = (task.status === '已确认' || task.status === '待开始') ? '待开始' : task.status;
              const statusColor =
                (task.status === '已确认' || task.status === '待开始') ? '#D4C5B9' : '#E8B4B8';

              const bgColor = rowIndex % 2 === 0 ? '#FFFFFF' : '#F9F6F1';
              const artistsText = task.artists ? task.artists.join('、') : '-';
              const artistsTempText = task.artistsTemp ? task.artistsTemp.join('、') : '-';

              htmlContent += `
                <tr style="background: ${bgColor};">
                  <td style="padding: 10px 8px; text-align: center; border: 1px solid #ddd; font-weight: 600; color: #888;">${rowIndex + 1}</td>
                  <td style="padding: 10px 8px; text-align: center; border: 1px solid #ddd;">${year}</td>
                  <td style="padding: 10px 8px; text-align: center; border: 1px solid #ddd;">${month}</td>
                  <td style="padding: 10px 8px; border: 1px solid #ddd;">${task.type || '-'}</td>
                  <td style="padding: 10px 8px; text-align: center; border: 1px solid #ddd;">
                    <span style="background: ${statusColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold;">${displayStatus || '-'}</span>
                  </td>
                  <td style="padding: 10px 8px; border: 1px solid #ddd;">${task.location || '-'}</td>
                  <td style="padding: 10px 8px; border: 1px solid #ddd;">${artistsText}</td>
                  <td style="padding: 10px 8px; border: 1px solid #ddd;">${artistsTempText}</td>
                </tr>
              `;
              rowIndex++;
            });
          }
        });
      });

      htmlContent += `
          </tbody>
        </table>
      `;

      // 添加可视化视图
      htmlContent += this.generateVisualizationHTML(tasksByYear, stats, monthsZh);

      htmlContent += `
        <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
          <p>© 2025 Artist Scheduler | 用心管理每一份创作 🎨</p>
          <p>Made with ❤️ for Artists</p>
          <p style="margin-top: 15px; color: #666;">本报表由 Artist Scheduler 自动生成</p>
          <p style="margin-top: 5px; color: #999; font-size: 11px;">一个专为职业画师设计的稿件排期管理工具</p>
          <p style="margin-top: 8px;">
            访问在线工具: <a href="https://xucheri.github.io/Artist-Scheduler/" style="color: #A6B1E1; text-decoration: none; font-weight: bold;">https://xucheri.github.io/Artist-Scheduler/</a>
          </p>
        </div>
      `;

      pdfContainer.innerHTML = htmlContent;
      document.body.appendChild(pdfContainer);

      // 使用html2canvas将内容转换为图片
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowHeight: pdfContainer.scrollHeight
      });

      // 移除临时容器
      document.body.removeChild(pdfContainer);

      // 创建PDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4宽度(mm)
      const pageHeight = 297; // A4高度(mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // 添加第一页
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 如果内容超过一页,继续添加
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(`稿件排期报表-${new Date().toISOString().split('T')[0]}.pdf`);

      if (!silent) {
        showNotification('PDF导出成功!', 'success');
        this.closeExportModal();
      }
    } catch (error) {
      console.error('PDF导出失败:', error);
      if (!silent) {
        showNotification('PDF导出失败,请重试', 'error');
      }
    }
  },

  calculateStats() {
    const stats = {
      total: filteredTasks.length,
      confirmed: 0,
      pending: 0,
      unconfirmed: 0
    };

    filteredTasks.forEach(task => {
      if (task.status === '已确认' || task.status === '待开始') stats.pending++;
      else if (task.status === '未确认') stats.unconfirmed++;
    });

    return stats;
  },

  calculatePDFStats() {
    const stats = {
      total: filteredTasks.length,
      confirmed: 0,
      pending: 0,
      unconfirmed: 0,
      byMonth: {},
      byType: {},
      byArtist: {},
      byLocation: {}
    };

    filteredTasks.forEach(task => {
      // 状态统计
      if (task.status === '已确认' || task.status === '待开始') stats.pending++;
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
      if (task.artistsTemp) {
        task.artistsTemp.forEach(artist => {
          stats.byArtist[artist] = (stats.byArtist[artist] || 0) + 1;
        });
      }

      // 场馆统计
      if (task.location) {
        stats.byLocation[task.location] = (stats.byLocation[task.location] || 0) + 1;
      }
    });

    return stats;
  },

  async exportAll() {
    try {
      showNotification('正在导出所有格式...', 'info');

      // 依次导出三种格式,使用silent模式
      this.exportToJSON(true);

      // 延迟一点时间,避免浏览器阻止多个下载
      await new Promise(resolve => setTimeout(resolve, 300));
      this.exportToCSV(true);

      await new Promise(resolve => setTimeout(resolve, 300));
      await this.exportToPDF(true);

      showNotification('所有格式已成功导出! (JSON + CSV + PDF)', 'success');
      this.closeExportModal();
    } catch (error) {
      console.error('批量导出失败:', error);
      showNotification('部分导出失败,请检查', 'error');
    }
  },

  async exportAllDataToPDF() {
    try {
      showNotification('正在生成完整PDF报表...', 'info');

      // 创建一个临时容器用于PDF内容
      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 800px;
        background: white;
        padding: 40px;
        font-family: 'Nunito', 'Microsoft YaHei', sans-serif;
      `;

      // 使用所有任务数据而不是筛选后的数据
      const allTasksData = allTasks;

      // 统计所有数据
      const totalStats = {
        total: allTasksData.length,
        confirmed: 0,
        pending: 0,
        unconfirmed: 0,
        byType: {},
        byArtist: {},
        byLocation: {}
      };

      allTasksData.forEach(task => {
        if (task.status === '已确认' || task.status === '待开始') totalStats.pending++;
        else if (task.status === '未确认') totalStats.unconfirmed++;

        // 类型统计
        totalStats.byType[task.type] = (totalStats.byType[task.type] || 0) + 1;

        // 画师统计
        if (task.artists) {
          task.artists.forEach(artist => {
            totalStats.byArtist[artist] = (totalStats.byArtist[artist] || 0) + 1;
          });
        }
        if (task.artistsTemp) {
          task.artistsTemp.forEach(artist => {
            totalStats.byArtist[artist] = (totalStats.byArtist[artist] || 0) + 1;
          });
        }

        // 场馆统计
        if (task.location) {
          totalStats.byLocation[task.location] = (totalStats.byLocation[task.location] || 0) + 1;
        }
      });

      const dateStr = new Date().toLocaleDateString('zh-CN');

      // 生成PDF内容HTML
      let htmlContent = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #A6B1E1; font-size: 32px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif;">✨ 稿件排期管理</h1>
          <h2 style="color: #E9A6A6; font-size: 24px; margin: 0 0 10px 0;">Artist Scheduler - 完整数据报表</h2>
          <p style="color: #888; font-size: 14px; margin: 0;">导出日期: ${dateStr}</p>
          <p style="color: #A6B1E1; font-size: 12px; margin: 5px 0 0 0; font-weight: bold;">包含所有年份所有数据</p>
        </div>

        <div style="background: #F9F6F1; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
          <h3 style="color: #2C2C2C; margin: 0 0 15px 0; font-size: 18px;">📊 总体统计</h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #A6B1E1;">${totalStats.total}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">总任务数</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #6B9080;">${totalStats.confirmed}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">已确认</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #D4C5B9;">${totalStats.pending}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">待开始</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #E8B4B8;">${totalStats.unconfirmed}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">未确认</div>
            </div>
          </div>
        </div>

        ${this.generateStatsChartsHTML(totalStats)}
      `;

      // 按年份分组
      const tasksByYear = {};
      allTasksData.forEach(task => {
        if (!tasksByYear[task.year]) {
          tasksByYear[task.year] = {};
        }
        if (!tasksByYear[task.year][task.month]) {
          tasksByYear[task.year][task.month] = [];
        }
        tasksByYear[task.year][task.month].push(task);
      });

      const monthsZh = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      const years = Object.keys(tasksByYear).sort((a, b) => b - a);

      // 为每个年份生成一个表格
      years.forEach((year, yearIndex) => {
        const yearTasks = Object.values(tasksByYear[year]).flat();
        const yearStats = {
          total: yearTasks.length,
          confirmed: 0,
          pending: yearTasks.filter(t => t.status === '已确认' || t.status === '待开始').length,
          unconfirmed: yearTasks.filter(t => t.status === '未确认').length
        };

        htmlContent += `
          <div style="page-break-before: ${yearIndex > 0 ? 'always' : 'auto'}; margin-top: ${yearIndex > 0 ? '0' : '30px'};">
            <div style="background: linear-gradient(135deg, #A6B1E1, #E9A6A6); color: white; padding: 15px 20px; border-radius: 12px; margin-bottom: 15px;">
              <h3 style="margin: 0 0 10px 0; font-size: 22px; font-family: 'Playfair Display', serif;">${year}年度数据</h3>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px;">
                <div>总计: ${yearStats.total}</div>
                <div>已确认: ${yearStats.confirmed}</div>
                <div>待开始: ${yearStats.pending}</div>
                <div>未确认: ${yearStats.unconfirmed}</div>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
              <thead>
                <tr style="background: linear-gradient(135deg, #A6B1E1, #E9A6A6); color: white;">
                  <th style="padding: 10px 6px; text-align: center; border: 1px solid #ddd; width: 40px;">序号</th>
                  <th style="padding: 10px 6px; text-align: center; border: 1px solid #ddd;">月份</th>
                  <th style="padding: 10px 6px; text-align: left; border: 1px solid #ddd;">类型</th>
                  <th style="padding: 10px 6px; text-align: center; border: 1px solid #ddd;">状态</th>
                  <th style="padding: 10px 6px; text-align: left; border: 1px solid #ddd;">场馆</th>
                  <th style="padding: 10px 6px; text-align: left; border: 1px solid #ddd;">参与画师</th>
                  <th style="padding: 10px 6px; text-align: left; border: 1px solid #ddd;">暂定画师</th>
                </tr>
              </thead>
              <tbody>
        `;

        let rowIndex = 0;
        monthsZh.forEach(month => {
          if (tasksByYear[year][month]) {
            tasksByYear[year][month].forEach(task => {
              const displayStatus = (task.status === '已确认' || task.status === '待开始') ? '待开始' : task.status;
              const statusColor =
                (task.status === '已确认' || task.status === '待开始') ? '#D4C5B9' : '#E8B4B8';

              const bgColor = rowIndex % 2 === 0 ? '#FFFFFF' : '#F9F6F1';
              const artistsText = task.artists ? task.artists.join('、') : '-';
              const artistsTempText = task.artistsTemp ? task.artistsTemp.join('、') : '-';

              htmlContent += `
                <tr style="background: ${bgColor};">
                  <td style="padding: 8px 6px; text-align: center; border: 1px solid #ddd; font-weight: 600; color: #888;">${rowIndex + 1}</td>
                  <td style="padding: 8px 6px; text-align: center; border: 1px solid #ddd;">${month}</td>
                  <td style="padding: 8px 6px; border: 1px solid #ddd;">${task.type || '-'}</td>
                  <td style="padding: 8px 6px; text-align: center; border: 1px solid #ddd;">
                    <span style="background: ${statusColor}; color: white; padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: bold;">${displayStatus || '-'}</span>
                  </td>
                  <td style="padding: 8px 6px; border: 1px solid #ddd;">${task.location || '-'}</td>
                  <td style="padding: 8px 6px; border: 1px solid #ddd;">${artistsText}</td>
                  <td style="padding: 8px 6px; border: 1px solid #ddd;">${artistsTempText}</td>
                </tr>
              `;
              rowIndex++;
            });
          }
        });

        htmlContent += `
              </tbody>
            </table>
        `;

        // 为每个年份添加可视化视图
        const yearTasksArray = Object.values(tasksByYear[year]).flat();
        const yearStatsForViz = {
          byType: {},
          byArtist: {},
          byLocation: {}
        };

        yearTasksArray.forEach(task => {
          yearStatsForViz.byType[task.type] = (yearStatsForViz.byType[task.type] || 0) + 1;
          if (task.artists) {
            task.artists.forEach(artist => {
              yearStatsForViz.byArtist[artist] = (yearStatsForViz.byArtist[artist] || 0) + 1;
            });
          }
          if (task.artistsTemp) {
            task.artistsTemp.forEach(artist => {
              yearStatsForViz.byArtist[artist] = (yearStatsForViz.byArtist[artist] || 0) + 1;
            });
          }
          if (task.location) {
            yearStatsForViz.byLocation[task.location] = (yearStatsForViz.byLocation[task.location] || 0) + 1;
          }
        });

        // 生成可视化视图HTML (需要临时设置filteredTasks为当前年份的任务)
        const savedFilteredTasks = filteredTasks;
        filteredTasks = yearTasksArray;
        htmlContent += this.generateVisualizationHTML(tasksByYear, yearStatsForViz, monthsZh);
        filteredTasks = savedFilteredTasks;

        htmlContent += `
          </div>
        `;
      });

      htmlContent += `
        <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px; page-break-before: avoid;">
          <p>© 2025 Artist Scheduler | 用心管理每一份创作 🎨</p>
          <p>Made with ❤️ for Artists</p>
          <p style="margin-top: 15px; color: #666;">本报表由 Artist Scheduler 自动生成</p>
          <p style="margin-top: 5px; color: #999; font-size: 11px;">一个专为职业画师设计的稿件排期管理工具</p>
          <p style="margin-top: 8px;">
            访问在线工具: <a href="https://xucheri.github.io/Artist-Scheduler/" style="color: #A6B1E1; text-decoration: none; font-weight: bold;">https://xucheri.github.io/Artist-Scheduler/</a>
          </p>
        </div>
      `;

      pdfContainer.innerHTML = htmlContent;
      document.body.appendChild(pdfContainer);

      // 使用html2canvas将内容转换为图片
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowHeight: pdfContainer.scrollHeight
      });

      // 移除临时容器
      document.body.removeChild(pdfContainer);

      // 创建PDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4宽度(mm)
      const pageHeight = 297; // A4高度(mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // 添加第一页
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 如果内容超过一页,继续添加
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(`稿件排期完整报表-${new Date().toISOString().split('T')[0]}.pdf`);
      showNotification('完整PDF报表导出成功!', 'success');
      this.closeExportModal();
    } catch (error) {
      console.error('完整PDF导出失败:', error);
      showNotification('完整PDF导出失败,请重试', 'error');
    }
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
    DataExporter.showExportModal();
  });

  // 导出弹窗关闭
  document.getElementById('closeExportModal').addEventListener('click', () => {
    DataExporter.closeExportModal();
  });
  document.getElementById('exportModalClose').addEventListener('click', () => {
    DataExporter.closeExportModal();
  });

  // 导出选项点击
  document.querySelectorAll('.export-option').forEach(option => {
    option.addEventListener('click', () => {
      const format = option.dataset.format;
      switch(format) {
        case 'json':
          DataExporter.exportToJSON();
          break;
        case 'csv':
          DataExporter.exportToCSV();
          break;
        case 'pdf':
          DataExporter.exportToPDF();
          break;
        case 'pdf-all':
          DataExporter.exportAllDataToPDF();
          break;
        case 'all':
          DataExporter.exportAll();
          break;
      }
    });
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
    const taskToEdit = TaskManager.currentTask;
    TaskManager.closeTaskDetail();
    TaskManager.showTaskForm(taskToEdit);
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
