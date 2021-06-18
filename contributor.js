const fetch = require('node-fetch');
const Request = require("request");
const path = require("path");
const fs = require("fs");

let date = new Date();
const body = {
    "name": "top-members",
    "schema":
    {
        "unit": "words",
        "languageId": "zh-TW",
        "format": "json",
        "dateFrom": `${date.getFullYear()}-${(date.getMonth() - 1 < 10 ? '0' + (date.getMonth()) : (date.getMonth()))}-${date.getDate() < 10 ? '0' + date.getDate() : date.getDate()}T00:00:00+00:00`,
        "dateTo": `${date.getFullYear()}-${(date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1))}-${date.getDate() < 10 ? '0' + date.getDate() : date.getDate()}T${date.getHours() < 10 ? '0' + date.getHours() : date.getHours()}:00:00+00:00`
    }
}
fetch("https://api.crowdin.com/api/v2/projects/442446/reports", {
    method: "post",
    body: JSON.stringify(body),
    headers: {
        "Authorization": `Bearer ${process.env.CrowdinToken}`,
        'Content-Type': 'application/json'
    },
}).then(res => res.json())
    .then(json => {
        Run(json);
    });

function Run(json) {
    setTimeout(function () {
        fetch(`https://api.crowdin.com/api/v2/projects/442446/reports/${json.data.identifier}`, {
            method: "get",
            headers: {
                "Authorization": `Bearer ${process.env.CrowdinToken}`,
            },
        }).then(res => res.json())
            .then(json => {
                if (json.data.status === "finished") {
                    fetch(`https://api.crowdin.com/api/v2/projects/442446/reports/${json.data.identifier}/download`, {
                        method: "get",
                        headers: {
                            "Authorization": `Bearer ${process.env.CrowdinToken}`,
                        },
                    }).then(res => res.json())
                        .then(json => {
                            console.log("取得報告成功，正在開始下載報告")
                            if (!fs.existsSync("./data")) {
                                fs.mkdirSync("./data");
                            }
                            let stream = fs.createWriteStream(path.join("./data/opt.json"));
                            Request(json.data.url).pipe(stream).on("close", function (err) {
                                if (err) {
                                    return console.log("下載時發生未知錯誤: " + err);
                                }
                                console.log("報告下載完成，程式結束處理！")
                            }
                            )
                        });
                    return console.log(json.data.identifier)
                } else {
                    Run(json)
                }
            });
    }, 10000);
}
