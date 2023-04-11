mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(notdir $(patsubst %/,%,$(dir $(mkfile_path))))

hello:
	echo "Hello, World"

pages:
	make mainsitemap
	make lights
	make webdev
	make miscellaneous 
	make dataguide
	make dataplay
	make datalabs
	make sitemap
	
sitemap:
	node ./src/create_sitemap.mjs
	
mainsitemap:
    # Function: Creates a sitemap and the corresponding series of pages
    # Args: input output mapname file,file,files..
	node ./src/convert_sitemap.mjs 

dataguide:
	node ./src/convert_sitemap.mjs dataguide
	
datalabs:
	node ./src/convert_sitemap.mjs datalabs

dataplay:
	node ./src/convert_sitemap.mjs dataplay

lights:
	node ./src/convert_sitemap.mjs lights

miscellaneous:
	node ./src/convert_sitemap.mjs miscellaneous

webdev:
	node ./src/convert_sitemap.mjs webdev

blog:
	node ./src/convert_sitemap.mjs blog
