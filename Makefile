

default: output
	./bin/pp-master-builder output/pp-wizard.html $$(find test-cases/1/ -name '*.xml')
output:
	mkdir output

