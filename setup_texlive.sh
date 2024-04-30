#!/bin/bash

# Install dependencies
sudo apt-get update
sudo apt-get install -y wget perl tar libpng16-16 zlib1g

# Download and install TeX Live
wget http://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz
tar -xzf install-tl-unx.tar.gz
cd install-tl-*
echo "I" | sudo ./install-tl

# Set PATH for TeX Live (modify this depending on actual installation path)
export PATH=/usr/local/texlive/2023/bin/x86_64-linux:$PATH

# Clean up 
rm -rf install-tl-unx.tar.gz install-tl-*
