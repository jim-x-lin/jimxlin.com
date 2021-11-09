require("./index.html");
require("normalize.css/normalize.css");
require("./main.css");
require("./img/headshot.jpg");
require("./img/favicon.png");

/****************************************
 * Obfuscation inspired by ScrapeShield *
 ****************************************/

function decode(string) {
  const key = parseInt(string.substr(0, 2), 36);
  var output = "";
  for (var i = 2; i < string.length; i += 2) {
    output += String.fromCharCode(key ^ parseInt(string.substr(i, 2), 36));
  }
  return output;
}

// use offline and hard-code the result
// function encode(string) {
//   const key = Math.ceil(Math.random() * 1295);
//   var output = key.toString(36);
//   for (var i = 0; i < string.length; i += 1) {
//     const encoded = (key ^ string.charCodeAt(i)).toString(36);
//     output += encoded.length === 1 ? '0' + encoded : encoded;
//   }
//   return output;
// }

function decodeContacts() {
  var links = document.querySelectorAll("#contact a");
  for (var i = 0; i < links.length; i += 1) {
    var link = links[i];
    link.setAttribute("href", decode(link.getAttribute("href").trim()));
    link.innerHTML = decode(link.innerHTML.trim());
  }
}

/*************
 * Dark Mode *
 *************/

function makeDark() {
  var bodyEl = document.querySelector("body");
  bodyEl.style.color = "#fff";
  bodyEl.style.background = "#000";
  var headerEl = document.querySelector("header");
  headerEl.style.color = "#fff";
  headerEl.style.background = "#000";
  var toggleEl = document.querySelector("#toggleDark");
  toggleEl.style.filter = "invert(1)";
  styleMultiple("a", "color", "#fff");
}

function makeLight() {
  var bodyEl = document.querySelector("body");
  bodyEl.style.color = "#000";
  bodyEl.style.background = "#fff";
  var headerEl = document.querySelector("header");
  headerEl.style.color = "#000";
  headerEl.style.background = "#fff";
  var toggleEl = document.querySelector("#toggleDark");
  toggleEl.style.filter = "invert(0)";
  styleMultiple("a", "color", "#000");
}

function toggleDark() {
  if (localStorage.getItem("darkmode")) {
    makeLight();
    localStorage.removeItem("darkmode");
  } else {
    makeDark();
    localStorage.setItem("darkmode", "true");
  }
}

/***********
 * Helpers *
 ***********/

function styleMultiple(selector, property, value) {
  var els = document.querySelectorAll(selector);
  for (var i = 0; i < els.length; i += 1) {
    els[i].style[property] = value;
  }
}

/**************
 * Initialize *
 **************/

window.onload = function () {
  decodeContacts();
  if (localStorage.getItem("darkmode")) makeDark();
  document.querySelector("#toggleDark").onclick = toggleDark;
};
