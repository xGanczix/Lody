const menuPoczatekZmiany = document.getElementById("poczatekZmiany");
const menuKoniecZmiany = document.getElementById("koniecZmiany");
const menuSprzedaz = document.getElementById("menuSprzedaz");
const menuUlozenieKuwet = document.getElementById("menuUlozenieKuwet");
const menuZamowienie = document.getElementById("menuZamowienie");

window.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }

  const decoded = parseJwt(token);
  if (!decoded.id) {
    return;
  }

  try {
    const response = await fetch(`/api/rcp-user-info/${decoded.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Błąd podczas pobierania danych.");
    }

    const data = await response.json();

    if (data.length > 0) {
      const koniecZmiany = data[0].RCPKoniecZmiany;

      if (koniecZmiany !== null && koniecZmiany !== "null") {
        menuPoczatekZmiany.removeAttribute("disabled");
        menuKoniecZmiany.setAttribute("disabled", "true");
        menuSprzedaz.setAttribute("disabled", "true");
        menuUlozenieKuwet.setAttribute("disabled", "true");
        menuZamowienie.setAttribute("disabled", "true");
      } else {
        menuPoczatekZmiany.setAttribute("disabled", "true");
        menuKoniecZmiany.removeAttribute("disabled");
        menuSprzedaz.removeAttribute("disabled");
        menuUlozenieKuwet.removeAttribute("disabled");
        menuZamowienie.removeAttribute("disabled");
      }
    } else {
    }
  } catch (error) {}
});

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

document
  .getElementById("poczatekZmiany")
  .addEventListener("click", async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const decoded = parseJwt(token);
      const response = await fetch("/api/zarejestruj-zmiane", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uzytkownikId: decoded.id }),
      });

      const result = await response.json();
      window.location.reload();
    } catch (err) {}
  });

document.getElementById("koniecZmiany").addEventListener("click", async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const decoded = parseJwt(token);
    const response = await fetch("/api/zarejestruj-zmiane", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uzytkownikId: decoded.id }),
    });

    const result = await response.json();
    window.location.reload();
  } catch (err) {}
});
