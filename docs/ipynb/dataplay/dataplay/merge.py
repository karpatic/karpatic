from dataplay.intaker import Intake
from dataplay.acs import retrieveAcsData
import numpy as np
import pandas as pd
#@ title Run: Create mergeDatasets()

# Worried about infinit interactive-loops. not an issue atm.
# Crosswalk needs to have exact same column names as left/right datasets
def mergeDatasets(left_ds=False, right_ds=False, crosswalk_ds=False,
                  left_col=False, right_col=False,
                  crosswalk_left_col = False, crosswalk_right_col = False,
                  merge_how='outer', # 'left', 'right', 'outer', 'inner' or "retrieveThisColumn"
                  interactive=False):
  # Interactive will ask if use_crosswalk unless crosswalk_ds == 'no'

  # 1. Used on Right Dataset in case merge_how is a column to pull. Returns False or Col
  def checkMergeHow(ds, how, interactive):
    inList = how in ['left', 'right', 'outer', 'inner']
    inDf = Intake.checkColumn(ds, how)
    if ( inList or inDf ): return how
    elif ( not interactive ): return False
    else:
      try:
        print('\n Invalid merge column given. \n Please select a value from either list');
        print("\n 1) Pull A single column from the right dataset: ", ds.columns)
        print("OR \n 2) Specify a type of join operation: (‘left’, ‘right’, ‘outer’, ‘inner’, columnName) " )
        return checkMergeHow(ds, input("Column Name: " ), interactive);
      except: return False # User probably trying to escape interactivity

  # 2i. Load data via url. Coerce Dtype needed for merge.
  def coerceForMerge( msg, first_ds, second_ds, first_col, second_col, interactive ):
      if (interactive):
        print(f'\n---Casting Datatypes from-to: {msg} Datasets---');
        print('Before Casting: ');
        print('-> Column One: ', first_col, first_ds[first_col].dtype)
        print('-> Column Two: ', second_col, second_ds[second_col].dtype)
      second_ds, second_col = Intake.getAndCheck(second_ds, second_col, interactive)
      first_ds, second_ds, status = Intake.coerce(first_ds, second_ds, first_col, second_col, interactive);
      if (not status and interactive): print('\n There was a problem!');
      if (interactive):
        print('\n After Casting: ');
        print('-> Column One: ', first_col, first_ds[first_col].dtype)
        print('-> Column Two: ', second_col, second_ds[second_col].dtypes)
      return first_ds, second_ds, second_col, status
  # 2ii.
  def mergeAndFilter(msg, first_ds, second_ds, first_col, second_col, how, interactive):
      if interactive:
        print(f'---PERFORMING MERGE : {msg}---');
        print('Column One : ', first_col, first_ds[first_col].dtype)
        print('How: ', how)
        print('Column Two : ', second_col, second_ds[second_col].dtype)
      first_ds = mergeOrPull(first_ds, second_ds, first_col, second_col, how)
      return filterEmpties(first_ds, second_ds, first_col, second_col, how, interactive)

  # Decide to perform a merge or commit a pull
  def mergeOrPull(df, cw, left_on, right_on, how):

    def merge(df, cw, left_on, right_on, how):
      df = pd.merge(df, cw, left_on=left_on, right_on=right_on, how=how)
      # df.drop(left_on, axis=1)
      df[right_on] = df[right_on].fillna(value='empty')
      return df

    def pull(df, cw, left_on, right_on, how):
      crswlk = dict(zip(cw[right_on], cw[how]  ) )
      dtype = df[left_on].dtype
      if dtype =='object':  df[how] = df.apply(lambda row: crswlk.get(str(row[left_on]), "empty"), axis=1)
      elif dtype == 'int64':
        df[how] = df.apply(lambda row: crswlk.get(int(row[left_on]), "empty"), axis=1)
      return df

    mergeType = how in ['left', 'right', 'outer', 'inner']
    if mergeType: return merge(df, cw, left_on, right_on, how)
    else: return pull(df, cw, left_on, right_on, how)

  # 2iiii. Filter between matched records and not.
  def filterEmpties(df, cw, left_on, right_on, how, interactive):
    if how in ['left', 'right', 'outer', 'inner']: how = right_on
    nomatch = df.loc[df[how] == 'empty']
    nomatch = nomatch.sort_values(by=left_on, ascending=True)

    if nomatch.shape[0] > 0:
      # Do the same thing with our foreign tracts
      if(interactive):
        print('\n Local Column Values Not Matched ')
        print(nomatch[left_on].unique() )
        print(len(nomatch[left_on]))
        print('\n Crosswalk Unique Column Values')
        print(cw[right_on].unique() )

    # Create a new column with the tracts value mapped to its corresponding value from the crossswalk
    df[how].replace('empty', np.nan, inplace=True)
    df.dropna(subset=[how], inplace=True)
    # cw = cw.sort_values(by=how, ascending=True)
    return df
 
  if (not hasattr(left_ds, 'shape') and not isinstance(left_ds, str) ) and not interactive:    return pd.DataFrame()
  if (not hasattr(right_ds, 'shape') and not isinstance(right_ds, str) ) and not interactive:    return pd.DataFrame()
  if not isinstance(left_col, str) and not interactive:    return pd.DataFrame()
  if not  isinstance(right_col, str) and not interactive:    return pd.DataFrame()

  # 0. Retrieve the left and right dataset.
  if (interactive): print('---Handling Left Dataset Options---\n');
  left_ds, left_col = Intake.getAndCheck(left_ds, left_col, interactive)
  if (interactive): 
    print('Left column:', left_col)
    if( left_col == False ): return pd.DataFrame()

  if (interactive): print('\n---Handling Right Dataset Options---\n');
  right_ds, right_col  = Intake.getAndCheck(right_ds, right_col, interactive)
  if (interactive): print('Right column:', left_col)

  if (interactive): print(f"\n---Ensuring Compatability Between merge_how (val: '{merge_how}') and the Right Dataset---\n");
  merge_how = checkMergeHow(right_ds, merge_how, interactive)
  if (interactive): print("\nColumn or ['inner','left','right','outer'] value: {merge_how} \n")

  # 1. Retrieve the crosswalk dataset: check left-cw, right-cw. try coercing.
  if (interactive): print(f'\n---Checking Crosswalk Dataset Options---\n')
  # if its a df
  if (not Intake.isPandas(crosswalk_ds)):
    default = str(crosswalk_ds).lower() == 'false'
    # If the user used the the default crosswalk value 'False' as them if they want to use one.
    if (default and interactive ): crosswalk_ds = input("\nProvide a Crosswalk? ( URL/ PATH or  'NO'/ <Empty>/ 'FALSE' ) ") or  False
    # Check if user opted to not use a crosswalk
    use_crosswalk = not ((str(crosswalk_ds).lower() in ["no", '', 'none', 'false']))
    if (use_crosswalk):
      crosswalk_ds, crosswalk_left_col = Intake.getAndCheck(crosswalk_ds, crosswalk_left_col, interactive)
      crosswalk_ds, crosswalk_right_col = Intake.getAndCheck(crosswalk_ds, crosswalk_right_col, interactive)

  # 3. Coerce all datasets for Merge.
  if ( Intake.isPandas(crosswalk_ds) ):
    left_ds, crosswalk_ds, crosswalk_left_col, status = coerceForMerge( 'Left->Crosswalk\n', left_ds, crosswalk_ds, left_col, crosswalk_left_col, interactive )
    right_ds, crosswalk_ds, crosswalk_right_col, status = coerceForMerge( 'Right->Crosswalk\n',right_ds, crosswalk_ds, right_col, crosswalk_right_col, interactive )
  else:
    left_ds, right_ds, right_col, status = coerceForMerge('Left->Right\n', left_ds, right_ds, left_col, right_col, interactive )

  if (interactive): print('\n---All checks complete. Status: \n', status, '---\n');
  if ( not status ):
    if (interactive):
      print('\nMerge Incomplete. Thank you!\n');
    return False
  else:
    if (Intake.isPandas(crosswalk_ds)):
      left_ds = mergeAndFilter('\nLEFT->CROSSWALK\n', left_ds, crosswalk_ds, left_col, crosswalk_left_col, crosswalk_right_col, interactive)
      left_col = crosswalk_right_col
    left_ds = mergeAndFilter('\nLEFT->RIGHT\n', left_ds, right_ds, left_col, right_col, merge_how, interactive)
  return left_ds