const inputNazwa = document.getElementById("dodawanie-sklepu-nazwa");
const inputUlica = document.getElementById("dodawanie-sklepu-ulica");
const inputNumer = document.getElementById("dodawanie-sklepu-numer");
const inputKod = document.getElementById("dodawanie-sklepu-kod");
const inputMiejscowosc = document.getElementById(
  "dodawanie-sklepu-miejscowosc"
);
const inputPojemnosc = document.getElementById("dodawanie-sklepu-pojemnosc");
const urlParams = new URLSearchParams(window.location.search);
const sklepId = urlParams.get("sklep");

document.addEventListener("DOMContentLoaded", async () => {
  if (!sklepId) {
    console.error("Brak ID sklepu w URL!");
  }

  try {
    const response = await fetch(`${CONFIG.URL}/api/sklepy-edycja/${sklepId}`);
    if (!response.ok) {
      throw new Error("Błąd podczas pobierania danych smaku");
    }

    const sklepArray = await response.json();
    const sklep = sklepArray[0];

    inputNazwa.value = sklep.SklNazwa;
    inputUlica.value = sklep.SklUlica;
    inputNumer.value = sklep.SklNumer;
    inputKod.value = sklep.SklKod;
    inputMiejscowosc.value = sklep.SklMiejscowosc;
    inputPojemnosc.value = sklep.SklPojemnosc;
  } catch (err) {
    console.log("Błąd pobierania danych sklepu: ", err);
  }

  document
    .getElementById("dodawanie-sklepu")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      const nazwa = inputNazwa.value;
      const ulica = inputUlica.value;
      const numer = inputNumer.value;
      const kod = inputKod.value;
      const miejscowosc = inputMiejscowosc.value;
      const pojemnosc = inputPojemnosc.value;

      const messageElement = document.getElementById("message");
      const messageContainer = document.querySelector(".message");

      try {
        const response = await fetch(
          `${CONFIG.URL}/api/sklepy-edycja-zapis/${sklepId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nazwa,
              ulica,
              numer,
              kod,
              miejscowosc,
              pojemnosc,
            }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          window.location.href = "sklepy.html";
        } else {
          messageElement.textContent =
            "Wystąpił błąd podczas edytowania sklepu";
          messageContainer.style.opacity = 1;
          setTimeout(() => {
            messageContainer.style.opacity = 0;
          }, 3000);
        }
      } catch (error) {
        messageElement.textContent = "Wystąpił błąd podczas edytowania sklepu";
        messageContainer.style.opacity = 1;
        setTimeout(() => {
          messageContainer.style.opacity = 0;
        }, 3000);
      }
    });
});
