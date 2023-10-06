"use strict";

// Globals.

let timeoutId = 0;

// Window events.

self.addEventListener("DOMContentLoaded", function(event) {
	console.log("window.DOMContentLoaded");
	setAlert("Loading...");
});

self.addEventListener("load", function(event) {
	console.log("window.DOMContentLoaded");
	setAlert("Done.");
});

// Sign up form events.

signupForm.addEventListener("submit", async function(event) {
	console.log("signupForm.submit");
	event.preventDefault();

	event.submitter.disabled = true;

	if (self.offline) {
		setAlert("Sorry, this site must be online to complete this action.");
		event.submitter.disabled = null;
		return;
	}

	const username = this.username.value.trim();

	if (!username.match(/[\w\-.]{8,}/)) {
		setAlert("Username invalid.");
		event.submitter.disabled = null;
		return;
	}

	const found = await getDatabaseUserByUsername({username});

	if (found) {
		setAlert("Username already signed up.");
		event.submitter.disabled = null;
		return;
	}

	const password = this.password.value.trim();

	if (!password.match(/[\w\x20-\x40]{8,}/)) {
		setAlert("Password invalid.");
		event.submitter.disabled = null;
		return;
	}

	const confirmation = this.confirmation.value.trim();

	if (password !== confirmation) {
		setAlert("Password confirmation incorrect.");
		event.submitter.disabled = null;
		return;
	}

	const id = self.crypto.randomUUID();

	await setDatabaseUser({id, username, password});

	setAlert("Done.");

	event.submitter.disabled = null;
});

// Alert dialog events.

alertDialog.addEventListener("click", function(event) {
	console.log("alertDialog.click");
	setAlert();
});

// Alert dialog functions.

function setAlert(textContent = null) {
	console.log("setAlert");

	//

	clearTimeout(timeoutId);

	// The dialog may already be closed if the user typed Escape while the
	// setTimeout ID is still not 0 (zero). Close the dialog before opening
	// it so we see the message has changed and we can use showModal() even
	// if open attribute is true. Use showModal so we can close the dialog by
	// clicking anywere on the screen (backdrop), or by typing Escape,
	// without a document key down event handler.

	if (alertDialog.open) {
		alertDialog.close();
	}

	// Node textContent property is a Safe Sink.
	// See <https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#safe-sinks>

	if (textContent) {
		alertDialog.textContent = textContent;
		alertDialog.showModal();

		// Auto-close the dialog in 5 seconds.

		setTimeout(setAlert, 5000);
	}
}

// IndexedDB utils.
// See <https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API>.

function getDatabase(name = "seguros-web", version = 1) {
	console.log("getDatabase");

	return new Promise(function(resolve, reject) {
		const request = self.indexedDB.open(name, version);

		request.addEventListener("error", function(event) {
			console.log("getDatabase.error");

			const error = event.target.error;

			reject(error);
		});

		request.addEventListener("upgradeneeded", function(event) {
			console.log("getDatabase.upgradeneeded");

			const db = event.target.result;

			if (event.newVersion == 1) {
				const userStore = db.createObjectStore("user", {keyPath: "id"});
				userStore.createIndex("username", "username", {unique: true});

				const itemStore = db.createObjectStore("item", {keyPath: "id"});
				itemStore.createIndex("username", "username"); // not unique
			}
		});

		request.addEventListener("success", function(event) {
			console.log("getDatabase.success");

			const db = event.target.result;

			resolve(db);
		});
	});
}

function getDatabaseUser(user) {
	console.log("getDatabaseUser");

	return getDatabase().then(function(db) {
		return new Promise(function(resolve, reject) {
			const transaction = db.transaction("user");
			const objectStore = transaction.objectStore("user");
			const request = objectStore.get(user.id);

			request.addEventListener("success", function(event) {
				console.log("getDatabaseUser.success");

				const record = event.target.result;
				console.log("getDatabaseUser.record", record);

				resolve(record);
			});
		});
	});
}

function getDatabaseUserByUsername(user) {
	console.log("getDatabaseUserByUsername");

	return getDatabase().then(function(db) {
		return new Promise(function(resolve, reject) {
			const transaction = db.transaction("user");
			const objectStore = transaction.objectStore("user");
			const index = objectStore.index("username");
			const request = index.get(user.username);

			request.addEventListener("success", function(event) {
				console.log("getDatabaseUserByUsername.success");

				const record = event.target.result;
				console.log("getDatabaseUserByUsername.record", record);

				resolve(record);
			});
		});
	});
}

function setDatabaseUser(user) {
	console.log("setDatabaseUser", user);

	return getDatabase().then(function(db) {
		return new Promise(function(resolve, reject) {
			const transaction = db.transaction(["user"], "readwrite");

			transaction.addEventListener("error", function(event) {
				console.log("setDatabaseUser.error");

				const error = event.target.error;

				reject(error);
			});

			transaction.addEventListener("complete", function(event) {
				console.log("setDatabaseUser.complete");

				//const transaction = event.target;

				resolve(true);
			});

			const objectStore = transaction.objectStore("user");
			const request = objectStore.add(user);

			request.addEventListener("success", function(event) {
				console.log("setDatabaseUser.success");

				//const key = event.target.result;

				//resolve(key);
			});
		});
	});
}
