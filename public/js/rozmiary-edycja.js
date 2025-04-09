document.addEventListener("DOMContentLoaded", async () => {
  const nazwa = document.getElementById("dodawanie-rozmiaru-nazwa");
  const pojemnosc = document.getElementById("dodawanie-rozmiaru-pojemnosc");
  const urlParams = new URLSearchParams(window.location.search);
  const rozmiarId = urlParams.get("rozmiar");

  if (!rozmiarId) {
    console.error("Brak ID rozmiaru w URL!");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.URL}/api/rozmiary-edycja/${rozmiarId}`
    );
    if (!response.ok) {
      throw new Error("Błąd podczas pobierania danych smaku");
    }

    const rozmiarArray = await response.json();
    const rozmiar = rozmiarArray[0];

    nazwa.value = rozmiar.RozNazwa;
    pojemnosc.value = rozmiar.RozPojemnosc;
  } catch (error) {
    console.error("Błąd pobierania danych rozmiaru:", error);
  }

  document
    .getElementById("dodawanie-rozmiaru")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      const rozmiar = document.getElementById("dodawanie-rozmiaru-nazwa").value;
      const pojemnosc = document.getElementById(
        "dodawanie-rozmiaru-pojemnosc"
      ).value;
      const messageElement = document.getElementById("message");
      const messageContainer = document.querySelector(".message");

      try {
        const response = await fetch(
          `${CONFIG.URL}/api/rozmiary-edycja-zapis/${rozmiarId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ rozmiar, pojemnosc }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          window.location.href = "rozmiary.html";
        } else {
          messageElement.textContent =
            "Wystąpił błąd podczas edytowania rozmiaru";
          messageContainer.style.opacity = 1;
          setTimeout(() => {
            messageContainer.style.opacity = 0;
          }, 3000);
        }
      } catch (error) {
        messageElement.textContent =
          "Wystąpił błąd podczas edytowania rozmiaru";
        messageContainer.style.opacity = 1;
        setTimeout(() => {
          messageContainer.style.opacity = 0;
        }, 3000);
      }
    });
});
