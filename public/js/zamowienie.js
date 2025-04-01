document.addEventListener("DOMContentLoaded", () => {
  async function fetchDostepneKuwety() {
    try {
      const response = await fetch(
        `${CONFIG.URL}/api/kuwety-dostepne-centrala`
      );
      const tableBody = document.getElementById("dostepne-kuwety-tbody");

      const dostepneKuwety = await response.json();

      dostepneKuwety.forEach((kuweta) => {
        const row = document.createElement("tr");
        row.innerHTML = `
              <td style="background: ${kuweta.SmkKolor}">${kuweta.KuwSmakNazwa}</td>
              <td style="background: ${kuweta.SmkKolor}">${kuweta.KuwPorcje}</td>
              <td>
                <button class="zamowienie-kuwety-btn" data-kuweta-id="${kuweta.KuwId}">
                  <img src="../img/white/add-product-white.png">
                </button>
              </td>
            `;

        tableBody.appendChild(row);
      });
    } catch (err) {
      console.error("Błąd pobierania kuwet:", err);
    }
  }

  async function fetchDostepneSmaki() {
    try {
      const response = await fetch(`${CONFIG.URL}/api/smaki-dostepne-centrala`);
      const tableBody = document.getElementById("dostepne-smaki-tbody");

      const dostepneSmaki = await response.json();

      dostepneSmaki.forEach((smak) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                <td style="background: ${smak.SmkKolor}; color: ${smak.SmkTekstKolor}">${smak.SmkNazwa}</td>
                <td>
                  <button class="zamowienie-smaki-btn" data-smak-id="${smak.SmkId}">
                    <img src="../img/white/add-product-white.png">
                  </button>
                </td>
            `;

        tableBody.appendChild(row);
      });
    } catch (err) {
      console.error("Błąd pobierania smaków:", err);
    }
  }

  fetchDostepneKuwety();
  fetchDostepneSmaki();

  // Przenoszenie kuwet (usuwanie z listy dostępnych)
  document
    .getElementById("dostepne-kuwety-tbody")
    .addEventListener("click", (event) => {
      const button = event.target.closest(".zamowienie-kuwety-btn");
      if (button) {
        const row = button.closest("tr");
        button.remove(); // Usunięcie przycisku
        document.getElementById("zamowienie-tbody").appendChild(row);
      }
    });

  // Kopiowanie smaków (bez usuwania z listy dostępnych)
  document
    .getElementById("dostepne-smaki-tbody")
    .addEventListener("click", (event) => {
      const button = event.target.closest(".zamowienie-smaki-btn");
      if (button) {
        const row = button.closest("tr").cloneNode(true); // Klonowanie wiersza
        document.getElementById("zamowienie-tbody").appendChild(row);
      }
    });
});
