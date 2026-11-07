const sections = [...document.querySelectorAll("[data-section]")];
const navLinks = [...document.querySelectorAll(".nav-link")];

function showPage(name) {
  sections.forEach((section) => {
    const active = section.dataset.section === name;
    section.hidden = !active;
    section.classList.toggle("is-visible", active);
  });
  navLinks.forEach((link) => {
    const active = link.dataset.page === name;
    link.classList.toggle("is-active", active);
    link.setAttribute("aria-current", active ? "page" : "false");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navLinks.forEach((link) => link.addEventListener("click", () => showPage(link.dataset.page)));
document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.go));
});

const sheetTabs = document.querySelector("#sheet-tabs");
const tableScroll = document.querySelector("#table-scroll");
const sheetCaption = document.querySelector("#sheet-caption");
const searchInput = document.querySelector("#sheet-search");
let workbook;
let activeSheet = 0;

function columnName(index) {
  let name = "";
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    name = String.fromCharCode(65 + ((value - 1) % 26)) + name;
  }
  return name;
}

function renderSheet(index) {
  activeSheet = index;
  const sheet = workbook.sheets[index];
  [...sheetTabs.children].forEach((tab, tabIndex) => {
    tab.setAttribute("aria-selected", String(tabIndex === index));
    tab.tabIndex = tabIndex === index ? 0 : -1;
  });
  sheetCaption.textContent = `${sheet.rows.length} filas · ${sheet.maxCol} columnas · ${sheet.name}`;
  renderTable(searchInput.value);
}

function renderTable(query = "") {
  const sheet = workbook.sheets[activeSheet];
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const table = document.createElement("table");
  table.className = "workbook-table";
  const body = document.createElement("tbody");

  sheet.rows.forEach((row) => {
    if (normalizedQuery && !row.cells.some((value) => value.toLocaleLowerCase("es").includes(normalizedQuery))) return;
    const tr = document.createElement("tr");
    const rowHeading = document.createElement("th");
    rowHeading.scope = "row";
    rowHeading.textContent = String(row.number);
    tr.append(rowHeading);

    for (let col = 0; col < sheet.maxCol; col += 1) {
      const cell = document.createElement("td");
      cell.textContent = row.cells[col] ?? "";
      if (cell.textContent) cell.dataset.column = columnName(col);
      tr.append(cell);
    }
    body.append(tr);
  });

  if (!body.children.length) {
    const empty = document.createElement("div");
    empty.className = "table-empty";
    empty.textContent = "No hay coincidencias en esta hoja.";
    tableScroll.replaceChildren(empty);
    return;
  }
  table.append(body);
  tableScroll.replaceChildren(table);
}

async function loadWorkbook() {
  try {
    const response = await fetch("./data/workbook.json");
    if (!response.ok) throw new Error(`No se pudo cargar el libro (${response.status}).`);
    workbook = await response.json();
    workbook.sheets.forEach((sheet, index) => {
      const button = document.createElement("button");
      button.className = "sheet-tab";
      button.type = "button";
      button.role = "tab";
      button.textContent = sheet.name;
      button.setAttribute("aria-selected", "false");
      button.addEventListener("click", () => {
        searchInput.value = "";
        renderSheet(index);
      });
      button.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          const direction = event.key === "ArrowRight" ? 1 : -1;
          const next = (index + direction + workbook.sheets.length) % workbook.sheets.length;
          sheetTabs.children[next].focus();
          sheetTabs.children[next].click();
        }
      });
      sheetTabs.append(button);
    });
    renderSheet(0);
  } catch (error) {
    sheetCaption.textContent = error.message;
    tableScroll.innerHTML = '<p class="table-empty">No fue posible mostrar las hojas del libro.</p>';
  }
}

searchInput.addEventListener("input", () => renderTable(searchInput.value));
loadWorkbook();
