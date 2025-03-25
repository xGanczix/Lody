document
  .getElementById("dodawanie-rozmiaru")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const rozmiarNazwa = document.getElementById(
      "dodawanie-rozmiaru-nazwa"
    ).value;
    const rozmiarPojemnosc = document.getElementById(
      "dodawanie-rozmiaru-pojemnosc"
    ).value;
    const messageElement = document.getElementById("message");
    const messageContainer = document.querySelector(".message");

    try {
      const response = await fetch(`${CONFIG.URL}/api/rozmiary-dodanie`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rozmiarNazwa, rozmiarPojemnosc }),
      });

      const data = await response.json();
      if (response.ok) {
        window.location.href = "rozmiary.html";
      } else {
        messageElement.textContent = "Wystąpił błąd podczas dodawania smaku";
        messageContainer.style.opacity = 1;
        setTimeout(() => {
          messageContainer.style.opacity = 0;
        }, 3000);
      }
    } catch (error) {
      console.error("Błąd:", error);
      messageElement.textContent = "Wystąpił błąd podczas dodawania smaku";
      messageContainer.style.opacity = 1;
      setTimeout(() => {
        messageContainer.style.opacity = 0;
      }, 3000);
    }
  });
