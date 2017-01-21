import os
import platform
import re

browserify = 'browserify build/client/main.js -o public/js/mmoo-client.js'

if platform.system() == 'Windows':
	browserify = re.sub(r'/', r'\\', browserify)

#print(command)
os.system('tsc')
os.system(browserify)