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
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedaz-formy-platnosci-sklep/${sklepId}`
    );
    const data = await response.json();

    const formyPlatnosci = data.map((item) => item.DokFormaPlatnosci);
    const wartosciSprzedazy = data.map((item) =>
      parseFloat(item.wartoscSprzedazy).toFixed(2)
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
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedazy-ilosci-smaki-sklep/${sklepId}`
    );
    const data = await response.json();

    const iloscSprzedana = data.map((item) => item.iloscSprzedana);
    const SmkNazwa = data.map((item) => item.SmkNazwa);
    const SmkKolor = data.map((item) => item.SmkKolor);
    const SmkTekstKolor = data.map((item) => item.SmkTekstKolor);

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
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedazy-wartosci-dzien-sklep/${sklepId}`
    );
    const data = await response.json();

    const wartosciSprzedazy = data.map((item) =>
      parseFloat(item.wartoscSprzedazyDzien).toFixed(2)
    );
    const dataSprzedazy = data.map((item) => item.SprzedazDzien.split("T")[0]);

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

sklepSelect.addEventListener("change", function () {
  const sklepId = sklepSelect.value;
  const raportFormyPlatnosciSklep = document.getElementById("formy-platnosci");
  const raportSprzedaneSmaki = document.getElementById("sprzedawane-smaki");
  const raportWartoscSprzedazy = document.getElementById(
    "sprzedaz-wartosci-dzien"
  );
  raportFormyPlatnosciSklep.innerHTML = "";
  raportSprzedaneSmaki.innerHTML = "";
  raportWartoscSprzedazy.innerHTML = "";

  fetchRaportSprzedazFormyPlatnosciSklep(sklepId);
  fetchRaportSprzedazSmakiSklep(sklepId);
  fetchRaportSprzedazWartoscSklep(sklepId);
});
