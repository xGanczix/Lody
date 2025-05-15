document.addEventListener("DOMContentLoaded", () => {
  const selectFilter = document.getElementById("centrala-smaki-filtrowanie");

  selectFilter.addEventListener("change", fetchSmaki);
  async function fetchSmaki() {
    try {
      const selectedStatus =
        document.getElementById("centrala-smaki-filtrowanie").value ||
        "aktywne";
      const response = await fetch(
        `${CONFIG.URL}/api/smaki?status=${selectedStatus}`
      );
      const smaki = await response.json();

      const tableBody = document.getElementById("centrala-smaki-tbody");
      tableBody.innerHTML = "";

      smaki.forEach((smak) => {
        const statusText = smak.SmkStatus === 1 ? "Aktywny" : "Usunięty";
        const actionButtonId = smak.SmkStatus === 1 ? "delete" : "restore";
        const actionIcon =
          smak.SmkStatus === 1 ? "delete-white.png" : "restore-white.png";
        const actionText = smak.SmkStatus === 1 ? "Usuń" : "Przywróć";

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${smak.SmkNazwa}</td>
          <td style="width: 150px">
            <div class="smak-background-color" style="background:${smak.SmkKolor}; padding: 2px">
              <span style="color: ${smak.SmkTekstKolor}">TEXT</span>
            </div>
          </td>
          <td>${statusText}</td>
          <td>
            <button id="edit" class="smaki-edycja-btn" data-smak="${smak.SmkId}">
              <img src="../img/white/edit-white.png">
            </button>
            <button id="${actionButtonId}" data-smak="${smak.SmkId}">
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

  fetchSmaki();

  document.addEventListener("click", (event) => {
    const editBtn = event.target.closest(".smaki-edycja-btn");
    if (editBtn) {
      const smakId = editBtn.dataset.smak;
      window.location.href = `smaki-edycja.html?smak=${encodeURIComponent(
        smakId
      )}`;
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  let selectedSmakId = null;

  document.addEventListener("click", (event) => {
    if (event.target.closest("#delete")) {
      const button = event.target.closest("#delete");
      selectedSmakId = button.getAttribute("data-smak");

      document.querySelector(".confirm-delete").style.display = "flex";
    } else if (event.target.id === "confirm-ok" && selectedSmakId) {
      fetch(`/api/smaki-usuwanie/${selectedSmakId}`, {
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
      selectedSmakId = null;
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  let selectedSmakId = null;

  document.addEventListener("click", (event) => {
    if (event.target.closest("#restore")) {
      const button = event.target.closest("#restore");
      selectedSmakId = button.getAttribute("data-smak");

      document.querySelector(".confirm-restore").style.display = "flex";
    } else if (event.target.id === "confirm-ok" && selectedSmakId) {
      fetch(`/api/smaki-przywracanie/${selectedSmakId}`, {
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
      selectedSmakId = null;
    }
  });
});

const headers = document.querySelectorAll("#centrala-smaki thead th");
const tbody = document.querySelector("#centrala-smaki-tbody");

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
