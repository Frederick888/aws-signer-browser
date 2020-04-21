function notifySettingsChange() {
    let message = {
        aws_key: document.getElementById('aws_key').value,
        aws_secret: document.getElementById('aws_secret').value,
        defined_services: document.getElementById('textarea1').value,
    };
    browser.runtime.sendMessage(message);
}

function timeoutInnerText(element, text) {
    let originalText = element.innerText;
    element.setAttribute('disabled', 1);
    element.innerText = text;
    setTimeout(() => {
        element.removeAttribute('disabled');
        element.innerText = originalText;
        element.style['background-color'] = null;
    }, 700);
}

function populatePatternsHtml(hostPatterns) {
    const patternList = document.querySelector('#host-patterns tbody');
    for (let pattern of hostPatterns) {
        let row = document.getElementById('host-pattern-template').cloneNode(true);
        row.removeAttribute('id');
        row.setAttribute('class', 'host-pattern');
        row.style.display = null;
        row.querySelector('input').value = pattern;
        row.children[1].addEventListener('click', (e) => {
            e.target.closest('tr').remove();
            if (document.querySelectorAll('.host-pattern').length == 0) {
                document.getElementById('host-pattern-placeholder').style.display = null;
            }
        });
        patternList.appendChild(row);
    }
}

let currentPatterns;
document.addEventListener('DOMContentLoaded', () => {
    M.AutoInit();

    browser.storage.local.get(['aws_key', 'aws_secret', 'defined_services'])
        .then((result) => {
            document.getElementById('aws_key').value = result.aws_key || '';
            document.getElementById('aws_secret').value = result.aws_secret || '';
            document.getElementById('textarea1').value = result.defined_services || '';
        });
    browser.permissions.getAll()
        .then((result) => {
            if (result.origins == undefined || result.origins.length == 0) {
                document.getElementById('host-pattern-placeholder').style.display = null;
            } else {
                populatePatternsHtml(result.origins);
            }
            currentPatterns = result.origins || [];
        });
});

document.getElementById('aws_key').addEventListener('change', (e) => {
    browser.storage.local.set({
        aws_key: e.target.value,
    });
    notifySettingsChange();
});

document.getElementById('aws_secret').addEventListener('change', (e) => {
    browser.storage.local.set({
        aws_secret: e.target.value,
    });
    notifySettingsChange();
});

document.getElementById('add-pattern').addEventListener('click', () => {
    populatePatternsHtml(['']);
    document.getElementById('host-pattern-placeholder').style.display = 'none';
});
document.getElementById('save-patterns').addEventListener('click', () => {
    let newPatterns = Array.from(document.querySelectorAll('.host-pattern input')).map((e) => e.value);
    let toRemove = currentPatterns.filter((pattern) => newPatterns.indexOf(pattern) == -1);
    let toRequest = newPatterns.filter((pattern) => currentPatterns.indexOf(pattern) == -1);
    browser.permissions.remove({
        origins: toRemove
    });
    try {
        browser.permissions.request({
            origins: toRequest
        }).then((success) => {
            if (success) {
                timeoutInnerText(document.getElementById('save-patterns'), 'Saved');
                browser.permissions.getAll()
                    .then((result) => {
                        currentPatterns = result.origins || [];
                    });
            } else {
                timeoutInnerText(document.getElementById('save-patterns'), 'Failed');
                browser.notifications.create(null, {
                    type: 'basic',
                    message: 'Failed to request permissions (denied?), please try again',
                    title: 'Request Failed',
                });
            }
        });
    } catch (e) {
        timeoutInnerText(document.getElementById('save-patterns'), 'Failed');
        browser.notifications.create(null, {
            type: 'basic',
            message: e.message,
            title: 'Request Failed',
        });
    }
});

let hostRegexp = /^(?:[\w\*-]+\.)?(?:([a-z]{2}-[a-z]{4,10}-\d+)\.)?([a-z]{2,10})\.amazonaws\.com$|^(?:[\w\*-]+\.)?s3-([a-z]{2}-[a-z]{4,10}-\d+)\.amazonaws\.com$/i;
document.getElementById('aws_host').addEventListener('change', (e) => {
    let host = e.target.value;
    host = host.replace(/^https?:\/\//i, '');
    host = host.replace(/(amazonaws\.com)\/.*$/i, '$1');
    document.getElementById('aws_host').value = host;
    if (hostRegexp.test(host)) {
        let matches = hostRegexp.exec(host);
        if (matches[1] !== undefined && document.getElementById('aws_region').value == '') {
            document.getElementById('aws_region').value = matches[1];
        }
        if (matches[2] !== undefined && document.getElementById('aws_service').value == '') {
            document.getElementById('aws_service').value = matches[2];
        }
        if (matches[3] !== undefined) {
            if (document.getElementById('aws_region').value == '') {
                document.getElementById('aws_region').value = matches[3];
            }
            if (document.getElementById('aws_service').value == '') {
                document.getElementById('aws_service').value = 's3';
            }
        }
    }
});

document.getElementById('add').addEventListener('click', () => {
    let service = {
        region: document.getElementById('aws_region').value,
        service: document.getElementById('aws_service').value,
        host: document.getElementById('aws_host').value,
    };
    for (let field in service) {
        if (service[field].length == 0) {
            browser.notifications.create(null, {
                type: 'basic',
                message: 'All three properties must be defined!',
                title: 'Incomplete Service Definition',
            });
            return;
        }
    }
    let definedServices;
    try {
        definedServices = JSON.parse(document.getElementById('textarea1').value || '[]');
    } catch (e) {
        browser.notifications.create(null, {
            type: 'basic',
            message: 'Defined services field does not contain a valid JSON!',
            title: 'Parsing Error',
        });
        return;
    }
    definedServices.push(service);
    let definedServicesJson = JSON.stringify(definedServices, null, 4);
    document.getElementById('textarea1').value = definedServicesJson;
    browser.storage.local.set({
        defined_services: definedServicesJson,
    });
    notifySettingsChange();
    document.getElementById('aws_region').value = '';
    document.getElementById('aws_service').value = '';
    document.getElementById('aws_host').value = '';

    timeoutInnerText(document.getElementById('add'), 'Added');
});

document.getElementById('save-services').addEventListener('click', () => {
    let definedServices;
    try {
        definedServices = JSON.parse(document.getElementById('textarea1').value || '[]');
    } catch (e) {
        timeoutInnerText(document.getElementById('save-services'), 'Failed');
        browser.notifications.create(null, {
            type: 'basic',
            message: 'Defined services field does not contain a valid JSON!',
            title: 'Parsing Error',
        });
        return;
    }
    let definedServicesJson = JSON.stringify(definedServices, null, 4);
    document.getElementById('textarea1').value = definedServicesJson;
    browser.storage.local.set({
        defined_services: definedServicesJson,
    });
    notifySettingsChange();

    timeoutInnerText(document.getElementById('save-services'), 'Saved');
});

let inputFields = document.querySelectorAll('.input-field input');
inputFields.forEach(inputField => {
    let postfix = inputField.parentElement.querySelector('.postfix');
    if (postfix) {
        inputField.addEventListener('focus', () => {
            postfix.classList.add('active');
        });
        inputField.addEventListener('blur', () => {
            postfix.classList.remove('active');
        });
        postfix.addEventListener('click', () => {
            if (postfix.classList.contains('mdi-eye-off')) {
                postfix.classList.remove('mdi-eye-off');
                postfix.classList.add('mdi-eye');
                inputField.setAttribute('type', 'text');
            } else {
                postfix.classList.remove('mdi-eye');
                postfix.classList.add('mdi-eye-off');
                inputField.setAttribute('type', 'password');
            }
        });
    }
});
