const request = require('request');
const fs = require('fs');

const VersionIndex = ["1.12", "1.16", "1.17"]

const VersionBrancheID = {
    "1.12": "37100",
    "1.16": "14694",
    "1.17": "33890"
}

let index = 1;
function RunLoop() {
    GetVersionIndex(VersionIndex[0]);
    setTimeout(function () {
        GetVersionIndex(VersionIndex[index]);
        index++;
        if (index < VersionIndex.length) {
            RunLoop();
        }
    }, 30e4) //每五分鐘執行一個版本的數據
}
RunLoop();

function GetVersionIndex(Version) {
    let GitVersion = `Original-${Version}`;
    if (GitVersion === "Original-1.16") {
        GitVersion = "Original"
    }
    let options = {
        'method': 'GET',
        'url': `https://raw.githubusercontent.com/RPMTW/ResourcePack-Mod-zh_tw/${GitVersion}/${Version}/CurseForgeIndex.json`,
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        Run(JSON.parse(response.body), VersionBrancheID[Version])
    });

    function Run(json, branchId) {
        let ModIDList = Object.keys(json);
        var i = 0;
        function CrowdinLoop() {
            setTimeout(function () {
                CrowdinRequst(ModIDList, branchId, i, json, Version),
                    i++;
                if (i < ModIDList.length) {
                    CrowdinLoop();
                }
            }, 800) //每8百毫秒執行一次
        }
        CrowdinLoop();
    }
}


function CrowdinRequst(ModIDList, branchId, i, json, Version) {
    let options = {
        'method': 'GET',
        'url': `https://api.crowdin.com/api/v2/projects/442446/directories/?branchId=${branchId}&recursion&limit=1&filter=${ModIDList[i]}`,
        'headers': {
            'Authorization': `Bearer ${process.env.CrowdinToken}`,
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        let CrowdinData = JSON.parse(response.body).data[0].data;
        let CrowdinDirName = CrowdinData.name;
        if (CrowdinDirName === ModIDList[i]) {
            GetModTranslationProgress(CrowdinData.id, ModIDList, i, json, Version);
        }
    });
}

function GetModTranslationProgress(DirID, ModIDList, i, json, Version) {
    let options = {
        'method': 'GET',
        'url': `https://api.crowdin.com/api/v2/projects/442446/directories/${DirID}/languages/progress/?limit=1`,
        'headers': {
            'Authorization': `Bearer ${process.env.CrowdinToken}`,
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        let CrowdinData = JSON.parse(response.body).data[0].data;

        let TranslationProgress = (CrowdinData.words.translated / CrowdinData.words.total * 100).toFixed(3) + "%";
        /*
        json[data] = CurseForge ID
        ModIDList[i] = ModID
        */
        let index = {};
        index[json[ModIDList[i]]] = {
            "ModID": ModIDList[i],
            "Progress": TranslationProgress,
        }
        let before = {};
        if (fs.existsSync(`${process.cwd()}/data/CrowdinIndex-${Version}.json`)) {
            before = JSON.parse(fs.readFileSync(`${process.cwd()}/data/CrowdinIndex-${Version}.json`).toString());
        } else {
            fs.writeFileSync(`${process.cwd()}/data/CrowdinIndex-${Version}.json`, "{}");
        }
        let NewData = JSON.stringify(Object.assign({}, before, index), null, 4)
        fs.writeFileSync(`${process.cwd()}/data/CrowdinIndex-${Version}.json`, NewData, function (error) {
            if (error) {
                console.log(`寫入模組翻譯索引檔案時發生未知錯誤\n錯誤原因: ${error}`);
            }else{
            console.log(`處理 ${ModIDList[i]} 的翻譯索引檔案完成`)
            }
        })
    }
    );
}
