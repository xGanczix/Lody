let sklepSelect = document.getElementById("centrala-raport-sklep");

document.addEventListener("DOMContentLoaded", function () {
  function loadSklepy() {
    const token = localStorage.getItem("token");
    const decoded = parseJwt(token);
    const uzytkownikId = decoded.id;
    fetch(`${CONFIG.URL}/api/sklepy-raportowanie/${uzytkownikId}`)
      .then((response) => response.json())
      .then((data) => {
        sklepSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "-- Wybierz sklep --";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        sklepSelect.appendChild(defaultOption);

        data.forEach((sklep) => {
          const option = document.createElement("option");
          option.value = sklep.SklId;
          option.textContent = sklep.SklNazwa;
          sklepSelect.appendChild(option);
        });
      })
      .catch((error) => console.error("Błąd pobierania sklepów:", error));
  }

  loadSklepy();
});

async function fetchStatusKuwet(sklepId) {
  try {
    const response = await fetch(`${CONFIG.URL}/api/status-kuwet/${sklepId}`);
    const kuwetySklep = await response.json();

    const tableBody = document.getElementById("status-kuwet-tbody");
    tableBody.innerHTML = "";

    kuwetySklep.forEach((kuweta) => {
      const row = document.createElement("tr");
      row.innerHTML = `
      <td>${kuweta.KuwId}</td>
      <td style="background: ${kuweta.SmkKolor}; color: ${kuweta.SmkTekstKolor}">${kuweta.KuwSmakNazwa}</td>
      <td>${kuweta.KuwPorcje} / ${kuweta.KuwRozmiarIlosc}</td>
      <td>${kuweta.KuwProcent}%</td>
      `;

      tableBody.appendChild(row);
    });
  } catch (err) {
    console.log(err);
  }
}

sklepSelect.addEventListener("change", function () {
  const sklepId = sklepSelect.value;
  alert(sklepId);
  fetchStatusKuwet(sklepId);
});

const headers = document.querySelectorAll("#centrala-status-kuwety thead th");
const tbody = document.querySelector("#status-kuwet-tbody");

function sortTable(column, direction) {
  // Reset strzałek
  headers.forEach((h, idx) => {
    h.setAttribute("data-order", "desc");
    h.textContent = h.textContent.replace(/[\u25B2\u25BC]/g, "");
    if (idx === column) {
      h.setAttribute("data-order", direction);
      h.textContent += direction === "asc" ? " ▲" : " ▼";
    }
  });

  const rows = Array.from(tbody.querySelectorAll("tr"));

  rows.sort((a, b) => {
    const aText = a.children[column].textContent.trim();
    const bText = b.children[column].textContent.trim();

    const aNum = parseFloat(aText.replace("%", "").replace(",", "."));
    const bNum = parseFloat(bText.replace("%", "").replace(",", "."));
    const isNumeric = !isNaN(aNum) && !isNaN(bNum);

    if (isNumeric) {
      return direction === "asc" ? aNum - bNum : bNum - aNum;
    } else {
      return direction === "asc"
        ? aText.localeCompare(bText)
        : bText.localeCompare(aText);
    }
  });

  tbody.innerHTML = "";
  rows.forEach((row) => tbody.appendChild(row));
}

// Klikanie nagłówków
headers.forEach((header, index) => {
  header.addEventListener("click", () => {
    const currentOrder = header.getAttribute("data-order");
    const newOrder = currentOrder === "asc" ? "desc" : "asc";
    sortTable(index, newOrder);
  });
});

// 👉 Domyślne sortowanie po załadowaniu danych
function applyDefaultSortAfterFetch() {
  sortTable(0, "asc"); // sortuj po kolumnie 0 rosnąco
}
