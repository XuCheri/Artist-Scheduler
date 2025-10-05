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
    const headers = ['年份', '月份', '类型', '地点', '画师', '状态', '备注'];
    const rows = allTasks.map(task => [
      task.year,
      task.month,
      task.type,
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

    if (!silent) {
      this.closeExportModal();
      showNotification('数据已导出为CSV!', 'success');
    }
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
      const stats = this.calculateStats();
      const dateStr = new Date().toLocaleDateString('zh-CN');

      // 生成PDF内容HTML
      let htmlContent = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #A6B1E1; font-size: 32px; margin: 0 0 10px 0; font-family: 'Playfair Display', serif;">✨ 稿件排期管理</h1>
          <h2 style="color: #E9A6A6; font-size: 24px; margin: 0 0 10px 0;">Artist Scheduler</h2>
          <p style="color: #888; font-size: 14px; margin: 0;">导出日期: ${dateStr}</p>
        </div>

        <div style="background: #F9F6F1; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
          <h3 style="color: #2C2C2C; margin: 0 0 15px 0; font-size: 18px;">📊 统计信息</h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #A6B1E1;">${stats.total}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">总任务数</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #6B9080;">${stats.confirmed}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">已确认</div>
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

        <h3 style="color: #2C2C2C; margin: 0 0 15px 0; font-size: 18px;">📋 任务详情</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: linear-gradient(135deg, #A6B1E1, #E9A6A6); color: white;">
              <th style="padding: 12px 8px; text-align: center; border: 1px solid #ddd;">年份</th>
              <th style="padding: 12px 8px; text-align: center; border: 1px solid #ddd;">月份</th>
              <th style="padding: 12px 8px; text-align: left; border: 1px solid #ddd;">类型</th>
              <th style="padding: 12px 8px; text-align: center; border: 1px solid #ddd;">状态</th>
              <th style="padding: 12px 8px; text-align: left; border: 1px solid #ddd;">地点</th>
              <th style="padding: 12px 8px; text-align: left; border: 1px solid #ddd;">参与画师</th>
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
              const statusColor =
                task.status === '已确认' ? '#6B9080' :
                task.status === '待开始' ? '#D4C5B9' : '#E8B4B8';

              const bgColor = rowIndex % 2 === 0 ? '#FFFFFF' : '#F9F6F1';
              const artistsText = task.artists ? task.artists.join('、') : '-';

              htmlContent += `
                <tr style="background: ${bgColor};">
                  <td style="padding: 10px 8px; text-align: center; border: 1px solid #ddd;">${year}</td>
                  <td style="padding: 10px 8px; text-align: center; border: 1px solid #ddd;">${month}</td>
                  <td style="padding: 10px 8px; border: 1px solid #ddd;">${task.type || '-'}</td>
                  <td style="padding: 10px 8px; text-align: center; border: 1px solid #ddd;">
                    <span style="background: ${statusColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold;">${task.status || '-'}</span>
                  </td>
                  <td style="padding: 10px 8px; border: 1px solid #ddd;">${task.location || '-'}</td>
                  <td style="padding: 10px 8px; border: 1px solid #ddd;">${artistsText}</td>
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
        <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
          <p>© 2025 Artist Scheduler | 用心管理每一份创作 🎨</p>
          <p>Made with ❤️ for Artists</p>
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

      // 计算需要多少页
      const pageCount = Math.ceil(imgHeight / pageHeight);

      // 逐页添加内容,避免在中间截断
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) {
          doc.addPage();
        }

        const sourceY = i * (canvas.height / pageCount);
        const sourceHeight = canvas.height / pageCount;

        // 创建临时canvas来裁剪当前页
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const pageCtx = pageCanvas.getContext('2d');

        // 绘制当前页的内容
        pageCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/png');
        doc.addImage(pageImgData, 'PNG', 0, 0, imgWidth, pageHeight);
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
      if (task.status === '已确认') stats.confirmed++;
      else if (task.status === '待开始') stats.pending++;
      else if (task.status === '未确认') stats.unconfirmed++;
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
        unconfirmed: 0
      };

      allTasksData.forEach(task => {
        if (task.status === '已确认') totalStats.confirmed++;
        else if (task.status === '待开始') totalStats.pending++;
        else if (task.status === '未确认') totalStats.unconfirmed++;
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
          confirmed: yearTasks.filter(t => t.status === '已确认').length,
          pending: yearTasks.filter(t => t.status === '待开始').length,
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
                  <th style="padding: 10px 6px; text-align: center; border: 1px solid #ddd;">月份</th>
                  <th style="padding: 10px 6px; text-align: left; border: 1px solid #ddd;">类型</th>
                  <th style="padding: 10px 6px; text-align: center; border: 1px solid #ddd;">状态</th>
                  <th style="padding: 10px 6px; text-align: left; border: 1px solid #ddd;">地点</th>
                  <th style="padding: 10px 6px; text-align: left; border: 1px solid #ddd;">参与画师</th>
                </tr>
              </thead>
              <tbody>
        `;

        let rowIndex = 0;
        monthsZh.forEach(month => {
          if (tasksByYear[year][month]) {
            tasksByYear[year][month].forEach(task => {
              const statusColor =
                task.status === '已确认' ? '#6B9080' :
                task.status === '待开始' ? '#D4C5B9' : '#E8B4B8';

              const bgColor = rowIndex % 2 === 0 ? '#FFFFFF' : '#F9F6F1';
              const artistsText = task.artists ? task.artists.join('、') : '-';

              htmlContent += `
                <tr style="background: ${bgColor};">
                  <td style="padding: 8px 6px; text-align: center; border: 1px solid #ddd;">${month}</td>
                  <td style="padding: 8px 6px; border: 1px solid #ddd;">${task.type || '-'}</td>
                  <td style="padding: 8px 6px; text-align: center; border: 1px solid #ddd;">
                    <span style="background: ${statusColor}; color: white; padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: bold;">${task.status || '-'}</span>
                  </td>
                  <td style="padding: 8px 6px; border: 1px solid #ddd;">${task.location || '-'}</td>
                  <td style="padding: 8px 6px; border: 1px solid #ddd;">${artistsText}</td>
                </tr>
              `;
              rowIndex++;
            });
          }
        });

        htmlContent += `
              </tbody>
            </table>
          </div>
        `;
      });

      htmlContent += `
        <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px; page-break-before: avoid;">
          <p>© 2025 Artist Scheduler | 用心管理每一份创作 🎨</p>
          <p>Made with ❤️ for Artists</p>
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

      // 计算需要多少页
      const pageCount = Math.ceil(imgHeight / pageHeight);

      // 逐页添加内容,避免在中间截断
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) {
          doc.addPage();
        }

        const sourceY = i * (canvas.height / pageCount);
        const sourceHeight = canvas.height / pageCount;

        // 创建临时canvas来裁剪当前页
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const pageCtx = pageCanvas.getContext('2d');

        // 绘制当前页的内容
        pageCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/png');
        doc.addImage(pageImgData, 'PNG', 0, 0, imgWidth, pageHeight);
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
