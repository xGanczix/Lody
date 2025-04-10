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
            <td><input type="number" step="0.01" value="${cena.CCena}"></td>
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

  document.addEventListener("click", (event) => {
    const editBtn = event.target.closest(".ceny-edycja-btn");
    if (editBtn) {
      const towarId = editBtn.dataset.towar;
      console.log(towarId);
    }
  });
});
