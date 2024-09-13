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
	make dataplay
	make labs
	make blog
	make sitemap 

audio:
	node ./../ipynb2web.cli.cjs audio
	
sitemap:
    # Final Step, creates sitemap.txt
	node ./../ipynb2web/src/cli.js sitemap
	
mainpages:
    # Function: Creates a sitemap and the corresponding series of pages
    # Args: input output mapname file,file,files..
	node ./../ipynb2web/src/cli.js 
	
labs:
	node ./..//ipynb2web/src/cli.js labs

dataplay:
	node ./..//ipynb2web/src/cli.js dataplay

lights:
	node ./..//ipynb2web/src/cli.js lights

software:
	node ./..//ipynb2web/src/cli.js software

blog:
	node ./../ipynb2web/src/cli.js blog

watchPages:
	nodemon --watch 'src/ipynb/*' --exec make pages