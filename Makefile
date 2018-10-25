output/pp-wizard.html: output
	./bin/pp-master-builder output/pp-wizard.html $$(find input -name '*.xml')

output/test.html: output
	./bin/pp-master-builder output/test.html $$(find test-cases/1/ -name '*.xml')

clean:
	rm -rf output/*.html

output:
	mkdir output

