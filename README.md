[![Coverage Status](https://coveralls.io/repos/appium/appium-support/badge.svg?branch=master&service=github)](https://coveralls.io/github/appium/appium-support?branch=master)
#appium-support

Utility functions used to support libs used across appium packages.

`npm install appium-support`

Appium, as of version 1.5 is all based on promises, so this module provides promise wrappers for some common operations.

Most notably, we wrap `fs` for file system commands. Note the addition of `hasAccess`.
Also note that `fs.mkdir` doesn't throw an error if the directory already exists, it will just resolve.

###Methods

- system.isWindows
- system.isMac
- system.isLinux
- system.isOSWin64
- system.arch
- system.macOsxVersion

- util.hasContent - returns true if input string has content
- util.hasValue - returns true if input value is not undefined and no null
- util.escapeSpace
- util.escapeSpecialChars
- util.localIp
- util.cancellableDelay
- util.multiResolve - multiple path.resolve

- *fs.hasAccess* - use this over `fs.access`
- *fs.exists* - calls `fs.hasAccess`
- *fs.rimraf*
- *fs.mkdir* - doesn't throw an error if directory already exists
- *fs.copyFile*
- fs.open
- fs.close
- fs.access
- fs.readFile
- fs.writeFile
- fs.write
- fs.readlink
- fs.chmod
- fs.unlink
- fs.readdir
- fs.stat
- fs.rename
- *fs.md5*

- plist.parsePlistFile
- plist.updatePlistFile

- mkdirp
