const fs = require('fs');
const expand = require('expand-tilde');
const glob = require('glob');
const rimraf = require('rimraf');

const LINK_PATH = expand('~/.config/yarn/link/**/package.json');

function linkPackageByPath(filename) {
	let data = getPackageData(filename);
	if (!data) return;

	let sourceDirectory = filename.replace(/package\.json$/, '');

	// TODO: use OS-aware join's
	let targetDirectory = 'node_modules/' + getTargetDirectory(data.name);
	let targetPath = `node_modules/${data.name}`;

	rimraf(targetPath, () => {
		// clean up
		if (targetDirectory !== 'node_modules/') {
			fs.mkdirSync(targetDirectory, { recursive: true });
		}

		// link up!
		fs.symlink(sourceDirectory, targetPath, 'dir', (err) => {
			if (err) {
				console.error(
					`Failed linking ${data.name}.`,
					err
				);
			} else {
				console.log(`Linked ${data.name}.`);
			}
		});
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
		console.error(`Could not parse ${filename}. Skipping ...`);
	}
	return null;
};

module.exports = {
	link: () => {
		glob(LINK_PATH, (err, filenames) => {
			// informational feedback loop for user's sanity.
			let quantifier = filenames.length === 1 ?
				'package.json' : "packages.json's";
			console.log(
				filenames.join("\n"),
				`\n${filenames.length} ${quantifier} found.\n`
			);
			filenames.forEach(linkPackageByPath);
		});
	}
};
