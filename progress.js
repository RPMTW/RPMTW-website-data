const fetch = require('node-fetch');
const fs = require("fs");

fetch("https://api.crowdin.com/api/v2/projects/442446/languages/progress", {
    method: "get",
    headers: {
        "Authorization": `Bearer ${process.env.CrowdinToken}`,
        'Content-Type': 'application/json'
    },
}).then(res => res.json())
    .then(json => {
        if (!fs.existsSync("./data")) {
            fs.mkdirSync("./data");
        }
        let data = JSON.stringify(
            {
                "progress": (json.data[0].data.words.translated / json.data[0].data.words.total * 100).toFixed(3) + "%"
            }
        )
        fs.writeFileSync("./data/progress.json", (data));
    });