/****************************************
 * Obfuscation inspired by ScrapeShield *
 ****************************************/

function decode(string) {
  const key = parseInt(string.substr(0, 2), 36);
  var output = "";
  for (let i = 2; i < string.length; i += 2) {
    output += String.fromCharCode(key ^ parseInt(string.substr(i, 2), 36));
  }
  return output;
}

// use offline and hard-code the result
function encode(string) {
  const key = Math.ceil(Math.random() * 1295);
  var output = key.toString(36);
  for (let i = 0; i < string.length; i += 1) {
    const encoded = (key ^ string.charCodeAt(i)).toString(36);
    output += encoded.length === 1 ? '0' + encoded : encoded;
  }
  return output;
}

function decodeContacts() {
  var links = document.querySelectorAll("#contact a");
  links.forEach(function(link) {
    link.setAttribute("href", decode(link.getAttribute("href").trim()));
    link.innerHTML = decode(link.innerHTML.trim());
  });
}

window.onload = function() {
  decodeContacts();
}
