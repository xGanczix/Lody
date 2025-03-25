document.addEventListener("DOMContentLoaded", function () {
  const userSelect = document.getElementById(
    "przypisywanie-uzytkownika-uzytkownik"
  );
  const storeContainer = document.getElementById(
    "przypisywanie-uzytkownika-sklepy"
  );

  function loadUsers() {
    fetch(`${CONFIG.URL}/api/uzytkownicy`)
      .then((response) => response.json())
      .then((data) => {
        userSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "-- Wybierz użytkownika --";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        userSelect.appendChild(defaultOption);

        data.forEach((user) => {
          const option = document.createElement("option");
          option.value = user.UzId;
          option.textContent = user.UzImie + " " + user.UzNazwisko;
          userSelect.appendChild(option);
        });
      })
      .catch((error) => console.error("Błąd pobierania użytkowników:", error));
  }

  function loadAvailableStores(userId) {
    fetch(`${CONFIG.URL}/api/sklepy-przypisane?uzytkownikId=${userId}`)
      .then((response) => response.json())
      .then((data) => {
        storeContainer.innerHTML = "";

        if (data.length === 0) {
          const message = document.createElement("p");
          message.textContent =
            "Użytkownik jest przypisany do wszystkich sklepów.";
          storeContainer.appendChild(message);
          return;
        }

        data.forEach((store) => {
          const wrapper = document.createElement("div");
          wrapper.style.display = "flex";
          wrapper.style.alignItems = "center";
          wrapper.style.gap = "8px";
          wrapper.style.width = "100%";
          wrapper.style.height = "30px";
          wrapper.style.padding = "0 6px";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = store.SklId;
          checkbox.name = "sklepy";
          checkbox.style.margin = "0";
          checkbox.style.width = "16px";
          checkbox.style.height = "16px";

          const label = document.createElement("label");
          label.textContent = store.SklNazwa;
          label.style.cursor = "pointer";
          label.style.flexGrow = "1";
          label.style.textAlign = "left";
          label.style.whiteSpace = "nowrap";

          wrapper.appendChild(checkbox);
          wrapper.appendChild(label);
          storeContainer.appendChild(wrapper);
        });
      })
      .catch((error) => console.error("Błąd pobierania sklepów:", error));
  }

  userSelect.addEventListener("change", function () {
    const userId = this.value;
    if (userId) {
      loadAvailableStores(userId);
    } else {
      storeContainer.innerHTML = "";
    }
  });

  document
    .getElementById("przypisywanie-uzytkownika")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const uzytkownikId = userSelect.value;
      const checkboxes = document.querySelectorAll(
        "#przypisywanie-uzytkownika-sklepy input[type='checkbox']:checked"
      );
      const sklepyId = Array.from(checkboxes).map((cb) => cb.value);

      if (!uzytkownikId || sklepyId.length === 0) {
        alert("Wybierz użytkownika i co najmniej jeden sklep.");
        return;
      }

      fetch(`${CONFIG.URL}/api/przypisywanie-uzytkownika`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uzytkownikId, sklepyId }),
      })
        .then((response) => response.json())
        .then((data) => {
          alert(data.message);
          window.location.href = "ustawienia.html";
        })
        .catch((error) => console.error("Błąd zapisu:", error));
    });

  loadUsers();
});
