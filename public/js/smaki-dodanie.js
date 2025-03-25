document.addEventListener("DOMContentLoaded", function () {
  const textInput = document.getElementById("dodawanie-smaku-smak");
  const backgroundColorInput = document.getElementById("dodawanie-smaku-kolor");
  const textColorInput = document.getElementById("dodawanie-smaku-kolor-text");
  const demo = document.getElementById("smak-podglad");

  if (!textInput || !backgroundColorInput || !textColorInput || !demo) {
    console.error("Błąd: Nie znaleziono jednego z elementów.");
    return;
  }

  textInput.addEventListener("input", function () {
    demo.textContent = textInput.value;
  });

  backgroundColorInput.addEventListener("input", function () {
    demo.style.backgroundColor = backgroundColorInput.value;
  });

  textColorInput.addEventListener("input", function () {
    demo.style.color = textColorInput.value;
  });

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
        const response = await fetch(`${CONFIG.URL}/api/smaki-dodanie`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ smak, kolor, textColor }),
        });

        const data = await response.json();
        if (response.ok) {
          window.location.href = "smaki.html";
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
});
