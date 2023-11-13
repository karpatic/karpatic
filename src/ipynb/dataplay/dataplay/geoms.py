# @title Run: Import Modules

# These imports will handle everything
import os
import sys
import csv
import numpy as np
import pandas as pd
import pyproj
from pyproj import Proj, transform
# conda install -c conda-forge proj4
from shapely.geometry import LineString
# from shapely import wkb
# https://pypi.org/project/geopy/
import folium

# In case file is KML, enable support
import fiona
fiona.drvsupport.supported_drivers['kml'] = 'rw'
fiona.drvsupport.supported_drivers['KML'] = 'rw'

import psycopg2
import pandas as pd
import geopandas as gpd
from geopandas import GeoDataFrame
from shapely.geometry import Point
from shapely.wkt import loads
from geopy.geocoders import Nominatim
from IPython.display import clear_output
from folium import plugins
from folium.plugins import TimeSliderChoropleth 
from folium.plugins import MarkerCluster
from dataplay import intaker 
from dataplay import merge
#
# Work With Geometry Data
# Description: geomSummary, getPointsInPolygons, getPolygonOnPoints, mapPointsInPolygons, getCentroids
#
def workWithGeometryData(method=False, df=False, polys=False, ptsCoordCol=False, polygonsCoordCol=False, polyColorCol=False, polygonsLabel='polyOnPoint', pntsClr='red', polysClr='white', interactive=False):
  def geomSummary(df): return type(df), df.crs, df.columns;
  def getCentroid(df, col): return df[col].representative_point() # df['geometry'].centroid

  # To 'import' a script you wrote, map its filepath into the sys
  def getPolygonOnPoints(pts, polygons, ptsCoordCol, polygonsCoordCol, polygonsLabel, interactive):
      count = 0
      # We're going to keep a list of how many points we find.
      boundaries = []

      # Loop over polygons with index i.
      for i, pt in pts.iterrows():
          # print('Searching for point within Geom:', pt )
          # Only one Label is accepted.
          poly_on_this_point = []
          # Now loop over all polygons with index j.
          for j, poly in polygons.iterrows():
              if poly[polygonsCoordCol].contains(pt[ptsCoordCol]):
                  # Then it's a hit! Add it to the list
                  poly_on_this_point.append(poly[polygonsLabel])
                  count = count + 1
                  # pts = pts.drop([j])

          # We could do all sorts, like grab a property of the
          # points, but let's just append the number of them.
          boundaries.append(poly_on_this_point)
          clear_output(wait=True)

      # Add the number of points for each poly to the dataframe.
      pts = pts.assign(CSA2010 = boundaries)
      if (interactive):
        print( 'Total Points: ', (pts.size / len(pts.columns) ) )
        print( 'Total Points in Polygons: ', count )
        print( 'Prcnt Points in Polygons: ', count / (pts.size / len(pts.columns) ) )
      return pts

  # To 'import' a script you wrote, map its filepath into the sys
  def getPointsInPolygons(pts, polygons, ptsCoordCol, polygonsCoordCol, interactive):
    count = 0
    total = pts.size / len(pts.columns)
    # We're going to keep a list of how many points we find.
    pts_in_polys = []

    # Loop over polygons with index i.
    for i, poly in polygons.iterrows():
        # print('Searching for point within Geom:', poly )
        # Keep a list of points in this poly
        pts_in_this_poly = 0

        # Now loop over all points with index j.
        for j, pt in pts.iterrows():
            if poly[polygonsCoordCol].contains(pt[ptsCoordCol]):
                # Then it's a hit! Add it to the list,
                pts_in_this_poly += 1
                # and drop it so we have less hunting. # pts = pts.drop([j])

        # We could do all sorts, like grab a property of the
        # points, but let's just append the number of them.
        pts_in_polys.append(pts_in_this_poly)
        if (interactive): print('Found this many points within the Geom:', pts_in_this_poly )
        count += pts_in_this_poly
        clear_output(wait=True)

    # Add the number of points for each poly to the dataframe.
    polygons['pointsinpolygon'] = gpd.GeoSeries(pts_in_polys)
    if (interactive):
      print( 'Total Points: ', total )
      print( 'Total Points in Polygons: ', count )
      print( 'Prcnt Points in Polygons: ', count / total )
    return polygons

  def mapPointsandPolygons(pnts, polys, pntsCl, polysClr, polyColorCol):
    print('mapPointsandPolygons');
    # We restrict to South America.
    ax = 1
    if polyColorCol:
      ax = polys.plot( column=polyColorCol, legend=True)
    else:
      ax = polys.plot( color=polysClr, edgecolor='black')

    # We can now plot our ``GeoDataFrame``.
    pnts.plot(ax=ax, color=pntsClr)

    return plt.show()

  if method=='summary': return geomSummary(df);
  if method=='ponp': return getPolygonOnPoints(df, polys, ptsCoordCol, polygonsCoordCol, polygonsLabel, interactive);
  if method=='pinp': return getPointsInPolygons(df, polys, ptsCoordCol, polygonsCoordCol, interactive);
  if method=='pandp': return mapPointsandPolygons(df, polys, pntsClr, polysClr, polyColorCol);
  if method=='centroid': return getCentroid(df, col);

# reverseGeoCode, readFile, getGeoParams, main
def readInGeometryData(url=False, porg=False, geom=False, lat=False, lng=False, revgeocode=False,  save=False, in_crs=4326, out_crs=False):

  def reverseGeoCode(df, lat ):
    # STREET	CITY	STATE ZIP NAME
    # , format_string="%s, BALTIMORE MD"
    geometry = []
    geolocator = Nominatim(user_agent="my-application")
    for index, row in df.iterrows():
      try:
          geol = geolocator.geocode(row[lat], timeout=None)
          pnt = Point(geol.longitude, geol.latitude)
          geometry.append(pnt)
      except:
          geometry.append(Point(-76, 39) )
          print(row[lat]);
    return geometry

  def readFile(url, geom, lat, lng, revgeocode, in_crs, out_crs):
    df = False
    gdf = False
    ext = isinstance(url, pd.DataFrame)
    if ext: ext='csv'
    else: ext = url[-3:]

    #XLS
    # b16 = pd.read_excel('Jones.BirthsbyCensus2016.XLS', sheetname='Births')

    # The file extension is used to determine the appropriate import method.
    if ext in ['son', 'kml', 'shp', 'pgeojson']: gdf = gpd.read_file(url)
    if ext == 'csv':
      df = url if isinstance(url, pd.DataFrame) else pd.read_csv(url)
      # Read using Geom, Lat, Lat/Lng, revGeoCode
      if revgeocode=='y': df['geometry'] = reverseGeoCode(df, lat)
      elif geom: df['geometry'] = df[geom].apply(lambda x: loads( str(x) ))
      elif lat==lng: df['geometry'] = df[lat].apply(lambda x: loads( str(x) ))
      elif lat!=lng: df['geometry'] = gpd.points_from_xy(df[lng], df[lat]);

      gdf = GeoDataFrame(df, crs=in_crs, geometry='geometry') #crs=2248
      if not out_crs == in_crs: gdf = gdf.to_crs(epsg=out_crs)
    return gdf

  def getGeoParams(url, porg, geom, lat, lng, revgeocode, save, in_crs, out_crs):
    addr=False

    if not url: url = input("Please enter the location of your dataset: " )
    # if url[-3:] == 'csv' :
    #   df = pd.read_csv(url,index_col=0,nrows=1)
    #   print(df.columns)

    # Geometries inside
    if geom and not (lat and lng): porg = 'g'
    # Point data inside
    elif not geom and lat or lng:
      porg = 'p';
      if not lat: lat = lng
      if not lng: lng = lat

    # If the P/G could not be infered...
    if not (porg in ['p', 'g']):
      if not revgeocode in ['y', 'n']: revgeocode = input("Do your records need reverse geocoding: (Enter: y/n') " )
      if revgeocode == 'y': porg = 'p'; lng = lat = input("Please enter the column name where the address is stored: " );
      elif revgeocode == 'n': porg = input("""Do the records in this dataset use (P)oints or (g)eometric polygons?: (Enter: 'p' or 'g') """ );
      else: return getGeoParams(url, porg, geom, lat, lng, revgeocode, save, in_crs, out_crs);

      if porg=='p':
          if not lat: lat = input("Please enter the column name where the latitude coordinate is stored: " );
          if not lng: lng = input("Please enter the column name where the longitude cooridnate is stored: (Could be same as the lat) " );
      elif porg=='g':
        if not geom: geom = input("Please enter column name where the geometry data is stored: (*optional, skip if unkown)" );
      else: return getGeoParams(url, porg, geom, lat, lng, revgeocode, save, in_crs, out_crs)

    if not out_crs: out_crs=in_crs

    return url, porg, geom, lat, lng, revgeocode, save, in_crs, out_crs

  # This function uses all the other functions
  def main(url, porg, geom, lat, lng, revgeocode, save, in_crs, out_crs):

    # Check for missing values. retrieve them
    if (isinstance(url, pd.DataFrame)): print('Converting DF to GDF')
    elif (not (url and porg) ) or (
        not (porg == 'p' or porg == 'g') ) or (
        porg == 'g' and not geom) or (
        porg == 'p' and (not (lat and lng) ) ):
      return readInGeometryData( *getGeoParams(url, porg, geom, lat, lng, revgeocode, save, in_crs, out_crs) );

    # print(f"RECIEVED url: {url}, \r\n porg: {porg}, \r\n geom: {geom}, \r\n lat: {lat}, \r\n lng: {lng}, \r\n revgeocode: {revgeocode}, \r\n in_crs: {in_crs}, \r\n out_crs: {out_crs}")

    # Quit if the Columns dont exist -> CSV Only
    # status = checkColumns(url, geom, lat, lng)
    # if status == False: print('A specified column does not exist'); return False;

    # Perform operation
    gdf = readFile(url, geom, lat, lng, revgeocode, in_crs, out_crs)

    # Tidy up

    # Save
    # if save: saveGeoData(gdf, url, fileName, driver='esri')

    return gdf

  return main(url, porg, geom, lat, lng, revgeocode, save, in_crs, out_crs)
# draw_heatmap, cluster_points, plot_points,
def map_points(data, lat_col='POINT_Y', lon_col='POINT_X', zoom_start=11, plot_points=True, cluster_points=False,
               pt_radius=15, draw_heatmap=False, heat_map_weights_col=None, heat_map_weights_normalize=True,
               heat_map_radius=15, popup=False):
    """Creates a map given a dataframe of points. Can also produce a heatmap overlay

    Arg:
        df: dataframe containing points to maps
        lat_col: Column containing latitude (string)
        lon_col: Column containing longitude (string)
        zoom_start: Integer representing the initial zoom of the map
        plot_points: Add points to map (boolean)
        pt_radius: Size of each point
        draw_heatmap: Add heatmap to map (boolean)
        heat_map_weights_col: Column containing heatmap weights
        heat_map_weights_normalize: Normalize heatmap weights (boolean)
        heat_map_radius: Size of heatmap point

    Returns:
        folium map object
    """
    df = data.copy()
    ## center map in the middle of points center in
    middle_lat = df[lat_col].median()
    middle_lon = df[lon_col].median()

    curr_map = folium.Map(location=[middle_lat, middle_lon], zoom_start=zoom_start)

    # add points to map
    if plot_points:
      for _, row in df.iterrows():
        # print([row[lat_col], row[lon_col]], row[popup])
        folium.CircleMarker([row[lat_col], row[lon_col]],
          radius=pt_radius,
          popup=row[popup],
          fill_color="#3db7e4", # divvy color
        ).add_to(curr_map)
    if cluster_points:
      marker_cluster = MarkerCluster().add_to(curr_map)
      for index, row in df.iterrows():
        folium.Marker( location=[row[lat_col],row[lon_col]], popup=row[popup], icon=None ).add_to(marker_cluster)

    # add heatmap
    if draw_heatmap:
        # convert to (n, 2) or (n, 3) matrix format
        if heat_map_weights_col is None:
            stations = zip(df[lat_col], df[lon_col])
        else:
            # if we have to normalize
            if heat_map_weights_normalize:
                df[heat_map_weights_col] = \
                    df[heat_map_weights_col] / df[heat_map_weights_col].sum()

            stations = zip(df[lat_col], df[lon_col], df[heat_map_weights_col])

        curr_map.add_child(plugins.HeatMap(stations, radius=heat_map_radius))

    return curr_map