const menuPoczatekZmiany = document.getElementById("poczatekZmiany");
const menuKoniecZmiany = document.getElementById("koniecZmiany");
const menuSprzedaz = document.getElementById("sprzedaz");
const menuUlozenieKuwet = document.getElementById("ulozenieKuwet");
const menuZamowienie = document.getElementById("zamowienie");

window.addEventListener("DOMContentLoaded", async () => {
  console.log("Strona załadowana, sprawdzam status zmiany...");

  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Brak tokena w localStorage");
    alert("Brak tokena. Zaloguj się ponownie.");
    return;
  }

  const decoded = parseJwt(token);
  if (!decoded.id) {
    console.error("Brak ID użytkownika w tokenie");
    alert("Brak ID użytkownika w tokenie.");
    return;
  }

  try {
    console.log(`Wysyłam zapytanie do API: /api/rcp-user-info/${decoded.id}`);

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
    console.log("Dane zwrócone z API:", data);

    if (data.length > 0) {
      const koniecZmiany = data[0].RCPKoniecZmiany;
      console.log("RCPKoniecZmiany:", koniecZmiany, typeof koniecZmiany);

      if (koniecZmiany !== null && koniecZmiany !== "null") {
        console.log(
          "Zmiana zamknięta - blokuję wszystkie przyciski oprócz pierwszego."
        );
        menuPoczatekZmiany.removeAttribute("disabled"); // Odblokowuje pierwszy przycisk
        menuKoniecZmiany.setAttribute("disabled", "true");
        menuSprzedaz.setAttribute("disabled", "true");
        menuUlozenieKuwet.setAttribute("disabled", "true");
        menuZamowienie.setAttribute("disabled", "true");
      } else {
        console.log("Zmiana otwarta - odblokowuję przyciski.");
        menuPoczatekZmiany.setAttribute("disabled", "true");
        menuKoniecZmiany.removeAttribute("disabled");
        menuSprzedaz.removeAttribute("disabled");
        menuUlozenieKuwet.removeAttribute("disabled");
        menuZamowienie.removeAttribute("disabled");
      }
    } else {
      console.log("Brak danych dla użytkownika.");
    }
  } catch (error) {
    console.error("Błąd:", error);
    alert("Wystąpił błąd podczas pobierania danych.");
  }
});

// Funkcja do dekodowania tokena JWT
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

// document.getElementById("koniecZmiany").addEventListener("click", () => {
//   alert("koniec");
//   menuPoczatekZmiany.removeAttribute("disabled");
//   menuKoniecZmiany.setAttribute("disabled", "true");
//   menuSprzedaz.setAttribute("disabled", "true");
//   menuUlozenieKuwet.setAttribute("disabled", "true");
//   menuZamowienie.setAttribute("disabled", "true");
// });
