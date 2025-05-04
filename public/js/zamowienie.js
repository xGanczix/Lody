async function fetchZamowienieDostepneSmaki() {
  try {
    const response = await fetch(`${CONFIG.URL}/api/dostepne-smaki-ilosc`);
    const smaki = await response.json();

    const tableBodySmaki = document.getElementById(
      "zamowienie-dostepne-smaki-tbody"
    );
    const zamowioneBody = document.getElementById(
      "zamowienie-pozycje-zamowione-tbody"
    );

    tableBodySmaki.innerHTML = "";

    smaki.forEach((smak) => {
      const row = document.createElement("tr");
      row.setAttribute("data-smak", "1");
      row.innerHTML = `
        <td style="background: ${smak.SmkKolor}; color: ${smak.SmkTekstKolor}">${smak.Nazwa}</td>
        <td style="background: ${smak.SmkKolor}; color: ${smak.SmkTekstKolor}">${smak.Dostepne_w_Centrali}</td>
        <td style="background: ${smak.SmkKolor}; color: ${smak.SmkTekstKolor}">
          <button data-smakid="${smak.SmkId}" class="zamowienie-smak-btn">
            <img src="../img/white/add-product-white.png">Zamów
          </button>
        </td>
      `;

      const button = row.querySelector(".zamowienie-smak-btn");

      button.addEventListener("click", () => {
        const inZamowione = zamowioneBody.contains(row);

        if (inZamowione) {
          button.innerHTML = `<img src="../img/white/add-product-white.png">Zamów`;
          button.classList.remove("zamowienie-pozycja-anuluj");

          const rows = Array.from(tableBodySmaki.querySelectorAll("tr"));
          rows.push(row);

          rows.sort((a, b) => {
            const nameA = a.children[0].textContent.trim().toLowerCase();
            const nameB = b.children[0].textContent.trim().toLowerCase();
            return nameA.localeCompare(nameB);
          });

          tableBodySmaki.innerHTML = "";
          rows.forEach((r) => tableBodySmaki.appendChild(r));
        } else {
          zamowioneBody.appendChild(row);
          button.innerHTML = `<img src="../img/white/delete-white.png">Usuń`;
          button.classList.add("zamowienie-pozycja-anuluj");
        }
      });

      tableBodySmaki.appendChild(row);
    });
  } catch (err) {
    console.log(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const towaryTbody = document.getElementById(
    "zamowienie-pozostale-towary-tbody"
  );
  const zamowioneTbody = document.getElementById(
    "zamowienie-pozycje-zamowione-tbody"
  );

  const buttons = towaryTbody.querySelectorAll(".zamowienie-towar-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");
      const textarea = row.querySelector("textarea");

      const isInZamowione = zamowioneTbody.contains(row);

      if (isInZamowione) {
        if (textarea) {
          textarea.value = "";
        }

        zamowioneTbody.removeChild(row);

        button.classList.remove("zamowienie-pozycja-anuluj");
        button.classList.add("zamowienie-towar-btn");
        button.innerHTML = `<img src="../img/white/add-product-white.png">Zamów`;
      } else {
        if (textarea && textarea.value.trim() === "") {
          alert("Uzupełnij opis przed dodaniem tego towaru.");
          return;
        }

        const rowClone = row.cloneNode(true);
        zamowioneTbody.appendChild(rowClone);

        const newButton = rowClone.querySelector(".zamowienie-towar-btn");
        newButton.classList.add("zamowienie-pozycja-anuluj");
        newButton.innerHTML = `<img src="../img/white/delete-white.png">Usuń`;

        if (textarea) {
          textarea.value = "";
        }

        newButton.addEventListener("click", () => {
          zamowioneTbody.removeChild(rowClone);
        });
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  fetchZamowienieDostepneSmaki();
});

document
  .getElementById("sprzedaz-zamowienie-btn")
  .addEventListener("click", async () => {
    const zamowioneRows = document.querySelectorAll(
      "#zamowienie-pozycje-zamowione-tbody tr"
    );

    const token = localStorage.getItem("token");

    const decoded = parseJwt(token);
    const uzytkownik = decoded.id;
    const sklep = decoded.sklepId;

    const zamowienia = Array.from(zamowioneRows).map((row) => {
      const nazwa = row.children[0].textContent.trim();

      const opisElement = row.children[1].querySelector("textarea, input");
      const opis = opisElement
        ? opisElement.value.trim()
        : row.children[1].textContent.trim();

      const isSmak = row.getAttribute("data-smak") === "1" ? 1 : 0;
      return { nazwa, opis, isSmak };
    });

    try {
      const response = await fetch("/api/zamowienie", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zamowienia, uzytkownik, sklep }),
      });

      if (response.ok) {
        alert("Zamówienie zostało zapisane.");
        window.location.reload();
      } else {
        alert("Wystąpił błąd podczas zapisywania zamówienia.");
      }
    } catch (err) {
      console.error("Błąd:", err);
      alert("Wystąpił błąd podczas zapisywania zamówienia.");
    }
  });
