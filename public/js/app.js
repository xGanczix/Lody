const themeToggleButton = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark-mode");
  themeIcon.setAttribute("src", "../img/white/sun-white.png");
}

themeToggleButton.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark-mode");

  if (document.documentElement.classList.contains("dark-mode")) {
    localStorage.setItem("theme", "dark");
    themeIcon.setAttribute("src", "../img/white/sun-white.png");
  } else {
    localStorage.setItem("theme", "light");
    themeIcon.setAttribute("src", "../img/white/moon-white.png");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("menu-display");
  const menu = document.querySelector("nav.centrala-menu");

  toggleButton.addEventListener("click", function () {
    if (menu.style.display === "none" || menu.style.display === "") {
      menu.style.display = "flex";
    } else {
      menu.style.display = "none";
    }
  });
});

function updateIcons() {
  const theme = localStorage.getItem("theme") || "light";
  const icons = [
    { id: "home-icon", name: "home" },
    { id: "lody-icon", name: "ice-cream" },
    { id: "smaki-icon", name: "strawberry" },
    { id: "uzytkownicy-icon", name: "user" },
    { id: "ustawienia-icon", name: "setting" },
    { id: "sklepy-icon", name: "tag" },
    { id: "arrow-right", name: "arrow-right" },
    { id: "rozmiary-icon", name: "size" },
    { id: "support-icon", name: "support" },
    { id: "kuwety-icon", name: "add-product" },
    { id: "help-icon", name: "question" },
    { id: "rcp-icon", name: "clock" },
    { id: "przypisanie-icon", name: "people" },
    { id: "raporty-icon", name: "chart" },
    { id: "arrow-right-raporty", name: "arrow-right" },
    { id: "ceny-icon", name: "money" },
    { id: "raport-sprzedaz-icon", name: "goods" },
    { id: "raport-status-icon", name: "clipboard" },
    { id: "raport-formy-platnosci-icon", name: "top-up" },
    { id: "raport-sprzedaz-sklep-icon", name: "tag_goods" },
  ];

  icons.forEach(({ id, name }) => {
    const icon = document.getElementById(id);
    if (icon) {
      const parentLink = icon.closest(".nav-link");
      let newSrc =
        theme === "dark"
          ? `../img/white/${name}-white.png`
          : `../img/black/${name}.png`;

      if (parentLink && parentLink.classList.contains("active")) {
        newSrc = `../img/white/${name}-white.png`;
      }

      icon.dataset.defaultSrc = newSrc;
      icon.setAttribute("src", `${newSrc}?v=${Date.now()}`);

      parentLink?.removeEventListener("mouseenter", handleMouseEnter);
      parentLink?.removeEventListener("mouseleave", handleMouseLeave);
      parentLink?.addEventListener("mouseenter", handleMouseEnter);
      parentLink?.addEventListener("mouseleave", handleMouseLeave);
    }
  });
}

function handleMouseEnter(event) {
  const icons = event.currentTarget.querySelectorAll("img");
  icons.forEach((icon) => {
    const name = icon.dataset.defaultSrc
      .split("/")
      .pop()
      .replace("-white.png", "")
      .replace(".png", "");
    icon.setAttribute("src", `../img/white/${name}-white.png?v=${Date.now()}`);
  });
}

function handleMouseLeave(event) {
  const link = event.currentTarget;
  const icons = link.querySelectorAll("img");
  if (!link.classList.contains("active")) {
    icons.forEach((icon) => {
      const defaultSrc = icon.dataset.defaultSrc;
      if (defaultSrc) {
        icon.setAttribute("src", `${defaultSrc}?v=${Date.now()}`);
      }
    });
  }
}

fetch("nav.html")
  .then((response) => response.text())
  .then((data) => {
    document.querySelector("nav").innerHTML = data;

    setTimeout(() => {
      const currentPath = window.location.pathname.split("/").pop();
      const links = document.querySelectorAll(".nav-link");

      links.forEach((link) => {
        const linkHref = link.getAttribute("href");
        const icon = link.querySelector("img");

        if (icon) {
          const name = icon
            .getAttribute("src")
            .split("/")
            .pop()
            .replace(/-white\\.png|\\?.*$/, "")
            .replace(/\\.png$/, "");
          icon.dataset.iconName = name;
        }

        if (
          linkHref === currentPath ||
          (linkHref === "#" && currentPath === "index.html")
        ) {
          link.classList.add("active");
          if (icon) {
            icon.setAttribute(
              "src",
              `../img/white/${icon.dataset.iconName}-white.png?v=${Date.now()}`
            );
          }
        }
      });

      updateIcons();
      initDropdown();

      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decodedToken = JSON.parse(atob(token.split(".")[1]));
          if (decodedToken.login === "pinnex") {
            document.getElementById("nav-serwis")?.removeAttribute("style");
            document
              .getElementById("nav-przypisywanie")
              ?.removeAttribute("style");
          } else if (decodedToken.login === "admin") {
            document
              .getElementById("nav-przypisywanie")
              ?.removeAttribute("style");
          }
        } catch (error) {
          console.error("Błąd dekodowania tokena:", error);
        }
      }
    }, 100);
  })
  .catch((error) => console.error("Błąd wczytywania menu:", error));

let lastTheme = localStorage.getItem("theme");
const observer = new MutationObserver(() => {
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme !== lastTheme) {
    lastTheme = currentTheme;
    updateIcons();
  }
});

observer.observe(document.documentElement, {
  attributes: true,
  childList: true,
  subtree: true,
});

function initDropdown() {
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
  const dropdownMenus = document.querySelectorAll(".dropdown-menu");

  dropdownToggles.forEach((dropdownToggle, index) => {
    const dropdownMenu = dropdownMenus[index];

    dropdownToggle.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      dropdownMenus.forEach((menu, i) => {
        if (i !== index) {
          menu.style.display = "none";
        }
      });

      dropdownMenu.style.display =
        dropdownMenu.style.display === "block" ? "none" : "block";
    });
  });

  document.addEventListener("click", function (event) {
    dropdownMenus.forEach((dropdownMenu) => {
      if (!dropdownMenu.contains(event.target)) {
        dropdownMenu.style.display = "none";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const navSerwis = document.getElementById("nav-serwis");
  const token = localStorage.getItem("token");

  if (!token) {
    navSerwis.style.display = "none";
    return;
  }

  try {
    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    if (decodedToken.login === "pinnex") {
      navSerwis.style.display = "block";
    } else {
      navSerwis.style.display = "none";
    }
  } catch (error) {}
});

function centralaSmaki() {
  window.location.href = "smaki-dodanie.html";
}

function centralaSmakiAnuluj() {
  window.location.href = "smaki.html";
}

function centralaUzytkownicy() {
  window.location.href = "uzytkownicy-dodanie.html";
}

function centralaUzytkownicyAnuluj() {
  window.location.href = "uzytkownicy.html";
}

function centralaRozmiary() {
  window.location.href = "rozmiary-dodanie.html";
}

function centralaRozmiaryAnuluj() {
  window.location.href = "rozmiary.html";
}

function centralaSklepy() {
  window.location.href = "sklepy-dodanie.html";
}

function centralaSklepyAnuluj() {
  window.location.href = "sklepy.html";
}

function centralaKuwety() {
  window.location.href = "kuwety-dodanie.html";
}

function centralaKuwetyAnuluj() {
  window.location.href = "kuwety.html";
}

function przypisanie() {
  window.location.href = "przypisywanie-uzytkownika.html";
}

function przypisanieAnuluj() {
  window.location.href = "centrala.html";
}
