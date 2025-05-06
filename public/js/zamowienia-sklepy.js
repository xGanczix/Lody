document.addEventListener("DOMContentLoaded", () => {
  const selectFilter = document.getElementById(
    "centrala-zamowienia-filtrowanie"
  );

  selectFilter.addEventListener("change", fetchZamowieniaSklepy);
  const token = localStorage.getItem("token");

  const decoded = parseJwt(token);
  const uzytkownik = decoded.id;
  async function fetchZamowieniaSklepy() {
    try {
      const selectedStatus =
        document.getElementById("centrala-zamowienia-filtrowanie").value ||
        "niezrealizowane";
      const response = await fetch(
        `${CONFIG.URL}/api/zamowienia-sklepy/${uzytkownik}/${selectedStatus}`
      );

      const zamowieniaSklepy = await response.json();

      const tableBody = document.getElementById(
        "centrala-zamowienia-sklepy-tbody"
      );
      tableBody.innerHTML = "";

      zamowieniaSklepy.forEach((zamowienie) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${zamowienie.ZamNr}</td>
            <td>${zamowienie.SklNazwa}</td>
            <td>${zamowienie.Data}</td>
            <td><button data-zamowienieId="${zamowienie.ZamId}">Szczegóły</button></td>
        `;

        tableBody.appendChild(row);
      });
    } catch (err) {
      console.log(err);
    }
  }

  fetchZamowieniaSklepy();
});

const headers = document.querySelectorAll("#centrala-zamowienia thead th");
const tbody = document.querySelector("#centrala-zamowienia-sklepy-tbody");

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
