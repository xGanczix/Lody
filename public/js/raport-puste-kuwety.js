document.addEventListener("DOMContentLoaded", () => {
  async function fetchPusteKuwety() {
    try {
      const response = await fetch(`${CONFIG.URL}/api/raport-puste-kuwety`);
      const kuwety = await response.json();

      const tableBody = document.getElementById("centrala-puste-kuwety-tbody");
      tableBody.innerHTML = "";

      kuwety.forEach((kuweta) => {
        let miejscowosc;
        if (kuweta.SklMiejscowosc === undefined) {
          miejscowosc = "";
        } else {
          miejscowosc = kuweta.SklMiejscowosc;
        }
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${kuweta.SklNazwa}</td>
            <td>${miejscowosc}</td>
            <td>${kuweta.iloscPustychKuwet}</td>
            <td><button data-sklepId="${kuweta.SklId}" id="odbierz">Odbierz</button></td>
        `;
        tableBody.appendChild(row);
      });
    } catch (err) {
      console.log(err);
    }
  }
  fetchPusteKuwety();
});

document.addEventListener("click", (event) => {
  if (event.target.closest("#odbierz")) {
    const button = event.target.closest("#odbierz");
    selectedSklepId = button.getAttribute("data-sklepId");
    document.querySelector(".confirm-delete").style.display = "flex";
  } else if (event.target.id === "confirm-ok" && selectedSklepId) {
    console.log(selectedSklepId);
    fetch(`${CONFIG.URL}/api/odbierz-puste-kuwety/${selectedSklepId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        if (response.ok) {
          window.location.reload();
        } else {
          alert("Błąd podczas odbioru kuwet!");
        }
      })
      .catch((error) => console.error("Błąd połączenia:", error));
  } else if (event.target.id === "confirm-cancel") {
    document.querySelector(".confirm-delete").style.display = "none";
    selectedSklepId = null;
  }
});
