const fetch = require('node-fetch');
const fs = require("fs");

const VersionIndex = ["1.12", "1.16", "1.17"]

const VersionBrancheID = {
    "1.12": "37100",
    "1.16": "14694",
    "1.17": "33890"
}

let progress = {
    "progress": "",
    "1.12": "",
    "1.16": "",
    "1.17": ""
}


fetch("https://api.crowdin.com/api/v2/projects/442446/languages/progress", { // All The Progress
    method: "get",
    headers: {
        "Authorization": `Bearer 5ab136d1a21a139a709461f914d5a0b7cec77e40416d9e93912e1816ce9c4074c308d2efbf4bf2e6`,
        'Content-Type': 'application/json'
    },
}).then(res => res.json())
    .then(json => {
        progress.progress = (json.data[0].data.words.translated / json.data[0].data.words.total * 100).toFixed(3) + "%"
    });


for (let i = 0; i <= VersionIndex.length - 1; i++) {
    let Version = VersionIndex[i];
    fetch(`https://api.crowdin.com/api/v2/projects/442446/branches/${VersionBrancheID[Version]}/languages/progress`, {
        method: "get",
        headers: {
            "Authorization": `Bearer 5ab136d1a21a139a709461f914d5a0b7cec77e40416d9e93912e1816ce9c4074c308d2efbf4bf2e6`,
            'Content-Type': 'application/json'
        },
    }).then(res => res.json())
        .then(json => {
            progress[Version] = (json.data[0].data.words.translated / json.data[0].data.words.total * 100).toFixed(3) + "%"

            if (progress["1.12"] !== "" && progress["progress"] !== "" && progress["1.16"] !== "" && progress["1.17"] !== "") {
                if (!fs.existsSync("./data")) {
                    fs.mkdirSync("./data");
                }
                let data = JSON.stringify(progress, null, 4);
                fs.writeFileSync("./data/progress.json", (data));
            }
        });
}