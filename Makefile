mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(notdir $(patsubst %/,%,$(dir $(mkfile_path))))

hello:
	echo "Hello, World"

# needs file by name of mapname in root of path
# convert_section_map.mjs - cli call starts server then kicks of main fn() cv_cli_nbs2html 
# cv_cli_nbs2html - uses cli arg provided to get all ipynb in a path, calls generate_sectionmap
# generate_sectionmap - create 'router+_map.json', calls ipynb_publish for filenames. 
# ipynb_publish uses convert.mjs?type=module if not meta.hide and converts the filename from/to yaml

pages:
	make mainsitemap
	make lights
	make software
	make notes 
	make dataplay
	make labs
	make blog
	make node src/client/utils/create_sitemap.mjs
	
sitemap:
	node ./src/client/utils/convert_section_map.mjs
	
mainsitemap:
    # Function: Creates a sitemap and the corresponding series of pages
    # Args: input output mapname file,file,files..
	node ./src/client/utils/convert_section_map.mjs 
	
labs:
	node ./src/client/utils/convert_section_map.mjs labs

dataplay:
	node ./src/client/utils/convert_section_map.mjs dataplay

lights:
	node ./src/client/utils/convert_section_map.mjs lights

notes:
	node ./src/client/utils/convert_section_map.mjs notes

software:
	node ./src/client/utils/convert_section_map.mjs software

blog:
	node ./src/client/utils/convert_section_map.mjs blog
