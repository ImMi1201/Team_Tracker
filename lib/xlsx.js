/*
 * xlsx.js — tạo file Excel (.xlsx) ngay trên trình duyệt, không cần thư viện ngoài.
 * Sheet Summary dùng công thức COUNTIF/COUNTIFS đếm trực tiếp từ các sheet chi tiết.
 */
(function (global) {
'use strict';

// ---------- Nén zip (kiểu "stored", Excel đọc bình thường) ----------
var XLSX_CRC_ = (function () {
  var t = new Uint32Array(256);
  for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function xlsxCrc32_(bytes) { var c = 0xffffffff; for (var i = 0; i < bytes.length; i++) c = XLSX_CRC_[(c ^ bytes[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function xlsxZip_(files) {
  var enc = new TextEncoder();
  var d = new Date();
  var time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  var parts = [], central = [], offset = 0;
  files.forEach(function (f) {
    var name = enc.encode(f.name), data = enc.encode(f.data), crc = xlsxCrc32_(data);
    var lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, data);
    var ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true);
    ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + data.length;
  });
  var cdSize = central.reduce(function (s, p) { return s + p.length; }, 0);
  var end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

var XLSX_STYLE_IDS_ = {
  default: 0, bold: 1, title: 2, header: 3, datetime: 4, date: 5, wrap: 6,
  total: 7, muted: 8, statusNot: 9, statusProg: 10, statusDone: 11, number: 12, statusBlocked: 13, wrapBold: 14,
};

var XLSX_STYLES_ = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy hh:mm"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts>
<fonts count="5">
<font><sz val="10"/><name val="Arial"/><family val="2"/></font>
<font><b/><sz val="10"/><name val="Arial"/><family val="2"/></font>
<font><b/><sz val="14"/><name val="Arial"/><family val="2"/></font>
<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/><family val="2"/></font>
<font><i/><sz val="9"/><color rgb="FF5C6B66"/><name val="Arial"/><family val="2"/></font>
</fonts>
<fills count="7">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1D2B27"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFECEFEE"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFCEFD4"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFDDF1E5"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFBE7E5"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top style="thin"><color rgb="FF1D2B27"/></top><bottom/><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="15">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
<xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="0" fillId="5" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="0" fillId="6" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

// ---------- Tiện ích ----------
function xlsxCol_(i) {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function xlsxEsc_(text) {
  return String(text)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Mốc thời gian (ms) -> số ngày kiểu Excel, theo giờ địa phương của máy tạo file
function xlsxSerial_(ms) {
  const offsetMin = new Date(ms).getTimezoneOffset();
  return (ms - offsetMin * 60000) / 86400000 + 25569;
}

function xlsxCell_(ref, cell) {
  if (cell === null || cell === undefined || cell === '') return '';
  const c = typeof cell === 'object' ? cell : { v: cell };
  const s = XLSX_STYLE_IDS_[c.s] !== undefined ? XLSX_STYLE_IDS_[c.s] : c.date !== undefined ? XLSX_STYLE_IDS_.datetime : XLSX_STYLE_IDS_.default;
  if (c.f) {
    const cached = typeof c.v === 'number' ? `<v>${c.v}</v>` : '';
    return `<c r="${ref}" s="${s}"><f>${xlsxEsc_(c.f)}</f>${cached}</c>`;
  }
  if (c.date !== undefined) {
    if (!Number.isFinite(c.date)) return '';
    return `<c r="${ref}" s="${s}"><v>${xlsxSerial_(c.date)}</v></c>`;
  }
  if (typeof c.v === 'number') {
    return Number.isFinite(c.v) ? `<c r="${ref}" s="${s}"><v>${c.v}</v></c>` : '';
  }
  const text = String(c.v).slice(0, 32000);
  const space = /^\s|\s$|\n/.test(text) ? ' xml:space="preserve"' : '';
  return `<c r="${ref}" s="${s}" t="inlineStr"><is><t${space}>${xlsxEsc_(text)}</t></is></c>`;
}

function xlsxSheet_(sheet) {
  const rows = sheet.rows
    .map((row, r) => {
      const cells = (row || []).map((cell, c) => xlsxCell_(`${xlsxCol_(c)}${r + 1}`, cell)).join('');
      return cells ? `<row r="${r + 1}">${cells}</row>` : '';
    })
    .join('');
  const cols = (sheet.columns || [])
    .map((col, i) => `<col min="${i + 1}" max="${i + 1}" width="${col.width || 12}" customWidth="1"/>`)
    .join('');
  let pane = '';
  if (sheet.freeze) {
    const m = /^([A-Z]+)(\d+)$/.exec(sheet.freeze);
    const ySplit = Number(m[2]) - 1;
    pane = `<pane ySplit="${ySplit}" topLeftCell="${sheet.freeze}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="${sheet.freeze}" sqref="${sheet.freeze}"/>`;
  }
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheetViews><sheetView workbookViewId="0"${sheet.index === 0 ? ' tabSelected="1"' : ''}>${pane}</sheetView></sheetViews>` +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    (cols ? `<cols>${cols}</cols>` : '') +
    `<sheetData>${rows}</sheetData>` +
    (sheet.autoFilter ? `<autoFilter ref="${sheet.autoFilter}"/>` : '') +
    '<pageMargins left="0.5" right="0.5" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>' +
    '</worksheet>'
  );
}


// ---------- Sổ tính ----------
function buildWorkbook_(sheets) {
  sheets.forEach((s, i) => (s.index = i));
  const sheetEntries = sheets
    .map((s, i) => `<sheet name="${xlsxEsc_(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('');
  const definedNames = sheets
    .map((s, i) => {
      if (!s.autoFilter) return '';
      const [a, b] = s.autoFilter.split(':');
      const abs = (ref) => ref.replace(/^([A-Z]+)(\d+)$/, '$$$1$$$2');
      return `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xlsxEsc_(s.name)}'!${abs(a)}:${abs(b)}</definedName>`;
    })
    .join('');

  const files = [
    {
      name: '[Content_Types].xml',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets
          .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
          .join('') +
        '</Types>',
    },
    {
      name: '_rels/.rels',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    },
    {
      name: 'xl/workbook.xml',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<bookViews><workbookView activeTab="0"/></bookViews>' +
        `<sheets>${sheetEntries}</sheets>` +
        (definedNames ? `<definedNames>${definedNames}</definedNames>` : '') +
        '<calcPr calcId="191029" fullCalcOnLoad="1"/>' +
        '</workbook>',
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        sheets
          .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
          .join('') +
        `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        '</Relationships>',
    },
    { name: 'xl/styles.xml', data: XLSX_STYLES_ },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: xlsxSheet_(s) })),
  ];
  return xlsxZip_(files);
}


// ---------- Báo cáo Team Tracker ----------
var REPORT_STATUS_ = {
  todo: { label: 'Not started', style: 'statusNot', order: 2 },
  progress: { label: 'In progress', style: 'statusProg', order: 1 },
  blocked: { label: 'Pending', style: 'statusBlocked', order: 0 },
  done: { label: 'Done', style: 'statusDone', order: 3 },
};
var REPORT_STATUS_KEYS_ = ['todo', 'progress', 'blocked', 'done'];

var rPad_ = (n) => String(n).padStart(2, '0');
var rIsIso_ = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
var rDateCell_ = (iso) => {
  if (!rIsIso_(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return { date: new Date(y, m - 1, d).getTime(), s: 'date' };
};
var rDays_ = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
var rNow_ = () => {
  const d = new Date();
  return `${rPad_(d.getDate())}/${rPad_(d.getMonth() + 1)}/${d.getFullYear()} ${rPad_(d.getHours())}:${rPad_(d.getMinutes())}`;
};

function reportCountStatuses_(tasks) {
  const c = { todo: 0, progress: 0, blocked: 0, done: 0, total: 0 };
  for (const t of tasks) {
    const k = REPORT_STATUS_[t.status] ? t.status : 'todo';
    c[k] += 1;
    c.total += 1;
  }
  return c;
}

function rLookups_(data) {
  const topics = new Map((data.topics || []).map((t) => [t.id, t]));
  const members = new Map((data.members || []).map((m) => [m.id, m]));
  const topicOrder = new Map((data.topics || []).map((t, i) => [t.id, i]));
  const topicName = (t) => (topics.get(t.topicId) || {}).name || t.topicName || '—';
  const memberName = (id, fallback) => (members.get(id) || {}).name || fallback || '—';
  return { topicName, memberName, topicOrder };
}

function rSortTasks_(tasks, topicOrder) {
  return tasks.slice().sort((a, b) => {
    const ta = topicOrder.has(a.topicId) ? topicOrder.get(a.topicId) : 9999;
    const tb = topicOrder.has(b.topicId) ? topicOrder.get(b.topicId) : 9999;
    if (ta !== tb) return ta - tb;
    const sa = (REPORT_STATUS_[a.status] || REPORT_STATUS_.todo).order;
    const sb = (REPORT_STATUS_[b.status] || REPORT_STATUS_.todo).order;
    if (sa !== sb) return sa - sb;
    return String(a.start || '').localeCompare(String(b.start || ''));
  });
}

/*
 * options:
 *   data      toàn bộ dữ liệu Team Tracker (để tra tên topic, thành viên, nhật ký)
 *   tasks     danh sách task đưa vào sheet Tasks
 *   archived  task đã lưu trữ (sheet Archived), tuỳ chọn
 *   includeLogs  thêm sheet Daily Log
 *   title, note  tiêu đề và ghi chú ở sheet Summary
 *   snapshot  số liệu toàn app lúc xuất (bảng cố định), tuỳ chọn
 */
function buildReport_(options) {
  const data = options.data || {};
  const { topicName, memberName, topicOrder } = rLookups_(data);
  const list = rSortTasks_(options.tasks || [], topicOrder);
  const archived = options.archived || [];

  // ----- Sheet Tasks -----
  const header = ['ID', 'Topic', 'Task', 'Assignee', 'Supported by', 'Start', 'Due date', 'Busy days', 'Status', 'Done date', 'Updates', 'Latest update'];
  const taskRows = [header.map((h) => ({ v: h, s: 'header' }))];
  list.forEach((t, i) => {
    const r = i + 2;
    const st = REPORT_STATUS_[t.status] || REPORT_STATUS_.todo;
    const updates = Array.isArray(t.updates) ? t.updates.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))) : [];
    const latest = updates.length ? updates[updates.length - 1] : null;
    const hasDates = rIsIso_(t.start) && rIsIso_(t.end);
    taskRows.push([
      { v: t.id, s: 'number' },
      topicName(t),
      { v: String(t.title || ''), s: 'wrap' },
      memberName(t.assigneeId, t.assigneeName),
      t.support || '',
      rDateCell_(t.start),
      rDateCell_(t.end),
      hasDates ? { f: `G${r}-F${r}`, v: rDays_(t.start, t.end), s: 'number' } : null,
      { v: st.label, s: st.style },
      rDateCell_(t.doneAt),
      { v: updates.length, s: 'number' },
      latest ? { v: `${latest.date}: ${latest.text}`, s: 'wrap' } : null,
    ]);
  });
  const last = Math.max(2, taskRows.length);

  // ----- Sheet Summary -----
  const counts = reportCountStatuses_(list);
  const statusRange = `'Tasks'!$I$2:$I$${last}`;
  const assigneeRange = `'Tasks'!$D$2:$D$${last}`;
  const summary = [
    [{ v: options.title || 'Team Tracker report', s: 'title' }],
    [{ v: `Exported ${rNow_()}`, s: 'muted' }],
    [],
    [{ v: 'Status', s: 'header' }, { v: 'Tasks in this file', s: 'header' }],
  ];
  REPORT_STATUS_KEYS_.forEach((k) => {
    summary.push([REPORT_STATUS_[k].label, { f: `COUNTIF(${statusRange},"${REPORT_STATUS_[k].label}")`, v: counts[k], s: 'number' }]);
  });
  summary.push([{ v: 'Total', s: 'total' }, { f: 'SUM(B5:B8)', v: counts.total, s: 'total' }]);
  summary.push([{ v: 'Counted from the Tasks sheet.', s: 'muted' }], []);

  // Theo thành viên
  const memberNames = [];
  const seen = new Set();
  for (const m of data.members || []) if (!seen.has(m.name)) { seen.add(m.name); memberNames.push(m.name); }
  for (const t of list) {
    const n = memberName(t.assigneeId, t.assigneeName);
    if (!seen.has(n)) { seen.add(n); memberNames.push(n); }
  }
  const byMemberHeaderRow = summary.length + 1;
  summary.push([{ v: 'Member', s: 'header' }, ...REPORT_STATUS_KEYS_.map((k) => ({ v: REPORT_STATUS_[k].label, s: 'header' })), { v: 'Total', s: 'header' }]);
  const cols = ['B', 'C', 'D', 'E'];
  memberNames.forEach((name, i) => {
    const r = byMemberHeaderRow + 1 + i;
    const mine = list.filter((t) => memberName(t.assigneeId, t.assigneeName) === name);
    const c = reportCountStatuses_(mine);
    summary.push([
      name,
      ...REPORT_STATUS_KEYS_.map((k, j) => ({ f: `COUNTIFS(${assigneeRange},$A${r},${statusRange},${cols[j]}$${byMemberHeaderRow})`, v: c[k], s: 'number' })),
      { f: `SUM(B${r}:E${r})`, v: c.total, s: 'total' },
    ]);
  });

  if (options.snapshot) {
    const s = options.snapshot;
    summary.push(
      [],
      [{ v: 'Whole app at export time', s: 'header' }, { v: 'Tasks', s: 'header' }],
      ...REPORT_STATUS_KEYS_.map((k) => [REPORT_STATUS_[k].label, { v: s[k], s: 'number' }]),
      [{ v: 'Total', s: 'total' }, { v: s.total, s: 'total' }],
      [{ v: 'Fixed numbers captured when this file was created.', s: 'muted' }]
    );
  }
  if (options.note) summary.push([], [{ v: options.note, s: 'muted' }]);

  const sheets = [
    { name: 'Summary', columns: [{ width: 28 }, { width: 18 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 12 }], rows: summary },
    {
      name: 'Tasks',
      columns: [8, 18, 60, 16, 16, 12, 12, 10, 13, 12, 9, 60].map((w) => ({ width: w })),
      rows: taskRows,
      freeze: 'A2',
      autoFilter: `A1:L${last}`,
    },
  ];

  // ----- Sheet Updates -----
  const updRows = [['Task ID', 'Topic', 'Task', 'Assignee', 'Date', 'Update'].map((h) => ({ v: h, s: 'header' }))];
  const allUpd = [];
  for (const t of list) for (const u of t.updates || []) allUpd.push({ t, u });
  allUpd.sort((a, b) => String(b.u.date).localeCompare(String(a.u.date)));
  for (const { t, u } of allUpd) {
    updRows.push([{ v: t.id, s: 'number' }, topicName(t), { v: String(t.title || ''), s: 'wrap' }, memberName(t.assigneeId, t.assigneeName), rDateCell_(u.date), { v: String(u.text || ''), s: 'wrap' }]);
  }
  sheets.push({
    name: 'Updates',
    columns: [8, 18, 50, 16, 12, 70].map((w) => ({ width: w })),
    rows: updRows,
    freeze: 'A2',
    autoFilter: `A1:F${Math.max(2, updRows.length)}`,
  });

  // ----- Sheet Daily Log -----
  if (options.includeLogs) {
    const tasksById = new Map((data.tasks || []).concat(archived).map((t) => [t.id, t]));
    const logRows = [['Date', 'Member', 'Task ID', 'Task', 'Log'].map((h) => ({ v: h, s: 'header' }))];
    const logs = (data.dailyLogs || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    for (const l of logs) {
      const t = l.taskId ? tasksById.get(l.taskId) : null;
      logRows.push([rDateCell_(l.date), memberName(l.memberId), l.taskId ? { v: l.taskId, s: 'number' } : null, t ? { v: String(t.title || ''), s: 'wrap' } : (l.taskId ? '(deleted task)' : 'General note'), { v: String(l.text || ''), s: 'wrap' }]);
    }
    sheets.push({
      name: 'Daily Log',
      columns: [12, 16, 8, 50, 70].map((w) => ({ width: w })),
      rows: logRows,
      freeze: 'A2',
      autoFilter: `A1:E${Math.max(2, logRows.length)}`,
    });
  }

  // ----- Sheet Archived -----
  if (archived.length) {
    const arRows = [['ID', 'Topic', 'Task', 'Assignee', 'Start', 'Due date', 'Done date', 'Archived on', 'Updates'].map((h) => ({ v: h, s: 'header' }))];
    for (const t of rSortTasks_(archived, topicOrder)) {
      arRows.push([
        { v: t.id, s: 'number' }, topicName(t), { v: String(t.title || ''), s: 'wrap' }, memberName(t.assigneeId, t.assigneeName),
        rDateCell_(t.start), rDateCell_(t.end), rDateCell_(t.doneAt), rDateCell_(t.archivedAt), { v: (t.updates || []).length, s: 'number' },
      ]);
    }
    sheets.push({
      name: 'Archived',
      columns: [8, 18, 60, 16, 12, 12, 12, 12, 9].map((w) => ({ width: w })),
      rows: arRows,
      freeze: 'A2',
      autoFilter: `A1:I${Math.max(2, arRows.length)}`,
    });
  }

  return buildWorkbook_(sheets);
}

// ---------- Tổng kết tuần ----------
function buildWrapupReport_(wrap) {
  const fmt = (iso) => (rIsIso_(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
  const label = (s) => (REPORT_STATUS_[s] || REPORT_STATUS_.todo).label;
  const TYPES = ['Done', 'New task', 'Update', 'Daily log'];

  const act = [['Member', 'Type', 'Date', 'Topic', 'Task', 'Status now', 'Details'].map((h) => ({ v: h, s: 'header' }))];
  for (const m of wrap.members) {
    const name = m.member.name;
    for (const t of m.done) {
      act.push([name, 'Done', rDateCell_(t.doneAt), t.topic, { v: t.title, s: 'wrap' }, label(t.status), null]);
      for (const u of t.updates || []) act.push([name, 'Update', rDateCell_(u.date), t.topic, { v: t.title, s: 'wrap' }, label(t.status), { v: String(u.text || ''), s: 'wrap' }]);
    }
    for (const t of m.created) act.push([name, 'New task', rDateCell_(t.createdAt), t.topic, { v: t.title, s: 'wrap' }, label(t.status), null]);
    for (const w of m.workedOn) {
      for (const u of w.updates) act.push([name, 'Update', rDateCell_(u.date), w.task.topic, { v: w.task.title, s: 'wrap' }, label(w.task.status), { v: String(u.text || ''), s: 'wrap' }]);
    }
    for (const l of m.logs) act.push([name, 'Daily log', rDateCell_(l.date), null, l.taskTitle ? { v: l.taskTitle, s: 'wrap' } : 'General note', null, { v: String(l.text || ''), s: 'wrap' }]);
  }
  const lastAct = Math.max(2, act.length);
  const who = `'Activity'!$A$2:$A$${lastAct}`;
  const type = `'Activity'!$B$2:$B$${lastAct}`;

  const sum = [
    [{ v: 'Weekly wrap-up', s: 'title' }],
    [{ v: `Week ${fmt(wrap.start)} to ${fmt(wrap.end)}. Exported ${rNow_()}`, s: 'muted' }],
    [],
    [{ v: 'Member', s: 'header' }, ...TYPES.map((t) => ({ v: t, s: 'header' })), { v: 'Total', s: 'header' }],
  ];
  const headerRow = 4;
  const cols = ['B', 'C', 'D', 'E'];
  wrap.members.forEach((m, i) => {
    const r = headerRow + 1 + i;
    const cached = [m.counts.done, m.counts.created, m.counts.updates, m.counts.logs];
    sum.push([
      m.member.name,
      ...TYPES.map((_, j) => ({ f: `COUNTIFS(${who},$A${r},${type},${cols[j]}$${headerRow})`, v: cached[j], s: 'number' })),
      { f: `SUM(B${r}:E${r})`, v: cached.reduce((a, b) => a + b, 0), s: 'total' },
    ]);
  });
  const first = headerRow + 1;
  const last = headerRow + wrap.members.length;
  const totalCached = [wrap.totals.done, wrap.totals.created, wrap.totals.updates, wrap.totals.logs];
  sum.push([
    { v: 'Total', s: 'total' },
    ...cols.map((c, j) => ({ f: wrap.members.length ? `SUM(${c}${first}:${c}${last})` : '0', v: totalCached[j], s: 'total' })),
    { f: wrap.members.length ? `SUM(F${first}:F${last})` : '0', v: totalCached.reduce((a, b) => a + b, 0), s: 'total' },
  ]);
  sum.push([{ v: 'Counted from the Activity sheet.', s: 'muted' }], []);
  sum.push([{ v: 'Workload now', s: 'header' }, ...REPORT_STATUS_KEYS_.map((k) => ({ v: REPORT_STATUS_[k].label, s: 'header' }))]);
  for (const m of wrap.members) sum.push([m.member.name, ...REPORT_STATUS_KEYS_.map((k) => ({ v: m.current[k], s: 'number' }))]);
  sum.push([{ v: 'Fixed numbers captured when this file was created.', s: 'muted' }]);

  return buildWorkbook_([
    { name: 'Summary', columns: [26, 12, 12, 12, 12, 12].map((w) => ({ width: w })), rows: sum },
    { name: 'Activity', columns: [16, 11, 12, 18, 50, 13, 60].map((w) => ({ width: w })), rows: act, freeze: 'A2', autoFilter: `A1:G${lastAct}` },
  ]);
}


// ---------- Tên sheet an toàn cho Excel ----------
var byName_ = function (a, b) { return String(a).localeCompare(String(b), 'vi', { sensitivity: 'base' }); };
function sheetName_(name, used) {
  var base = String(name || 'Member').replace(/[\[\]:*?\/\\]/g, ' ').replace(/^'+|'+$/g, '').trim().slice(0, 31) || 'Member';
  if (base.toLowerCase() === 'history') base = 'History (member)';
  var n = base, i = 2;
  while (used[n.toLowerCase()]) { var suffix = ' (' + i++ + ')'; n = base.slice(0, 31 - suffix.length) + suffix; }
  used[n.toLowerCase()] = true;
  return n;
}
function sheetRef_(name) { return "'" + String(name).replace(/'/g, "''") + "'"; }
function lookups_(state) {
  var topics = {}, members = {};
  (state.topics || []).forEach(function (t) { topics[t.id] = t.name; });
  (state.members || []).forEach(function (m) { members[m.id] = m.name; });
  return { topic: function (id) { return topics[id] || '—'; }, member: function (id) { return members[id] || '—'; } };
}
function latestUpdate_(t) {
  var ups = (t.updates || []).slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
  var u = ups[ups.length - 1];
  return u ? { v: u.date + ': ' + u.text, s: 'wrap' } : null;
}
var STATUS_STYLE_ = { todo: 'statusNot', progress: 'statusProg', blocked: 'statusBlocked', done: 'statusDone' };
var STATUS_TEXT_ = { todo: 'Not started', progress: 'In progress', blocked: 'Pending', done: 'Done' };

/*
 * Task Done trong một năm (theo ngày hoàn thành): sheet Summary, sheet "All done",
 * rồi mỗi người một sheet, xếp tên A → Z.
 */
function buildDoneByYear(state, year) {
  var L = lookups_(state);
  var y = String(year);
  var done = (state.tasks || []).filter(function (t) { return t.status === 'done' && t.doneAt && t.doneAt.slice(0, 4) === y; });
  var names = [];
  done.forEach(function (t) { var n = L.member(t.assigneeId); if (names.indexOf(n) < 0) names.push(n); });
  names.sort(byName_);
  done.sort(function (a, b) { return byName_(L.member(a.assigneeId), L.member(b.assigneeId)) || String(a.doneAt).localeCompare(String(b.doneAt)); });

  var header = ['ID', 'Topic', 'Task', 'Assignee', 'Supported by', 'Start', 'Due date', 'Done date', 'Busy days', 'Updates', 'Latest update'];
  var widths = [8, 18, 58, 16, 16, 12, 12, 12, 10, 9, 60];
  function rowsFor(list) {
    var rows = [header.map(function (h) { return { v: h, s: 'header' }; })];
    list.forEach(function (t, i) {
      var r = i + 2;
      rows.push([{ v: t.id, s: 'number' }, L.topic(t.topicId), { v: t.title, s: 'wrap' }, L.member(t.assigneeId), t.support || '',
        rDateCell_(t.start), rDateCell_(t.end), rDateCell_(t.doneAt),
        { f: 'G' + r + '-F' + r, v: rDays_(t.start, t.end), s: 'number' }, { v: (t.updates || []).length, s: 'number' }, latestUpdate_(t)]);
    });
    return rows;
  }
  var used = { summary: true, 'all done': true };
  var allRows = rowsFor(done);
  var last = Math.max(2, allRows.length);
  var summary = [
    [{ v: 'Done tasks in ' + y, s: 'title' }],
    [{ v: 'Grouped by the date each task was marked Done. Exported ' + rNow_() + '.', s: 'muted' }],
    [],
    [{ v: 'Member', s: 'header' }, { v: 'Done tasks', s: 'header' }]
  ];
  names.forEach(function (n, i) {
    var r = 5 + i;
    summary.push([n, { f: "COUNTIF('All done'!$D$2:$D$" + last + ',A' + r + ')', v: done.filter(function (t) { return L.member(t.assigneeId) === n; }).length, s: 'number' }]);
  });
  summary.push([{ v: 'Total', s: 'total' }, { f: names.length ? 'SUM(B5:B' + (4 + names.length) + ')' : '0', v: done.length, s: 'total' }]);
  summary.push([{ v: 'Each member has their own sheet in this file.', s: 'muted' }]);

  var sheets = [
    { name: 'Summary', columns: [{ width: 28 }, { width: 14 }], rows: summary },
    { name: 'All done', columns: widths.map(function (w) { return { width: w }; }), rows: allRows, freeze: 'A2', autoFilter: 'A1:K' + last }
  ];
  names.forEach(function (n) {
    var mine = done.filter(function (t) { return L.member(t.assigneeId) === n; });
    var rows = rowsFor(mine);
    sheets.push({ name: sheetName_(n, used), columns: widths.map(function (w) { return { width: w }; }), rows: rows, freeze: 'A2', autoFilter: 'A1:K' + Math.max(2, rows.length) });
  });
  return buildWorkbook_(sheets);
}

/*
 * Task đang mở: Not started & In progress (xếp theo tên A → Z, rồi Not started trước In progress),
 * Pending ở sheet riêng, task chờ duyệt ở sheet riêng.
 */
function buildOpenTasks(state) {
  var L = lookups_(state);
  var draft = function (t) { return t.approval === 'pending_new' || t.approval === 'rejected'; };
  var order = { todo: 0, progress: 1 };
  var tasks = state.tasks || [];
  var active = tasks.filter(function (t) { return !draft(t) && (t.status === 'todo' || t.status === 'progress'); })
    .sort(function (a, b) { return byName_(L.member(a.assigneeId), L.member(b.assigneeId)) || order[a.status] - order[b.status] || String(a.end).localeCompare(String(b.end)); });
  var pending = tasks.filter(function (t) { return !draft(t) && t.status === 'blocked'; })
    .sort(function (a, b) { return byName_(L.member(a.assigneeId), L.member(b.assigneeId)) || String(a.end).localeCompare(String(b.end)); });
  var waiting = tasks.filter(function (t) { return draft(t) || t.approval === 'pending_done'; })
    .sort(function (a, b) { return byName_(L.member(a.assigneeId), L.member(b.assigneeId)); });

  var header = ['ID', 'Topic', 'Task', 'Assignee', 'Status', 'Supported by', 'Start', 'Due date', 'Updates', 'Latest update'];
  var widths = [8, 18, 58, 16, 13, 16, 12, 12, 9, 60];
  function rowsFor(list, extra) {
    var rows = [header.concat(extra ? [extra] : []).map(function (h) { return { v: h, s: 'header' }; })];
    list.forEach(function (t) {
      var row = [{ v: t.id, s: 'number' }, L.topic(t.topicId), { v: t.title, s: 'wrap' }, L.member(t.assigneeId),
        { v: STATUS_TEXT_[t.status] || t.status, s: STATUS_STYLE_[t.status] }, t.support || '', rDateCell_(t.start), rDateCell_(t.end),
        { v: (t.updates || []).length, s: 'number' }, latestUpdate_(t)];
      if (extra) row.push({ pending_new: 'New task', pending_done: 'Done requested', rejected: 'Not approved' }[t.approval] || '');
      rows.push(row);
    });
    return rows;
  }
  var aRows = rowsFor(active), pRows = rowsFor(pending);
  var aLast = Math.max(2, aRows.length), pLast = Math.max(2, pRows.length);
  var names = [];
  active.concat(pending).forEach(function (t) { var n = L.member(t.assigneeId); if (names.indexOf(n) < 0) names.push(n); });
  names.sort(byName_);
  var A = "'Not started & In progress'", P = "'Pending'";
  var summary = [
    [{ v: 'Open tasks', s: 'title' }],
    [{ v: 'Exported ' + rNow_() + '. Pending tasks are listed separately and not counted as active work.', s: 'muted' }],
    [],
    [{ v: 'Member', s: 'header' }, { v: 'Not started', s: 'header' }, { v: 'In progress', s: 'header' }, { v: 'Active total', s: 'header' }, { v: 'Pending', s: 'header' }]
  ];
  names.forEach(function (n, i) {
    var r = 5 + i;
    var mine = function (list, st) { return list.filter(function (t) { return L.member(t.assigneeId) === n && (!st || t.status === st); }).length; };
    summary.push([n,
      { f: 'COUNTIFS(' + A + '!$D$2:$D$' + aLast + ',$A' + r + ',' + A + '!$E$2:$E$' + aLast + ',"Not started")', v: mine(active, 'todo'), s: 'number' },
      { f: 'COUNTIFS(' + A + '!$D$2:$D$' + aLast + ',$A' + r + ',' + A + '!$E$2:$E$' + aLast + ',"In progress")', v: mine(active, 'progress'), s: 'number' },
      { f: 'B' + r + '+C' + r, v: mine(active), s: 'total' },
      { f: 'COUNTIF(' + P + '!$D$2:$D$' + pLast + ',$A' + r + ')', v: mine(pending), s: 'number' }]);
  });
  var e = 4 + names.length;
  summary.push([{ v: 'Total', s: 'total' }].concat(['B', 'C', 'D', 'E'].map(function (c, j) {
    var cached = [active.filter(function (t) { return t.status === 'todo'; }).length, active.filter(function (t) { return t.status === 'progress'; }).length, active.length, pending.length][j];
    return { f: names.length ? 'SUM(' + c + '5:' + c + e + ')' : '0', v: cached, s: 'total' };
  })));
  var sheets = [
    { name: 'Summary', columns: [28, 13, 13, 13, 13].map(function (w) { return { width: w }; }), rows: summary },
    { name: 'Not started & In progress', columns: widths.map(function (w) { return { width: w }; }), rows: aRows, freeze: 'A2', autoFilter: 'A1:J' + aLast },
    { name: 'Pending', columns: widths.map(function (w) { return { width: w }; }), rows: pRows, freeze: 'A2', autoFilter: 'A1:J' + pLast }
  ];
  if (waiting.length) {
    var wRows = rowsFor(waiting, 'Waiting for');
    sheets.push({ name: 'Waiting for approval', columns: widths.concat([16]).map(function (w) { return { width: w }; }), rows: wRows, freeze: 'A2', autoFilter: 'A1:K' + Math.max(2, wRows.length) });
  }
  return buildWorkbook_(sheets);
}

global.TTXlsx = {
  buildReport: buildReport_,
  buildWrapupReport: buildWrapupReport_,
  buildDoneByYear: buildDoneByYear,
  buildOpenTasks: buildOpenTasks
};
})(window);
