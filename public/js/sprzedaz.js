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
const CENA_PORCJI = 6.5;

/**
 * Dodaje wybrany smak do tabeli zamówienia.
 */
function dodajDoTabeli(smak) {
  const tbody = document.getElementById("pozycje-wydania-tbody");

  let istniejącyWiersz = [...tbody.rows].find(
    (row) => row.dataset.id == smak.Id // Zmieniamy dataset.smakId na dataset.id
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
    nowyWiersz.dataset.id = smak.Id; // Używamy dataset.id, zgodnie z zapytaniem
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
    const message = document.getElementById("message");
    message.style.opacity = 1;
    message.innerHTML = "Anulowanie wydania";

    // Reset numeracji i sumy
    aktualizujLiczniki();
    aktualizujSume();
  });

document
  .getElementById("gotowka")
  .addEventListener("click", () => zapiszWydanie("gotówka"));
document
  .getElementById("karta")
  .addEventListener("click", () => zapiszWydanie("karta"));
document
  .getElementById("bon")
  .addEventListener("click", () => zapiszWydanie("bon"));

async function zapiszWydanie(formaPlatnosci) {
  const token = localStorage.getItem("token");
  const decoded = parseJwt(token);

  alert("sklep:" + decoded.sklepId);
  alert("uzytkowniik:" + decoded.id);

  const sklepId = decoded.sklepId; // 🛠 Pobierz rzeczywiste ID sklepu
  const autorId = decoded.id; // 🛠 Pobierz rzeczywiste ID użytkownika (możesz trzymać w JWT)

  // Pobieramy pozycje z tabeli
  const pozycje = [];
  document.querySelectorAll("#pozycje-wydania-tbody tr").forEach((row) => {
    const towId = row.getAttribute("data-id");
    const ilosc = parseFloat(row.querySelector(".ilosc").textContent);
    const cena = parseFloat(row.querySelector(".cena").textContent);

    pozycje.push({ towId, ilosc, cena });
  });

  console.log("Pozycje do wysłania:", pozycje);

  // Wysyłamy dane do backendu
  try {
    const response = await fetch("/api/zapisz-wydanie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sklepId,
        platnosc: formaPlatnosci,
        autorId,
        pozycje,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Po zapisie, czyścimy tabelę
      document.getElementById("pozycje-wydania-tbody").innerHTML = "";
      document.getElementById("wartosc-wydania").innerHTML = "0.00 zł";
      const message = document.getElementById("message");
      message.style.opacity = 1;
      message.style.background = "rgba(0, 196, 10, 0.3)";
      message.style.border = "2px solid #28a745";
      message.innerHTML = "Paragon zapisany";
      console.log("Dokument zapisany:", data.numerDokumentu);

      setTimeout(() => {
        message.style.opacity = 0;
      }, 2000);
    } else {
      message.style.opacity = 1;
      message.style.background = "rgba(255, 0, 0, 0.3)";
      message.style.border = "2px solid #dc3545";
      message.innerHTML = "Błąd zapisu paragonu";

      setTimeout(() => {
        message.style.opacity = 0;
      }, 10000);
    }
  } catch (error) {
    console.error("Błąd połączenia z serwerem:", error);
  }
}
