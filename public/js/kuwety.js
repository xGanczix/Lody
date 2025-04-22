document.addEventListener("DOMContentLoaded", () => {
  const selectFilter = document.getElementById("centrala-kuwety-filtrowanie");
  const przypisanieFilter = document.getElementById(
    "centrala-kuwety-filtrowanie1"
  );

  selectFilter.addEventListener("change", fetchKuwety);
  przypisanieFilter.addEventListener("change", fetchKuwety);

  async function fetchKuwety() {
    try {
      const selectedStatus =
        document.getElementById("centrala-kuwety-filtrowanie").value ||
        "aktywne";
      const selectedPrzypisanie =
        document.getElementById("centrala-kuwety-filtrowanie1").value ||
        "nieprzypisane";
      const response = await fetch(
        `${CONFIG.URL}/api/kuwety?status=${selectedStatus}&przypisanie=${selectedPrzypisanie}`
      );
      const kuwety = await response.json();

      const tableBody = document.getElementById("centrala-kuwety-tbody");
      tableBody.innerHTML = "";

      kuwety.forEach((kuweta) => {
        const statusText = kuweta.KuwStatus === 1 ? "Aktywny" : "Usunięty";
        const actionButtonId = kuweta.KuwStatus === 1 ? "delete" : "restore";
        const actionIcon =
          kuweta.KuwStatus === 1 ? "delete-white.png" : "restore-white.png";
        const actionText = kuweta.KuwStatus === 1 ? "Usuń" : "Przywróć";

        const row = document.createElement("tr");
        row.innerHTML = `
                <td>${kuweta.KuwId}</td>
                <td>${kuweta.KuwSmakNazwa}</td>
                <td>${kuweta.KuwRozmiarIlosc}</td>
                <td>${kuweta.KuwPorcje}</td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${
                          kuweta.KuwProcent
                        }%" id="progress-${kuweta.KuwId}"></div>
                        <div class="progress-text">${kuweta.KuwProcent}%</div>
                    </div>
                </td>
                <td>${
                  kuweta.KuwSklNazwa !== null
                    ? kuweta.KuwSklNazwa
                    : kuweta.KuwStatusZamowienia === 3
                    ? "⚠️ BUFOR ⚠️"
                    : ""
                }</td>
                <td>${statusText}</td>
                <td>
                  <button id="edit" class="kuwety-edycja-btn" data-kuweta="${
                    kuweta.KuwId
                  }">
                    <img src="../img/white/edit-white.png">
                  </button>
                  <button id="${actionButtonId}" data-rozmiar="${kuweta.KuwId}">
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

  fetchKuwety();

  document.addEventListener("click", (event) => {
    const editBtn = event.target.closest(".kuwety-edycja-btn");
    if (editBtn) {
      const kuwetaId = editBtn.dataset.kuweta;
      window.location.href = `kuwety-edycja.html?kuweta=${encodeURIComponent(
        kuwetaId
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
      fetch(`/api/kuwety-usuwanie/${selectedRozmiarId}`, {
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

const headers = document.querySelectorAll("#centrala-kuwety thead th");
const tbody = document.querySelector("#centrala-kuwety-tbody");

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
