(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const CTL = ['NUL','SOH','STX','ETX','EOT','ENQ','ACK','BEL','BS','HT','LF','VT','FF','CR','SO','SI',
               'DLE','DC1','DC2','DC3','DC4','NAK','SYN','ETB','CAN','EM','SUB','ESC','FS','GS','RS','US'];
  const label = c => c === 32 ? 'SP' : c === 127 ? 'DEL' : c < 32 ? CTL[c] : String.fromCharCode(c);
  const hex2 = n => n.toString(16).toUpperCase().padStart(2, '0');
  const bin = (n, w) => n.toString(2).padStart(w, '0');

  /* ---------- STEP 1 ---------- */
  function drawAscii(hit) {
    let h = '<thead><tr><th rowspan="2" style="vertical-align:bottom">下位<br>4ビット</th><th colspan="8">上位3ビット</th></tr><tr>';
    for (let u = 0; u < 8; u++) h += '<th>' + bin(u, 3) + '</th>';
    h += '</tr></thead><tbody>';
    for (let l = 0; l < 16; l++) {
      h += '<tr><th>' + bin(l, 4) + '</th>';
      for (let u = 0; u < 8; u++) {
        const c = u * 16 + l;
        if (u < 2) h += '<td class="ctl">' + CTL[c] + '</td>';
        else h += '<td class="c' + (hit === c ? ' hit' : '') + '" data-c="' + c + '">' + label(c) + '</td>';
      }
      h += '</tr>';
    }
    $('asciiTable').innerHTML = h + '</tbody>';
    $('asciiTable').querySelectorAll('td.c').forEach(td => td.addEventListener('click', () => {
      $('binIn').value = bin(+td.dataset.c, 7); drawLook();
    }));
  }
  function drawLook() {
    const s = $('binIn').value.trim().replace(/[^01]/g, '');
    const n = $('lookNote');
    if (s.length !== 7) { n.className = 'note info'; n.textContent = '0と1を7個入れてください（いまは ' + s.length + ' 個）。'; drawAscii(-1); return; }
    const c = parseInt(s, 2), up = s.slice(0, 3), lo = s.slice(3);
    n.className = 'note ok';
    n.innerHTML = '上位3ビット <strong class="mono">' + up + '</strong>、下位4ビット <strong class="mono">' + lo + '</strong> の交点は ' +
      '<strong style="font-size:1.3rem">' + label(c) + '</strong>。' +
      '　16進法では <span class="mono">' + hex2(c) + '</span>、10進法では <span class="mono">' + c + '</span>。' +
      (c < 32 || c === 127 ? '<br>これは画面に文字として出ない<strong>制御文字</strong>です。' : '');
    drawAscii(c);
  }

  /* ---------- STEP 2 ---------- */
  function drawCode() {
    const s = $('strIn').value;
    const rows = [...s].map(ch => {
      const c = ch.codePointAt(0);
      return { ch: ch, c: c, ok: c < 128 };
    });
    $('codeTable').innerHTML = '<thead><tr><th>文字</th>' + rows.map(r => '<th class="mono">' + (r.ch === ' ' ? '␣' : r.ch) + '</th>').join('') + '</tr></thead><tbody>' +
      '<tr><td>2進法（7ビット）</td>' + rows.map(r => '<td class="mono">' + (r.ok ? bin(r.c, 7) : '—') + '</td>').join('') + '</tr>' +
      '<tr><td>16進法</td>' + rows.map(r => '<td class="mono"><strong>' + (r.ok ? hex2(r.c) : '—') + '</strong></td>').join('') + '</tr>' +
      '<tr><td>10進法</td>' + rows.map(r => '<td class="mono">' + (r.ok ? r.c : '—') + '</td>').join('') + '</tr></tbody>';
    const n = rows.length, bad = rows.filter(r => !r.ok).length;
    $('cCount').textContent = n + ' 文字';
    $('cBits7').textContent = (n - bad) * 7 + ' ビット';
    $('cBytes').textContent = (n - bad) + ' バイト（' + (n - bad) * 8 + ' ビット）';
    const nt = $('codeNote');
    if (bad) { nt.className = 'note ng'; nt.innerHTML = 'ASCIIで表せない文字が ' + bad + ' 個あります。ASCIIは半角の英数字・記号だけです（日本語は STEP 3 へ）。'; }
    else {
      nt.className = 'note ok';
      nt.innerHTML = '16進法で並べると <strong class="mono">' + rows.map(r => hex2(r.c)).join(' ') + '</strong>。' +
        '大文字と小文字はコードが 32（16進法で 20）ずれていることにも注目しましょう。';
    }
  }
  function drawHex() {
    const parts = $('hexIn').value.trim().split(/[\s,]+/).filter(Boolean);
    const n = $('hexNote');
    let out = '', ng = false;
    parts.forEach(p => {
      const v = parseInt(p, 16);
      if (!isFinite(v) || v < 0 || v > 127) { ng = true; return; }
      out += label(v);
    });
    if (ng || !parts.length) { n.className = 'note ng'; n.textContent = '00〜7F の範囲の16進法を空白で区切って入れてください。'; return; }
    n.className = 'note ok';
    n.innerHTML = '読み取った文字列は <strong style="font-size:1.2rem">' + out + '</strong> です。';
  }

  /* ---------- STEP 3 ---------- */
  const ENC = new TextEncoder();
  function drawU8() {
    const s = $('u8In').value;
    const chars = [...s];
    $('u8Box').innerHTML = chars.map(ch => {
      const b = ENC.encode(ch);
      return '<div class="byteg"><span class="ch">' + (ch === ' ' ? '␣' : ch) + '</span>' +
        '<span class="hx">' + [...b].map(hex2).join('') + '</span>' +
        '<span class="bn">' + b.length + ' バイト</span></div>';
    }).join('');
    const total = ENC.encode(s).length;
    $('u8Chars').textContent = chars.length + ' 文字';
    $('u8Bytes').textContent = total + ' バイト';
    $('u8Bits').textContent = total * 8 + ' ビット';
    const n = $('u8Note');
    const per = chars.length ? (total / chars.length) : 0;
    n.className = 'note ok';
    n.innerHTML = '16進法で並べると <strong class="mono">' + chars.map(ch => [...ENC.encode(ch)].map(hex2).join('')).join(' ') + '</strong>。<br>' +
      '16進法1桁は4ビットなので、6桁の文字なら 4×6＝24ビット＝<strong>3バイト</strong>。' +
      'この文字列は1文字あたり平均 <strong>' + (Math.round(per * 100) / 100) + ' バイト</strong>です。';
    $('u8Rule').innerHTML = '<thead><tr><th>文字の種類</th><th>UTF-8のバイト数</th><th>例</th></tr></thead><tbody>' +
      '<tr><td>半角英数字・記号（ASCIIと同じ）</td><td class="mono">1</td><td class="mono">A ＝ 41</td></tr>' +
      '<tr><td>記号・ヨーロッパの文字など</td><td class="mono">2</td><td class="mono">é ＝ C3A9</td></tr>' +
      '<tr><td>ひらがな・カタカナ・漢字</td><td class="mono">3</td><td class="mono">文 ＝ E69687</td></tr>' +
      '<tr><td>絵文字など</td><td class="mono">4</td><td class="mono">🎌 ＝ F09F8E8C</td></tr></tbody>';
  }

  /* ---------- STEP 4 ---------- */
  const MISREAD = [
    { id: 'utf-8', name: 'UTF-8 として読む（正しい読み方）', self: true },
    { id: 'shift_jis', name: 'Shift_JIS として読む' },
    { id: 'euc-jp', name: 'EUC-JP として読む' },
    { id: 'iso-8859-1', name: 'ISO-8859-1（西欧向け）として読む' }
  ];
  function drawMoji() {
    const s = $('mjIn').value;
    const b = ENC.encode(s);
    $('mjHex').textContent = [...b].map(hex2).join(' ');
    let any = false;
    $('mjBox').innerHTML = MISREAD.map(m => {
      let r;
      try { r = new TextDecoder(m.id).decode(b); } catch (e) { r = '（このブラウザでは試せません）'; }
      if (!m.self && r !== s) any = true;
      return '<div class="mojiline' + (m.self ? ' self' : '') + '"><span class="enc">' + m.name + '</span>' +
        '<span class="res">' + (r.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])) || '（表示できる文字がありません）') + '</span></div>';
    }).join('');
    const n = $('mjNote');
    n.className = 'note ' + (any ? 'ng' : 'info');
    n.innerHTML = any
      ? '<strong>バイト列はまったく同じ</strong>なのに、読み方を変えるだけで別の文字に見えます。これが文字化けです。' +
        'データが壊れたわけではないので、<strong>正しいエンコーディングを指定し直せば元に戻ります</strong>。'
      : '半角英数字だけの文字列は、どの体系でもコードが同じ（ASCIIが土台）なので文字化けしません。日本語を入れて試してみましょう。';
  }

  /* ---------- STEP 5 ---------- */
  const BLANKS = [
    { k: 'ア', q: '文字コードが「1000111（2）」の文字は', ch: ['t', 'r', 'G', "'"], a: 'G',
      why: '上位3ビットが 100、下位4ビットが 0111。表の交点は G です。' },
    { k: 'イ', q: '文字列「Dec.」に対応する文字コードを16進法で表すと', ch: ['44 63 65 2E', '44 65 63 2D', '45 64 63 2E', '44 65 63 2E'], a: '44 65 63 2E',
      why: 'D＝1000100＝44、e＝1100101＝65、c＝1100011＝63、.＝0101110＝2E です。大文字Dと小文字eを取り違えないように。' },
    { k: 'ウ', q: '世界中のさまざまな文字を表せる文字コード体系は', ch: ['JIS X 0201', 'Unicode', 'Shift_JIS', 'EUC-JP'], a: 'Unicode',
      why: 'JIS X 0201は半角英数字とカタカナ、Shift_JISは日本語用、EUC-JPはUNIXでよく使われた日本語用。世界共通をめざしたのがUnicodeです。' },
    { k: 'エ', q: '「E69687（16）」から、1文字分のデータ量は', ch: ['1', '2', '3', '4'], a: '3',
      why: '16進法1桁は4ビット。6桁なので 4×6＝24ビット、8ビット＝1バイトだから 24÷8＝3バイトです。' },
    { k: 'オ', q: '文字化けが生じる理由として最も適切なものは', ch: ['プリンタのインク残量が少ないため', '異なるエンコーディング方式で表示させたため', 'ハードウェアの互換性のため', 'コンピュータウイルスの感染のため'], a: '異なるエンコーディング方式で表示させたため',
      why: 'STEP 4 で見たとおり、バイト列は同じでも読み方の決まりが違うと別の文字になります。データが壊れているわけではありません。' }
  ];
  let bAns = {};
  function drawBlanks() {
    $('blankBox').innerHTML = BLANKS.map((b, i) =>
      '<div' + (i ? ' style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)"' : '') + '>' +
      '<p class="qhead" style="margin:0 0 8px">【' + b.k + '】　' + b.q + '</p>' +
      '<div class="choice4' + (b.ch.some(c => c.length > 12) ? ' v' : '') + '" data-i="' + i + '">' + b.ch.map((c, j) =>
        '<button class="btn" data-i="' + i + '" data-c="' + c + '" style="text-align:' + (b.ch.some(x => x.length > 12) ? 'left' : 'center') + '">' +
        '⓪①②③④'[j] + '　' + c + '</button>').join('') + '</div>' +
      '<div class="note" id="bfb' + i + '" hidden></div></div>').join('');
    $('blankBox').querySelectorAll('button[data-c]').forEach(btn => btn.addEventListener('click', () => {
      const i = +btn.dataset.i, b = BLANKS[i], ok = btn.dataset.c === b.a;
      const row = $('blankBox').querySelector('.choice4[data-i="' + i + '"]');
      row.classList.add('locked');
      [...row.children].forEach(x => { if (x.dataset.c === b.a) x.classList.add('correct'); else if (x === btn) x.classList.add('wrong'); });
      const fb = $('bfb' + i);
      fb.hidden = false; fb.className = 'note ' + (ok ? 'ok' : 'ng');
      fb.innerHTML = (ok ? '正解。' : '正解は <strong>' + b.a + '</strong>。') + b.why;
      bAns[i] = ok;
      const done = Object.keys(bAns).length, right = Object.values(bAns).filter(Boolean).length;
      const n = $('blankNote');
      n.className = 'note ' + (done === BLANKS.length ? (right === done ? 'ok' : 'warn') : 'info');
      n.innerHTML = done + ' / ' + BLANKS.length + ' 問解答（正解 ' + right + ' 問）' +
        (done === BLANKS.length ? '<br>本文の答えは【ア】②　【イ】③　【ウ】①　【エ】②　【オ】① です。' : '');
    }));
    $('blankNote').className = 'note info';
    $('blankNote').textContent = '0 / ' + BLANKS.length + ' 問解答';
  }

  function init() {
    $('binIn').addEventListener('input', drawLook);
    document.querySelectorAll('button[data-bin]').forEach(b => b.addEventListener('click', () => { $('binIn').value = b.dataset.bin; drawLook(); }));
    $('strIn').addEventListener('input', drawCode);
    document.querySelectorAll('button[data-str]').forEach(b => b.addEventListener('click', () => { $('strIn').value = b.dataset.str; drawCode(); }));
    $('hexIn').addEventListener('input', drawHex);
    $('u8In').addEventListener('input', drawU8);
    document.querySelectorAll('button[data-u8]').forEach(b => b.addEventListener('click', () => { $('u8In').value = b.dataset.u8; drawU8(); }));
    $('mjIn').addEventListener('input', drawMoji);
    document.querySelectorAll('button[data-mj]').forEach(b => b.addEventListener('click', () => { $('mjIn').value = b.dataset.mj; drawMoji(); }));
    window.Terms.glossary($('glossBox'), ['文字コード', '文字コード体系', 'ASCIIコード', 'Unicode', 'UTF-8', 'Shift_JIS', 'エンコーディング', '文字化け', '制御文字', '16進法', 'ビット']);
    drawAscii(-1); drawLook(); drawCode(); drawHex(); drawU8(); drawMoji(); drawBlanks();
    window.Terms.attach();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
