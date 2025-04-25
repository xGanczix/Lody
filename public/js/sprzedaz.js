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

            const handleClick = () => {
              if (parseInt(przypisanySmak.Porcje) <= 0) {
                alert(`Brak porcji dla smaku: ${przypisanySmak.Nazwa}`);
                return;
              }

              const cena = parseFloat(przycisk.getAttribute("data-cena"));
              dodajDoTabeli(przypisanySmak, cena);
            };

            przycisk.addEventListener("click", handleClick);
            przycisk.addEventListener("touchstart", (e) => {
              e.preventDefault();
              handleClick();
            });
          }
        }
      });

    document.querySelectorAll(".pozostale-towary").forEach((przycisk) => {
      const handleClick = () => {
        const nazwa = przycisk.textContent.trim();
        const towId = przycisk.getAttribute("data-towar");
        dodajDoTabeliLodyWloskie(nazwa, towId);
      };

      przycisk.addEventListener("click", handleClick);
      przycisk.addEventListener("touchstart", (e) => {
        e.preventDefault();
        handleClick();
      });
    });

    document.querySelectorAll(".dodatek").forEach((przycisk) => {
      const handleClick = () => {
        const nazwa = przycisk.textContent.replace(/\s+/g, " ").trim();
        const towId = przycisk.getAttribute("data-towar");
        dodajDoTabeliLodyWloskie(nazwa, towId);
      };

      przycisk.addEventListener("click", handleClick);
      przycisk.addEventListener("touchstart", (e) => {
        e.preventDefault();
        handleClick();
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
    nowyWiersz.dataset.towarId = 1;
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
    const towarId = row.getAttribute("data-towar-id"); // zawsze istnieje
    const kuwetaId = row.getAttribute("data-id"); // tylko jeśli to kuweta

    const ilosc = parseFloat(row.querySelector(".ilosc").textContent);
    const cena = parseFloat(row.querySelector(".cena").textContent);

    pozycje.push({
      towId: kuwetaId ? parseInt(kuwetaId) : null,
      pozostalyTowarId: towarId ? parseInt(towarId) : null,
      ilosc,
      cena,
    });
  });

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
          sumaLodyWloskie += ilosc * 1;
        } else if (nazwa.includes("Lody Włoskie Duże")) {
          sumaLodyWloskie += ilosc * 2;
        }
      });
      poziom = Math.max(0, poziom - sumaLodyWloskie);
      aktualizujLicznik();

      let sumaKawa = 0;
      document.querySelectorAll("#pozycje-wydania-tbody tr").forEach((row) => {
        const nazwaKawa = row.querySelector("td:nth-child(2)").textContent;
        const iloscKawa = parseInt(row.querySelector(".ilosc").textContent);
        if (nazwaKawa.includes("Kawa")) {
          sumaKawa += iloscKawa * 1;
        }
      });
      poziomKawa = Math.max(0, poziomKawa - sumaKawa);
      aktualizujLicznikKawa();

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

async function dodajDoTabeliLodyWloskie(nazwaTowaru, towarId) {
  const tbody = document.getElementById("pozycje-wydania-tbody");

  let cenaTowaru = await pobierzCeneTowaru(towarId);

  if (cenaTowaru === null || isNaN(cenaTowaru)) {
    console.error("Nie udało się pobrać ceny towaru");
    return;
  }

  let istniejącyWiersz = [...tbody.rows].find(
    (row) => row.dataset.towarId === towarId
  );

  if (istniejącyWiersz) {
    let iloscCell = istniejącyWiersz.querySelector(".ilosc");
    let cenaCell = istniejącyWiersz.querySelector(".cena");

    let nowaIlosc = parseInt(iloscCell.textContent) + 1;
    iloscCell.textContent = nowaIlosc;
    cenaCell.textContent = (nowaIlosc * cenaTowaru).toFixed(2) + " zł";
  } else {
    const nowyWiersz = document.createElement("tr");
    nowyWiersz.dataset.towarId = towarId;
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

async function pobierzCeneTowaru(towarId) {
  try {
    const response = await fetch(`${CONFIG.URL}/api/cena-towaru/${towarId}`);
    if (!response.ok) {
      throw new Error("Błąd pobierania ceny");
    }
    const data = await response.json();

    if (
      Array.isArray(data) &&
      data.length > 0 &&
      typeof data[0].CCena === "number"
    ) {
      return data[0].CCena;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Błąd API:", error);
    return null;
  }
}

let poziom = 100;
let poziomKawa = 100;

const licznik = document.querySelector(".licznik-wypelnienie");
const licznikKawa = document.querySelector(".licznik-wypelnienie-kawa");

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
const buttonsPozostale = document.querySelectorAll("button.dodatek");

buttons.forEach((button) => {
  const handleClick = () => {
    button.style.fontSize = "40px";
    setTimeout(function () {
      button.style.fontSize = "20px";
    }, 50);
  };

  button.addEventListener("click", handleClick);
  button.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleClick();
  });
});

buttonsPozostale.forEach((button) => {
  const handleClick = () => {
    button.style.fontSize = "40px";
    setTimeout(function () {
      button.style.fontSize = "20px";
    }, 50);
  };

  button.addEventListener("click", handleClick);
  button.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleClick();
  });
});

document
  .getElementById("zmiana-formy-platnosci")
  .addEventListener("click", () => {
    document.querySelector(".zmiana-formy-platnosci-container").style.display =
      "flex";
    document.querySelector(
      ".zmiana-formy-platnosci-container"
    ).style.opacity = 1;
  });

document
  .getElementById("zmiana-formy-platnosci-anuluj")
  .addEventListener("click", () => {
    document.querySelector(".zmiana-formy-platnosci-container").style.display =
      "none";
    document.querySelector(
      ".zmiana-formy-platnosci-container"
    ).style.opacity = 0;
  });

async function zmienFormePlatnosci(formaPlatnosci) {
  const token = localStorage.getItem("token");
  const decoded = parseJwt(token);

  const sklepId = decoded.sklepId;

  try {
    const response = await fetch(`${CONFIG.URL}/api/zmiana-formy-platnosci`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sklepId,
        platnosc: formaPlatnosci,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      document.querySelector(
        ".zmiana-formy-platnosci-container"
      ).style.display = "none";
      const message = document.getElementById("message");
      message.style.opacity = 1;
      message.style.background = "rgba(0, 196, 10, 0.3)";
      message.style.border = "2px solid #28a745";
      message.innerHTML = "Forma płatności zmieniona";

      setTimeout(() => {
        message.style.opacity = 0;
      }, 2000);
    } else {
      message.style.opacity = 1;
      message.style.background = "rgba(255, 0, 0, 0.3)";
      message.style.border = "2px solid #dc3545";
      message.innerHTML = "Błąd zmiany formy płatności";

      setTimeout(() => {
        message.style.opacity = 0;
      }, 10000);
    }
  } catch (err) {
    console.log("Błąd zmiany formy płatności: ", err);
  }
}

document
  .getElementById("gotowka-zmiana")
  .addEventListener("click", () => zmienFormePlatnosci("gotówka"));
document
  .getElementById("karta-zmiana")
  .addEventListener("click", () => zmienFormePlatnosci("karta"));
document
  .getElementById("bon-zmiana")
  .addEventListener("click", () => zmienFormePlatnosci("bon"));
