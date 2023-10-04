"use strict";

// Document ready.

self.addEventListener("DOMContentLoaded", function(event) {
	console.log("self.DOMContentLoaded");

	while (dialog1.lastChild) dialog1.removeChild(dialog1.lastChild);

	dialog1.addEventListener("click", onDialog1Click, false);
	form1.addEventListener("submit", onForm1Submit, false);

	dialog1.close();
});

// Dialog1 events.

function onDialog1Click(event) {
	console.log("onDialog1Click");
	dialog1.close();
}

// Dialog1 functions.

function setDialog1(textContent = "") {
	dialog1.textContent = textContent;
	dialog1.showModal();
}

// Form1 events.

function onForm1Submit(event) {
	console.log("onForm1Submit");
	event.preventDefault();
}
