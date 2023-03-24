mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(notdir $(patsubst %/,%,$(dir $(mkfile_path))))

hello:
	echo "Hello, World"

pages:
	make mainsitemap
	make lightsmap
	make webdev
	make miscellaneous
	make datascience
	make remainder
	
mainsitemap:
	node ./src/convert_sitemap.mjs ./src/ipynb/ ./src/posts/ mapsitemap index,lights,miscellaneous,webdev,datascience

lightsmap:
	node ./src/convert_sitemap.mjs ./src/ipynb/ ./src/posts/ maplights index,lights,aboutlights

miscellaneous:
	node ./src/convert_sitemap.mjs ./src/ipynb/ ./src/posts/ mapmiscellaneous index,miscellaneous

webdev:
	node ./src/convert_sitemap.mjs ./src/ipynb/ ./src/posts/ mapwebdev index,webdev

datascience:
	node ./src/convert_sitemap.mjs ./src/ipynb/ ./src/posts/ mapdatascience index,datascience

remainder:
	node ./src/convert_sitemap.mjs ./src/ipynb/ ./src/posts/ mapremainder legal,aboutmysite,aboutme
