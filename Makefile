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
	node ../../packages/ipynb2web/src/cli.js '' './rsc/posts/' './ipynb' '' './rsc/posts/assets'
	
blog:
	node ../../packages/ipynb2web/src/cli.js blog ./rsc/posts/ ./ipynb/ '' './rsc/posts/assets'

datascience:
	node ../../packages/ipynb2web/src/cli.js datascience ./rsc/posts/ ./ipynb/ '' './rsc/posts/assets'

labs:
	node ../../packages/ipynb2web/src/cli.js labs ./rsc/posts/ ./ipynb/ '' './rsc/posts/assets'

software:
	node ../../packages/ipynb2web/src/cli.js software ./rsc/posts/ ./ipynb/ '' './rsc/posts/assets'

webdev:
	node ../../packages/ipynb2web/src/cli.js webdev ./rsc/posts/ ./ipynb/ '' './rsc/posts/assets'

sitemap:
	# Generate SEO sitemap from generated *_map.json files in rsc/posts
	node ../../packages/ipynb2web/src/cli.js sitemap './rsc/posts' './sitemap.txt' 'docs' 'charleskarpati.com'
	echo "http://charleskarpati.com/index" >> ./sitemap.txt
	echo "http://charleskarpati.com/404" >> ./sitemap.txt
	sed -i 's/$$/.html/' ./sitemap.txt
	cp ./sitemap.txt ./rsc/posts/sitemap.txt
