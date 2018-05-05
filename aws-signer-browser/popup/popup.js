document.getElementById("settings").addEventListener("click", function () {
    browser.tabs.create({
        url: "/settings/settings.html"
    });
    window.close();
});