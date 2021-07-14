import json

import requests
from crowdin_api import CrowdinClient
from crowdin_api.exceptions import NotFound

project_id = 442446
token = os.environ['TOKEN']
#token = "5a1be4e807d52e890764a641b81c694b73e94c5dce47a172f1ead0a591694a0a7cfb3212a4dfeaa1"
header = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'}
with open('config.json') as json_config:
    config = json.load(json_config)
curseforge_result = []
i = 0
if int(config["modCount"]) <= 50:
    curseforge_result = curseforge_result + requests.get(
        "https://addons-ecs.forgesvc.net/api/v2/addon/search?categoryId=0&gameId=432&index={}&pageSize={}&gameVersion={}&sectionId=6&sort=1".format(
            0,
            config["modCount"], config["ver"]), headers=header, timeout=None).json()
else:
    number = int(config["modCount"]) / 50
    if type(number) == float:
        for i in range(int(number)):
            curseforge_result = curseforge_result + requests.get(
                "https://addons-ecs.forgesvc.net/api/v2/addon/search?categoryId=0&gameId=432&index={}&pageSize={}&gameVersion={}&sectionId=6&sort=1".format(
                    i,
                    50, config["ver"]), headers=header, timeout=None).json()
        curseforge_result = curseforge_result + requests.get(
            "https://addons-ecs.forgesvc.net/api/v2/addon/search?categoryId=0&gameId=432&index={}&pageSize={}&gameVersion={}&sectionId=6&sort=1".format(
                i + 1,
                50, config["ver"]), headers=header, timeout=None).json()[:int(int(config["modCount"]) - (50 * number))]
print(len(curseforge_result))
class FirstCrowdinClient(CrowdinClient):
    TOKEN = token


mod_list = []
curseforge_mod_slug_list = []
client = FirstCrowdinClient()
file_list = client.source_files.list_files(project_id, limit=500)
folder_list = client.source_files.list_directories(project_id, limit=500)
progress = {}
slug_name = {}
slug_id = {}
translated_mod = {}
print("Translated percentage:")
add = 0
for index_ in range(len(folder_list["data"])):
    if file_list["data"][index_ + add]["data"]["name"] == "zh_tw.json":
        translated_mod[folder_list["data"][index_]["data"]["name"]] = file_list["data"][index_ + add]["data"][
            "directoryId"]  # Will break when more that one file in the same dir, not a permanent solution
    else:
        while file_list["data"][index_]["data"]["name"] == "zh_tw.json":
            print("Non-translation file detected")
            add = add + 1
print(translated_mod)
for curseforge_result_i in curseforge_result:
    if curseforge_result_i["slug"] in translated_mod.keys():
        print(curseforge_result_i["slug"])
        mod_list.append(curseforge_result_i["slug"])
        mod_list.append(curseforge_result_i["id"])
        mod_list.append(curseforge_result_i["name"])
        dirId = translated_mod[curseforge_result_i["slug"]]
        try:
            file_progress = client.translation_status.get_directory_progress(project_id, dirId)
            progress[curseforge_result_i["slug"]] = file_progress["data"][0]["data"]["translationProgress"]
            progress[curseforge_result_i["id"]] = file_progress["data"][0]["data"]["translationProgress"]
            progress[curseforge_result_i["name"]] = file_progress["data"][0]["data"]["translationProgress"]
        except NotFound:
            print("Non-dir")
        except Exception as e:
            print("Unexpected error:" + str(e))
with open("progress.txt", "w")as pf:
    pf.write(str(json.dumps(progress, indent=None)))

"""
print("Translated percentage:")
for iiii in curseforge_result:
    curseforge_mod_slug_list.append(iiii["slug"])
    slug_name[iiii["slug"]] = iiii["name"]
    slug_id[iiii["slug"]] = iiii["id"]
for iiiii in file_list["data"]:
    filepath = iiiii["data"]["path"]
    try:
        fileprogress = client.translation_status.get_directory_progress(project_id, iiiii["data"]["directoryId"])
        for iiiiii in filepath.split("/"):
            if iiiiii in curseforge_mod_slug_list:
                print(iiiiii)
                progress[iiiiii] = fileprogress["data"][0]["data"]["translationProgress"]
                progress[slug_name[iiiiii]] = fileprogress["data"][0]["data"]["translationProgress"]
                progress[slug_id[iiiiii]] = fileprogress["data"][0]["data"]["translationProgress"]
    except NotFound:
        print("Non-dir")
    except Exception as e:
        print("Unexpected error:" + e)
with open("progress.txt", "w")as pf:
    pf.write(str(json.dumps(progress, indent=None)))
b = client.translations.export_project_translation(project_id, "zh-TW", format=ExportProjectTranslationFormat.ANDROID)
print("Translated percentage:")
wget.download(b["data"]["url"])
with open("RPMTW.xml", "r") as file:
    content = file.readlines()
    content = "".join(content)
    bs_ = bs(content, "lxml")
all_data = bs_.find_all("string")
for i in all_data:
    for ii in i["name"].split("."):
        if ii in curseforge_mod_slug_list and ii not in mod_list:
            print(ii)
            mod_list.append(ii)
            mod_list.append(slug_name[ii])
            mod_list.append(str(slug_id[ii]))
with open("supported_mod.txt", "w") as f:
    f.write(",".join(mod_list))
os.remove("RPMTW.xml")
# print(mod_list)
# print(progress)
"""
