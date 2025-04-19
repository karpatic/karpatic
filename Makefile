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
	make sitemap 
	make mainpages 
	make blog
	make datascience
	make labs 
	make software   
	make webdev

audio:
	node ./../ipynb2web.cli.cjs audio
	
sitemap:
    # Final Step, creates sitemap.txt
	node ./../ipynb2web/src/cli.js sitemap 
	
mainpages:
    # Function: Creates a sitemap and the corresponding series of pages
    # Args: input output mapname file,file,files..
	node ./../ipynb2web/src/cli.js '' './src/posts/' './src/ipynb'
	
blog:
	node ./../ipynb2web/src/cli.js blog ./src/posts/ ./src/ipynb/

datascience:
	node ./../ipynb2web/src/cli.js datascience ./src/posts/ ./src/ipynb/
	
labs:
	node ./..//ipynb2web/src/cli.js labs ./src/posts/ ./src/ipynb/

software:
	node ./..//ipynb2web/src/cli.js software ./src/posts/ ./src/ipynb/

webdev:
	node ./..//ipynb2web/src/cli.js webdev ./src/posts/ ./src/ipynb/
 
watchPages:
	nodemon --watch 'src/ipynb/*' --exec make pages