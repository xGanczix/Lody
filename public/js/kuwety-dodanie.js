document.addEventListener("DOMContentLoaded", async function () {
  const select = document.getElementById("dodawanie-kuwet-smak");

  try {
    const response = await fetch(`${CONFIG.URL}/api/smaki`);
    const smaki = await response.json();

    if (!Array.isArray(smaki)) {
      throw new Error("Nieprawidłowy format danych");
    }

    smaki.forEach((smak) => {
      const option = document.createElement("option");
      option.value = smak.SmkId;
      option.textContent = smak.SmkNazwa;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Błąd pobierania smaków:", error);
  }
});

document.addEventListener("DOMContentLoaded", async function () {
  const select = document.getElementById("dodawanie-kuwet-rozmiar");

  try {
    const response = await fetch(`${CONFIG.URL}/api/rozmiary`);
    const rozmiary = await response.json();

    if (!Array.isArray(rozmiary)) {
      throw new Error("Nieprawidłowy format danych");
    }

    rozmiary.forEach((rozmiar) => {
      const option = document.createElement("option");
      option.value = rozmiar.RozId;
      option.textContent =
        rozmiar.RozNazwa + " - " + rozmiar.RozPojemnosc + " porcji";
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Błąd pobierania rozmiarów:", error);
  }
});

document.addEventListener("DOMContentLoaded", async function () {
  const select = document.getElementById("dodawanie-kuwet-sklep");

  try {
    const response = await fetch(`${CONFIG.URL}/api/sklepy-logowanie`);
    const sklepy = await response.json();

    if (!Array.isArray(sklepy)) {
      throw new Error("Nieprawidłowy format danych");
    }

    sklepy.forEach((sklep) => {
      const option = document.createElement("option");
      option.value = sklep.SklId;
      option.textContent = sklep.SklNazwa;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Błąd pobierania sklepów:", error);
  }
});

document
  .getElementById("dodawanie-kuwet")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const kuwetaSmak = document.getElementById("dodawanie-kuwet-smak").value;
    const kuwetaRozmiar = document.getElementById(
      "dodawanie-kuwet-rozmiar"
    ).value;
    const kuwetaSklep = document.getElementById("dodawanie-kuwet-sklep").value;
    const messageElement = document.getElementById("message");
    const messageContainer = document.querySelector(".message");

    try {
      const response = await fetch(`${CONFIG.URL}/api/kuwety-dodanie`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ kuwetaSmak, kuwetaRozmiar, kuwetaSklep }),
      });

      const data = await response.json();
      if (response.ok) {
        window.location.href = "kuwety.html";
      } else {
        messageElement.textContent = "Wystąpił błąd podczas dodawania kuwety";
        messageContainer.style.opacity = 1;
        setTimeout(() => {
          messageContainer.style.opacity = 0;
        }, 3000);
      }
    } catch (error) {
      console.error("Błąd:", error);
      messageElement.textContent = "Wystąpił błąd podczas dodawania kuwety";
      messageContainer.style.opacity = 1;
      setTimeout(() => {
        messageContainer.style.opacity = 0;
      }, 3000);
    }
  });
