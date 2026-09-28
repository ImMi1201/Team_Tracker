/*
 * report.js — xuất báo cáo điều tra OOS (Full Scale OOS Investigation Report) ra file Word (.docx).
 * Bố cục theo mẫu SOP-LA-A008-FORM06/06, toàn bộ bằng tiếng Anh.
 * Mỗi bước (step) của task thành một mục trong phần Investigation Result, nội dung lấy từ ghi chú của bước.
 * Dùng thư viện docx (biến toàn cục `docx`), trang tự tải khi cần.
 */
window.TTReport = (function () {
  'use strict';

  var DOCX_URL = 'https://cdn.jsdelivr.net/npm/docx@9.8.0/dist/index.iife.js';
  var FONT = 'Times New Roman';
  var PAGE_W = 11906, MARGIN = 1134;            // A4, lề 2 cm
  var CONTENT_W = PAGE_W - 2 * MARGIN;          // 9638 DXA
  var PLACEHOLDER = '[Enter here]';

  var SIGNERS = [
    ['preparer', 'Prepared by', 'Preparer'],
    ['production', 'Reviewed by', 'Production Manager'],
    ['qc', 'Reviewed by', 'QC Manager'],
    ['qa', 'Approved by', 'QA Manager'],
    ['factory', 'Circulate to', 'Factory Director'],
    ['vtc', 'Circulate to', 'Director of Vietnam Techno Center']
  ];

  function load() {
    if (window.docx) return Promise.resolve(window.docx);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = DOCX_URL;
      s.onload = function () { window.docx ? resolve(window.docx) : reject(new Error('Could not load the Word library.')); };
      s.onerror = function () { reject(new Error('Could not load the Word library. Check your internet connection.')); };
      document.head.appendChild(s);
    });
  }

  function fmtDate(iso) { if (!iso) return ''; var p = String(iso).slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function lines(text) { return String(text || '').split(/\r?\n/); }
  function val(v) { return String(v || '').trim(); }

  function build(task, rep) {
    var D = window.docx;
    rep = rep || {};
    var sig = rep.signatories || {};
    var impact = rep.impact || {};
    var none = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    var line = { style: D.BorderStyle.SINGLE, size: 4, color: '000000' };
    var allBorders = { top: line, bottom: line, left: line, right: line };

    // ---------- helpers ----------
    function run(text, o) { o = o || {}; return new D.TextRun({ text: text, font: FONT, size: o.size || 22, bold: o.bold, italics: o.italics, underline: o.underline ? {} : undefined, color: o.color }); }
    function para(children, o) {
      o = o || {};
      return new D.Paragraph({ children: children, alignment: o.align, spacing: { before: o.before || 0, after: o.after == null ? 60 : o.after, line: 260 }, indent: o.indent, keepNext: o.keepNext });
    }
    function text(t, o) { return para([run(t, o)], o); }
    // Nhãn + giá trị (giá trị trống thì hiện ô chờ điền màu xám)
    function field(label, value, o) {
      o = o || {};
      var v = val(value);
      return para([run(label, { bold: true }), run(' '), v ? run(v) : run(PLACEHOLDER, { color: '808080', italics: true })], o);
    }
    // Đoạn nhiều dòng (mỗi dòng thành một paragraph)
    function block(value, o) {
      var v = val(value);
      if (!v) return [text(PLACEHOLDER, { color: '808080', italics: true, indent: o && o.indent })];
      return lines(v).map(function (l) { return text(l, { indent: o && o.indent }); });
    }
    function cell(children, width, o) {
      o = o || {};
      return new D.TableCell({
        children: children, width: { size: width, type: D.WidthType.DXA }, borders: o.borders || allBorders,
        columnSpan: o.span, verticalAlign: o.vAlign || D.VerticalAlign.TOP,
        shading: o.fill ? { type: D.ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
        margins: { top: 80, bottom: 80, left: 110, right: 110 }
      });
    }
    function table(widths, rows) {
      return new D.Table({ width: { size: widths.reduce(function (a, b) { return a + b; }, 0), type: D.WidthType.DXA }, columnWidths: widths, rows: rows });
    }
    function box(children, keep) { return table([CONTENT_W], [new D.TableRow({ cantSplit: !!keep, children: [cell(children, CONTENT_W)] })]); }
    function spacer() { return para([run('')], { after: 120 }); }
    function check(on) { return on ? '☒' : '☐'; }

    // ---------- 1. Thông tin chung ----------
    var third = Math.floor(CONTENT_W / 3);
    var widths3 = [third, third, CONTENT_W - 2 * third];
    var lots = lines(rep.lots).map(val).filter(Boolean);
    var info = table(widths3, [
      new D.TableRow({ children: [
        cell([text('Product Name / Material Name', { bold: true })].concat(block(rep.product || task.title)), widths3[0]),
        cell([text('Lot No. / Control No.', { bold: true })].concat(block(rep.lots)), widths3[1]),
        cell([text('Test Item', { bold: true })].concat(block(rep.testItem)), widths3[2])
      ] }),
      new D.TableRow({ children: [cell([text('Specification:', { bold: true })].concat(block(rep.specification)), CONTENT_W, { span: 3 })] })
    ]);

    // ---------- 2. Nội dung OOS + kết quả điều tra ----------
    var body = [
      field('OOS content:', rep.oosContent),
      field('Specification:', rep.specification),
      field('Result:', rep.result),
      field('Investigation content:', rep.investigationContent || (task.steps || []).map(function (s) { return s.title; }).join(', ')),
      text('Investigation Result', { bold: true, before: 160 }),
      text('Technical and scientific explanation', { underline: true, before: 60 })
    ];

    // Bảng kết quả thử nghiệm: mỗi lô một dòng, cột kết quả để chèn ảnh/mô tả
    if (lots.length) {
      var w2 = [Math.round(CONTENT_W * 0.28), CONTENT_W - Math.round(CONTENT_W * 0.28) - 220];
      body.push(field('Test result' + (rep.stabilityPoint ? ' after ' + rep.stabilityPoint : '') + ':', rep.testResultNote, { before: 120 }));
      body.push(table(w2, [
        new D.TableRow({ tableHeader: true, children: [
          cell([text('Testing item', { bold: true, align: D.AlignmentType.CENTER })], w2[0], { vAlign: D.VerticalAlign.CENTER, fill: 'F2F2F2' }),
          cell([text(val(rep.testItem) || 'Result', { bold: true, align: D.AlignmentType.CENTER }), text(val(rep.specification), { align: D.AlignmentType.CENTER, after: 0 })], w2[1], { fill: 'F2F2F2' })
        ] })
      ].concat(lots.map(function (lot) {
        var name = (val(rep.productCode) ? val(rep.productCode) + ' – ' : '') + lot;
        return new D.TableRow({ children: [
          cell([text(name, { bold: true, align: D.AlignmentType.CENTER })], w2[0], { vAlign: D.VerticalAlign.CENTER }),
          cell([text('[Insert photo / result for ' + lot + ']', { color: '808080', italics: true, align: D.AlignmentType.CENTER, before: 400, after: 400 })], w2[1], { vAlign: D.VerticalAlign.CENTER })
        ] });
      }))));
    }

    // Mỗi bước = một mục điều tra; ghi chú của bước là nội dung
    var steps = task.steps || [];
    steps.forEach(function (s, i) {
      body.push(para([run((i + 1) + '. ' + s.title, { underline: true })], { before: 200, keepNext: true }));
      if (s.done && s.doneAt) body.push(text('Completed: ' + fmtDate(s.doneAt), { italics: true, color: '595959', size: 20 }));
      body.push.apply(body, block(s.note));
    });
    if (!steps.length) body.push(text('[Add steps to this task to list each investigation item here]', { color: '808080', italics: true, before: 120 }));

    body.push(para([run('Conclusion', { underline: true, bold: true })], { before: 240, keepNext: true }));
    body.push.apply(body, block(rep.conclusion));

    // ---------- 3. Đánh giá của QA ----------
    var qa = box([
      text('Evaluation of QA Manager', { bold: true }),
      text('1. Range of impact:', { bold: true, before: 80 }),
      text(check(impact.lot) + '  a. Product for only this lot', { indent: { left: 360 } }),
      text(check(impact.product) + '  b. Product (including previous lots or other lots)', { indent: { left: 360 } }),
      text(check(impact.process) + '  c. Process', { indent: { left: 360 } }),
      text(check(impact.release) + '  d. Release', { indent: { left: 360 } }),
      para([run('Propose CA:', { bold: true }), run('     ' + check(rep.proposeCa === 'capa') + ' CAPA     ' + check(rep.proposeCa === 'deviation') + ' Deviation     ' + check(rep.proposeCa === 'no') + ' No')], { before: 120 }),
      text('Special remarks:', { bold: true, before: 120 })
    ].concat(val(rep.remarks) ? block(rep.remarks) : [spacer(), spacer()]).concat([
      field('QA Manager:', sig.qa, { before: 160 }),
      field('Date:', ''),
      field('Circulate to responsible person:', rep.circulateTo, { before: 120 }),
      field('Related document No.:', rep.relatedDocs, { before: 120 })
    ]), true);

    // ---------- 4. Bảng ký duyệt ----------
    var ws = [1900, 2600, 1300, 2238, 1600];
    var sigTable = table(ws, [
      new D.TableRow({ tableHeader: true, children: [
        cell([text('')], ws[0], { fill: 'F2F2F2' }), cell([text('')], ws[1], { fill: 'F2F2F2' }),
        cell([text('Date', { bold: true, align: D.AlignmentType.CENTER })], ws[2], { fill: 'F2F2F2' }),
        cell([text('Full Name', { bold: true, align: D.AlignmentType.CENTER })], ws[3], { fill: 'F2F2F2' }),
        cell([text('Signature', { bold: true, align: D.AlignmentType.CENTER })], ws[4], { fill: 'F2F2F2' })
      ] })
    ].concat(SIGNERS.map(function (r) {
      return new D.TableRow({ cantSplit: true, children: [
        cell([text(r[1])], ws[0], { vAlign: D.VerticalAlign.CENTER }), cell([text(r[2])], ws[1], { vAlign: D.VerticalAlign.CENTER }),
        cell([text(r[0] === 'preparer' ? fmtDate(rep.preparedDate) : '', { align: D.AlignmentType.CENTER })], ws[2], { vAlign: D.VerticalAlign.CENTER }),
        cell([text(val(sig[r[0]]))], ws[3], { vAlign: D.VerticalAlign.CENTER }), cell([text('', { before: 300, after: 300 })], ws[4])
      ] });
    })));

    var formCode = val(rep.formCode) || 'SOP-LA-A008-FORM06/06';
    var header = new D.Header({ children: [
      new D.Paragraph({ alignment: D.AlignmentType.RIGHT, children: [new D.TextRun({ font: FONT, size: 20, children: ['Page: ', D.PageNumber.CURRENT, '/', D.PageNumber.TOTAL_PAGES] })] }),
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { before: 60, after: 120 }, children: [run('FULL SCALE OOS INVESTIGATION REPORT', { bold: true, size: 26 })] })
    ] });
    var footer = new D.Footer({ children: [new D.Paragraph({ children: [run(formCode, { size: 18 })] })] });

    var doc = new D.Document({
      creator: 'My Tracker', title: 'Full Scale OOS Investigation Report' + (rep.reportNo ? ' ' + rep.reportNo : ''),
      styles: { default: { document: { run: { font: FONT, size: 22 } } } },
      sections: [{
        properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: 1134, bottom: 1134, left: MARGIN, right: MARGIN, header: 567, footer: 567 } } },
        headers: { default: header }, footers: { default: footer },
        children: [
          para([run('No: ', { bold: true }), val(rep.reportNo) ? run(val(rep.reportNo)) : run(PLACEHOLDER, { color: '808080', italics: true })], { align: D.AlignmentType.RIGHT, after: 80 }),
          info,
          box(body),
          spacer(),
          qa,
          spacer(),
          sigTable
        ]
      }]
    });
    return D.Packer.toBlob ? D.Packer.toBlob(doc) : D.Packer.toBuffer(doc);
  }

  function fileName(task, rep) {
    var base = 'OOS_Report_' + (val(rep && rep.reportNo) || task.title);
    return base.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_').slice(0, 100) + '.docx';
  }

  return { load: load, build: build, fileName: fileName, SIGNERS: SIGNERS };
})();
