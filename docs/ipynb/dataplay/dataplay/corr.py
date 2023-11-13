import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import networkx as nx
import warnings
warnings.filterwarnings('ignore')
from dataplay import merge
from dataplay import intaker

# this example is from the Geek for Geeks link above
def average_clustering(G, trials=1000): 
    """Estimates the average clustering coefficient of G. 
  
    The local clustering of each node in `G` is the  
    fraction of triangles that actually exist over  
    all possible triangles in its neighborhood. 
    The average clustering coefficient of a graph  
    `G` is the mean of local clusterings. 
  
    This function finds an approximate average  
    clustering coefficient for G by repeating `n`  
    times (defined in `trials`) the following 
    experiment: choose a node at random, choose  
    two of its neighbors at random, and check if 
    they are connected. The approximate coefficient  
    is the fraction of triangles found over the  
    number of trials [1]_. 
  
    Parameters 
    ---------- 
    G : NetworkX graph 
  
    trials : integer 
        Number of trials to perform (default 1000). 
  
    Returns 
    ------- 
    c : float 
        Approximated average clustering coefficient. 
  
     
  
    """
    n = len(G) 
    triangles = 0
    nodes = G.nodes() 
    for i in [int(random.random() * n) for i in range(trials)]: 
        nbrs = list(G[nodes[i]]) 
        if len(nbrs) < 2: 
            continue
        u, v = random.sample(nbrs, 2) 
        if u in G[v]: 
            triangles += 1
    return triangles / float(trials) 
#function to create and display networks from the correlatin matrix. 

def create_corr_network_5(G, corr_direction, min_correlation):
    ##Creates a copy of the graph
    H = G.copy()
    
    ##Checks all the edges and removes some based on corr_direction
    for stock1, stock2, weight in G.edges(data=True):
        ##if we only want to see the positive correlations we then delete the edges with weight smaller than 0        
        if corr_direction == "positive":
            ####it adds a minimum value for correlation. 
            ####If correlation weaker than the min, then it deletes the edge
            if weight["weight"] <0 or weight["weight"] < min_correlation:
                H.remove_edge(stock1, stock2)
        ##this part runs if the corr_direction is negative and removes edges with weights equal or largen than 0
        else:
            ####it adds a minimum value for correlation. 
            ####If correlation weaker than the min, then it deletes the edge
            if weight["weight"] >=0 or weight["weight"] > min_correlation:
                H.remove_edge(stock1, stock2)
                
    
    #crates a list for edges and for the weights
    edges,weights = zip(*nx.get_edge_attributes(H,'weight').items())
    
    ### increases the value of weights, so that they are more visible in the graph
    weights = tuple([(1+abs(x))**2 for x in weights])
    
    #####calculates the degree of each node
    d = nx.degree(H)
    #####creates list of nodes and a list their degrees that will be used later for their sizes
    nodelist, node_sizes = zip(*d)

    #positions
    positions=nx.circular_layout(H)
    
    #Figure size
    plt.figure(figsize=(15,15))

    #draws nodes
    nx.draw_networkx_nodes(H,positions,node_color='#DA70D6',nodelist=nodelist,
                           #####the node size will be now based on its degree
                           node_size=tuple([x**3 for x in node_sizes]),alpha=0.8)
    
    #Styling for labels
    nx.draw_networkx_labels(H, positions, font_size=8, 
                            font_family='sans-serif')
    
    ###edge colors based on weight direction
    if corr_direction == "positive":
        edge_colour = plt.cm.GnBu 
    else:
        edge_colour = plt.cm.PuRd
        
    #draws the edges
    nx.draw_networkx_edges(H, positions, edges,style='solid',
                          ###adds width=weights and edge_color = weights 
                          ###so that edges are based on the weight parameter 
                          ###edge_cmap is for the color scale based on the weight
                          ### edge_vmin and edge_vmax assign the min and max weights for the width
                          width=weights, edge_color = weights, edge_cmap = edge_colour,
                          edge_vmin = min(weights), edge_vmax=max(weights))

    # displays the graph without axis
    plt.axis('off')
    #saves image
    plt.savefig("part5" + corr_direction + ".png", format="PNG")
    plt.show() 
