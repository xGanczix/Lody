document.addEventListener("DOMContentLoaded", () => {
  const selectFilter = document.getElementById("centrala-rozmiary-filtrowanie");

  selectFilter.addEventListener("change", fetchRozmiar);
  async function fetchRozmiar() {
    try {
      const selectedStatus =
        document.getElementById("centrala-rozmiary-filtrowanie").value ||
        "aktywne";
      const response = await fetch(
        `${CONFIG.URL}/api/rozmiary?status=${selectedStatus}`
      );
      const rozmiary = await response.json();

      const tableBody = document.getElementById("centrala-rozmiary-tbody");
      tableBody.innerHTML = "";

      rozmiary.forEach((rozmiar) => {
        const statusText = rozmiar.RozStatus === 1 ? "Aktywny" : "Usunięty";
        const actionButtonId = rozmiar.RozStatus === 1 ? "delete" : "restore";
        const actionIcon =
          rozmiar.RozStatus === 1 ? "delete-white.png" : "restore-white.png";
        const actionText = rozmiar.RozStatus === 1 ? "Usuń" : "Przywróć";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${rozmiar.RozId}</td>
            <td>${rozmiar.RozNazwa}</td>
            <td>${rozmiar.RozPojemnosc}</td>
            <td>${statusText}</td>
            <td>
              <button id="edit" class="rozmiary-edycja-btn" data-rozmiar="${rozmiar.RozId}">
                <img src="../img/white/edit-white.png">
              </button>
              <button id="${actionButtonId}" data-rozmiar="${rozmiar.RozId}">
                <img src="../img/white/${actionIcon}" alt="${actionText}">
              </button>
            </td>
          `;

        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Błąd pobierania smaków:", error);
    }
  }

  fetchRozmiar();

  document.addEventListener("click", (event) => {
    const editBtn = event.target.closest(".rozmiary-edycja-btn");
    if (editBtn) {
      const rozmiarId = editBtn.dataset.rozmiar;
      window.location.href = `rozmiary-edycja.html?rozmiar=${encodeURIComponent(
        rozmiarId
      )}`;
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  let selectedRozmiarId = null;

  document.addEventListener("click", (event) => {
    if (event.target.closest("#delete")) {
      const button = event.target.closest("#delete");
      selectedRozmiarId = button.getAttribute("data-rozmiar");

      document.querySelector(".confirm-delete").style.display = "flex";
    } else if (event.target.id === "confirm-ok" && selectedRozmiarId) {
      fetch(`/api/rozmiary-usuwanie/${selectedRozmiarId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => {
          if (response.ok) {
            window.location.reload();
          } else {
            alert("Błąd podczas zmiany statusu!");
          }
        })
        .catch((error) => console.error("Błąd połączenia:", error));
    } else if (event.target.id === "confirm-cancel") {
      document.querySelector(".confirm-delete").style.display = "none";
      selectedRozmiarId = null;
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  let selectedRozmiarId = null;

  document.addEventListener("click", (event) => {
    if (event.target.closest("#restore")) {
      const button = event.target.closest("#restore");
      selectedRozmiarId = button.getAttribute("data-rozmiar");

      document.querySelector(".confirm-restore").style.display = "flex";
    } else if (event.target.id === "confirm-ok" && selectedRozmiarId) {
      fetch(`/api/rozmiary-przywracanie/${selectedRozmiarId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => {
          if (response.ok) {
            window.location.reload();
          } else {
            alert("Błąd podczas zmiany statusu!");
          }
        })
        .catch((error) => console.error("Błąd połączenia:", error));
    } else if (event.target.id === "confirm-cancel") {
      document.querySelector(".confirm-restore").style.display = "none";
      selectedRozmiarId = null;
    }
  });
});

const headers = document.querySelectorAll("#centrala-rozmiary thead th");
const tbody = document.querySelector("#centrala-rozmiary-tbody");

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
