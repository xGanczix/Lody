document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("ustawienia-mariadb");
  const testDbButton = document.getElementById("test-db-connection");

  fetch(`${CONFIG.URL}/api/ustawienia`)
    .then((res) => res.json())
    .then((data) => {
      if (data.DB_SERVER)
        document.getElementById("ustawienia-mariadb-host").value =
          data.DB_SERVER;
      if (data.DB_PORT)
        document.getElementById("ustawienia-mariadb-port").value = data.DB_PORT;
      if (data.DB_USER)
        document.getElementById("ustawienia-mariadb-user").value = data.DB_USER;
      if (data.DB_DATABASE)
        document.getElementById("ustawienia-mariadb-db").value =
          data.DB_DATABASE;
    });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const userConfirmed = confirm("Czy chcesz zapisać ustawienia?");

    if (userConfirmed) {
      const ustawienia = {
        host: document.getElementById("ustawienia-mariadb-host").value,
        port: document.getElementById("ustawienia-mariadb-port").value,
        user: document.getElementById("ustawienia-mariadb-user").value,
        pass: document.getElementById("ustawienia-mariadb-pass").value,
        db: document.getElementById("ustawienia-mariadb-db").value,
      };

      fetch(`${CONFIG.URL}/api/ustawienia-zapis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ustawienia),
      })
        .then((res) => res.json())
        .then((data) => {
          alert("Zapisano ustawienia! Kliknij OK, aby odświeżyć stronę.");

          location.reload();
        })
        .catch((error) => {
          console.error("Błąd przy zapisie ustawień:", error);
        });

      setTimeout(() => {
        const restartScript = document.createElement("script");
        restartScript.src = "./restart.bat";
        document.body.appendChild(restartScript);
      }, 1000);
    } else {
      console.log("Zapis ustawień anulowany.");
    }
  });

  testDbButton.addEventListener("click", () => {
    const ustawienia = {
      host: document.getElementById("ustawienia-mariadb-host").value,
      port: document.getElementById("ustawienia-mariadb-port").value,
      user: document.getElementById("ustawienia-mariadb-user").value,
      pass: document.getElementById("ustawienia-mariadb-pass").value,
      db: document.getElementById("ustawienia-mariadb-db").value,
    };

    fetch(`${CONFIG.URL}/api/test-db-connection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ustawienia),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("✅ Połączenie z bazą danych udane!");
        } else {
          alert("❌ Błąd połączenia z bazą danych!");
        }
      })
      .catch((error) => {
        console.error("Błąd przy teście połączenia z bazą:", error);
        alert("❌ Wystąpił błąd podczas testowania połączenia.");
      });
  });
});
