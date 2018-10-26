default: output/Released.html output/TestCase1.html

output/Released.html: output input/application.xml input/operatingsystem.xml input/mobile-device.xml 
	./bin/pp-master-builder output/Released.html $$(find input -name '*.xml')

output/TestCase1.html: output test-cases/1/fileencryption.xml test-cases/1/application.xml test-cases/1/mobile-device.xml test-cases/1/operatingsystem.xml test-cases/1/OsTd.xml test-cases/1/emailclient.xml
	./bin/pp-master-builder output/TestCase1.html $$(find test-cases/1/ -name '*.xml')



clean:
	rm output/*.html

output:
	mkdir output

