document.addEventListener("DOMContentLoaded", () => {
  const pinInput = document.getElementById("pin-pin");
  const pinKeys = document.querySelectorAll(".pin-key");
  const pinDelete = document.getElementById("pin-delete");

  pinKeys.forEach((key) => {
    key.addEventListener("click", () => {
      const keyValue = key.textContent.trim();
      if (!isNaN(keyValue) && pinInput.value.length < 6) {
        pinInput.value += keyValue;
      }
    });
  });

  pinDelete.addEventListener("click", () => {
    pinInput.value = "";
  });

  pinInput.addEventListener("input", () => {
    pinInput.value = pinInput.value.replace(/\D/g, "");
  });
});

document
  .getElementById("form-login-password")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const login = document.getElementById("password-login").value;
    const password = document.getElementById("password-password").value;

    try {
      const message = document.getElementById("message-login");
      const response = await fetch(`${CONFIG.URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "centrala/centrala.html";
      } else {
        message.textContent = data.message;
        message.style.opacity = 1;
        setTimeout(() => {
          message.style.opacity = 0;
        }, 3000);
      }
    } catch (error) {
      console.error("❗ Błąd logowania:", error);
    }
  });

document.addEventListener("DOMContentLoaded", async function () {
  const select = document.getElementById("pin-sklep");

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
  .getElementById("form-login-pin")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const pinSklep = document.getElementById("pin-sklep").value;
    const pin = document.getElementById("pin-pin").value;

    try {
      const message = document.getElementById("message-login");
      const response = await fetch(`${CONFIG.URL}/api/login-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinSklep, pin }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "sklep/sklep-menu.html";
      } else {
        message.textContent = data.message;
        message.style.opacity = 1;
        setTimeout(() => {
          message.style.opacity = 0;
        }, 3000);
      }
    } catch (error) {
      console.error("❗ Błąd logowania:", error);
    }
  });
