# Welcome!

## About

This is a mono repo spanning multiple projects.

Everything is 100% written by me.

A templating engine uses YAML to converted ipynb's for use in pre-rendered (blog, notebooks and articles) <10kbs pages.

This repo has:

- ESP32 firmware and companion app
- My blog, notebooks, and articles
- Custom NPM ipynb2html library
- Python Datascience course with companion PyPi libray
- Crypto Trading bots
- 3D Printable Census Map

please visit the official [website](https://charleskarpati.com/) for more information

## OVERVIEW
```
KARPATIC
|- README
|- package.json
|- webpack.config.js
|- Makefile: runs ipynb convert scripts + sitemap.txt
|- docs - build script output for production
|- src
|  |- README: (you are here)
|  |- ipynb 
|  |- client: github
|  |  |- images
|  |  |- posts: makefile converted ipynbs
|  |  |- templates
|  |  |- utils: convert scripts
|  |- server: heroku
|  |  |- contracts: solidity
|  |  |- scripts 

 
```

## SET UP

- Read the /README.md in both /client and /server
- `npm install`
- `npm run start`

## Misc
The following are being used internally.

- `make sitemap` - description within. files used by server but stored in client atm...

### Prettier

- I use Prettier in Visual Studio Code. More [information](https://dev.to/gulshansaini/how-to-disable-prettier-in-vscode-for-a-specific-project-2a48).
