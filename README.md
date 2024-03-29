# auto-link

Looks for existing links created with `yarn link` and adds them to the local `node_modules` directory.

## Install

This package is not registered with NPM. But, you can install it directly from the GitHub URL:

```
yarn global add https://github.com/svidgen/yarn-auto-link
```

### Use

From the root directory of your dependencies:

```
yarn link
```

Then, from the root directory of the consuming package:

```
auto-link
```

If your bundler can't work with symlinks, use copies instead:

```
auto-link -c
```

Finally, run your code!

### Clean

When you're all done working on the dependency packages, it's best to clean up by trashing your `node_modules` and reinstalling.

```
rm -rf node_modules && yarn
```
