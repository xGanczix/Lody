document
  .getElementById("dodawanie-uzytkownika")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const uzytkownikImie = document.getElementById(
      "dodawanie-uzytkownika-imie"
    )?.value;
    const uzytkownikNazwisko = document.getElementById(
      "dodawanie-uzytkownika-nazwisko"
    )?.value;
    const uzytkownikLogin =
      document.getElementById("dodawanie-uzytkownika-login")?.value || "";
    const uzytkownikHaslo =
      document.getElementById("dodawanie-uzytkownika-haslo")?.value || "";
    const uzytkownikPIN =
      document.getElementById("dodawanie-uzytkownika-pin")?.value || "";
    const uzytkownikStawkaGodzinowa =
      document.getElementById("dodawanie-uzytkownika-stawka")?.value || null;

    const messageElement = document.getElementById("message");
    const messageContainer = document.querySelector(".message");

    try {
      const response = await fetch(`${CONFIG.URL}/api/uzytkownik-dodanie`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uzytkownikImie,
          uzytkownikNazwisko,
          uzytkownikLogin,
          uzytkownikHaslo,
          uzytkownikPIN,
          uzytkownikStawkaGodzinowa,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = "uzytkownicy.html";
      } else {
        messageElement.textContent = data.error || "Wystąpił błąd.";
        messageContainer.style.opacity = 1;
        setTimeout(() => {
          messageContainer.style.opacity = 0;
        }, 3000);
      }
    } catch (error) {
      console.error("Błąd:", error);
      messageElement.textContent =
        "Wystąpił błąd podczas dodawania użytkownika";
      messageContainer.style.opacity = 1;
      setTimeout(() => {
        messageContainer.style.opacity = 0;
      }, 3000);
    }
  });
