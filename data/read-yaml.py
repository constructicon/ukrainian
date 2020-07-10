import yaml
import pprint

with open("example.yaml", "r") as f:
    try:
        data = yaml.safe_load(f)
    except yaml.YAMLError as e:
        print(e)

pprint.pprint(data)
pprint.pprint(data[165])
pprint.pprint(data[17])
