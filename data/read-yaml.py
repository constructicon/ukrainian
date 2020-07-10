import yaml
import pprint

with open("0017.yml", "r") as f:
    try:
        data = yaml.safe_load(f)
    except yaml.YAMLError as e:
        print(e)

pprint.pprint(data)
