const fetch = require('node-fetch');
const csv = require('@fast-csv/parse');
const Request = require("request");
const path = require("path");
const fs = require("fs");

let userName = []
let word = []
let Voted = []

let date = new Date();
const body = {
    "name": "top-members",
    "schema":
        {
            "unit": "words",
            "languageId": "zh-TW",
            "format": "csv",
            "dateFrom": `${date.getFullYear()}-${(date.getMonth() - 1 < 10 ? '0' + (date.getMonth()) : (date.getMonth()))}-${date.getDate() < 10 ? '0' + date.getDate() : date.getDate()}T00:00:00+00:00`,
            "dateTo": `${date.getFullYear()}-${(date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1))}-${date.getDate() < 10 ? '0' + date.getDate() : date.getDate()}T00:00:00+00:00`
        }
}
fetch("https://api.crowdin.com/api/v2/projects/442446/reports", {
    method: "post",
    body: JSON.stringify(body),
    headers: {
        "Authorization": "Bearer 8f5c5b1bcb8c7e7500a669338cc591f4a140f1ce0071ff17a8cd7e353c95be8ba502db352b2f6068",
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
                "Authorization": "Bearer 8f5c5b1bcb8c7e7500a669338cc591f4a140f1ce0071ff17a8cd7e353c95be8ba502db352b2f6068",
            },
        }).then(res => res.json())
            .then(json => {
                if (json.data.status === "finished") {
                    fetch(`https://api.crowdin.com/api/v2/projects/442446/reports/${json.data.identifier}/download`, {
                        method: "get",
                        headers: {
                            "Authorization": "Bearer 8f5c5b1bcb8c7e7500a669338cc591f4a140f1ce0071ff17a8cd7e353c95be8ba502db352b2f6068",
                        },
                    }).then(res => res.json())
                        .then(json => {
                            console.log("取得報告成功，正在開始下載報告")
                            let stream = fs.createWriteStream(path.join("./opt.csv"));
                            Request(json.data.url).pipe(stream).on("close", function (err) {
                                    if (err) {
                                        return console.log("下載時發生未知錯誤: " + err);
                                    }
                                    fs.createReadStream('./opt.csv')
                                        .pipe(csv.parse())
                                        .on('error', error => console.error(error))
                                        .on('data', row => {
                                            userName = userName.concat(row[0]);
                                            word = word.concat(row[2]);
                                            Voted = Voted.concat(row[4]);
                                            console.log(`翻譯貢獻者名稱: ${row[0]} 翻譯字數: ${row[2]} 投票次數: ${row[4]}`);
                                        })
                                        .on('end', rowCount => {
                                            console.log(`處理完成，共有 ${rowCount - 1} 個翻譯貢獻者，正在寫入檔案...`)
                                            let data = {
                                                userName: userName,
                                                word: word,
                                                Voted: Voted
                                            }
                                            fs.writeFile(`./opt.json`, JSON.stringify(data, 4, null), function (err) {
                                                if (err) {
                                                    return console.log("寫入檔案時，發生未知錯誤");
                                                }
                                                console.log("成功寫入，腳本執行完畢。")
                                            })
                                        });
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
