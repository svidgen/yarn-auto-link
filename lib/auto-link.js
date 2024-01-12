const fs = require('fs');
const expand = require('expand-tilde');
const glob = require('glob');
const path = require('path');
const rimraf = require('rimraf');

const LINK_PATH = expand('~/.config/yarn/link/**/package.json');

const logs = [];
const errors = [];
const warnings = [];

function linkPackageByPath(filename, copy = false) {
	let data = getPackageData(filename);
	if (!data) return;

	let sourceDirectory = filename.replace(/package\.json$/, '');

	let targetDirectory = path.join('node_modules', getTargetDirectory(data.name));
	let targetPath = path.join('node_modules', data.name);

	rimraf(targetPath, () => {
		if (copy) {
			try {
				copyFolderSync(sourceDirectory, targetPath);
			} catch (err) {
				errors.push(`Failed to copy ${data.name}.` + err);
			}
		} else {
			// ensures `node_modules` and nested packages can be linked
			fs.mkdirSync(targetDirectory, { recursive: true });

			// link up!
			fs.symlink(sourceDirectory, targetPath, 'dir', (err) => {
				if (err) {
					errors.push(
						`Failed linking ${data.name}.` + err
					);
				} else {
					logs.push(`Linked ${data.name}.`);
				}
			});
		}
	});
};

function copyFolderSync(from, to) {
	logs.push(`Copying from '${from}' to '${to}' ...`);

	try {
		fs.mkdirSync(to, { recursive: true });
	} catch (err) {
		if (err.message.startsWith('EEXIST')) {
			warnings.push(`Folder '${to}' already exists. This is unexpected!`);
		} else {
			throw err;
		}
	}

	fs.readdirSync(from).forEach(item => {
		const source = path.join(from, item);
		const dest = path.join(to, item);

		if (fs.lstatSync(source).isDirectory()) {
			copyFolderSync(source, dest);
		} else {
			try {
				fs.copyFileSync(source, dest);
			} catch (err) {
				if (err.message.startsWith('EACCES')) {
					errors.push(`No permission to copy '${source}'!`);
				} else {
					throw err;
				}
			}
		}
	});
};

function getTargetDirectory(name) {
	// TODO; use OS-aware splits and joins
	let dirParts = name.split('/');
	dirParts.pop();
	return dirParts.join('/');
};

function getPackageData(filename) {
	try {
		let data = require(filename);
		if (!data.name) {
			throw new Error("Package isn't named!");
		}
		return data;
	} catch (err) {
		errors.push(`Could not parse ${filename}. Skipping ...`);
	}
	return null;
};

module.exports = {
	link: ({copy, warnings: _warnings = false, verbose = false}) => {
		if (verbose) {
			logs.push = (...args) => console.log(...args);
		}

		glob(LINK_PATH, (err, filenames) => {
			// informational feedback loop for user's sanity.
			let quantifier = filenames.length === 1 ?
				'package.json' : "packages.json's";

			logs.push(
				filenames.join("\n") + 
				`\n${filenames.length} ${quantifier} found.\n`
			);

			filenames.forEach(p => linkPackageByPath(p, copy));

			if (errors.length > 0) {
				console.log(`\nERRORS: \n ${errors.join('\n')}\n`);
			}

			if (warnings.length > 0 && (_warnings || verbose)) {
				console.log(`\nWARNINGS: \n ${errors.join('\n')}\n`);
			}
		});
	}
};
