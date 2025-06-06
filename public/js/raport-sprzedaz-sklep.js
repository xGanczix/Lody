let sklepSelect = document.getElementById("centrala-raport-sklep");

document.addEventListener("DOMContentLoaded", function () {
  function loadSklepy() {
    const token = localStorage.getItem("token");
    const decoded = parseJwt(token);
    const uzytkownikId = decoded.id;
    fetch(`${CONFIG.URL}/api/sklepy-raportowanie/${uzytkownikId}`)
      .then((response) => response.json())
      .then((data) => {
        sklepSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "-- Wybierz sklep --";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        sklepSelect.appendChild(defaultOption);

        data.forEach((sklep) => {
          const option = document.createElement("option");
          option.value = sklep.SklId;
          option.textContent = sklep.SklNazwa;
          sklepSelect.appendChild(option);
        });
      })
      .catch((error) => console.error("Błąd pobierania sklepów:", error));
  }

  loadSklepy();
});

async function fetchRaportSprzedazFormyPlatnosciSklep(sklepId) {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedaz-formy-platnosci-sklep/${sklepId}?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    const formyPlatnosci = data.map((item) => item.DokFormaPlatnosci);
    const wartosciSprzedazy = data.map((item) =>
      parseFloat(item.wartoscSprzedazy.replace(/,/g, "")).toFixed(2)
    );

    var colors = [
      "#008FFB",
      "#00E396",
      "#FEB019",
      "#FF4560",
      "#775DD0",
      "#3F51B5",
      "#546E7A",
      "#D4526E",
    ];

    const options = {
      chart: {
        type: "bar",
      },
      series: [
        {
          name: "Wartość Sprzedaży",
          data: wartosciSprzedazy,
        },
      ],
      xaxis: {
        categories: formyPlatnosci,
      },
      title: {
        text: `Wartości sprzedaży według form płatności`,
      },
      colors: colors.slice(0, formyPlatnosci.length),
      plotOptions: {
        bar: {
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return parseFloat(val).toFixed(2);
        },
      },
      legend: {
        show: false,
      },
    };
    const chart = new ApexCharts(
      document.querySelector("#formy-platnosci"),
      options
    );
    chart.render();
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
  }
}

async function fetchRaportSprzedazSmakiSklep(sklepId) {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedazy-ilosci-smaki-sklep/${sklepId}?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    const validData = data.filter(
      (item) =>
        item &&
        item.iloscSprzedana != null &&
        item.SmkNazwa != null &&
        item.SmkKolor != null &&
        item.SmkTekstKolor != null
    );

    const iloscSprzedana = validData.map((item) => item.iloscSprzedana);
    const SmkNazwa = validData.map((item) => item.SmkNazwa);
    const SmkKolor = validData.map((item) => item.SmkKolor);
    const SmkTekstKolor = validData.map((item) => item.SmkTekstKolor);

    const options = {
      chart: {
        type: "bar",
      },
      series: [
        {
          name: "Ilość Sprzedana",
          data: iloscSprzedana,
        },
      ],
      xaxis: {
        labels: {
          show: false,
        },
        categories: SmkNazwa,
      },
      yaxis: {
        labels: {
          show: false,
        },
      },
      title: {
        text: "Ilość sprzedanych smaków",
      },
      colors: SmkKolor,
      plotOptions: {
        bar: {
          horizontal: false,
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: SmkTekstKolor,
        },
        formatter: function (val) {
          return val;
        },
      },
      legend: {
        show: true,
        position: "right",
        markers: {
          fillColors: SmkKolor,
        },
        labels: {
          colors: "#000",
          useSeriesColors: false,
          formatter: function (val, index) {
            return SmkNazwa[index];
          },
        },
      },
    };

    const chart = new ApexCharts(
      document.querySelector("#sprzedawane-smaki"),
      options
    );
    chart.render();
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
  }
}

async function fetchRaportSprzedazWartoscSklep(sklepId) {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedazy-wartosci-dzien-sklep/${sklepId}?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    const wartosciSprzedazy = data.map((item) =>
      parseFloat(item.wartoscSprzedazyDzien.replace(/,/g, "")).toFixed(2)
    );
    const dataSprzedazy = data.map((item) => {
      const date = new Date(item.SprzedazDzien);
      return date.toLocaleDateString("pl-PL");
    });

    const options = {
      chart: {
        type: "line",
      },
      series: [
        {
          name: "Wartość Sprzedaży",
          data: wartosciSprzedazy,
        },
      ],
      xaxis: {
        categories: dataSprzedazy,
      },
      title: {
        text: "Wartość sprzedaży według dni",
      },
      stroke: {
        curve: "smooth",
      },
      markers: {
        size: 4,
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return parseFloat(val).toFixed(2);
        },
      },
      colors: ["#008FFB"],
      legend: {
        show: false,
      },
    };

    const chart = new ApexCharts(
      document.querySelector("#sprzedaz-wartosci-dzien"),
      options
    );
    chart.render();
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
  }
}

async function fetchRaportSprzedazTowaryWartoscSklep(sklepId) {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-towary-sprzedaz-wartosc-sklep/${sklepId}?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    const nazwaTowaru = data.map((item) => item.TowNazwa);
    const wartoscSprzedazy = data.map((item) =>
      parseFloat(String(item.TowaryWartosc).replace(/,/g, "")).toFixed(2)
    );

    var colors = [
      "#008FFB",
      "#00E396",
      "#FEB019",
      "#FF4560",
      "#775DD0",
      "#3F51B5",
      "#546E7A",
      "#D4526E",
    ];

    const options = {
      chart: {
        type: "bar",
      },
      series: [
        {
          name: "Wartość Sprzedaży",
          data: wartoscSprzedazy,
        },
      ],
      xaxis: {
        labels: {
          show: false,
        },
        categories: nazwaTowaru,
      },
      yaxis: {
        labels: {
          show: true,
        },
      },
      title: {
        text: "Wartość sprzedaży towarów",
      },
      colors: colors.slice(0, nazwaTowaru.length),
      plotOptions: {
        bar: {
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return parseFloat(val).toFixed(2);
        },
      },
      legend: {
        show: true,
        position: "bottom",
        markers: {
          fillColors: colors.slice(0, nazwaTowaru.length),
        },
        labels: {
          colors: "#000",
          useSeriesColors: false,
          formatter: function (val, index) {
            return TowNazwa[index];
          },
        },
      },
    };

    const chart = new ApexCharts(
      document.querySelector("#sprzedawane-towary-wartosc"),
      options
    );
    chart.render();
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
  }
}

async function fetchRaportSprzedazTowaryIloscSklep(sklepId) {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-towary-sprzedaz-wartosc-sklep/${sklepId}?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    const nazwaTowaru = data.map((item) => item.TowNazwa);
    const iloscSprzedana = data.map((item) =>
      parseFloat(String(item.TowaryIlosc).replace(/,/g, "")).toFixed(2)
    );

    var colors = [
      "#008FFB",
      "#00E396",
      "#FEB019",
      "#FF4560",
      "#775DD0",
      "#3F51B5",
      "#546E7A",
      "#D4526E",
    ];

    const options = {
      chart: {
        type: "bar",
      },
      series: [
        {
          name: "Sprzedana Ilość",
          data: iloscSprzedana,
        },
      ],
      xaxis: {
        labels: {
          show: false,
        },
        categories: nazwaTowaru,
      },
      yaxis: {
        labels: {
          show: false,
        },
      },
      title: {
        text: "Ilość sprzedanych towarów",
      },
      colors: colors.slice(0, nazwaTowaru.length),
      plotOptions: {
        bar: {
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
      },
      legend: {
        show: true,
        position: "bottom",
        markers: {
          fillColors: colors.slice(0, nazwaTowaru.length),
        },
        labels: {
          colors: "#000",
          useSeriesColors: false,
          formatter: function (val, index) {
            return TowNazwa[index];
          },
        },
      },
    };

    const chart = new ApexCharts(
      document.querySelector("#sprzedawane-towary-ilosc"),
      options
    );
    chart.render();
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
  }
}

function wartoscDat() {
  const dzisiaj = new Date();
  const dzisiajFormatowane = dzisiaj.toISOString().split("T")[0];
  const tydzienWczesniej = new Date(dzisiaj);
  tydzienWczesniej.setDate(dzisiaj.getDate() - 7);
  const tydzienWczesniejFormatowane = tydzienWczesniej
    .toISOString()
    .split("T")[0];

  const poczatkowa = document.getElementById("startDate");
  const koncowa = document.getElementById("endDate");
  poczatkowa.value = tydzienWczesniejFormatowane;
  koncowa.value = dzisiajFormatowane;
}

document.addEventListener("DOMContentLoaded", () => {
  wartoscDat();
});

sklepSelect.addEventListener("change", function () {
  const sklepId = sklepSelect.value;
  const raportFormyPlatnosciSklep = document.getElementById("formy-platnosci");
  const raportSprzedaneSmaki = document.getElementById("sprzedawane-smaki");
  const raportWartoscSprzedazy = document.getElementById(
    "sprzedaz-wartosci-dzien"
  );
  const raportSprzedanychIlosciTowarow = document.getElementById(
    "sprzedawane-towary-ilosc"
  );
  const raportSprzedanychTowarowWartosc = document.getElementById(
    "sprzedawane-towary-wartosc"
  );
  raportFormyPlatnosciSklep.innerHTML = "";
  raportSprzedaneSmaki.innerHTML = "";
  raportWartoscSprzedazy.innerHTML = "";
  raportSprzedanychIlosciTowarow.innerHTML = "";
  raportSprzedanychTowarowWartosc.innerHTML = "";

  fetchRaportSprzedazFormyPlatnosciSklep(sklepId);
  fetchRaportSprzedazSmakiSklep(sklepId);
  fetchRaportSprzedazWartoscSklep(sklepId);
  fetchRaportSprzedazTowaryIloscSklep(sklepId);
  fetchRaportSprzedazTowaryWartoscSklep(sklepId);
});

document.getElementById("raportujDaty").addEventListener("click", () => {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const sklepId = sklepSelect.value;
  if (startDate > endDate) {
    alert("Data początkowa jest większa od  końcowej!");
    return;
  } else {
    document.querySelector("#formy-platnosci").innerHTML = "";
    document.querySelector("#sprzedawane-towary-wartosc").innerHTML = "";
    document.querySelector("#sprzedaz-wartosci-dzien").innerHTML = "";
    document.querySelector("#sprzedawane-smaki").innerHTML = "";
    document.querySelector("#sprzedawane-towary-ilosc").innerHTML = "";

    fetchRaportSprzedazFormyPlatnosciSklep(sklepId);
    fetchRaportSprzedazSmakiSklep(sklepId);
    fetchRaportSprzedazWartoscSklep(sklepId);
    fetchRaportSprzedazTowaryIloscSklep(sklepId);
    fetchRaportSprzedazTowaryWartoscSklep(sklepId);
  }
});
