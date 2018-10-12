

default:
	python3 pp-make-worksheet.py Worksheet.js Worksheet.css ResultsToSt.xsl /tmp/Out.txt $$(cat ProfileList.txt) 

