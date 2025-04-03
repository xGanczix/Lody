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
              <td style="background: ${kuweta.SmkKolor}; color: ${kuweta.SmkTekstKolor}">${kuweta.KuwSmakNazwa}</td>
              <td style="background: ${kuweta.SmkKolor}; color: ${kuweta.SmkTekstKolor}">${kuweta.KuwPorcje}</td>
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

  document
    .getElementById("dostepne-kuwety-tbody")
    .addEventListener("click", (event) => {
      const button = event.target.closest(".zamowienie-kuwety-btn");
      if (button) {
        const row = button.closest("tr");
        row.setAttribute(
          "data-kuweta-id",
          button.getAttribute("data-kuweta-id")
        );
        button.remove();
        document.getElementById("zamowienie-tbody").appendChild(row);

        const kuwetaId = row.getAttribute("data-kuweta-id");

        fetch(`${CONFIG.URL}/api/status-zamowienia-kuwety`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ kuwetaId: kuwetaId }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Odpowiedź z serwera:", data);
          })
          .catch((error) => {
            console.error("Błąd przy wysyłaniu:", error);
          });
      }
    });

  document
    .getElementById("dostepne-smaki-tbody")
    .addEventListener("click", (event) => {
      const button = event.target.closest(".zamowienie-smaki-btn");
      if (button) {
        const row = document.createElement("tr");
        const originalRow = button.closest("tr");
        const firstTd = originalRow.querySelector("td");
        const firstTdClone = firstTd.cloneNode(true);
        row.appendChild(firstTdClone);

        const newCell1 = document.createElement("td");
        newCell1.textContent = "";
        newCell1.style.backgroundColor = firstTd.style.backgroundColor;
        newCell1.style.color = firstTd.style.color;
        row.appendChild(newCell1);

        const newCell2 = document.createElement("td");
        newCell2.textContent = "";
        row.appendChild(newCell2);

        row.setAttribute("data-smak-id", button.getAttribute("data-smak-id"));
        document.getElementById("zamowienie-tbody").appendChild(row);
      }
    });

  document
    .getElementById("zamowienie-zapisz-btn")
    .addEventListener("click", async () => {
      const zamowienieRows = document.getElementById("zamowienie-tbody").rows;
      const zamowienieData = [];
      const updateKuwetyPromises = [];

      for (let row of zamowienieRows) {
        const kuwetaId = row.getAttribute("data-kuweta-id");
        const smakId = row.getAttribute("data-smak-id");

        const token = localStorage.getItem("token");
        const decoded = parseJwt(token);
        const sklepId = decoded.sklepId;
        console.log(sklepId);

        if (kuwetaId) {
          zamowienieData.push({ kuwetaId, sklepId });

          const updateKuwetaPromise = fetch(
            `${CONFIG.URL}/api/aktualizuj-kuwete-status`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                kuwetaId: kuwetaId,
                KuwStatusZamowienia: 2,
                KuwSklId: sklepId,
              }),
            }
          );
          updateKuwetyPromises.push(updateKuwetaPromise);
        }

        if (smakId) {
          zamowienieData.push({ smakId, sklepId });
        }
      }

      if (zamowienieData.length === 0) {
        alert("Brak wybranych kuwet i smaków do zamówienia.");
        return;
      }

      try {
        await Promise.all(updateKuwetyPromises);

        const response = await fetch(`${CONFIG.URL}/api/zamowienie`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(zamowienieData),
        });

        const data = await response.json();

        if (response.ok) {
          alert("Zamówienie zapisane!");

          document.getElementById("zamowienie-tbody").innerHTML = "";
        } else {
          alert("Błąd zapisywania zamówienia: " + data.message);
        }
      } catch (error) {
        console.error("Błąd przy wysyłaniu zamówienia:", error);
      }
    });
});
