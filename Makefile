mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(notdir $(patsubst %/,%,$(dir $(mkfile_path))))

# needs file by name of mapname in root of path
# convert_section_map.mjs - cli call starts server then kicks of main fn() cv_cli_nbs2html 
# cv_cli_nbs2html - uses cli arg provided to get all ipynb in a path, calls generate_sectionmap
# generate_sectionmap - create 'router+_map.json', calls ipynb_publish for filenames. 
# ipynb_publish uses convert.mjs?type=module if not meta.hide and converts the filename from/to yaml

pages:
	make mainpages 
	make blog
	make datascience
	make labs 
	make software   
	make webdev
	make sitemap 
	
mainpages:
    # Function: Creates a sitemap and the corresponding series of pages
    # Args: input output mapname to from..
	node ./../ipynb2web/src/cli.js '' './rsc/posts/' './ipynb' '' './rsc/posts/assets'
	
blog:
	node ./../ipynb2web/src/cli.js blog ./rsc/posts/ ./ipynb/ '' './rsc/posts/assets'

datascience:
	node ./../ipynb2web/src/cli.js datascience ./rsc/posts/ ./ipynb/ '' './rsc/posts/assets'

labs:
	node ./../ipynb2web/src/cli.js labs ./rsc/posts/ ./ipynb/ '' './rsc/posts/assets'

software:
	node ./../ipynb2web/src/cli.js software ./rsc/posts/ ./ipynb/ '' './rsc/posts/assets'

webdev:
	node ./../ipynb2web/src/cli.js webdev ./rsc/posts/ ./ipynb/ '' './rsc/posts/assets'

sitemap:
	node ./../ipynb2web/src/cli.js sitemap '' './rsc/posts/sitemap.txt' './ipynb' 'docs/' 