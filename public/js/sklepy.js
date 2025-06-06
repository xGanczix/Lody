document.addEventListener("DOMContentLoaded", () => {
  const selectFilter = document.getElementById("centrala-sklepy-filtrowanie");

  selectFilter.addEventListener("change", fetchSklep);
  async function fetchSklep() {
    try {
      const selectedStatus =
        document.getElementById("centrala-sklepy-filtrowanie").value ||
        "aktywne";

      const token = localStorage.getItem("token");
      const decoded = parseJwt(token);
      const uzytkownikId = decoded.id;

      const response = await fetch(
        `${CONFIG.URL}/api/sklepy?status=${selectedStatus}&uzytkownik=${uzytkownikId}`
      );
      const sklepy = await response.json();

      const tableBody = document.getElementById("centrala-sklepy-tbody");
      tableBody.innerHTML = "";

      sklepy.forEach((sklep) => {
        const statusText = sklep.SklStatus === 1 ? "Aktywny" : "Usunięty";
        const actionButtonId = sklep.SklStatus === 1 ? "delete" : "restore";
        const actionIcon =
          sklep.SklStatus === 1 ? "delete-white.png" : "restore-white.png";
        const actionText = sklep.SklStatus === 1 ? "Usuń" : "Przywróć";

        const row = document.createElement("tr");
        row.innerHTML = `
              <td>${sklep.SklId}</td>
              <td>${sklep.SklNazwa}</td>
              <td>${sklep.SklUlica}</td>
              <td>${sklep.SklNumer}</td>
              <td>${sklep.SklKod}</td>
              <td>${sklep.SklMiejscowosc}</td>
              <td>${sklep.SklPojemnosc}</td>
              <td>${statusText}</td>
              <td>
                <button id="edit" class="sklepy-edycja-btn" data-sklep="${sklep.SklId}">
                  <img src="../img/white/edit-white.png">
                </button>
                <button id="${actionButtonId}" data-sklep="${sklep.SklId}">
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

  fetchSklep();

  document.addEventListener("click", (event) => {
    const editBtn = event.target.closest(".sklepy-edycja-btn");
    if (editBtn) {
      const sklepId = editBtn.dataset.sklep;
      window.location.href = `sklepy-edycja.html?sklep=${encodeURIComponent(
        sklepId
      )}`;
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  let selectedSklepId = null;

  document.addEventListener("click", (event) => {
    if (event.target.closest("#delete")) {
      const button = event.target.closest("#delete");
      selectedSklepId = button.getAttribute("data-sklep");

      document.querySelector(".confirm-delete").style.display = "flex";
    } else if (event.target.id === "confirm-ok" && selectedSklepId) {
      fetch(`/api/sklepy-usuwanie/${selectedSklepId}`, {
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
      selectedSklepId = null;
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  let selectedSklepId = null;

  document.addEventListener("click", (event) => {
    if (event.target.closest("#restore")) {
      const button = event.target.closest("#restore");
      selectedSklepId = button.getAttribute("data-sklep");

      document.querySelector(".confirm-restore").style.display = "flex";
    } else if (event.target.id === "confirm-ok" && selectedSklepId) {
      fetch(`/api/sklepy-przywracanie/${selectedSklepId}`, {
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
      selectedSklepId = null;
    }
  });
});

const headers = document.querySelectorAll("#centrala-sklepy thead th");
const tbody = document.querySelector("#centrala-sklepy-tbody");

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
