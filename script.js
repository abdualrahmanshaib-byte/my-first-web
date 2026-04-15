// ==========================================
// 1. نظام الذاكرة المتقدم (التراجع والإعادة)
// ==========================================
let historyStack = [];
let historyIndex = -1;

function saveState() {
  const area = document.getElementById('printable-area');
  if (!area) return;
  const content = area.innerHTML;
  if (historyIndex >= 0 && historyStack[historyIndex] === content) return;
  if (historyIndex < historyStack.length - 1) { historyStack = historyStack.slice(0, historyIndex + 1); }
  historyStack.push(content);
  if (historyStack.length > 50) historyStack.shift(); else historyIndex++;
}

function undoAction() {
  if (historyIndex > 0) {
    historyIndex--;
    document.getElementById('printable-area').innerHTML = historyStack[historyIndex];
    resetShapeControls();
  }
}

function redoAction() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    document.getElementById('printable-area').innerHTML = historyStack[historyIndex];
    resetShapeControls();
  }
}

function resetShapeControls() {
  activePage = null; selectedShape = null;
  document.getElementById('shape-controls').style.display = 'none';
}

let typingTimer;
document.getElementById('printable-area').addEventListener('input', function() {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(saveState, 500);
});

window.onload = function() { saveState(); };

document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redoAction(); else undoAction(); }
  if (e.ctrlKey && e.key.toLowerCase() === 'y') { e.preventDefault(); redoAction(); }
});

// ==========================================
// 2. الجداول ومربعات النص الحرة
// ==========================================
function insertTable() {
  focusEditor();
  let rows = prompt("أدخل عدد الصفوف:", "3");
  let cols = prompt("أدخل عدد الأعمدة:", "3");
  if (rows && cols && !isNaN(rows) && !isNaN(cols)) {
    let html = '<br><table class="math-table" contenteditable="true"><tbody>';
    for (let i = 0; i < rows; i++) {
      html += '<tr>';
      for (let j = 0; j < cols; j++) { html += '<td><br></td>'; }
      html += '</tr>';
    }
    html += '</tbody></table><br>';
    document.execCommand("insertHTML", false, html);
    saveState();
  }
}

function insertTextBox() {
  if (!activePage) activePage = document.querySelector('.a4-page');
  let floatingText = document.createElement('div');
  floatingText.className = 'floating-text';
  floatingText.contentEditable = 'true';
  floatingText.style.left = '50px';
  floatingText.style.top = '250px';
  floatingText.innerHTML = 'اكتب هنا...';
  activePage.appendChild(floatingText);

  let range = document.createRange();
  range.selectNodeContents(floatingText);
  let sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  saveState();
}

document.addEventListener('dblclick', function(e) {
  if (e.target.classList.contains('content-area') || e.target.classList.contains('page-border') || e.target.classList.contains('a4-page')) {
    const page = e.target.closest('.a4-page');
    let rect = page.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    let floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.contentEditable = 'true';
    floatingText.style.left = x + 'px';
    floatingText.style.top = y + 'px';
    floatingText.innerHTML = 'اكتب هنا...';
    page.appendChild(floatingText);

    let range = document.createRange();
    range.selectNodeContents(floatingText);
    let sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    saveState();
  }
});

// ==========================================
// 3. أدوات الكتابة والأسس
// ==========================================
function toggleSuperscript() { focusEditor(); document.execCommand('superscript', false, null); saveState(); }
function toggleSubscript() { focusEditor(); document.execCommand('subscript', false, null); saveState(); }

function loadLogo(event) {
  let file = event.target.files[0];
  if (file) {
    let reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('logo-preview').src = e.target.result;
      document.getElementById('logo-preview').style.display = 'block';
      document.getElementById('logo-placeholder').style.display = 'none';
      saveState();
    }
    reader.readAsDataURL(file);
  }
}

let activePage = null;
document.addEventListener('focusin', function(e) {
  if(e.target.closest('.a4-page')) { activePage = e.target.closest('.a4-page'); }
});

function focusEditor() {
  let active = document.activeElement;
  if (active && active.classList.contains('floating-text')) return;
  if (active && (active.classList.contains('content-area') || active.closest('.content-area'))) return;
  if (active && active.classList.contains('editable-field')) return;
  // If focus inside a math-container, root-content, or fraction part, let it stay
  if (active && (active.classList.contains('root-content') || active.classList.contains('fraction-num') || active.classList.contains('fraction-den'))) return;

  document.querySelector('.content-area').focus();
}

function insertText(t) { focusEditor(); document.execCommand("insertText", false, t); saveState(); }
function insertDiwaniLetter(l) { focusEditor(); let html = `<span style="font-family:'Aref Ruqaa',serif; font-size:1.3em; margin:0 2px;">${l}</span>`; document.execCommand("insertHTML", false, html); saveState(); }
function insertSetLetter(l) { focusEditor(); let html = `<span style="font-weight:900; font-size:1.2em; letter-spacing:1px;">${l}</span>`; document.execCommand("insertHTML", false, html); saveState(); }
function changeColor(c) { focusEditor(); document.execCommand('foreColor', false, c); saveState(); }

function switchTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("keyboard-panel");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
    tabcontent[i].classList.remove('active-panel');
  }
  tablinks = document.getElementsByClassName("tab-btn");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "flex";
  document.getElementById(tabName).classList.add('active-panel');
  evt.currentTarget.className += " active";
}

function generatePDF() {
  const element = document.getElementById('printable-area');
  const opt = {
    margin:       0,
    filename:     'اختبار_رياضيات.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

function insertIntegration() {
  focusEditor();
  let html = `<span style="font-size: 1.5em; vertical-align: middle; margin: 0 5px;">&int;</span>`;
  document.execCommand("insertHTML", false, html);
  saveState();
}

function insertGradeBox() {
  focusEditor();
  let html = `<div style="border: 1px solid #900; padding: 5px; display: inline-block; min-width: 40px; text-align: center; color: #900; font-weight: bold;">الدرجة: <br><br></div>&nbsp;`;
  document.execCommand("insertHTML", false, html);
  saveState();
}

let selectedShape = null;

function insertFloatingShape(char) {
  if (!activePage) activePage = document.querySelector('.a4-page');
  let shape = document.createElement('div');
  shape.className = 'math-shape';
  shape.innerHTML = char;
  shape.style.left = '100px';
  shape.style.top = '100px';
  shape.style.fontSize = '40px';
  shape.style.transform = 'rotate(0deg)';

  // Make it draggable
  shape.onmousedown = function(event) {
    selectedShape = shape;
    document.getElementById('shape-controls').style.display = 'flex';
    document.getElementById('shape-size').value = parseInt(shape.style.fontSize);
    let rotation = shape.style.transform.replace(/[^0-9]/g, '');
    document.getElementById('shape-rotate').value = rotation || 0;

    let shiftX = event.clientX - shape.getBoundingClientRect().left;
    let shiftY = event.clientY - shape.getBoundingClientRect().top;

    function moveAt(pageX, pageY) {
      let rect = activePage.getBoundingClientRect();
      shape.style.left = pageX - rect.left - shiftX + 'px';
      shape.style.top = pageY - rect.top - shiftY + 'px';
    }

    function onMouseMove(event) {
      moveAt(event.pageX, event.pageY);
    }

    document.addEventListener('mousemove', onMouseMove);

    document.onmouseup = function() {
      document.removeEventListener('mousemove', onMouseMove);
      shape.onmouseup = null;
      saveState();
    };
  };

  shape.ondragstart = function() { return false; };
  activePage.appendChild(shape);
  saveState();
}

document.getElementById('shape-size').addEventListener('input', function(e) {
  if (selectedShape) {
    selectedShape.style.fontSize = e.target.value + 'px';
  }
});

document.getElementById('shape-rotate').addEventListener('input', function(e) {
  if (selectedShape) {
    selectedShape.style.transform = `rotate(${e.target.value}deg)`;
  }
});

// ==========================================
// 4. الكسور والجذور المحسّنة والكتابة بداخلها
// ==========================================

function insertRoot() {
  focusEditor();
  let id = "root-" + Date.now();
  // إنشاء عنصر الجذر
  let html = `&nbsp;<span class="math-root math-container" contenteditable="false"><span class="root-symbol">√</span><span id="${id}" class="root-content" contenteditable="true"></span></span>&nbsp;`;
  document.execCommand("insertHTML", false, html);

  // وضع المؤشر داخل الجذر فوراً
  setTimeout(() => {
    let el = document.getElementById(id);
    if(el) {
      el.focus();
    }
  }, 10);
  saveState();
}

function insertFraction() {
  focusEditor();
  let numId = "num-" + Date.now();
  let html = `&nbsp;<span class="math-fraction math-container" contenteditable="false"><span id="${numId}" class="fraction-num" contenteditable="true"></span><span class="fraction-den" contenteditable="true"></span></span>&nbsp;`;
  document.execCommand("insertHTML", false, html);

  // وضع المؤشر داخل البسط فوراً
  setTimeout(() => {
    let el = document.getElementById(numId);
    if(el) {
      el.focus();
    }
  }, 10);
  saveState();
}

// زر الخروج من النطاق (الجذر، الكسر، الأس)
function exitFormat() {
  let sel = window.getSelection();
  if (!sel.rangeCount) return;

  let node = sel.anchorNode;
  if (node.nodeType === 3) node = node.parentNode; // إذا كان النص

  // إزالة تنسيق الأس أو الرقم السفلي إذا كنا داخله
  let inSup = node.closest('sup');
  let inSub = node.closest('sub');

  if (inSup || inSub) {
    // استخدم الأوامر القياسية للخروج من الأس/الرقم السفلي
    if(inSup) document.execCommand('superscript', false, null);
    if(inSub) document.execCommand('subscript', false, null);

    // إذا لم ينجح الأمر أو أردنا ضمان المؤشر بعد العنصر:
    let container = inSup || inSub;
    let range = document.createRange();
    range.setStartAfter(container);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    // إضافة مسافة وهمية إذا لزم الأمر ليتمكن المستخدم من الكتابة
    document.execCommand("insertHTML", false, "&nbsp;&#8203;");

    focusEditor();
    return;
  }

  // الخروج من الجذر أو الكسر
  let mathContainer = node.closest('.math-container');
  if (mathContainer) {
    let range = document.createRange();
    range.setStartAfter(mathContainer);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    // إدراج مسافة لا تنكسر لضمان خروج المؤشر بشكل صحيح من الحاوية غير القابلة للتعديل
    document.execCommand("insertHTML", false, "&nbsp;&#8203;");

    let contentArea = mathContainer.closest('.content-area');
    if (contentArea) contentArea.focus();
  }
}
