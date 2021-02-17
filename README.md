# pp-st-wizard
[![GitHub issues Open](https://img.shields.io/github/issues/commoncriteria/pp-st-wizard.svg?maxAge=2592000)](https://github.com/commoncriteria/pp-st-wizard/issues) 
![license](https://img.shields.io/badge/license-Unlicensed-blue.svg)

Project that creates the master wizard javascript page. It takes work that was formerly done in the worksheet directory of the transforms project.

[Live release site for the PP Wizard](https://commoncriteria.github.io/pp/pp-st-wizard/pp-wizard.html)

[Test site for the PP Wizard](https://commoncriteria.github.io/pp/pp-st-wizard/test1.html)

Prequisites


For those cloning the repository, the command line for this tool is quite simple:
````   
   pp-master-builder <in-1> [<in-2> [<in-3> [...]]]
````
Where in-* is any of the various input xml files (PPs, Modules, Packages, TDs).

To build the project, just run

````
   make
````   


The inputs can be PPs, Modules, or TDs (and eventually Packages, 
Configuration Annexes, etc). You don't have to organize them or anything. 
It just eats them all, figures out how to apply them, and emits a PP 
Wizard JS Application.
