JAVAC ?= javac
JAVA  ?= java
BUILD := build/classes

.PHONY: all test clean

all: $(BUILD)/atlas/Parity.class

$(BUILD)/atlas/Parity.class: $(wildcard src/atlas/*.java)
	mkdir -p $(BUILD)
	$(JAVAC) -Xlint:all -d $(BUILD) src/atlas/*.java

test: all
	$(JAVA) -cp $(BUILD) atlas.Parity

clean:
	rm -rf build
