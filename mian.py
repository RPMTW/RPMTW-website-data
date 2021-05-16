import json
import requests
from bs4 import BeautifulSoup as bs
from crowdin_api import CrowdinClient
project_id = 442446
with open("token.txt","r") as token_file:
    token=token_file.read()
header = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'}
with open('config.json') as json_config:
    config = json.load(json_config)
curseforge_result = requests.get(
    'https://addons-ecs.forgesvc.net/api/v2/addon/search?categoryId=0&gameId=432&index=0&pageSize={}&gameVersion={}&sectionId=6&sort=1'.format(
        config["modCount"], config["ver"]), headers=header).json()
class FirstCrowdinClient(CrowdinClient):
    TOKEN = token

mod_list=[]
curseforge_mod_slug_list=[]
client = FirstCrowdinClient()
projects = client.projects.get_project(project_id)
progress = client.translation_status.get_project_progress(project_id, ["zh-TW"])
# b=client.translations.export_project_translation(project_id,"zh-TW",format=ExportProjectTranslationFormat.ANDROID)
# wget.download(b["data"]["url"])
for iii in curseforge_result:
    curseforge_mod_slug_list.append(iii["slug"])
with open("RPMTW.xml", "r") as file:
    content = file.readlines()
    content = "".join(content)
    bs_ = bs(content, "lxml")
all_data = bs_.find_all("string")
for i in all_data:
    for ii in i["name"].split("."):
        if ii in curseforge_mod_slug_list and ii not in mod_list:
            mod_list.append(ii)
with open("supported_mod.txt","w") as f:
    f.write(",".join(mod_list))
print(mod_list)
print(progress)
