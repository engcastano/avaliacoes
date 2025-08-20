// App de avaliação — sem dependências externas. Salva no localStorage.
// Estrutura de dados:
// config = { columns: [{id, label, group, weight}], countZeros: boolean }
// data = { students: [{id, name, grades: {colId: number}}] }

const LS_CONFIG = "avaliacoes_config_v1";
const LS_DATA   = "avaliacoes_data_v1";

let config = loadConfig() || defaultConfig();
let data = loadData() || { students: [] };
renderTable();

// Topbar actions
document.getElementById("btnAddAluno").addEventListener("click", () => showAlunoDialog());
document.getElementById("btnConfigCols").addEventListener("click", () => showColsDialog());
document.getElementById("btnExportCSV").addEventListener("click", exportCSV);
document.getElementById("btnExportJSON").addEventListener("click", exportJSON);
document.getElementById("btnLimpar").addEventListener("click", clearAll);
document.getElementById("chkFaltasZero").checked = config.countZeros || false;
document.getElementById("chkFaltasZero").addEventListener("change", (e) => {
  config.countZeros = e.target.checked;
  saveConfig();
  renderTable();
});
document.getElementById("inputImportJSON").addEventListener("change", importJSON);

// -------------- Storage --------------
function loadConfig(){ try { return JSON.parse(localStorage.getItem(LS_CONFIG)); } catch { return null; } }
function loadData(){ try { return JSON.parse(localStorage.getItem(LS_DATA)); } catch { return null; } }
function saveConfig(){ localStorage.setItem(LS_CONFIG, JSON.stringify(config)); }
function saveData(){ localStorage.setItem(LS_DATA, JSON.stringify(data)); }

function defaultConfig(){
  return {
    columns: [
      { id: rid(), label: "Part A1", group: "A1", weight: 1 },
      { id: rid(), label: "Part A2", group: "A2", weight: 1 },
      { id: rid(), label: "Modelo A2", group: "A2", weight: 1 },
      { id: rid(), label: "Organ A2", group: "A2", weight: 1 },
    ],
    countZeros: false
  };
}

function rid(){ return Math.random().toString(36).slice(2,10); }

// -------------- Tabela --------------
function renderTable(){
  const table = document.getElementById("gradeTable");
  table.innerHTML = "";

  // Agrupar colunas por aula (group)
  const groups = {};
  for (const col of config.columns){
    if (!groups[col.group]) groups[col.group] = [];
    groups[col.group].push(col);
  }
  const groupKeys = Object.keys(groups);

  // Cabeçalho 1: grupos
  const thead = document.createElement("thead");
  const trG = document.createElement("tr");

  const thNum = document.createElement("th"); thNum.className = "sticky group"; thNum.textContent = "#";
  const thNome = document.createElement("th"); thNome.className = "sticky2 group"; thNome.textContent = "Aluno";
  trG.appendChild(thNum); trG.appendChild(thNome);

  for (const g of groupKeys){
    const th = document.createElement("th");
    th.className = "group";
    th.colSpan = groups[g].length;
    th.innerHTML = `${g} <span class="badge">${groups[g].length} itens</span>`;
    trG.appendChild(th);
  }
  const thMediaGroup = document.createElement("th"); thMediaGroup.className = "group"; thMediaGroup.textContent = "Média";
  trG.appendChild(thMediaGroup);
  thead.appendChild(trG);

  // Cabeçalho 2: itens
  const trI = document.createElement("tr");
  const thNum2 = document.createElement("th"); thNum2.className = "sticky"; thNum2.textContent = "—";
  const thNome2 = document.createElement("th"); thNome2.className = "sticky2"; thNome2.textContent = "—";
  trI.appendChild(thNum2); trI.appendChild(thNome2);
  for (const g of groupKeys){
    for (const col of groups[g]){
      const th = document.createElement("th");
      th.innerHTML = `${col.label} <span class="item-weight">(${col.weight})</span>`;
      trI.appendChild(th);
    }
  }
  const thMedia = document.createElement("th"); thMedia.textContent = "Média Geral";
  trI.appendChild(thMedia);
  thead.appendChild(trI);
  table.appendChild(thead);

  // Corpo
  const tbody = document.createElement("tbody");
  data.students.forEach((st, idx) => {
    const tr = document.createElement("tr");
    const tdIdx = document.createElement("td"); tdIdx.className = "sticky"; tdIdx.textContent = String(idx+1).padStart(2,"0");
    const tdNome = document.createElement("td"); tdNome.className = "sticky2";
    const inpNome = document.createElement("input"); inpNome.type = "text"; inpNome.value = st.name || "";
    inpNome.addEventListener("change", () => { st.name = inpNome.value.trim(); saveData(); });
    tdNome.appendChild(inpNome);
    tr.appendChild(tdIdx); tr.appendChild(tdNome);

    // notas
    for (const g of groupKeys){
      for (const col of groups[g]){
        const td = document.createElement("td");
        const inp = document.createElement("input");
        inp.type = "number"; inp.min = "0"; inp.max = "10"; inp.step = "0.1";
        const val = st.grades?.[col.id];
        if (typeof val === "number") inp.value = val;
        inp.addEventListener("change", () => {
          const v = Number(inp.value);
          if (!st.grades) st.grades = {};
          if (Number.isFinite(v)) st.grades[col.id] = v;
          else delete st.grades[col.id];
          saveData();
          // Atualiza média deste aluno
          tdMedia.textContent = calcMediaAluno(st).toFixed(2);
        });
        td.appendChild(inp);
        tr.appendChild(td);
      }
    }
    const tdMedia = document.createElement("td");
    tdMedia.textContent = calcMediaAluno(st).toFixed(2);
    tr.appendChild(tdMedia);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

function calcMediaAluno(st){
  const cols = config.columns;
  let sum = 0, wsum = 0;
  for (const c of cols){
    const g = st.grades?.[c.id];
    if (typeof g === "number"){
      sum += g * c.weight;
      wsum += c.weight;
    } else if (config.countZeros){
      // conta ausência como zero
      sum += 0;
      wsum += c.weight;
    }
  }
  if (wsum === 0) return 0;
  return sum / wsum;
}

// -------------- Diálogo: Colunas/Aulas --------------
const dlgCols = document.getElementById("dlgCols");
const aulasList = document.getElementById("aulasList");
const itensList = document.getElementById("itensList");
const aulaLabel = document.getElementById("aulaAtualLabel");
let aulaAtual = null;

document.getElementById("btnAddAula").addEventListener("click", () => {
  const v = document.getElementById("inpAula").value.trim();
  if (!v) return;
  if (!hasGroup(v)){
    aulaAtual = v;
    renderAulasEditor();
    document.getElementById("inpAula").value = "";
  } else {
    alert("Aula já existe.");
  }
});

document.getElementById("btnAddItem").addEventListener("click", () => {
  if (!aulaAtual) { alert("Selecione uma aula."); return; }
  const label = document.getElementById("inpItemLabel").value.trim();
  const weight = Number(document.getElementById("inpItemPeso").value);
  if (!label) return;
  config.columns.push({ id: rid(), label, group: aulaAtual, weight: Number.isFinite(weight) ? weight : 1 });
  saveConfig();
  renderAulasEditor();
  renderTable();
  document.getElementById("inpItemLabel").value = "";
});

document.getElementById("btnColsSalvar").addEventListener("click", () => {
  saveConfig();
  dlgCols.close();
  renderTable();
});

function showColsDialog(){
  renderAulasEditor();
  dlgCols.showModal();
}

function hasGroup(g){ return config.columns.some(c => c.group === g); }

function groupsFromConfig(){
  const groups = {};
  for (const c of config.columns){
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c);
  }
  return groups;
}

function renderAulasEditor(){
  const groups = groupsFromConfig();
  aulasList.innerHTML = "";
  const tmplAula = document.getElementById("tmplAulaLi");
  Object.keys(groups).forEach(g => {
    const li = tmplAula.content.cloneNode(true);
    const pill = li.querySelector(".aula-pill");
    pill.textContent = g;
    pill.addEventListener("click", () => { aulaAtual = g; renderItensEditor(groups[g]); });
    li.querySelector(".rm-aula").addEventListener("click", () => {
      if (!confirm(`Remover aula ${g} e todos os seus itens?`)) return;
      config.columns = config.columns.filter(c => c.group !== g);
      if (aulaAtual === g) aulaAtual = null;
      saveConfig();
      renderAulasEditor();
      renderTable();
    });
    aulasList.appendChild(li);
  });

  // Seleciona automáticamente a primeira aula se nada selecionado
  if (!aulaAtual){
    const ks = Object.keys(groups);
    aulaAtual = ks.length ? ks[0] : null;
  }
  renderItensEditor(aulaAtual ? groups[aulaAtual] : []);
}

function renderItensEditor(cols){
  aulaLabel.textContent = aulaAtual ? `— ${aulaAtual}` : "";
  itensList.innerHTML = "";
  const tmplItem = document.getElementById("tmplItemLi");
  cols.forEach(col => {
    const li = tmplItem.content.cloneNode(true);
    li.querySelector(".item-label").textContent = col.label;
    li.querySelector(".item-weight").textContent = `(${col.weight})`;
    li.querySelector(".rm-item").addEventListener("click", () => {
      config.columns = config.columns.filter(c => c.id !== col.id);
      // remove notas dessa coluna
      data.students.forEach(st => { if (st.grades) delete st.grades[col.id]; });
      saveConfig(); saveData();
      renderAulasEditor(); renderTable();
    });
    itensList.appendChild(li);
  });
}

// -------------- Diálogo: Aluno --------------
const dlgAluno = document.getElementById("dlgAluno");
document.getElementById("btnAlunoSalvar").addEventListener("click", (e) => {
  e.preventDefault();
  const name = document.getElementById("inpAlunoNome").value.trim();
  if (!name) return;
  data.students.push({ id: rid(), name, grades: {} });
  saveData();
  dlgAluno.close();
  document.getElementById("inpAlunoNome").value = "";
  renderTable();
});
function showAlunoDialog(){ dlgAluno.showModal(); }

// -------------- Exportar / Importar --------------
function exportCSV(){
  const cols = config.columns;
  const headers = ["#", "Aluno", ...cols.map(c => `${c.group}:${c.label} (${c.weight})`), "Média"];
  const rows = [headers];

  data.students.forEach((st, idx) => {
    const line = [idx+1, escapeCSV(st.name || "")];
    for (const c of cols){
      const v = st.grades?.[c.id];
      line.push(typeof v === "number" ? v : "");
    }
    line.push(calcMediaAluno(st).toFixed(2));
    rows.push(line);
  });

  const csv = rows.map(r => r.join(",")).join("\n");
  downloadText(csv, "avaliacoes.csv", "text/csv");
}

function escapeCSV(s){
  if (s.includes(",") || s.includes('"') || s.includes("\n")){
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function exportJSON(){
  const blob = {
    meta: { app: "avaliacoes", version: 1, exportedAt: new Date().toISOString() },
    config, data
  };
  downloadText(JSON.stringify(blob, null, 2), "avaliacoes.json", "application/json");
}

function importJSON(e){
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if (!obj || !obj.config || !obj.data) throw new Error("Arquivo não reconhecido.");
      config = obj.config; data = obj.data;
      saveConfig(); saveData();
      renderTable();
      alert("Importado com sucesso!");
    } catch (err){
      alert("Falha ao importar: " + err.message);
    }
  };
  reader.readAsText(file);
}

// -------------- Util --------------
function downloadText(text, filename, mime){
  const blob = new Blob([text], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

function clearAll(){
  if (!confirm("Limpar todas as configurações e dados?")) return;
  localStorage.removeItem(LS_CONFIG);
  localStorage.removeItem(LS_DATA);
  config = defaultConfig();
  data = { students: [] };
  renderTable();
  alert("Reiniciado.");
}
