document.addEventListener("DOMContentLoaded", async () => {
  aktualizujLicznik();
  aktualizujLicznikKawa();

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

    const res = await fetch(`${CONFIG.URL}/api/ulozenie-kuwet-menu/${sklepId}`);
    const ulozenieData = res.ok ? (await res.json())[0] || {} : {};

    const kuwetRes = await fetch(`${CONFIG.URL}/api/kuwety-sklep/${sklepId}`);
    if (!kuwetRes.ok) {
      console.log("Błąd pobierania kuwet");
      return;
    }
    const kuwetData = await kuwetRes.json();

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
            przycisk.setAttribute("data-cena", przypisanySmak.CCena);

            przycisk.addEventListener("click", () => {
              const cena = parseFloat(przycisk.getAttribute("data-cena"));
              dodajDoTabeli(przypisanySmak, cena);
            });
          }
        }
      });

    document.querySelectorAll(".pozostale-towary").forEach((przycisk) => {
      przycisk.addEventListener("click", () => {
        const nazwa = przycisk.textContent.trim();
        dodajDoTabeliLodyWloskie(nazwa);
      });
    });

    document.querySelectorAll(".dodatek").forEach((przycisk) => {
      przycisk.addEventListener("click", () => {
        const nazwa = przycisk.textContent.replace(/\s+/g, " ").trim();

        console.log("Dodatek:", nazwa);
        dodajDoTabeliLodyWloskie(nazwa);
      });
    });

    console.log("Ułożenie kuwet zakończone.");
  } catch (err) {
    console.log("Błąd podczas układania kuwet:", err);
  }
});

function dodajDoTabeli(smak, cena) {
  const tbody = document.getElementById("pozycje-wydania-tbody");

  let istniejącyWiersz = [...tbody.rows].find(
    (row) => row.dataset.id == smak.Id
  );
  if (istniejącyWiersz) {
    let iloscCell = istniejącyWiersz.querySelector(".ilosc");
    let cenaCell = istniejącyWiersz.querySelector(".cena");

    let nowaIlosc = parseInt(iloscCell.textContent) + 1;
    iloscCell.textContent = nowaIlosc;
    cenaCell.textContent = (nowaIlosc * cena).toFixed(2) + " zł";
  } else {
    const nowyWiersz = document.createElement("tr");
    nowyWiersz.dataset.id = smak.Id;
    nowyWiersz.innerHTML = `
      <td class="licznik"></td>
      <td>${smak.Nazwa}</td>
      <td class="ilosc">1</td>
      <td class="cena">${cena.toFixed(2)} zł</td>
      <td><button class="usun-btn"><img src="../img/white/delete-white.png"></button></td>
    `;

    nowyWiersz.querySelector(".usun-btn").addEventListener("click", () => {
      nowyWiersz.remove();
      aktualizujLiczniki();
      aktualizujSume();
    });

    tbody.appendChild(nowyWiersz);
    aktualizujLiczniki();
  }

  aktualizujSume();
}

function aktualizujLiczniki() {
  document
    .querySelectorAll("#pozycje-wydania-tbody tr")
    .forEach((row, index) => {
      row.querySelector(".licznik").textContent = index + 1;
    });
}

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
    document.getElementById("pozycje-wydania-tbody").innerHTML = "";
    const message = document.getElementById("message");
    message.style.opacity = 1;
    message.innerHTML = "Anulowanie wydania";
    message.style.background = "rgba(255, 0, 0, 0.3)";
    message.style.border = "2px solid #dc3545";

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

  const sklepId = decoded.sklepId;
  const autorId = decoded.id;

  const pozycje = [];
  document.querySelectorAll("#pozycje-wydania-tbody tr").forEach((row) => {
    const towId = row.getAttribute("data-id");
    const ilosc = parseFloat(row.querySelector(".ilosc").textContent);
    const cena = parseFloat(row.querySelector(".cena").textContent);

    pozycje.push({ towId, ilosc, cena });
  });

  console.log("Pozycje do wysłania:", pozycje);

  try {
    const response = await fetch(`${CONFIG.URL}/api/zapisz-wydanie`, {
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
      let sumaLodyWloskie = 0;
      document.querySelectorAll("#pozycje-wydania-tbody tr").forEach((row) => {
        const nazwa = row.querySelector("td:nth-child(2)").textContent;
        const ilosc = parseInt(row.querySelector(".ilosc").textContent);
        if (nazwa.includes("Lody Włoskie Małe")) {
          sumaLodyWloskie += ilosc * 1; // Małe lody - odejmujemy 1% za każdą sztukę
        } else if (nazwa.includes("Lody Włoskie Duże")) {
          sumaLodyWloskie += ilosc * 2; // Duże lody - odejmujemy 2% za każdą sztukę
        }
      });
      // Odejmij od poziomu (dla lodów)
      poziom = Math.max(0, poziom - sumaLodyWloskie);
      aktualizujLicznik(); // Aktualizuj licznik dla lodów

      let sumaKawa = 0;
      document.querySelectorAll("#pozycje-wydania-tbody tr").forEach((row) => {
        const nazwaKawa = row.querySelector("td:nth-child(2)").textContent;
        const iloscKawa = parseInt(row.querySelector(".ilosc").textContent);
        if (nazwaKawa.includes("Kawa")) {
          sumaKawa += iloscKawa * 1; // Kawa - odejmujemy 1% za każdą sztukę
        }
      });
      // Odejmij od poziomu (dla kawy)
      poziomKawa = Math.max(0, poziomKawa - sumaKawa);
      aktualizujLicznikKawa(); // Aktualizuj licznik dla kawy

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

function dodajDoTabeliLodyWloskie(nazwaTowaru) {
  const tbody = document.getElementById("pozycje-wydania-tbody");

  // Ustawienie ceny w zależności od nazwy przycisku
  let cenaTowaru = 0;
  if (nazwaTowaru === "Lody Włoskie Małe") {
    cenaTowaru = 6; // cena za małe lody
  } else if (nazwaTowaru === "Lody Włoskie Duże") {
    cenaTowaru = 8; // cena za duże lody
  } else if (nazwaTowaru === "Kawa") {
    cenaTowaru = 10;
  } else if (nazwaTowaru === "Granita") {
    cenaTowaru = 8;
  } else if (nazwaTowaru === "Polewa Posypka") {
    cenaTowaru = 0.5;
  } else if (nazwaTowaru === "Bita Śmietana") {
    cenaTowaru = 2;
  }

  // Sprawdzamy, czy dany towar już istnieje w tabeli
  let istniejącyWiersz = [...tbody.rows].find(
    (row) => row.dataset.nazwa === nazwaTowaru
  );

  // Jeżeli istnieje, aktualizujemy ilość i cenę
  if (istniejącyWiersz) {
    let iloscCell = istniejącyWiersz.querySelector(".ilosc");
    let cenaCell = istniejącyWiersz.querySelector(".cena");

    let nowaIlosc = parseInt(iloscCell.textContent) + 1;
    iloscCell.textContent = nowaIlosc;
    cenaCell.textContent = (nowaIlosc * cenaTowaru).toFixed(2) + " zł";
  } else {
    // Jeżeli nie istnieje, tworzymy nowy wiersz
    const nowyWiersz = document.createElement("tr");
    nowyWiersz.dataset.nazwa = nazwaTowaru;
    nowyWiersz.innerHTML = `
      <td class="licznik"></td>
      <td>${nazwaTowaru}</td>
      <td class="ilosc">1</td>
      <td class="cena">${cenaTowaru.toFixed(2)} zł</td>
      <td><button class="usun-btn"><img src="../img/white/delete-white.png"></button></td>
    `;

    nowyWiersz.querySelector(".usun-btn").addEventListener("click", () => {
      nowyWiersz.remove();
      aktualizujLiczniki();
      aktualizujSume();
    });

    tbody.appendChild(nowyWiersz);
    aktualizujLiczniki();
  }

  aktualizujSume();
}

let poziom = 100;
let poziomKawa = 100;

const licznik = document.querySelector(".licznik-wypelnienie");
const licznikKawa = document.querySelector(".licznik-wypelnienie-kawa");

// document.querySelectorAll(".pozostale-towary").forEach((btn) => {
//   btn.addEventListener("click", () => {
//     const zmiana = parseInt(btn.dataset.zmiana);
//     poziom = Math.max(0, poziom - zmiana);
//     aktualizujLicznik();
//   });
// });

function aktualizujLicznik() {
  licznik.style.height = poziom + "%";
  licznik.textContent = poziom + "%";
}

function aktualizujLicznikKawa() {
  licznikKawa.style.height = poziomKawa + "%";
  licznikKawa.textContent = poziomKawa + "%";
}

document.querySelector("button.reset-wloskie").addEventListener("click", () => {
  poziom = 100;
  aktualizujLicznik();
});

document.querySelector("button.reset-kawa").addEventListener("click", () => {
  poziomKawa = 100;
  aktualizujLicznikKawa();
});

const buttons = document.querySelectorAll("button.lody-rzemieslnicze-smak");

buttons.forEach((button) => {
  button.addEventListener("click", function () {
    button.style.fontSize = "40px";

    setTimeout(function () {
      button.style.fontSize = "20px";
    }, 300);
  });
});
