export var g = new JustGage({
  id: "guage-hum",
  pointer: true,
  min: 0,
  max: 100,
  title: "Humedad",
  decimals:2,
  customSectors: [{
    color: "#ff0000",
    lo: 50,
    hi: 100
  }, {
    color: "#00ff00",
    lo: 0,
    hi: 50
  }]
});

export var g1 = new JustGage({
  id: "guage-temp",
  pointer: true,
  min: 0,
  max: 120,
  decimals:2,
  title: "Temperatura",
  customSectors: [{
    color: "#ff0000",
    lo: 50,
    hi: 100
  }, {
    color: "#00ff00",
    lo: 0,
    hi: 50
  }]
});

export var g2 = new JustGage({
  id: "guage-dist",
  pointer: true,
  min: 0,
  max: 100,
  title: "Distancia",
  decimals:2,
  customSectors: [{
    color: "#ff0000",
    lo: 50,
    hi: 100
  }, {
    color: "#00ff00",
    lo: 0,
    hi: 50
  }]
});

export var g3 = new JustGage({
  id: "guage-co2",
  pointer: true,
  min: 0,
  max: 1000,
  decimals:2,
  title: "CO2 en el Aire",
  customSectors: [{
    color: "#ff0000",
    lo: 50,
    hi: 100
  }, {
    color: "#00ff00",
    lo: 0,
    hi: 50
  }]
});

export var g4 = new JustGage({
  id: "guage-alcohol",
  pointer: true,
  min: 0,
  max: 300,
  decimals:2,
  title: "Alcohol del Aire",
  customSectors: [{
    color: "#ff0000",
    lo: 50,
    hi: 100
  }, {
    color: "#00ff00",
    lo: 0,
    hi: 50
  }]
});

export var g5 = new JustGage({
  id: "guage-co",
  pointer: true,
  min: 0,
  max: 300,
  decimals:2,
  title: "CO en el Aire",
  customSectors: [{
    color: "#ff0000",
    lo: 50,
    hi: 100
  }, {
    color: "#00ff00",
    lo: 0,
    hi: 50
  }]
});