import os
import platform
import re
import time
import subprocess

shellCommands = [
	'tsc --alwaysStrict',
	'browserify build/client/main.js -o public/js/mmoo-client.js'
]

startTime = time.time()
for command in shellCommands:
	if platform.system() == 'Windows':
		command = re.sub(r'/', r'\\', command)

	commandStartTime = time.time()
	print('Running "{0}"...'.format(command))

	subprocess.call(command, shell=True)

	commandTime = time.time() - commandStartTime
	print('Finished in {0:.2f} seconds\n'.format(round(commandTime,2)))

totalTime = time.time() - startTime
print('Build completed in {0:.2f} seconds'.format(round(totalTime,2)))