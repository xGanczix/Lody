document.addEventListener("DOMContentLoaded", () => {
  const selectFilter = document.getElementById("centrala-kuwety-filtrowanie");

  selectFilter.addEventListener("change", fetchKuwety);

  async function fetchKuwety() {
    try {
      const selectedStatus =
        document.getElementById("centrala-kuwety-filtrowanie").value ||
        "aktywne";
      const response = await fetch(
        `${CONFIG.URL}/api/kuwety?status=${selectedStatus}`
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
                  <button id="edit" data-kuweta="${kuweta.KuwId}">
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
