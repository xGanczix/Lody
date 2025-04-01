document.addEventListener("DOMContentLoaded", async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("Brak tokena");
      return;
    }

    const decoded = parseJwt(token);
    if (!decoded?.sklepId) {
      console.log("Nieprawidłowy token");
      return;
    }

    const sklepId = decoded.sklepId;

    // Pobranie danych ułożenia kuwet
    const res = await fetch(`${CONFIG.URL}/api/ulozenie-kuwet-menu/${sklepId}`);
    const ulozenieData = res.ok ? (await res.json())[0] || {} : {};

    // Pobranie dostępnych kuwet w sklepie
    const kuwetRes = await fetch(`${CONFIG.URL}/api/kuwety-sklep/${sklepId}`);
    if (!kuwetRes.ok) {
      console.log("Błąd pobierania kuwet");
      return;
    }
    const kuwetData = await kuwetRes.json();

    // Pobranie przycisków smaków lodów
    document
      .querySelectorAll(".lody-rzemieslnicze-smak")
      .forEach((przycisk, index) => {
        const przypisanySmakId = ulozenieData[`UKuw${index + 1}Id`];
        if (przypisanySmakId) {
          const przypisanySmak = kuwetData.find(
            (item) => item.Id === przypisanySmakId
          );
          if (przypisanySmak) {
            przycisk.style.backgroundColor = przypisanySmak.Kolor;
            przycisk.style.color = przypisanySmak.TekstKolor;
            przycisk.textContent = przypisanySmak.Nazwa;
            przycisk.addEventListener("click", () =>
              dodajDoTabeli(przypisanySmak)
            );
          }
        }
      });

    console.log("Ułożenie kuwet zakończone.");
  } catch (err) {
    console.log("Błąd podczas układania kuwet:", err);
  }
});

// Cena za 1 porcję
const CENA_PORCJI = 6;

/**
 * Dodaje wybrany smak do tabeli zamówienia.
 */
function dodajDoTabeli(smak) {
  const tbody = document.getElementById("pozycje-wydania-tbody");

  let istniejącyWiersz = [...tbody.rows].find(
    (row) => row.dataset.smakId == smak.Id
  );
  if (istniejącyWiersz) {
    // Jeśli smak już istnieje, zwiększamy ilość i aktualizujemy cenę
    let iloscCell = istniejącyWiersz.querySelector(".ilosc");
    let cenaCell = istniejącyWiersz.querySelector(".cena");

    let nowaIlosc = parseInt(iloscCell.textContent) + 1;
    iloscCell.textContent = nowaIlosc;
    cenaCell.textContent = (nowaIlosc * CENA_PORCJI).toFixed(2) + " zł";
  } else {
    // Jeśli smak nie istnieje, dodajemy nowy wiersz
    const nowyWiersz = document.createElement("tr");
    nowyWiersz.dataset.smakId = smak.Id;
    nowyWiersz.innerHTML = `
      <td class="licznik"></td>
      <td>${smak.Nazwa}</td>
      <td class="ilosc">1</td>
      <td class="cena">${CENA_PORCJI.toFixed(2)} zł</td>
      <td><button class="usun-btn">❌ Usuń</button></td>
    `;

    // Obsługa usuwania
    nowyWiersz.querySelector(".usun-btn").addEventListener("click", () => {
      nowyWiersz.remove();
      aktualizujLiczniki();
      aktualizujSume();
    });

    tbody.appendChild(nowyWiersz);
    aktualizujLiczniki();
  }

  // Aktualizacja sumy wartości wydania
  aktualizujSume();
}

/**
 * Aktualizuje numerację pozycji w tabeli.
 */
function aktualizujLiczniki() {
  document
    .querySelectorAll("#pozycje-wydania-tbody tr")
    .forEach((row, index) => {
      row.querySelector(".licznik").textContent = index + 1;
    });
}

/**
 * Aktualizuje sumę wartości wydania.
 */
function aktualizujSume() {
  let suma = 0;
  document
    .querySelectorAll("#pozycje-wydania-tbody .cena")
    .forEach((cenaCell) => {
      suma += parseFloat(cenaCell.textContent);
    });

  document.getElementById("wartosc-wydania").textContent =
    suma.toFixed(2) + " zł";
}

document
  .getElementById("pozycje-wydania-anuluj")
  .addEventListener("click", () => {
    // Usunięcie wszystkich wierszy z tabeli
    document.getElementById("pozycje-wydania-tbody").innerHTML = "";

    // Reset numeracji i sumy
    aktualizujLiczniki();
    aktualizujSume();
  });
