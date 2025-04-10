const inputImie = document.getElementById("dodawanie-uzytkownika-imie");
const inputNazwisko = document.getElementById("dodawanie-uzytkownika-nazwisko");
const inputLogin = document.getElementById("dodawanie-uzytkownika-login");
const inputHaslo = document.getElementById("dodawanie-uzytkownika-haslo");
const inputPin = document.getElementById("dodawanie-uzytkownika-pin");
const inputStawka = document.getElementById("dodawanie-uzytkownika-stawka");
const urlParams = new URLSearchParams(window.location.search);
const uzytkownikId = urlParams.get("uzytkownik");

document.addEventListener("DOMContentLoaded", async () => {
  if (!uzytkownikId) {
    console.log("Brak ID użytkownika w URL");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.URL}/api/uzytkownik-edycja/${uzytkownikId}`
    );
    if (!response.ok) {
      throw new Error("Błąd podczas pobierania danych użytkownika");
    }

    const uzytkownikArray = await response.json();
    const uzytkownik = uzytkownikArray[0];

    inputImie.value = uzytkownik.UzImie;
    inputNazwisko.value = uzytkownik.UzNazwisko;
    inputLogin.value = uzytkownik.UzLogin;
    inputHaslo.value = "";
    inputPin.value = "";
    inputStawka.value = uzytkownik.UzStawkaGodzinowa;
  } catch (err) {
    console.log("Błąd pobierania danych użytkownika: ", err);
  }

  document
    .getElementById("dodawanie-uzytkownika")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      const imie = inputImie.value;
      const nazwisko = inputNazwisko.value;
      const login = inputLogin.value;
      const haslo = inputHaslo.value;
      const pin = inputPin.value;
      const stawka = inputStawka.value;
      const messageElement = document.getElementById("message");
      const messageContainer = document.querySelector(".message");

      try {
        const response = await fetch(
          `${CONFIG.URL}/api/uzytkownicy-edycja-zapis/${uzytkownikId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imie, nazwisko, login, haslo, pin, stawka }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          window.location.href = "uzytkownicy.html";
        } else {
          messageElement.textContent =
            "Wystąpił błąd podczas edytowania użytkownika";
          messageContainer.style.opacity = 1;
          setTimeout(() => {
            messageContainer.style.opacity = 0;
          }, 3000);
        }
      } catch (error) {
        messageElement.textContent =
          "Wystąpił błąd podczas edytowania użytkownika";
        messageContainer.style.opacity = 1;
        setTimeout(() => {
          messageContainer.style.opacity = 0;
        }, 3000);
      }
    });
});
