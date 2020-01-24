browser.storage.local.get(['enabled'])
    .then(function (result) {
        if (!(result.enabled === undefined ? true : result.enabled))
            toggleSigner(false);
    });

function toggleSigner(notify = true) {
    let button = document.getElementById("switch");
    if (button.innerText == 'ENABLED') {
        button.classList.replace('blue', 'red');
        button.classList.replace('darken-1', 'darken-3');
        button.innerText = 'DISABLED';
        if (notify)
            browser.runtime.sendMessage({
                enabled: false
            });
    } else {
        button.classList.replace('red', 'blue');
        button.classList.replace('darken-3', 'darken-1');
        button.innerText = 'ENABLED';
        if (notify)
            browser.runtime.sendMessage({
                enabled: true
            });
    }
}

document.getElementById("settings").addEventListener("click", function () {
    browser.tabs.create({
        url: "/settings/settings.html"
    });
    window.close();
});

document.getElementById("switch").addEventListener("click", toggleSigner);
