default: output/pp-wizard.html output/test1.html

output/pp-wizard.html: output
	./bin/pp-master-builder output/pp-wizard.html $$(find input -name '*.xml')

output/test1.html: output
	./bin/pp-master-builder output/test1.html $$(find test-cases/1/ -name '*.xml')

clean:
	rm -rf output/*.html

output:
	mkdir output

