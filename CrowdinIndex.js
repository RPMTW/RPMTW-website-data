const fetch = require('node-fetch');
const fs = require('fs');

const VersionBranchID = {
    "1.12": "37100",
    "1.16": "14694",
    "1.17": "33890"
}
const __Versions__ = Object.keys(VersionBranchID)

let nowVersion = 2
let Token = "5ab136d1a21a139a709461f914d5a0b7cec77e40416d9e93912e1816ce9c4074c308d2efbf4bf2e6"

function start(Version) {
    let nowMod = 0
    let mods = null
    let modNames = null

    /* GET all mods */
    fetch(`https://raw.githubusercontent.com/RPMTW/ResourcePack-Mod-zh_tw/${{ "1.16": "Original" }[Version] || `Original-${Version}`}/${Version}/CurseForgeIndex.json`, {
        method: "get"
    }).then((res) => res.json()).then((json) => {
        mods = json
        modNames = Object.keys(json)
        getCrowdinID()
    }).catch((error) => console.log(error))

    function getCrowdinID() {
        fetch(`https://api.crowdin.com/api/v2/projects/442446/directories/?branchId=${VersionBranchID[Version]}&recursion&limit=1&filter=${modNames[nowMod]}`, {
            method: "get",
            headers: {
                "Authorization": `Bearer ${process.env.CrowdinToken || Token}`,
            }
        }).then((res) => res.json()).then((json) => {
            if (json.data && json.data[0]) {
                getData(json.data[0].data.id)
            } else {
                end()
            }
        }).catch(error => console.log(error))
    }

    function getData(CrowdinId) {
        fetch(`https://api.crowdin.com/api/v2/projects/442446/directories/${CrowdinId}/languages/progress/?limit=1`, {
            method: "get",
            headers: {
                "Authorization": `Bearer ${process.env.CrowdinToken || Token}`,
            }
        }).then((res) => res.json()).then((json) => {
            if (json.data && json.data[0]) {
                write(json.data[0].data, CrowdinId)
            } else {
                end()
            }
        }).catch(error => console.log(error))
    }

    function write(data, CrowdinId) {
        /* {
            "CurseID": {
                ModName: "模組Name",
                ModID: "模組ID",
                Progress: "進度%"
            }
        } */
        let index = {};
        index[CrowdinId] = {
            "ModName": modNames[nowMod],
            "ModId": mods[modNames[nowMod]],
            "Progress": (data.words.translated / data.words.total * 100).toFixed(3) + "%"
        };
        let before = {};
        if (fs.existsSync(`${process.cwd()}/data/CrowdinIndex-${Version}.json`)) {
            before = JSON.parse(fs.readFileSync(`${process.cwd()}/data/CrowdinIndex-${Version}.json`).toString());
        } else {
            fs.writeFileSync(`${process.cwd()}/data/CrowdinIndex-${Version}.json`, "{}");
        }

        let NewData = JSON.stringify(Object.assign({}, before, index))
        fs.writeFileSync(`${process.cwd()}/data/CrowdinIndex-${Version}.json`, NewData, function (error) {
            if (error) {
                console.log(`寫入模組翻譯索引檔案時發生未知錯誤，錯誤原因: ${error}`);
            }
        })
        console.log(`處理 ${modNames[nowMod]} 的翻譯索引檔案完成`)
        end()
    }

    function end() {
        if (++nowMod < modNames.length) {
            setTimeout(function () {
                getCrowdinID()
            }, 1e3 * 10) // mod and mod <-> 10s
        } else {
            setTimeout(() => {
                ++nowVersion < __Versions__.length && start(__Versions__[nowVersion])
            }, 1e3 * 60 * 5) // version and version <-> 5min
        }
    }
}

start(__Versions__[nowVersion])