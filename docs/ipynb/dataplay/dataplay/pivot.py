import pandas as pd
from IPython.display import display, HTML
import random

def pivot_init():
    TEMPLATE = f"""
    <script type="text/javascript">
        window.loadScripts = (scripts) => {{
            let index = 0;
            function loadScript(url, onload) {{
                var script = document.createElement("script");
                script.src = url;
                onload && (script.onload = onload);
                document.head.appendChild(script);
            }} 
            function loadNext() {{
                if (index < scripts.length) {{
                    console.log('loadScripts', scripts[index])
                    loadScript(scripts[index], () => {{ index++; loadNext(); }});
                }}
            }}
            loadNext();
        }}
        window.scripts = [
            "https://api.charleskarpati.com/vanillapivottable/sortable.js",
            "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js",
            "https://api.charleskarpati.com/vanillapivottable/pivottable.js"
        ];
        loadScripts(scripts);
    </script>
    <link rel="stylesheet" type="text/css" href="https://pivottable.js.org/dist/pivot.css">
    """    
    return display(HTML(TEMPLATE))
def pivot_data(df, output_id=None, rows=None, cols=None, renderName="Table"):
    if output_id is None:
        output_id = "output" + str(random.randint(1000000, 9999999))
    
    # Default to not using any.
    # But if it's a string, check if it's a comma separated list
    if rows == None: rows = []
    if type(rows) == str: 
        if "," in rows: rows = rows.split(",")
        else: rows = [rows]
            
    # Same thing but for columns
    if cols == None: cols = []
    if type(cols) == str: 
        if "," in cols: cols = cols.split(",")
        else: cols = [cols]
            
    # Convert DataFrame to JSON for JavaScript
    json_data = df.to_json(orient='records')
    
    rows = str(rows).replace("'", "\"")
    cols = str(cols).replace("'", "\"")

    # HTML and JavaScript template
    # Check if df is a label or if output_id maps to one.
    # Use window.labels[label].data if it exists
    # when a user pivots. update window.labels[label].mapping.rows / cols / viztype.
    TEMPLATE = f"""
    <div id="{output_id}"></div> 
    
    <script type="text/javascript">
    setTimeout(function() {{ 
        window.pivotUI(document.getElementById("{output_id}"), 
            JSON.parse(`{json_data}`),
            {{
                rows: {rows},
                cols: {cols},
                rendererName: '{renderName}',
                showUI: true
            }}
        ) 
    }}, 1000);
    </script>
    """ 
    # "https://pivottable.js.org/dist/pivot.js""http://localhost:8080/ipynb/dataplay/pivottable.js"
    # return HTML(TEMPLATE)
    #return print(TEMPLATE) # TEMPLATE.replace("\n", "")
    # Display the pivot table
    return display(HTML(TEMPLATE))