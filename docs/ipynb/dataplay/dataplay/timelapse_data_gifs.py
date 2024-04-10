import numpy as np
import pandas as pd
from dataplay import merge
from dataplay import intaker
from VitalSigns import acsDownload
#@title Run This Cell: Import Modules

# Once installed we need to import and configure the Widgets
from IPython.core.interactiveshell import InteractiveShell
InteractiveShell.ast_node_interactivity = 'all'
import ipywidgets as widgets
from ipywidgets import interact, interact_manual

# Used 4 Importing Data
import urllib.request as urllib
from urllib.parse import urlencode
# This Prevents Timeouts when Importing
import socket
socket.setdefaulttimeout(10.0)

# Pandas Data Manipulation Libraries
import pandas as pd
# Show entire column widths
pd.set_option('display.max_colwidth', -1)
# 4 Working with Json Data
import json
# 4 Data Processing
import numpy as np
# 4 Reading Json Data into Pandas
from pandas.io.json import json_normalize

# 4 exporting data as CSV
import csv

from VitalSigns.acsDownload import retrieve_acs_data

from dataplay.merge import mergeDatasets

from dataplay.geoms import readInGeometryData
from dataplay.geoms import map_points
from dataplay.geoms import workWithGeometryData

# Geo-Formatting
# Postgres-Conversion
import geopandas as gpd
import psycopg2,pandas,numpy
from shapely import wkb
import os
import sys

# In case file is KML
import fiona
fiona.drvsupport.supported_drivers['kml'] = 'rw' # enable KML support which is disabled by default
fiona.drvsupport.supported_drivers['KML'] = 'rw' # enable KML support which is disabled by default

# https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.2010.html
# https://www.census.gov/cgi-bin/geo/shapefiles/index.php?year=2010&layergroup=Census+Tracts

from geopandas import GeoDataFrame

from shapely.wkt import loads
from pandas import ExcelWriter
from pandas import ExcelFile

# load libraries
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import geopandas as gpd
import glob

# Gif
import imageio

# Pictures
from PIL import Image
import requests
from io import BytesIO
#@title Run This Cell: Misc Function Declarations
# These functions right here are used in the calculations below.
# Finds a column matchings a substring
def getColName  (df, col): return df.columns[df.columns.str.contains(pat = col)][0]
def getColByName (df, col): return df[getColName(df, col)]

# Pulls a column from one dataset into a new dataset.
# This is not a crosswalk. calls getColByName()
def addKey(df, fi, col):
    key = getColName(df, col)
    val = getColByName(df, col)
    fi[key] = val
    return fi
# Return 0 if two specified columns are equal.
def nullIfEqual(df, c1, c2):
    return df.apply(lambda x:
        x[getColName(df, c1)]+x[getColName(df, c2)] if x[getColName(df, c1)]+x[getColName(df, c2)] != 0 else 0, axis=1)
# I'm thinking this doesnt need to be a function..
def sumInts(df): return df.sum(numeric_only=True)
import geopandas as gpd
import numpy as np
import pandas as pd
from dataplay import geoms

# Gif
import imageio

# Pictures
from PIL import Image
import requests
from io import BytesIO
def getMinMax(df):
  mins = df.min().values
  maxs = df.max().values
  print("Min&Max: ", mins, maxs)
  return [mins, maxs]
def getAbsMinMax(df):
  # Get Min Max
  mins, maxs = getMinMax(df)
  return [min(mins), max(maxs)]
def createGif(fileNames, saveGifAs, images):
  print("CREATING GIF")
  # This will print out a picture of each picture in the gifmap as well.
  for filename in fileNames:
      # images.append(imageio.imread(filename))
      img = Image.open(filename)
      size = 328, 328
      img.thumbnail(size, Image.ANTIALIAS)
      print(img)
  imageio.mimsave(saveGifAs, images, fps=.5)
  print("GIF CREATED")
def createPicture(df, col, vmin, vmax, labelBounds, title, annotation, fontsize):
    print( '~~~~~~~~~~~~~~~~ \r\n createPicture for: ', 'Col: '+str(col))

    # create map, UDPATE: added plt.Normalize to keep the legend range the same for all maps
    fig = df.plot(column=col, cmap='Blues', figsize=(10,10),
      linewidth=0.8, edgecolor='0.8', vmin=vmin, vmax=vmax,
      legend=True, norm=plt.Normalize(vmin=vmin, vmax=vmax)
    )

    if labelBounds:
      if type(True) == type(labelBounds): labelBounds = col
      print('Adding Label: ', labelBounds)
      df.apply(lambda x: fig.annotate(s=x[labelBounds], xy=x['geometry'].centroid.coords[0], ha='center') if x.geometry else False ,axis=1);
    # remove axis off chart and set title
    fig.axis('off')

    print('Setting Title: ', title)
    fig.set_title(str(col.replace("final", title)), fontdict={'fontsize': fontsize, 'fontweight' : '3'})

    print('Setting Data-Source Annotation: ', annotation)
    fig.annotate(annotation, xy=(0.1, .08), xycoords='figure fraction', horizontalalignment='left', verticalalignment='top', fontsize=10, color='#555555')

    # this will save the figure as a high-res png in the output path. you can also save as svg if you prefer.
    # filepath = os.path.join(output_path, image_name)
    print('Get Figure: ')
    chart = fig.get_figure()
    # fig.savefig(“map_export.png”, dpi=300)
    print('Save Figure: ')
    chart.savefig( str(col)+".png" , dpi=300)
    print('Saved & Finished.')
    plt.close(chart)

    return ''
def createGifMap(df, saveGifAs, labelBounds, title, annotation, fontsize):
  # set the min and max range for the choropleth map
  print('createGifMap')
  vmin, vmax = getAbsMinMax( df.filter(regex="final") )

  print('Creating Pictures')
  fileNames = []
  images = []
  # For each column
  for indx, col in enumerate( df.filter( regex="final").columns ):
    createPicture(df, col, vmin, vmax, labelBounds, title, annotation, fontsize)
    print('Adding to images list')
    images.append(imageio.imread(str(col)+".png"))
  print( '~~~~~~~~~~~~~~~~ \r\n Saving images to !')

  createGif(fileNames, saveGifAs, images)