const themeToggleButton = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  themeIcon.setAttribute("src", "../img/white/sun-white.png");
}

themeToggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("theme", "dark");
    themeIcon.setAttribute("src", "../img/white/sun-white.png");
  } else {
    localStorage.setItem("theme", "light");
    themeIcon.setAttribute("src", "../img/white/moon-white.png");
  }
});
