(function() {
  const token = sessionStorage.getItem('accessToken');
  let user;
  try {
    user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
  } catch (e) {}

  if (!token || user?.role !== 'platform_admin') {
    location.href = 'login/index.html';
    return;
  }

  const escape = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));

  const api = (path, options = {}) =>
    fetch('http://localhost:3000/api/' + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
        ...(options.headers || {})
      }
    }).then(async r => {
      const body = await r.json();
      if (!r.ok) throw new Error(body.message || 'Request failed');
      return body;
    });

  const money = value =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);

  const table = (rows, columns) =>
    rows.length
      ? '<table><thead><tr>' +
        columns.map(c => '<th>' + escape(c.label) + '</th>').join('') +
        '</tr></thead><tbody>' +
        rows
          .map(
            row =>
              '<tr>' +
              columns.map(c => '<td>' + (c.html ? c.value(row) : escape(c.value(row))) + '</td>').join('') +
              '</tr>'
          )
          .join('') +
        '</tbody></table>'
      : '<p style="padding:16px;color:#6b7280;">No data available.</p>';

  function cards(data, target) {
    const el = document.getElementById(target);
    if (!el) return;
    el.innerHTML = [
      ['Total Municipal Corporations', data.total_municipal_corporations],
      ['Active Municipal Corporations', data.active_municipal_corporations],
      ['Total Applications', data.total_applications],
      ['Total Licenses Issued', data.total_licenses ?? 0],
      ['Completed Transactions', data.completed_transactions],
      ['Total Gross Collection', money(data.total_gross_collection)],
      ['Total TradeZo Revenue', money(data.total_tradezo_revenue)],
      ['Total Municipal Share', money(data.total_municipal_share)]
    ]
      .filter(x => x[1] !== undefined)
      .map(
        x =>
          '<article class="metric"><span>' +
          escape(x[0]) +
          '</span><strong>' +
          escape(x[1]) +
          '</strong></article>'
      )
      .join('');
  }

  function formatStatus(status) {
    const s = String(status || '').toLowerCase();
    let bg = '#fef3c7', fg = '#92400e', border = '#fde68a';
    if (s.includes('issue') || s.includes('approve') || s.includes('verif')) {
      bg = '#ecfdf5'; fg = '#065f46'; border = '#a7f3d0';
    } else if (s.includes('reject')) {
      bg = '#fef2f2'; fg = '#991b1b'; border = '#fecaca';
    }
    return '<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:' + bg + ';color:' + fg + ';border:1px solid ' + border + ';text-transform:uppercase;">' + escape(status || 'SUBMITTED') + '</span>';
  }

  function renderRevenueBarGraph(corporations, targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;

    if (!corporations || !corporations.length) {
      el.innerHTML = '<p style="padding:24px;color:#6b7280;text-align:center;">No revenue data available to display chart.</p>';
      return;
    }

    const maxRevenue = Math.max(...corporations.map(c => Number(c.tradezo_revenue) || 0), 0);
    // Determine Y-axis ceiling with a nice round number
    const chartMax = maxRevenue > 0 ? Math.ceil(maxRevenue * 1.25) : 1000;
    
    // Y-axis ticks (4 intervals)
    const yTicks = [
      0,
      Math.round(chartMax * 0.25),
      Math.round(chartMax * 0.5),
      Math.round(chartMax * 0.75),
      chartMax
    ];

    const svgHeight = 300;
    const svgWidth = Math.max(700, corporations.length * 190 + 140);
    const paddingLeft = 110;
    const paddingRight = 40;
    const paddingTop = 40;
    const paddingBottom = 70;
    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;

    // Generate Y-axis gridlines and labels
    const gridLinesHtml = yTicks.map(val => {
      const yPos = paddingTop + plotHeight - (val / chartMax) * plotHeight;
      return `
        <line x1="${paddingLeft}" y1="${yPos}" x2="${svgWidth - paddingRight}" y2="${yPos}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="${val === 0 ? '0' : '4,4'}" />
        <text x="${paddingLeft - 12}" y="${yPos + 4}" text-anchor="end" font-size="11" font-weight="600" fill="#64748b">${money(val)}</text>
      `;
    }).join('');

    // Generate Bars and X-axis labels
    const barGroupWidth = plotWidth / corporations.length;
    const barWidth = Math.min(64, barGroupWidth * 0.55);

    const barsHtml = corporations.map((c, i) => {
      const rev = Number(c.tradezo_revenue) || 0;
      const barHeight = chartMax > 0 ? (rev / chartMax) * plotHeight : 0;
      const xCenter = paddingLeft + i * barGroupWidth + barGroupWidth / 2;
      const xBar = xCenter - barWidth / 2;
      const yBar = paddingTop + plotHeight - barHeight;

      const fullName = c.name || c.corporation_id || 'Municipality';
      const shortName = fullName.length > 25 ? (fullName.split('(')[1]?.replace(')', '') || fullName.slice(0, 22) + '...') : fullName;

      return `
        <g class="chart-bar-group">
          <!-- Value on top of bar -->
          <text x="${xCenter}" y="${yBar - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="#102a72">${money(rev)}</text>
          
          <!-- Bar Rect -->
          <rect x="${xBar}" y="${yBar}" width="${barWidth}" height="${Math.max(barHeight, 2)}" rx="4" fill="url(#barGradient)" stroke="#1f3f96" stroke-width="1" style="transition:all 0.3s ease;">
            <title>${escape(fullName)}: ${money(rev)}</title>
          </rect>
          
          <!-- X-Axis Label -->
          <text x="${xCenter}" y="${paddingTop + plotHeight + 22}" text-anchor="middle" font-size="12" font-weight="600" fill="#1e293b">${escape(shortName)}</text>
          <text x="${xCenter}" y="${paddingTop + plotHeight + 38}" text-anchor="middle" font-size="11" font-weight="500" fill="#64748b">(${escape(c.corporation_id || c.municipality_id)})</text>
        </g>
      `;
    }).join('');

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div>
          <h3 style="margin:0;color:var(--navy);font-size:17px;font-weight:700;">Revenue by Municipal Corporation</h3>
          <p style="margin:4px 0 0;font-size:13px;color:var(--muted);">Visual comparison of TradeZo platform revenue across municipal corporations</p>
        </div>
        <div style="display:flex;align-items:center;gap:16px;font-size:13px;color:#475569;">
          <span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;background:#102a72;border-radius:2px;display:inline-block;"></span> <strong>Revenue (₹)</strong></span>
        </div>
      </div>
      <div style="width:100%;overflow-x:auto;">
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width:100%;max-width:${svgWidth}px;height:auto;display:block;margin:0 auto;font-family:inherit;">
          <defs>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#2563eb" />
              <stop offset="100%" stop-color="#102a72" />
            </linearGradient>
          </defs>
          
          <!-- Y-Axis Title -->
          <text x="-${(paddingTop + plotHeight / 2)}" y="20" transform="rotate(-90)" text-anchor="middle" font-size="11" font-weight="700" fill="#475569" letter-spacing="0.5">REVENUE (₹)</text>
          
          <!-- X-Axis Title -->
          <text x="${paddingLeft + plotWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" font-size="11" font-weight="700" fill="#475569" letter-spacing="0.5">MUNICIPAL CORPORATION / CITY</text>

          <!-- Grid Lines and Y Ticks -->
          ${gridLinesHtml}

          <!-- X-Axis Baseline -->
          <line x1="${paddingLeft}" y1="${paddingTop + plotHeight}" x2="${svgWidth - paddingRight}" y2="${paddingTop + plotHeight}" stroke="#94a3b8" stroke-width="1.5" />

          <!-- Bars and Labels -->
          ${barsHtml}
        </svg>
      </div>
    `;
  }

  let lastActiveView = 'overview';

  window.showApplicationsForMuni = async (muniId, muniName, fromView = 'overview') => {
    lastActiveView = fromView;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(b => b.classList.remove('active'));
    const appsSection = document.getElementById('applications');
    if (appsSection) appsSection.classList.add('active');

    const titleEl = document.getElementById('appsMuniTitle');
    const subEl = document.getElementById('appsMuniSubtitle');
    if (titleEl) titleEl.textContent = muniName + ' — Applications';
    if (subEl) subEl.textContent = 'All trade license application details for ' + muniName + ' (' + muniId + ')';

    const tableEl = document.getElementById('muni-applications-table');
    if (tableEl) {
      tableEl.innerHTML = '<p style="padding:24px;color:#6b7280;text-align:center;">Loading application records...</p>';
    }

    try {
      const res = await api('applications').catch(() => ({ data: [] }));
      const allApps = Array.isArray(res) ? res : (res.data || []);
      const muniApps = allApps.filter(a => (a.municipality_id || '').toLowerCase() === muniId.toLowerCase());

      if (!muniApps.length) {
        if (tableEl) {
          tableEl.innerHTML = `
            <div style="background:#fff;padding:48px 24px;text-align:center;border:1px solid var(--line);border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <div style="font-size:38px;margin-bottom:8px;">📄</div>
              <h3 style="color:var(--navy);margin:0 0 6px;font-size:18px;">No Applications Found</h3>
              <p style="color:var(--muted);font-size:14px;margin:0;">There are currently 0 trade license applications submitted under <strong>${escape(muniName)}</strong>.</p>
            </div>
          `;
        }
        return;
      }

      const appColumns = [
        { label: 'Ref # / ID', value: r => r.application_ref || ('APP-' + r.application_id) },
        { label: 'Business Name', value: r => r.business_name || '—' },
        { label: 'Applicant Name', value: r => r.full_name || '—' },
        { label: 'Phone', value: r => r.applicant_phone || '—' },
        { label: 'Category', value: r => r.trade_category || r.business_type || 'General Trade' },
        { label: 'Premises Address', value: r => r.shop_address || '—' },
        { label: 'Status', html: true, value: r => formatStatus(r.application_status) },
        { label: 'Submitted On', value: r => r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-IN') : '—' }
      ];

      if (tableEl) {
        tableEl.innerHTML = table(muniApps, appColumns);
      }
    } catch (err) {
      if (tableEl) {
        tableEl.innerHTML = '<p style="padding:16px;color:#dc2626;">Failed to load applications: ' + escape(err.message) + '</p>';
      }
    }
  };

  window.openMuniOfficersModal = async (muniId, muniName) => {
    const modal = document.getElementById('muniOfficersModal');
    const content = document.getElementById('muniOfficersContent');
    const title = document.getElementById('officersModalMuniTitle');
    const sub = document.getElementById('officersModalMuniSubtitle');

    if (title) title.textContent = muniName || 'Municipal Corporation';
    if (sub) sub.textContent = 'Tenant ID: ' + muniId + ' • Department & Field Officers';
    if (content) {
      content.innerHTML = '<p style="padding:24px 0;text-align:center;color:#6b7280;">Loading assigned officers...</p>';
    }
    if (modal) modal.classList.add('show');

    try {
      const allUsers = await api('users').catch(() => []);
      const muniUsers = allUsers.filter(u => (u.municipality_id || '').toLowerCase() === muniId.toLowerCase());

      const headList = muniUsers.filter(u => u.role === 'municipal_commissioner' || u.role === 'super_user');
      const doList = muniUsers.filter(u => u.role === 'department_officer');
      const foList = muniUsers.filter(u => u.role === 'field_officer');

      let html = '<div style="display:flex;flex-direction:column;gap:12px;">';

      // 1. Municipal Head / Commissioner
      if (headList.length) {
        headList.forEach(u => {
          html += `
            <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px 14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#6b21a8;background:#f3e8ff;padding:2px 8px;border-radius:10px;">🏛️ Municipal Commissioner / Head</span>
              </div>
              <div style="font-size:15px;font-weight:700;color:#1e1b4b;">${escape(u.full_name)}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;font-size:13px;color:#475569;">
                <div>📧 <a href="mailto:${escape(u.email)}" style="color:#2563eb;text-decoration:none;">${escape(u.email)}</a></div>
                <div>📞 <span>${escape(u.phone || '—')}</span></div>
              </div>
            </div>
          `;
        });
      }

      // 2. Department Officer (DO)
      if (doList.length) {
        doList.forEach(u => {
          html += `
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#15803d;background:#dcfce7;padding:2px 8px;border-radius:10px;">📋 Department Officer (DO)</span>
              </div>
              <div style="font-size:15px;font-weight:700;color:#14532d;">${escape(u.full_name)}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;font-size:13px;color:#475569;">
                <div>📧 <a href="mailto:${escape(u.email)}" style="color:#2563eb;text-decoration:none;">${escape(u.email)}</a></div>
                <div>📞 <span>${escape(u.phone || '—')}</span></div>
              </div>
            </div>
          `;
        });
      } else {
        html += `
          <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;padding:12px 14px;color:#64748b;font-size:13px;">
            <strong>Department Officer (DO):</strong> No DO currently registered.
          </div>
        `;
      }

      // 3. Field Officer (FO)
      if (foList.length) {
        foList.forEach(u => {
          html += `
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#1d4ed8;background:#dbeafe;padding:2px 8px;border-radius:10px;">🔍 Field Officer (FO)</span>
              </div>
              <div style="font-size:15px;font-weight:700;color:#1e3a8a;">${escape(u.full_name)}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;font-size:13px;color:#475569;">
                <div>📧 <a href="mailto:${escape(u.email)}" style="color:#2563eb;text-decoration:none;">${escape(u.email)}</a></div>
                <div>📞 <span>${escape(u.phone || '—')}</span></div>
              </div>
            </div>
          `;
        });
      } else {
        html += `
          <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;padding:12px 14px;color:#64748b;font-size:13px;">
            <strong>Field Officer (FO):</strong> No FO currently registered.
          </div>
        `;
      }

      html += '</div>';
      if (content) content.innerHTML = html;
    } catch (err) {
      if (content) {
        content.innerHTML = '<p style="padding:16px;color:#dc2626;">Failed to load officer details: ' + escape(err.message) + '</p>';
      }
    }
  };

  const closeOfficersModalBtn = document.getElementById('closeOfficersModalBtn');
  const muniOfficersModal = document.getElementById('muniOfficersModal');
  if (closeOfficersModalBtn) {
    closeOfficersModalBtn.onclick = () => muniOfficersModal?.classList.remove('show');
  }
  if (muniOfficersModal) {
    muniOfficersModal.onclick = (e) => {
      if (e.target === muniOfficersModal) muniOfficersModal.classList.remove('show');
    };
  }

  const backBtn = document.getElementById('backFromAppsBtn');
  if (backBtn) {
    backBtn.onclick = () => {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.sidebar-nav .nav-link').forEach(b => b.classList.remove('active'));
      const targetSec = document.getElementById(lastActiveView) || document.getElementById('overview');
      const targetNav = document.querySelector('[data-view="' + lastActiveView + '"]') || document.querySelector('[data-view="overview"]');
      if (targetSec) targetSec.classList.add('active');
      if (targetNav) targetNav.classList.add('active');
    };
  }

  async function load() {
    try {
      const [overview, corporations, revenue, settings] = await Promise.all([
        api('platform-admin/overview'),
        api('platform-admin/corporations'),
        api('platform-admin/revenue'),
        api('platform-admin/settings')
      ]);

      const dashboardColumns = [
        {
          label: 'Municipality / Corporation',
          html: true,
          value: r => '<button type="button" style="background:none;border:none;padding:0;color:var(--navy);font-weight:700;font-size:13px;text-decoration:underline;cursor:pointer;text-align:left;" onclick="openMuniOfficersModal(\'' + escape(r.corporation_id || r.municipality_id) + '\', \'' + escape(r.name) + '\')">' + escape(r.name || '—') + ' <span style="font-weight:400;color:var(--muted);font-size:12px;">(' + escape(r.corporation_id || r.municipality_id) + ')</span></button>'
        },
        { label: 'State / District', value: r => (r.state || '—') + ' / ' + (r.district || '—') },
        {
          label: 'Municipal Head',
          html: true,
          value: r => r.municipal_head
            ? escape(r.municipal_head.name + (r.municipal_head.email ? ' (' + r.municipal_head.email + ')' : ''))
            : '<button class="btn-primary" style="padding:4px 10px;font-size:12px;cursor:pointer;" onclick="openAddHeadModal(\'' + escape(r.corporation_id || r.municipality_id) + '\', \'' + escape(r.name) + '\')">+ Add Head</button>'
        },
        {
          label: 'Applications',
          html: true,
          value: r => '<button class="btn-primary" style="padding:4px 12px;font-size:12px;cursor:pointer;border-radius:5px;" onclick="showApplicationsForMuni(\'' + escape(r.corporation_id || r.municipality_id) + '\', \'' + escape(r.name) + '\', \'overview\')">View</button>'
        }
      ];

      const corporationColumns = [
        { label: 'Municipality / Corporation', value: r => (r.name || '—') + ' (' + (r.corporation_id || r.municipality_id) + ')' },
        { label: 'State / District', value: r => (r.state || '—') + ' / ' + (r.district || '—') },
        {
          label: 'Municipal Head',
          html: true,
          value: r => r.municipal_head
            ? escape(r.municipal_head.name + (r.municipal_head.email ? ' (' + r.municipal_head.email + ')' : ''))
            : '<button class="btn-primary" style="padding:4px 10px;font-size:12px;cursor:pointer;" onclick="openAddHeadModal(\'' + escape(r.corporation_id || r.municipality_id) + '\', \'' + escape(r.name) + '\')">+ Add Head</button>'
        },
        { label: 'FO / DO Counts', value: r => (r.field_officers_count ?? 0) + ' FO / ' + (r.department_officers_count ?? 0) + ' DO' },
        { label: 'Applications', value: r => r.applications ?? 0 }
      ];

      const revenueColumns = [
        { label: 'Corporation ID', value: r => r.corporation_id || r.municipality_id },
        { label: 'Name', value: r => r.name },
        { label: 'Applications', value: r => r.applications ?? 0 },
        { label: 'Gross Collection', value: r => money(r.gross_collection ?? 0) },
        { label: 'Revenue', value: r => money(r.tradezo_revenue ?? 0) },
        { label: 'Municipal Share', value: r => money(r.municipal_share ?? 0) }
      ];

      if (document.getElementById('overview-corporation-table')) {
        document.getElementById('overview-corporation-table').innerHTML = table(corporations, dashboardColumns);
      }
      if (document.getElementById('corporation-table')) {
        document.getElementById('corporation-table').innerHTML = table(corporations, corporationColumns);
      }

      // 1. Render Total Revenue & Summary Cards on Revenue page
      const revCorps = Array.isArray(revenue.corporations) ? revenue.corporations : [];
      const totalRev = revCorps.reduce((sum, r) => sum + (Number(r.tradezo_revenue) || 0), 0);
      const totalGross = revCorps.reduce((sum, r) => sum + (Number(r.gross_collection) || 0), 0);
      const totalMuni = revCorps.reduce((sum, r) => sum + (Number(r.municipal_share) || 0), 0);

      const revCardsEl = document.getElementById('revenue-summary-cards');
      if (revCardsEl) {
        revCardsEl.innerHTML = `
          <article class="metric" style="border-left:4px solid #102a72;">
            <span style="font-weight:700;letter-spacing:0.5px;color:#102a72;">TOTAL REVENUE</span>
            <strong style="color:#102a72;">${money(totalRev)}</strong>
            <small style="color:#64748b;font-size:12px;margin-top:4px;display:block;">TradeZo Platform Share</small>
          </article>
          <article class="metric" style="border-left:4px solid #2563eb;">
            <span style="font-weight:700;letter-spacing:0.5px;">TOTAL GROSS COLLECTION</span>
            <strong>${money(totalGross)}</strong>
            <small style="color:#64748b;font-size:12px;margin-top:4px;display:block;">All application collections</small>
          </article>
          <article class="metric" style="border-left:4px solid #15803d;">
            <span style="font-weight:700;letter-spacing:0.5px;">TOTAL MUNICIPAL SHARE</span>
            <strong style="color:#15803d;">${money(totalMuni)}</strong>
            <small style="color:#64748b;font-size:12px;margin-top:4px;display:block;">Municipal / Government Share</small>
          </article>
        `;
      }

      // 2. Render Revenue Bar Graph on Revenue page
      renderRevenueBarGraph(revCorps, 'revenue-chart-container');

      // 3. Render Revenue Table with Revenue Column
      if (document.getElementById('revenue-corporations')) {
        document.getElementById('revenue-corporations').innerHTML = table(revCorps, revenueColumns);
      }

      if (document.getElementById('platformFeeInput')) {
        document.getElementById('platformFeeInput').value = settings.default_platform_fee ?? 250;
      }
      if (document.getElementById('baseFeeInput')) {
        document.getElementById('baseFeeInput').value = settings.default_base_processing_fee ?? 1200;
      }
      if (document.getElementById('serviceTaxInput')) {
        document.getElementById('serviceTaxInput').value = settings.default_service_tax_percentage ?? 5;
      }
    } catch (e) {
      document.getElementById('message').textContent = e.message;
    }
  }

  // Navigation view toggling
  document.querySelectorAll('[data-view]').forEach(button => {
    button.onclick = () => {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.sidebar-nav .nav-link').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(button.dataset.view).classList.add('active');
    };
  });

  // Settings update
  document.getElementById('settings-form').onsubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        default_platform_fee: Number(document.getElementById('platformFeeInput').value),
        default_base_processing_fee: Number(document.getElementById('baseFeeInput').value),
        default_service_tax_percentage: Number(document.getElementById('serviceTaxInput').value)
      };
      const percentageEl = document.getElementById('percentage');
      if (percentageEl) {
        payload.tradezo_revenue_percentage = Number(percentageEl.value);
      }
      await api('platform-admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      document.getElementById('message').textContent = 'Fee settings saved successfully.';
      setTimeout(() => { document.getElementById('message').textContent = ''; }, 3000);
      load();
    } catch (err) {
      document.getElementById('message').textContent = err.message;
    }
  };

  // Add Municipality Modal
  const modal = document.getElementById('addCorpModal');
  const openBtn = document.getElementById('openAddCorpBtn');
  const closeBtn = document.getElementById('closeAddCorpBtn');
  const addForm = document.getElementById('addCorpForm');

  if (openBtn) openBtn.onclick = () => modal.classList.add('show');
  if (closeBtn) closeBtn.onclick = () => modal.classList.remove('show');

  if (addForm) {
    addForm.onsubmit = async e => {
      e.preventDefault();
      try {
        const payload = {
          municipality_id: document.getElementById('muniId').value.trim(),
          name: document.getElementById('muniName').value.trim(),
          state: document.getElementById('muniState').value.trim(),
          district: document.getElementById('muniDistrict').value.trim(),
          base_processing_fee: Number(document.getElementById('muniFee').value),
          platform_fee: Number(document.getElementById('muniPlatformFee').value),
          service_tax_percentage: Number(document.getElementById('muniTax').value),
          status: 'active'
        };

        const headName = document.getElementById('muniHeadName')?.value?.trim();
        const headEmail = document.getElementById('muniHeadEmail')?.value?.trim();
        if (headName) payload.head_name = headName;
        if (headEmail) payload.head_email = headEmail;

        await api('municipalities', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        modal.classList.remove('show');
        addForm.reset();
        document.getElementById('message').textContent = 'New Municipal Corporation added successfully!';
        setTimeout(() => { document.getElementById('message').textContent = ''; }, 3000);
        load();
      } catch (err) {
        alert(err.message || 'Failed to add corporation.');
      }
    };
  }

  // Add Municipal Head Modal
  window.openAddHeadModal = (muniId, muniName) => {
    document.getElementById('headTargetMuniId').value = muniId;
    document.getElementById('headTargetMuniName').value = muniName + ' (' + muniId + ')';
    document.getElementById('addHeadModal').classList.add('show');
  };

  const addHeadModal = document.getElementById('addHeadModal');
  const closeHeadBtn = document.getElementById('closeAddHeadBtn');
  const addHeadForm = document.getElementById('addHeadForm');

  if (closeHeadBtn) closeHeadBtn.onclick = () => addHeadModal.classList.remove('show');

  if (addHeadForm) {
    addHeadForm.onsubmit = async e => {
      e.preventDefault();
      try {
        const muniId = document.getElementById('headTargetMuniId').value;
        const name = document.getElementById('headFullName').value.trim();
        const email = document.getElementById('headEmail').value.trim();
        const phone = document.getElementById('headPhone').value.trim();
        const password = document.getElementById('headPassword').value.trim() || 'super123';

        await api('users', {
          method: 'POST',
          body: JSON.stringify({
            full_name: name,
            email: email,
            phone: phone,
            role: 'super_user',
            municipality_id: muniId,
            password_hash: password
          })
        });

        addHeadModal.classList.remove('show');
        addHeadForm.reset();
        document.getElementById('message').textContent = 'Municipal Head created successfully for ' + muniId + '!';
        setTimeout(() => { document.getElementById('message').textContent = ''; }, 4000);
        load();
      } catch (err) {
        alert(err.message || 'Failed to create Municipal Head.');
      }
    };
  }

  const logoutBtn = document.getElementById('logout') || document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('loggedInUser');
      location.href = 'login/index.html';
    };
  }

  load();
})();
