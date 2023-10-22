mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(notdir $(patsubst %/,%,$(dir $(mkfile_path))))

hello:
	echo "Hello, World"

pages:
	make mainsitemap
	make lights
	make software
	make notes 
	make dataplay
	make labs
	make blog
	
sitemap:
	node ./src/client/utils/convert_sitemap.mjs
	
mainsitemap:
    # Function: Creates a sitemap and the corresponding series of pages
    # Args: input output mapname file,file,files..
	node ./src/client/utils/convert_sitemap.mjs 
	
labs:
	node ./src/client/utils/convert_sitemap.mjs labs

dataplay:
	node ./src/client/utils/convert_sitemap.mjs dataplay

lights:
	node ./src/client/utils/convert_sitemap.mjs lights

notes:
	node ./src/client/utils/convert_sitemap.mjs notes

software:
	node ./src/client/utils/convert_sitemap.mjs software

blog:
	node ./src/client/utils/convert_sitemap.mjs blog
