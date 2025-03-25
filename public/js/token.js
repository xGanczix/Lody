async function checkAuth() {
  const token = localStorage.getItem("token");
  const mainContent = document.querySelector(".centala-container");

  if (mainContent) mainContent.classList.add("hidden");

  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${CONFIG.URL}/api/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    if (mainContent) mainContent.classList.remove("hidden");
  } catch (error) {
    console.warn("Błąd autoryzacji:", error.message);
    redirectToLogin();
  }
}

function redirectToLogin() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", checkAuth);

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Błąd dekodowania tokena", e);
    return null;
  }
}

const token = localStorage.getItem("token");

if (token) {
  const decoded = parseJwt(token);
  if (decoded && decoded.imie && decoded.nazwisko && decoded.sklepNazwa) {
    document.getElementById("username").textContent =
      decoded.imie + " " + decoded.nazwisko + " - Sklep: " + decoded.sklepNazwa;
  } else if (decoded && decoded.imie && decoded.nazwisko) {
    document.getElementById("username").textContent =
      decoded.imie + " " + decoded.nazwisko;
  }
}
