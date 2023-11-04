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
	make mainpages
	make lights
	make software
	make notes 
	make dataplay
	make labs
	make blog
	make sitemap
	
sitemap:
    # Final Step, creates sitemap.txt
	node ./src/server/prerender.mjs sitemap
	
mainpages:
    # Function: Creates a sitemap and the corresponding series of pages
    # Args: input output mapname file,file,files..
	node ./src/server/prerender.mjs 
	
labs:
	node ./src/server/prerender.mjs labs

dataplay:
	node ./src/server/prerender.mjs dataplay

lights:
	node ./src/server/prerender.mjs lights

notes:
	node ./src/server/prerender.mjs notes

software:
	node ./src/server/prerender.mjs software

blog:
	node ./src/server/prerender.mjs blog
