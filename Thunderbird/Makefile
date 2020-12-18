.PHONY: dist upload

all: dist

dist:
	rm -f deepl.xpi
	zip deepl.xpi --exclude Makefile -r *

install:
	cp deepl.xpi ~/Documents/Thunderbird/extensions/deepl@itagagaki.xpi

clean:
	rm -f deepl.xpl
