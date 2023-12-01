import geopandas as gpd
import numpy as np
import pandas as pd
# conditionally loaded ->  from dataplay import geoms

# The intaker class retrieves data into a pandas dataframe.
# Can read in a CSV URL but uses dataplay.geom.readInGeometryData() for Geojson endpoints.
# Otherwise this tool assumes shp or pgeojson files have geom='geometry', in_crs=2248. 
# Depending on interactivity the values should be 
# coerce fillna(-1321321321321325)
class Intake:

  # 1. Recursively calls self/getData until something valid is given.
  #    Returns df or False. Calls readInGeometryData. or pulls csv directly.
  # Returns df or False.
  def getData(url, interactive=False):
    escapeQuestionFlags = ["no", '', 'none']
    if ( Intake.isPandas(url) ): return url
    if (str(url).lower() in escapeQuestionFlags ): return False
    # if interactive: print('Getting Data From: ', url)
    try:
      isGeom = False
      if  ('csv' in url): 
        df = pd.read_csv( url )
        # check if 'geometry' is a column
        if (Intake.checkColumn(df, 'geometry')): 
          isGeom = True
      if (isGeom or [ele for ele in ['pgeojson', 'shp', 'geojson'] if(ele in url)]):
        # print('importing geoms', url)
        from dataplay import geoms
        # print(f'using readInGeometryData using args: url=${url}, porg=False, geom=\'geometry\', lat=False, lng=False, revgeocode=False,  save=False, in_crs=2248, out_crs=False' )
        df = geoms.readInGeometryData(url=url, porg=False, geom='geometry', lat=False, lng=False, revgeocode=False,  save=False, in_crs=2248, out_crs=False)
      return df
    except:
      if interactive: return Intake.getData(input("Error: Try Again?  ( URL/ PATH or  'NO'/ <Empty> ) " ), interactive)
      return False

  # 1ai. A misnomer. Returns Bool.
  def isPandas(df): return isinstance(df, pd.DataFrame) or isinstance(df, gpd.GeoDataFrame) or isinstance(df, tuple)


  # a1. Used by Merge Lib. Returns valid (df, column) or (df, False) or (False, False).
  def getAndCheck(url, col='geometry', interactive=False):
    df = Intake.getData(url, interactive) # Returns False or df
    if ( not Intake.isPandas(df) ):
      if(interactive): print('No data was retrieved.', df)
      return False, False
    if (isinstance(col, list)):
      for colm in col:
        if not Intake.getAndCheckColumn(df, colm):
          if(interactive): print('Exiting. Error on the column: ', colm)
          return df, False
    newcol = Intake.getAndCheckColumn(df, col, interactive) # Returns False or col
    if (not newcol):
      if(interactive): print('Exiting. Error on the column: ', col)
      return df, col
    return df, newcol

  # a2. Returns Bool
  def checkColumn(dataset, column): return {column}.issubset(dataset.columns)

  # b1. Used by Merge Lib. Returns Both Datasets and Coerce Status
  def coerce(ds1, ds2, col1, col2, interactive):
    ds1, ldt, lIsNum = Intake.getdTypeAndFillNum(ds1, col1, interactive)
    ds2, rdt, rIsNum  = Intake.getdTypeAndFillNum(ds2, col2, interactive)

    ds2 = Intake.coerceDtypes(lIsNum, rdt, ds2, col2, interactive)
    ds1 = Intake.coerceDtypes(rIsNum, ldt, ds1, col1, interactive)

    # Return the data and the coerce status
    return ds1, ds2, (ds1[col1].dtype == ds2[col2].dtype)

   # b2. Used by Merge Lib. fills na with crazy number
  def getdTypeAndFillNum(ds, col, interactive):
    dt = ds[col].dtype
    isNum = dt == 'float64' or dt == 'int64'
    if isNum: ds[col] = ds[col].fillna(-1321321321321325)
    return ds, dt, isNum

   # b3. Used by Merge Lib.
  def coerceDtypes(isNum, dt, ds, col, interactive):
    if isNum and dt == 'object':
      if(interactive): print('Converting Key from Object to Int' )
      ds[col] = pd.to_numeric(ds[col], errors='coerce')
      if interactive: print('Converting Key from Int to Float' )
      ds[col] = ds[col].astype(float)
    return ds

  # a3. Returns False or col. Interactive calls self
  def getAndCheckColumn(df, col, interactive):
    if Intake.checkColumn(df, col) : return col
    if (not interactive): return False
    else:
        print("Invalid column given: ", col);
        print(df.columns);
        print("Please enter a new column fom the list above.");
        col = input("Column Name: " )
        return Intake.getAndCheckColumn(df, col, interactive);