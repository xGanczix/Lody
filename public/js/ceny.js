document.addEventListener("DOMContentLoaded", () => {
  async function fetchCeny() {
    try {
      const response = await fetch(`${CONFIG.URL}/api/ceny`);
      const ceny = await response.json();

      const tableBody = document.getElementById("centrala-ceny-tbody");
      tableBody.innerHTML = "";

      ceny.forEach((cena) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${cena.CId}</td>
            <td>${cena.TowNazwa}</td>
            <td><input type="number" step="0.01" class="cena-towaru" value="${cena.CCena}"></td>
            <td><input type="number" step="0.01" value="${cena.CPoprzedniaCena}" disabled></td>
            <td>${cena.CDataZmiany}</td>
            <td><button class="ceny-edycja-btn" data-towar="${cena.TowId}">Zapisz</button></td>
            `;

        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Błąd pobierania smaków:", error);
    }
  }

  fetchCeny();

  document.addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("ceny-edycja-btn")) {
      const button = e.target;
      const towarId = button.dataset.towar;

      const row = button.closest("tr");
      const cena = row.querySelector(".cena-towaru").value;

      fetch(`${CONFIG.URL}/api/ceny-edycja/${towarId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cena }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Sukces:", data);
          fetchCeny();
        })
        .catch((error) => {
          console.error("Błąd:", error);
        });
    }
  });
});

const headers = document.querySelectorAll("#centrala-ceny thead th");
const tbody = document.querySelector("#centrala-ceny-tbody");

function sortTable(column, direction) {
  headers.forEach((h, idx) => {
    h.setAttribute("data-order", "desc");
    h.textContent = h.textContent.replace(/[\u25B2\u25BC]/g, "");

    if (idx !== headers.length - 1) {
      if (idx === column) {
        h.setAttribute("data-order", direction);
        h.textContent += direction === "asc" ? " ▲" : " ▼";
      }
    }
  });

  const rows = Array.from(tbody.querySelectorAll("tr"));

  rows.sort((a, b) => {
    const aCell = a.children[column];
    const bCell = b.children[column];

    let aText = aCell.textContent.trim();
    let bText = bCell.textContent.trim();

    // Jeśli komórka zawiera input, użyj wartości inputu
    if (aCell.querySelector("input")) {
      aText = aCell.querySelector("input").value;
    }
    if (bCell.querySelector("input")) {
      bText = bCell.querySelector("input").value;
    }

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

headers.forEach((header, index) => {
  header.addEventListener("click", () => {
    const currentOrder = header.getAttribute("data-order");
    const newOrder = currentOrder === "asc" ? "desc" : "asc";
    sortTable(index, newOrder);
  });
});

function applyDefaultSortAfterFetch() {
  sortTable(0, "asc");
}
