document
  .getElementById("dodawanie-sklepu-kod")
  .addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 2) {
      value = value.slice(0, 2) + "-" + value.slice(2, 5);
    }
    e.target.value = value;
  });

document
  .getElementById("dodawanie-sklepu")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const sklepNazwa = document.getElementById("dodawanie-sklepu-nazwa")?.value;
    const sklepUlica =
      document.getElementById("dodawanie-sklepu-ulica")?.value || "";
    const sklepNumer =
      document.getElementById("dodawanie-sklepu-numer")?.value || "";
    const sklepKod =
      document.getElementById("dodawanie-sklepu-kod")?.value || "";
    const sklepMiejscowosc =
      document.getElementById("dodawanie-sklepu-miejscowosc")?.value || "";
    const sklepPojemnosc = document.getElementById(
      "dodawanie-sklepu-pojemnosc"
    )?.value;

    const messageElement = document.getElementById("message");
    const messageContainer = document.querySelector(".message");

    try {
      const response = await fetch(`${CONFIG.URL}/api/sklepy-dodanie`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sklepNazwa,
          sklepUlica,
          sklepNumer,
          sklepKod,
          sklepMiejscowosc,
          sklepPojemnosc,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = "sklepy.html";
      } else {
        messageElement.textContent = data.error || "Wystąpił błąd.";
        messageContainer.style.opacity = 1;
        setTimeout(() => {
          messageContainer.style.opacity = 0;
        }, 3000);
      }
    } catch (error) {
      console.error("Błąd:", error);
      messageElement.textContent = "Wystąpił błąd podczas dodawania sklepu";
      messageContainer.style.opacity = 1;
      setTimeout(() => {
        messageContainer.style.opacity = 0;
      }, 3000);
    }
  });
