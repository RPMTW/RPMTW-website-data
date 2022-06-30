const fetch = require("node-fetch");
const fs = require("fs");

const DirectoriesID = {
    "1.12": "37102",
    "1.16": "14696",
    "1.17": "33892",
    "1.18": "57407",
    "1.19": "68452"
};

let progress = {
    "progress": "",
    "1.12": "",
    "1.16": "",
    "1.17": "",
    "1.18": "",
    "1.19": "",
    "data": {}
};

fetch("https://api.crowdin.com/api/v2/projects/442446/languages/progress",
    {
        method: "get",
        headers: {
            "Authorization": `Bearer ${process.env.CrowdinToken}`,
            'Content-Type': 'application/json'
        },
    })
    .then(res => res.json())
    .then(json => {
        progress.progress = ((json.data[0].data.words.translated / json.data[0].data.words.total) * 100).toFixed(3) + "%"
    });

for (let version in DirectoriesID)
    fetch(`https://api.crowdin.com/api/v2/projects/442446/directories/${DirectoriesID[version]}/languages/progress`,
        {
            method: "get",
            headers: {
                "Authorization": `Bearer ${process.env.CrowdinToken}`,
                "Content-Type": "application/json",
            },
        })
        .then(res => res.json())
        .then(json => {
            console.log(json);
            let words = json.data[0].data.words
            progress[version] = ((words.translated / words.total) * 100).toFixed(3) + "%";
            progress.data[version] = {
                translated: words.translated,
                total: words.total
            }
            let t = true;
            for (let i of Object.keys(progress)) if (i != "data" && progress[i].length == 0) t = false;
            if (t) {
                fs.existsSync("./data") || fs.mkdirSync("./data");
                fs.writeFileSync("./data/progress.json", JSON.stringify(progress, null, 4));
            }
        });
