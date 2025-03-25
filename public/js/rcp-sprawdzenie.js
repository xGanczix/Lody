const menuPoczatekZmiany = document.getElementById("poczatekZmiany");
const menuKoniecZmiany = document.getElementById("koniecZmiany");
const menuSprzedaz = document.getElementById("sprzedaz");
const menuUlozenieKuwet = document.getElementById("ulozenieKuwet");
const menuZamowienie = document.getElementById("zamowienie");

document.getElementById("poczatekZmiany").addEventListener("click", () => {
  alert("początek");
  menuPoczatekZmiany.setAttribute("disabled", "true");
  menuKoniecZmiany.removeAttribute("disabled");
  menuSprzedaz.removeAttribute("disabled");
  menuUlozenieKuwet.removeAttribute("disabled");
  menuZamowienie.removeAttribute("disabled");
});

document.getElementById("koniecZmiany").addEventListener("click", () => {
  alert("koniec");
  menuPoczatekZmiany.removeAttribute("disabled");
  menuKoniecZmiany.setAttribute("disabled", "true");
  menuSprzedaz.setAttribute("disabled", "true");
  menuUlozenieKuwet.setAttribute("disabled", "true");
  menuZamowienie.setAttribute("disabled", "true");
});
