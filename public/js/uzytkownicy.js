document.addEventListener("DOMContentLoaded", () => {
  const selectFilter = document.getElementById(
    "centrala-uzytkownicy-filtrowanie"
  );

  selectFilter.addEventListener("change", fetchUzytkownicy);
  async function fetchUzytkownicy() {
    try {
      const selectedStatus =
        document.getElementById("centrala-uzytkownicy-filtrowanie").value ||
        "aktywne";
      const response = await fetch(
        `${CONFIG.URL}/api/uzytkownicy?status=${selectedStatus}`
      );
      const uzytkownicy = await response.json();

      const tableBody = document.getElementById("centrala-uzytkownicy-tbody");
      tableBody.innerHTML = "";

      uzytkownicy.forEach((uzytkownik) => {
        const statusText = uzytkownik.UzStatus === 1 ? "Aktywny" : "Usunięty";
        const actionButtonId = uzytkownik.UzStatus === 1 ? "delete" : "restore";
        const actionIcon =
          uzytkownik.UzStatus === 1 ? "delete-white.png" : "restore-white.png";
        const actionText = uzytkownik.UzStatus === 1 ? "Usuń" : "Przywróć";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${uzytkownik.UzId}</td>
            <td>${uzytkownik.UzImie}</td>
            <td>${uzytkownik.UzNazwisko}</td>
            <td>${uzytkownik.UzLogin}</td>
            <td>${uzytkownik.UzStawkaGodzinowa}</td>
            <td>${statusText}</td>
            <td>
              <button id="edit" class="uzytkownicy-edycja-btn" data-uzytkownik="${uzytkownik.UzId}">
                <img src="../img/white/edit-white.png">
              </button>
              <button id="${actionButtonId}" data-uzytkownik="${uzytkownik.UzId}">
                <img src="../img/white/${actionIcon}" alt="${actionText}">
              </button>
            </td>
          `;

        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Błąd pobierania użytkowników:", error);
    }
  }

  fetchUzytkownicy();

  document.addEventListener("click", (event) => {
    const editBtn = event.target.closest(".uzytkownicy-edycja-btn");
    if (editBtn) {
      const uzytkownikId = editBtn.dataset.uzytkownik;
      window.location.href = `uzytkownicy-edycja.html?uzytkownik=${encodeURIComponent(
        uzytkownikId
      )}`;
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  let selectedUzytkownikId = null;

  document.addEventListener("click", (event) => {
    if (event.target.closest("#delete")) {
      const button = event.target.closest("#delete");
      selectedUzytkownikId = button.getAttribute("data-uzytkownik");
      document.querySelector(".confirm-delete").style.display = "flex";
    } else if (event.target.id === "confirm-ok" && selectedUzytkownikId) {
      fetch(`/api/uzytkownicy-usuwanie/${selectedUzytkownikId}`, {
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
      selectedUzytkownikId = null;
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  let selectedUzytkownikId = null;

  document.addEventListener("click", (event) => {
    if (event.target.closest("#restore")) {
      const button = event.target.closest("#restore");
      selectedUzytkownikId = button.getAttribute("data-uzytkownik");

      document.querySelector(".confirm-restore").style.display = "flex";
    } else if (event.target.id === "confirm-ok" && selectedUzytkownikId) {
      fetch(`/api/uzytkownicy-przywracanie/${selectedUzytkownikId}`, {
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
      selectedUzytkownikId = null;
    }
  });
});

const headers = document.querySelectorAll("#centrala-uzytkownicy thead th");
const tbody = document.querySelector("#centrala-uzytkownicy-tbody");

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
