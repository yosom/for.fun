console.clear();

const turbulenceElement = document.getElementById("turbulence");
const displacementElement = document.getElementById("displacement");

const scaleElement = document.getElementById("scale");
const baseFrequencyElement = document.getElementById("baseFrequency");
const octavesElement = document.getElementById("octaves");

const scaleOuputElement = document.getElementById("scaleOuput");
const baseFrequencyOuputElement = document.getElementById("baseFrequencyOuput");
const octavesOuputElement = document.getElementById("octavesOuput");

scaleElement.addEventListener("input", (e) => {
  scaleOuputElement.innerHTML = e.target.value;
  displacementElement.setAttribute("scale", e.target.value);
});

baseFrequencyElement.addEventListener("input", (e) => {
  baseFrequencyOuputElement.innerHTML = e.target.value;
  turbulenceElement.setAttribute("baseFrequency", e.target.value);
});

octavesElement.addEventListener("input", (e) => {
  octavesOuputElement.innerHTML = e.target.value;
  turbulenceElement.setAttribute("numOctaves", e.target.value);
});
