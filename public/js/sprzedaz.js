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

async function fetchLicznik() {
  let licznikWloskie = document.querySelector(".licznik-wypelnienie");
  let licznikKawa = document.querySelector(".licznik-wypelnienie-kawa");
  const token = localStorage.getItem("token");
  const decoded = parseJwt(token);

  const sklepId = decoded.sklepId;
  const typ = 1;
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/odczytaj-licznik/${sklepId}/${typ}`
    );
    const liczniki = await response.json();

    licznikWloskie.style.height = liczniki[0].LWartosc + "%";
    licznikWloskie.textContent = liczniki[0].LWartosc + "%";
  } catch (err) {
    console.log(err);
  }
}

async function fetchLicznikKawa() {
  let licznikKawa = document.querySelector(".licznik-wypelnienie-kawa");
  const token = localStorage.getItem("token");
  const decoded = parseJwt(token);

  const sklepId = decoded.sklepId;
  const typ = 2;
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/odczytaj-licznik/${sklepId}/${typ}`
    );
    const liczniki = await response.json();

    licznikKawa.style.height = liczniki[0].LWartosc + "%";
    licznikKawa.textContent = liczniki[0].LWartosc + "%";
  } catch (err) {
    console.log(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchLicznik();
  fetchLicznikKawa();
});

document.querySelector(".reset-wloskie").addEventListener("click", () => {
  async function resetWloskie() {
    const token = localStorage.getItem("token");
    const decoded = parseJwt(token);

    const sklepId = decoded.sklepId;
    const typ = 1;
    try {
      const response = await fetch(
        `${CONFIG.URL}/api/resetuj-licznik/${sklepId}/${typ}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sklepId, typ }),
        }
      );

      if (response.ok) {
        const message = document.getElementById("message");
        message.style.opacity = 1;
        message.style.background = "rgba(0, 196, 10, 0.3)";
        message.style.border = "2px solid #28a745";
        message.innerHTML = "Wlew lody włoskie";
        fetchLicznik();

        setTimeout(() => {
          message.style.opacity = 0;
        }, 2000);
      } else {
        message.style.opacity = 1;
        message.style.background = "rgba(255, 0, 0, 0.3)";
        message.style.border = "2px solid #dc3545";
        message.innerHTML = "Błąd zapisu wlewu włoskie";

        setTimeout(() => {
          message.style.opacity = 0;
        }, 10000);
      }
    } catch (err) {
      console.log(err);
    }
  }
  resetWloskie();
});

document.querySelector(".reset-kawa").addEventListener("click", () => {
  async function resetKawa() {
    const token = localStorage.getItem("token");
    const decoded = parseJwt(token);

    const sklepId = decoded.sklepId;
    const typ = 2;
    try {
      const response = await fetch(
        `${CONFIG.URL}/api/resetuj-licznik/${sklepId}/${typ}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sklepId, typ }),
        }
      );

      if (response.ok) {
        const message = document.getElementById("message");
        message.style.opacity = 1;
        message.style.background = "rgba(0, 196, 10, 0.3)";
        message.style.border = "2px solid #28a745";
        message.innerHTML = "Wlew kawa";
        fetchLicznikKawa();

        setTimeout(() => {
          message.style.opacity = 0;
        }, 2000);
      } else {
        message.style.opacity = 1;
        message.style.background = "rgba(255, 0, 0, 0.3)";
        message.style.border = "2px solid #dc3545";
        message.innerHTML = "Błąd zapisu wlewu włoskie";

        setTimeout(() => {
          message.style.opacity = 0;
        }, 10000);
      }
    } catch (err) {
      console.log(err);
    }
  }
  resetKawa();
});

async function zapiszWydanie(formaPlatnosci) {
  const token = localStorage.getItem("token");
  const decoded = parseJwt(token);

  const sklepId = decoded.sklepId;
  const autorId = decoded.id;

  const pozycje = [];
  document.querySelectorAll("#pozycje-wydania-tbody tr").forEach((row) => {
    const towarId = row.getAttribute("data-towar-id");
    const kuwetaId = row.getAttribute("data-id");

    const ilosc = parseFloat(row.querySelector(".ilosc").textContent);
    const cena = parseFloat(row.querySelector(".cena").textContent);
    const nazwa = row.querySelector("td:nth-child(2)").textContent;

    let typ = 0;
    if (nazwa.includes("Lody Włoskie")) {
      typ = 1;
    } else if (nazwa.includes("Kawa")) {
      typ = 2;
    }
    console.log(typ);
    let rozmiar = "none";
    if (nazwa.includes("Lody Włoskie Małe")) {
      rozmiar = "mala";
    } else if (nazwa.includes("Lody Włoskie Duże")) {
      rozmiar = "duza";
    } else {
      rozmiar = "none";
    }

    pozycje.push({
      towId: kuwetaId ? parseInt(kuwetaId) : null,
      pozostalyTowarId: towarId ? parseInt(towarId) : null,
      ilosc,
      cena,
      typ,
      rozmiar,
    });
  });

  let licznikLodyWloskie = await odczytajLicznik(sklepId, 1);
  let licznikKawa = await odczytajLicznik(sklepId, 2);

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
      document.getElementById("pozycje-wydania-tbody").innerHTML = "";
      document.getElementById("wartosc-wydania").innerHTML = "0.00 zł";
      const message = document.getElementById("message");
      message.style.opacity = 1;
      message.style.background = "rgba(0, 196, 10, 0.3)";
      message.style.border = "2px solid #28a745";
      message.innerHTML = "Paragon zapisany";

      fetchLicznik();
      fetchLicznikKawa();

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

async function odczytajLicznik(sklepId, typ) {
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/odczytaj-licznik/${sklepId}/${typ}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.LWartosc || 0;
    } else {
      console.error("Błąd odczytu licznika:", await response.text());
      return 0;
    }
  } catch (error) {
    console.error("Błąd połączenia z serwerem:", error);
    return 0;
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
  const token = localStorage.getItem("token");
  const decoded = parseJwt(token);

  const sklepId = decoded.sklepId;
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/cena-towaru/${towarId}/${sklepId}`
    );
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
