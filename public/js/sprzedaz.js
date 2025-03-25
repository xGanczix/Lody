const wartosc = document.getElementById("wartosc-wydania");

function pozycjaFirst() {
  document.getElementById("pozycja1").style.display = "table-row";
  wartosc.innerHTML = "6,00 zł";
}

function pozycjaSecond() {
  document.getElementById("pozycja2").style.display = "table-row";
  wartosc.innerHTML = "12,00 zł";
}

function pozycjaThird() {
  document.getElementById("pozycja3").style.display = "table-row";
  wartosc.innerHTML = "18,00 zł";
}

function gotowka() {
  const pozycja1 = document.getElementById("pozycja1");
  const pozycja2 = document.getElementById("pozycja2");
  const pozycja3 = document.getElementById("pozycja3");

  pozycja1.style.display = "none";
  pozycja2.style.display = "none";
  pozycja3.style.display = "none";
  wartosc.innerHTML = "0,00 zł";
}

function karta() {
  const pozycja1 = document.getElementById("pozycja1");
  const pozycja2 = document.getElementById("pozycja2");
  const pozycja3 = document.getElementById("pozycja3");

  pozycja1.style.display = "none";
  pozycja2.style.display = "none";
  pozycja3.style.display = "none";
  wartosc.innerHTML = "0,00 zł";
}

function bon() {
  const pozycja1 = document.getElementById("pozycja1");
  const pozycja2 = document.getElementById("pozycja2");
  const pozycja3 = document.getElementById("pozycja3");

  pozycja1.style.display = "none";
  pozycja2.style.display = "none";
  pozycja3.style.display = "none";
  wartosc.innerHTML = "0,00 zł";
}

function anuluj() {
  const pozycja1 = document.getElementById("pozycja1");
  const pozycja2 = document.getElementById("pozycja2");
  const pozycja3 = document.getElementById("pozycja3");

  pozycja1.style.display = "none";
  pozycja2.style.display = "none";
  pozycja3.style.display = "none";
  wartosc.innerHTML = "0,00 zł";
}
