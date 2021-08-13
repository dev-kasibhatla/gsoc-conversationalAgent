import sys
import vosk
name = "vosk"

if name in sys.modules:
	print(1)
else:
	print(0)
