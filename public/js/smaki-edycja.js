document.addEventListener("DOMContentLoaded", async () => {
  const textInput = document.getElementById("dodawanie-smaku-smak");
  const backgroundColorInput = document.getElementById("dodawanie-smaku-kolor");
  const textColorInput = document.getElementById("dodawanie-smaku-kolor-text");
  const urlParams = new URLSearchParams(window.location.search);
  const smakId = urlParams.get("smak");

  if (!smakId) {
    console.error("Brak ID smaku w URL!");
    return;
  }

  try {
    const response = await fetch(`${CONFIG.URL}/api/smaki-edycja/${smakId}`);
    if (!response.ok) {
      throw new Error("Błąd podczas pobierania danych smaku");
    }

    const smakArray = await response.json();
    const smak = smakArray[0];

    console.log("Dane smaku:", smak);

    const nazwaInput = document.getElementById("dodawanie-smaku-smak");
    const kolorInput = document.getElementById("dodawanie-smaku-kolor");
    const tekstKolorInput = document.getElementById(
      "dodawanie-smaku-kolor-text"
    );
    const demo = document.getElementById("smak-podglad");

    nazwaInput.value = smak.SmkNazwa;
    kolorInput.value = smak.SmkKolor;
    tekstKolorInput.value = smak.SmkTekstKolor;

    updatePreview();

    nazwaInput.addEventListener("input", updatePreview);
    kolorInput.addEventListener("input", updatePreview);
    tekstKolorInput.addEventListener("input", updatePreview);

    function updatePreview() {
      demo.textContent = nazwaInput.value;
      demo.style.backgroundColor = kolorInput.value;
      demo.style.color = tekstKolorInput.value;
    }
  } catch (error) {
    console.error("Błąd pobierania danych smaku:", error);
  }

  document
    .getElementById("dodawanie-smaku")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      const smak = textInput.value;
      const kolor = backgroundColorInput.value;
      const textColor = textColorInput.value;
      const messageElement = document.getElementById("message");
      const messageContainer = document.querySelector(".message");

      try {
        const response = await fetch(
          `${CONFIG.URL}/api/smaki-edycja-zapis/${smakId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ smak, kolor, textColor }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          window.location.href = "smaki.html";
        } else {
          messageElement.textContent = "Wystąpił błąd podczas edytowania smaku";
          messageContainer.style.opacity = 1;
          setTimeout(() => {
            messageContainer.style.opacity = 0;
          }, 3000);
        }
      } catch (error) {
        messageElement.textContent = "Wystąpił błąd podczas edytowania smaku";
        messageContainer.style.opacity = 1;
        setTimeout(() => {
          messageContainer.style.opacity = 0;
        }, 3000);
      }
    });
});
