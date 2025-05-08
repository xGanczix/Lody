document.addEventListener("DOMContentLoaded", () => {
  async function fetchZamowienieSzczegoly() {
    const urlParams = new URLSearchParams(window.location.search);
    const zamowienieId = urlParams.get("zamowienieId");
    try {
      const response = await fetch(
        `${CONFIG.URL}/api/zamowienia-szczegoly/${zamowienieId}`
      );
      const data = await response.json();

      const tableBody = document.getElementById("zamowienie-szczegoly-tbody");
      tableBody.innerHTML = "";

      data.forEach((zamowienie) => {
        let opis = zamowienie.ZamPozIsSmak === 1 ? "" : zamowienie.ZamPozOpis;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${zamowienie.ZamPozTowar}</td>
            <td>${opis}</td>
            <td><input type="checkbox"></td>
        `;

        tableBody.appendChild(row);
      });
    } catch (err) {
      console.log("Błąd pobierania danych zamówienia: ", err);
    }
  }

  fetchZamowienieSzczegoly();
});

const realizujBtn = document.getElementById("zrealizowane");
realizujBtn.addEventListener("click", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const zamowienieId = urlParams.get("zamowienieId");

  fetch(`${CONFIG.URL}/api/zamowienie-zrealizuj/${zamowienieId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ zamowienieId }),
  })
    .then((response) => {
      if (response.ok) {
        window.opener.location.reload();
        window.close();
      } else {
        alert("Błąd realizacji zamówienia");
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
