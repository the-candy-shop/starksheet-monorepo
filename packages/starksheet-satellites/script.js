function onComputeClicked() {
  let uris = document.getElementById("uris").value;
  let [input, result] = compute(uris);
  console.log("input", input);
  console.log("result", result);
  document.getElementById("uris").value = input.join("\n");
  document.getElementById("output").innerHTML = result;
}

function compute(uris) {
  console.log("input", uris);
  uris = uris.split(/\s*,\s*|\s*\n\s*/);
  uris = uris.map((uri) => uri.replace(/['"]/g, ""));
  console.log("uris", uris);

  let l = uris.map((uri) => Math.ceil(uri.length / 31) + 1);
  let uris_encoded = [];

  for (let i = 0; i < l.length; i++) {
    uris_encoded.push(
      "0x" + (l.slice(0, i).reduce((a, b) => a + b, 0) + l.length).toString(16)
    );
  }

  for (let uri of uris) {
    let parts = uri.match(/.{1,31}/g);
    uris_encoded.push("0x" + parts.length.toString(16));
    for (let part of parts) {
      console.log("part", part);
      uris_encoded.push("0x" + a2hex(part));
    }
  }

  return [uris, uris_encoded];
}

function a2hex(str) {
  var arr = [];
  for (var i = 0, l = str.length; i < l; i++) {
    var hex = Number(str.charCodeAt(i)).toString(16);
    arr.push(hex);
  }
  return arr.join("");
}

function copyResult() {
  let text = document.getElementById("output").innerText;
  navigator.clipboard.writeText(text).then(
    function () {
      alert("Result copied to clipboard");
    },
    function (err) {
      alert("Could not copy text: ", err);
    }
  );
}
