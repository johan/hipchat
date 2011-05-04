chrome.extension.sendRequest({name:"getStylesForUrl", url: getMeta("stylish-id-url") || location.href}, function(response) {
	if (response.length == 0) {
		sendEvent("styleCanBeInstalledChrome");
	} else {
		sendEvent("styleAlreadyInstalledChrome");
	}
});

function sendEvent(type) {
	var stylishEvent = document.createEvent("Events");
	stylishEvent.initEvent(type, false, false, document.defaultView, null);
	document.dispatchEvent(stylishEvent);
}

document.addEventListener("stylishInstallChrome", function() {
	getResource(getMeta("stylish-description"), function(name) {
		if (confirm(chrome.i18n.getMessage('styleInstall', [name]))) {
			getResource(getMeta("stylish-code-chrome"), function(code) {
				// check for old style json
				var json = JSON.parse(code);
				chrome.extension.sendRequest({name:"saveFromJSON", json: json}, function(response) {
					sendEvent("styleInstalledChrome");
				});
			});
			getResource(getMeta("stylish-install-ping-url-chrome"));
		}	
	});
}, false);

function getMeta(name) {
	var e = document.querySelector("link[rel='" + name + "']");
	return e ? e.getAttribute("href") : null;
}

function getResource(url, callback) {
	if (url.indexOf("#") == 0) {
		if (callback) {
			callback(document.getElementById(url.substring(1)).innerText);
		}
		return;
	}
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4 && callback) {
	    callback(xhr.responseText);
	  }
	}
	xhr.send();
}
