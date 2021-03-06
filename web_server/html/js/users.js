var table = document.getElementsByTagName('table')[0],
    scanBtn = getE("startScan"),
    clientsFound = getE("clientsFound"),
    scanStatus = getE("spinner-container"),
    clientNames = getE('clientNames'),
    nameListTable = getE('nameList'),
    res = '', scanTime = '',
    previousCall = new Date().getTime(),
    selectAllState = 'not-checked',
    countdownRemaining = 0,
    startCountdown,
    tableHeaderHTML = '<tr><th width="11%"></th><th>Naam</th><th>Clientgegevens</th><th>Pkts</th></tr>';

function compare(a, b) {
    if (a.p > b.p) return -1;
    if (a.p < b.p) return 1;
    return 0;
}

function toggleBtn(onoff) {
    if (onoff) {
        showLoading();
    } else {
        showLoading("hide");
    }
}

function getResults() {
    getResponse("ClientScanResults.json", function(responseText) {
        try {
            res = JSON.parse(responseText);
        } catch (e) {
            notify("FOUT: Bij het wissen van clientlijst. (E5)");
            return;
        }

        res.clients = res.clients.sort(compare);

        clientsFound.innerHTML = '(' + res.clients.length + ' gevonden)';

        var tr = '';
        if (res.clients.length > 1) tableHeaderHTML = '<tr><th width="11%"><input type="checkbox" name="selectAll" id="selectAll" value="false" onclick="selAll()" '+selectAllState+'><label class="checkbox" for="selectAll"></th><th>Naam</th><th>Clientgegevens</th><th>Pkts</th></tr>';
        tr += tableHeaderHTML;

        for (var i = 0; i < res.clients.length; i++) {

            if (res.clients[i].s == 1) tr += '<tr class="selected">';
            else tr += '<tr>';
            if (res.clients[i].s == 1) tr += '<td onclick="select(' + res.clients[i].i + ')"><input type="checkbox" name="check' + res.clients[i].i + '" id="check' + res.clients[i].i + '" value="false" checked><label class="checkbox" for="check' + res.clients[i].i + '"></label></td>';
            else tr += '<td onclick="select(' + res.clients[i].i + ')"><input type="checkbox" name="check' + res.clients[i].i + '" id="check' + res.clients[i].i + '" value="false"><label class="checkbox" for="check' + res.clients[i].i + '"></label></td>';
            if (res.clients[i].n) {
                tr += '<td class="darken-on-hover" onclick="setName(' + res.clients[i].i + ')"><b>' + res.clients[i].n + '</b></td>';
            } else {
                tr += '<td class="darken-on-hover" onclick="setName(' + res.clients[i].i + ')">' + res.clients[i].v + '</td>';
            }
            tr += '<td onclick="select(' + res.clients[i].i + ')"><b>' + res.clients[i].m + '</b><br>' + res.clients[i].a + '</td>';
            tr += '<td onclick="select(' + res.clients[i].i + ')">' + res.clients[i].p + '</td>';

            tr += '</tr>';
        }
        if (tr != tableHeaderHTML) table.innerHTML = tr;
        if (res.nameList.length != 0) {
            document.getElementById('saved-users').className = "";
        }
        clientNames.innerHTML = "(" + res.nameList.length + "/50)";
        var tr = '<tr><th>Naam</th><th><a onclick="clearNameList()" class="right" style="padding-right:10px">Opnieuw instellen</a></th></tr>';
        for (var i = 0; i < res.nameList.length; i++) {

            tr += '<tr>';
            tr += '<td><b>' + res.nameList[i].n + '</b><br>' + res.nameList[i].m + '</td>';
            tr += '<td><div class="edit delete" onclick="deleteName(' + i + ')">&times;</div><div class="clearfix"></div><div class="edit add" onclick="add(' + i + ')">+</div><div class="clearfix"></div><div class="edit" onclick="editNameList(' + i + ')"><svg style=width:22px;height:24px viewBox="0 0 24 24"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"></path></svg></div></td>';
            tr += '</tr>';
        }

        nameListTable.innerHTML = tr;
        Waves.attach('.edit');

    }, function() {
        notify("Verbind opnieuw met het Wi-Fi netwerk (E6)");
        checkConnection();
    }, 3000);

}

function scan() {
    countdownRemaining = scanTime;
    startCountdown = setInterval(function(){countdown()}, 1000);
    getResponse("ClientScan.json?time=" + scanTime, function(responseText) {
        if (responseText == "true") {
            toggleBtn(true);
            
        } else {
            notify("INFO: Geen Wi-Fi netwerk(en) geselecteerd! (E7)");
            countdown(true);
        }
    });
}

function select(num) {
    var time = new Date().getTime();
    if ((time - previousCall) >= 80) {
        previousCall = time;
        getResponse("clientSelect.json?num=" + num, function(responseText) {
            if (responseText == "true") getResults();
            else notify("FOUT: Ongeldige aanvraag 'clientSelect.json' (E8)");
        });
    }
}

function selAll() {
    if (selectAllState == 'not-checked') {
        select(-1);
        selectAllState = 'checked';
    } else {
        select(-2);
        selectAllState = 'not-checked';
    }
}

function clearNameList() {
    if (confirm("Alle gebruikers verwijderen?") == true) {
        getResponse("clearNameList.json", function(responseText) {
            if (responseText == "true") getResults();
            else notify("FOUT: Ongeldige aanvraag 'clearNameList.json' (E9)");
        });
    }
}

function addClient() {
    getResponse("addClient.json?mac=" + cMac.value + "&name=" + cName.value, function(responseText) {
        if (responseText == "true") {
            getResults();
            var macReset = document.getElementById('cMac');
            var nameReset = document.getElementById('cName');
            macReset.value = '';
            nameReset.value = '';
        } else notify("FOUT: Ongeldige aanvraag 'addClient.json' (E10)");
    });
}

function setName(id) {
    var newName = prompt("Name for " + res.clients[id].m);

    if (newName != null) {
        getResponse("setName.json?id=" + id + "&name=" + newName, function(responseText) {
            if (responseText == "true") getResults();
            else notify("FOUT: Ongeldige aanvraag 'editNameList.json' (E11)");
        });
    }
}

function editNameList(id) {
    var newName = prompt("Name for " + res.nameList[id].m);

    if (newName != null) {
        getResponse("editNameList.json?id=" + id + "&name=" + newName, function(responseText) {
            if (responseText == "true") getResults();
            else notify("FOUT: Ongeldige aanvraag 'editNameList.json' (E12)");
        });
    }
}

function deleteName(id) {
    getResponse("deleteName.json?num=" + id, function(responseText) {
        if (responseText == "true") getResults();
        else notify("FOUT: Ongeldige aanvraag 'deleteName.json' (E13)");
    });
}

function add(id) {
    getResponse("addClientFromList.json?num=" + id, function(responseText) {
        if (responseText == "true") getResults();
        else notify("FOUT: Ongeldige aanvraag 'addClientFromList.json' (E14)");
    });
}
function countdown(stop) {
    if (stop == true) {
        clearInterval(startCountdown)
    } else if (countdownRemaining == 0) {
        notify("Scan complete! Reconnect and reload the page");
        indicate(true);
        clearInterval(startCountdown)
    } else {
        if (countdownRemaining == '') countdownRemaining = scanTime;
        notify("Scanning for users ~ "+countdownRemaining+"s remaining");
        countdownRemaining--;
    }
}

getResponse("ClientScanTime.json", function(responseText) {
    scanTime = responseText;
});

getResults();
toggleBtn(false);
